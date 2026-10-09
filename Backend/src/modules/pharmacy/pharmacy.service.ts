import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import { QueryPrescriptionsDto } from './dto/query-prescriptions.dto';

import { resolveBranchId } from '../../common/services/branch-resolver.service';

@Injectable()
export class PharmacyService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  private async resolveBranchId(identifier?: string): Promise<string | null> {
    return resolveBranchId(this.prisma, identifier);
  }

  async create(dto: CreatePrescriptionDto, doctorId: string) {
    const id = dto.id || `RX-${Date.now()}`;

    // 1. CDSS Check for drug interactions
    const drugNames = dto.items.map((i) => i.drugName);
    const interactionWarnings = await this.checkInteractions(drugNames);

    // Resolve patient
    const patientIdentifier = (dto.patientId || dto.patientName || '').trim();
    let patient = await this.prisma.patient.findFirst({
      where: {
        OR: [
          { id: patientIdentifier },
          { mrn: { equals: patientIdentifier, mode: 'insensitive' } },
          { fullName: { equals: patientIdentifier, mode: 'insensitive' } },
        ],
      },
    });

    if (!patient) {
      patient = await this.prisma.patient.findFirst({
        where: { fullName: { contains: patientIdentifier, mode: 'insensitive' } },
      });
    }

    if (!patient) {
      throw new NotFoundException(`Patient '${patientIdentifier}' not found`);
    }

    // Resolve branch
    const branchId = (await this.resolveBranchId(dto.branchId || dto.branch)) || patient.registrationBranchId || 'accra-main-branch-001';

    const prescription = await this.prisma.prescription.create({
      data: {
        id,
        consultationId: dto.consultationId || null,
        patientId: patient.id,
        doctorId,
        branchId,
        prescriptionType: dto.prescriptionType || 'Conventional',
        status: 'Pending',
        notes: dto.notes || null,
        items: {
          create: dto.items.map((item) => ({
            drugName: item.drugName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantityPrescribed: item.quantityPrescribed,
            stockItemId: item.stockItemId || null,
            itemStatus: 'Pending',
          })),
        },
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
        items: true,
      },
    });

    return {
      prescription,
      cdssAlerts: interactionWarnings,
    };
  }

  async dispense(prescriptionId: string, dto: DispensePrescriptionDto, pharmacistId: string) {
    const prescription = await this.prisma.prescription.findFirst({
      where: {
        OR: [
          { id: prescriptionId },
          { id: { equals: prescriptionId, mode: 'insensitive' } },
        ],
      },
      include: { items: true },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    }

    if (prescription.status === 'Dispensed') {
      throw new BadRequestException('Prescription has already been fully dispensed');
    }

    await this.prisma.$transaction(async (tx) => {
      // If no specific line items are specified, dispense all remaining quantities
      if (!dto.dispensedItems || dto.dispensedItems.length === 0) {
        for (const presItem of prescription.items) {
          const qtyRemaining = presItem.quantityPrescribed - presItem.quantityDispensed;
          if (qtyRemaining > 0) {
            await tx.prescriptionItem.update({
              where: { id: presItem.id },
              data: {
                quantityDispensed: presItem.quantityPrescribed,
                itemStatus: 'Dispensed',
              },
            });

            if (presItem.stockItemId) {
              await this.stockService.deductStockFEFO(
                presItem.stockItemId,
                qtyRemaining,
                prescription.branchId,
                pharmacistId,
                prescription.id,
              );
            }
          }
        }
      } else {
        for (const item of dto.dispensedItems) {
          const presItem = prescription.items.find((i) => i.id === item.prescriptionItemId);
          if (!presItem) continue;

          const toDispense = item.quantityToDispense || (presItem.quantityPrescribed - presItem.quantityDispensed);
          const newDispensedQty = presItem.quantityDispensed + toDispense;
          const isFullyDispensed = newDispensedQty >= presItem.quantityPrescribed;

          await tx.prescriptionItem.update({
            where: { id: presItem.id },
            data: {
              quantityDispensed: newDispensedQty,
              itemStatus: isFullyDispensed ? 'Dispensed' : 'Partially Dispensed',
            },
          });

          if (presItem.stockItemId) {
            await this.stockService.deductStockFEFO(
              presItem.stockItemId,
              toDispense,
              prescription.branchId,
              pharmacistId,
              prescription.id,
            );
          }
        }
      }

      // Mark overall prescription as Dispensed
      await tx.prescription.update({
        where: { id: prescription.id },
        data: {
          status: 'Dispensed',
          dispensedBy: pharmacistId,
          dispensedAt: new Date(),
        },
      });
    });

    return this.prisma.prescription.findUnique({
      where: { id: prescription.id },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
        dispensedByUser: { select: { id: true, fullName: true } },
        items: true,
      },
    });
  }

  async checkInteractions(drugNames: string[]) {
    if (!drugNames || drugNames.length < 1) return [];

    const interactions = await this.prisma.drugInteractionsCatalog.findMany({
      where: {
        OR: drugNames.map((name) => ({
          OR: [
            { drugA: { contains: name, mode: 'insensitive' } },
            { drugB: { contains: name, mode: 'insensitive' } },
          ],
        })),
      },
    });

    return interactions;
  }

  async findAll(query: QueryPrescriptionsDto) {
    const { patientId, status, branchId, branch, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    const resolvedBranchId = await this.resolveBranchId(branchId || branch);
    if (resolvedBranchId) {
      where.branchId = resolvedBranchId;
    }

    if (status && status.toLowerCase() !== 'all') {
      where.status = { equals: status, mode: 'insensitive' };
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { id: { contains: s, mode: 'insensitive' } },
        { patient: { fullName: { contains: s, mode: 'insensitive' } } },
        { patient: { mrn: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, items, pendingCount, dispensedCount, partialCount] = await Promise.all([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
          doctor: { select: { id: true, fullName: true } },
          branch: { select: { id: true, name: true, code: true } },
          dispensedByUser: { select: { id: true, fullName: true } },
          items: true,
        },
      }),
      this.prisma.prescription.count({ where: { ...where, status: 'Pending' } }),
      this.prisma.prescription.count({ where: { ...where, status: 'Dispensed' } }),
      this.prisma.prescription.count({ where: { ...where, status: 'Partial' } }),
    ]);

    // Format matching PharmacyPage.tsx
    const formatted = await Promise.all(
      items.map(async (rx) => {
        const drugNames = rx.items.map((i) => i.drugName);
        const interactions = await this.checkInteractions(drugNames);

        return {
          id: rx.id,
          patientId: rx.patientId,
          patientName: rx.patient?.fullName || 'Walk-in Patient',
          patientMrn: rx.patient?.mrn || 'N/A',
          doctorId: rx.doctorId,
          doctorName: rx.doctor?.fullName || 'Physician',
          date: rx.createdAt ? rx.createdAt.toISOString().split('T')[0] : '2026-08-22',
          branch: rx.branch?.name || 'Accra',
          type: rx.prescriptionType,
          status: rx.status,
          notes: rx.notes,
          dispensedBy: rx.dispensedByUser?.fullName || null,
          dispensedAt: rx.dispensedAt ? rx.dispensedAt.toISOString() : null,
          items: rx.items.map((i) => ({
            id: i.id,
            drug: i.drugName,
            dosage: i.dosage,
            frequency: i.frequency,
            duration: i.duration,
            qty: i.quantityPrescribed,
            quantityDispensed: i.quantityDispensed,
            status: i.itemStatus,
          })),
          cdssInteractions: interactions.map((inter) => ({
            drugs: [inter.drugA, inter.drugB],
            warning: inter.warningMessage,
            severity: inter.severity,
            guidance: inter.clinicalGuidance,
          })),
        };
      }),
    );

    return {
      items: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        pendingCount,
        dispensedCount,
        partialCount,
      },
    };
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findFirst({
      where: {
        OR: [
          { id },
          { id: { equals: id, mode: 'insensitive' } },
        ],
      },
      include: {
        patient: {
          include: {
            allergies: true,
          },
        },
        doctor: true,
        branch: true,
        dispensedByUser: true,
        items: { include: { stockItem: true } },
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription ${id} not found`);
    }

    return prescription;
  }
}
