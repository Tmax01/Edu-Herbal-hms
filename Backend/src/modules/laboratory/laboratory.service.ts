import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { SubmitResultsDto } from './dto/submit-results.dto';
import { QueryLabOrdersDto } from './dto/query-lab-orders.dto';

import { resolveBranchId } from '../../common/services/branch-resolver.service';

@Injectable()
export class LaboratoryService {
  constructor(private prisma: PrismaService) {}

  private async resolveBranchId(identifier?: string): Promise<string | null> {
    return resolveBranchId(this.prisma, identifier);
  }

  async create(dto: CreateLabOrderDto, doctorId: string) {
    // 1. Resolve Patient
    const patientIdentifier = (dto.patientId || dto.patientName || '').trim();
    if (!patientIdentifier) {
      throw new BadRequestException('Patient identifier is required');
    }

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
      throw new NotFoundException(`Patient '${patientIdentifier}' not found in registry`);
    }

    // 2. Resolve Branch
    const resolvedBranchId = await this.resolveBranchId(dto.branchId || dto.branch);
    const branchId = resolvedBranchId || patient.registrationBranchId || 'accra-main-branch-001';

    // 3. Resolve Tests / Items
    const itemsToCreate: { testName: string; referenceRange?: string | null; unit?: string | null; flag: string }[] = [];

    if (dto.items && Array.isArray(dto.items) && dto.items.length > 0) {
      for (const item of dto.items) {
        itemsToCreate.push({
          testName: item.testName,
          referenceRange: item.referenceRange || null,
          unit: item.unit || null,
          flag: 'Normal',
        });
      }
    } else if (dto.tests && Array.isArray(dto.tests) && dto.tests.length > 0) {
      for (const testName of dto.tests) {
        itemsToCreate.push({
          testName: typeof testName === 'string' ? testName : String(testName),
          referenceRange: null,
          unit: null,
          flag: 'Normal',
        });
      }
    } else {
      throw new BadRequestException('At least one diagnostic test must be specified in the order');
    }

    const id = dto.id || `LAB-${Date.now()}`;

    return this.prisma.labOrder.create({
      data: {
        id,
        consultationId: dto.consultationId || null,
        patientId: patient.id,
        doctorId: dto.doctorId || doctorId,
        branchId,
        priority: dto.priority || 'Routine',
        status: 'Pending',
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
        doctor: { select: { id: true, fullName: true } },
        branch: { select: { id: true, name: true, code: true } },
        items: true,
      },
    });
  }

  async submitResults(orderId: string, dto: SubmitResultsDto, technicianId: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: {
        OR: [
          { id: orderId },
          { id: { equals: orderId, mode: 'insensitive' } },
        ],
      },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Lab order '${orderId}' not found`);
    }

    // Determine result text
    let resultSummary = dto.resultSummary || dto.resultText || '';
    if (!resultSummary && typeof dto.results === 'string') {
      resultSummary = dto.results;
    }
    if (!resultSummary && dto.fileName) {
      resultSummary = 'See attached PDF report';
    }

    // Update individual test items if array provided
    if (Array.isArray(dto.results)) {
      for (const res of dto.results) {
        if (res.itemId) {
          await this.prisma.labOrderItem.update({
            where: { id: res.itemId },
            data: {
              parameterResults: res.parameterResults || null,
              flag: res.flag || 'Normal',
            },
          }).catch(() => null);
        }
      }
    }

    // Create PDF Attachment if provided
    if (dto.fileName) {
      const fileSizeKb = dto.fileSizeKb || (dto.size ? parseInt(dto.size, 10) : 284) || 284;
      await this.prisma.labAttachment.create({
        data: {
          labOrderId: order.id,
          fileName: dto.fileName,
          filePathUrl: dto.filePathUrl || `/uploads/lab/${dto.fileName}`,
          fileSizeKb,
          uploadedBy: technicianId,
        },
      });
    }

    // Update Order Status: frontend expects 'Awaiting Approval' when lab tech submits
    const updatedStatus = dto.status || 'Awaiting Approval';

    const updatedOrder = await this.prisma.labOrder.update({
      where: { id: order.id },
      data: {
        status: updatedStatus,
        resultSummary: resultSummary || null,
        technicianId,
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
        branch: { select: { id: true, name: true, code: true } },
        technicianUser: { select: { id: true, fullName: true } },
        items: true,
        attachments: true,
      },
    });

    return updatedOrder;
  }

  async approveResults(orderId: string, doctorId: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: {
        OR: [
          { id: orderId },
          { id: { equals: orderId, mode: 'insensitive' } },
        ],
      },
    });

    if (!order) {
      throw new NotFoundException(`Lab order '${orderId}' not found`);
    }

    // When doctor approves, status transitions to 'Completed' (consistent with frontend completed tab)
    return this.prisma.labOrder.update({
      where: { id: order.id },
      data: {
        status: 'Completed',
        approvedByDoctorId: doctorId,
        approvedAt: new Date(),
      },
      include: {
        patient: true,
        items: true,
        attachments: true,
        approvedByDoctorUser: { select: { id: true, fullName: true } },
      },
    });
  }

  async addAttachment(orderId: string, fileName: string, fileSizeKb: number = 250, staffId: string) {
    const order = await this.prisma.labOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Lab order '${orderId}' not found`);
    }

    return this.prisma.labAttachment.create({
      data: {
        labOrderId: order.id,
        fileName,
        filePathUrl: `/uploads/lab/${fileName}`,
        fileSizeKb,
        uploadedBy: staffId,
      },
    });
  }

  async findAll(query: QueryLabOrdersDto) {
    const { patientId, status, branchId, branch, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Branch Filter
    const resolvedBranchId = await this.resolveBranchId(branchId || branch);
    if (resolvedBranchId) {
      where.branchId = resolvedBranchId;
    }

    // 2. Status Filter
    if (status && status.toLowerCase() !== 'all') {
      if (status.toLowerCase() === 'pending') {
        // Pending filter can mean pending orders (!== 'Completed')
        where.status = { not: 'Completed' };
      } else {
        where.status = { equals: status, mode: 'insensitive' };
      }
    }

    // 3. Patient Filter
    if (patientId) {
      where.patientId = patientId;
    }

    // 4. Search Filter
    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { id: { contains: s, mode: 'insensitive' } },
        { patient: { fullName: { contains: s, mode: 'insensitive' } } },
        { patient: { mrn: { contains: s, mode: 'insensitive' } } },
        { items: { some: { testName: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    // Aggregate counts across the branch filter scope
    const branchScope = where.branchId ? { branchId: where.branchId } : {};

    const [total, orders, pendingCount, completedCount, pdfCount] = await Promise.all([
      this.prisma.labOrder.count({ where }),
      this.prisma.labOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderedAt: 'desc' },
        include: {
          patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
          doctor: { select: { id: true, fullName: true, staffNumber: true } },
          technicianUser: { select: { id: true, fullName: true, staffNumber: true } },
          branch: { select: { id: true, name: true, code: true } },
          items: true,
          attachments: { orderBy: { uploadedAt: 'desc' } },
        },
      }),
      this.prisma.labOrder.count({
        where: {
          ...branchScope,
          status: { not: 'Completed' },
        },
      }),
      this.prisma.labOrder.count({
        where: {
          ...branchScope,
          status: 'Completed',
        },
      }),
      this.prisma.labAttachment.count({
        where: where.branchId
          ? { labOrder: { branchId: where.branchId } }
          : {},
      }),
    ]);

    // Format output matching LabPage.tsx structure
    const formattedOrders = orders.map((o) => {
      const latestPdf = o.attachments[0] || null;
      return {
        id: o.id,
        patientId: o.patientId,
        patientName: o.patient?.fullName || 'Walk-in Patient',
        patientMrn: o.patient?.mrn || 'N/A',
        doctorId: o.doctorId,
        doctorName: o.doctor?.fullName || 'Physician',
        technicianId: o.technicianId,
        technicianName: o.technicianUser?.fullName || null,
        tests: o.items.map((i) => i.testName),
        status: o.status,
        orderedDate: o.orderedAt ? o.orderedAt.toISOString().split('T')[0] : '2026-08-22',
        branch: o.branch?.name || 'Accra',
        results: o.resultSummary,
        hasPdf: latestPdf ? {
          labOrderId: o.id,
          fileName: latestPdf.fileName,
          uploadedAt: latestPdf.uploadedAt.toISOString().replace('T', ' ').slice(0, 16),
          size: `${latestPdf.fileSizeKb} KB`,
          filePathUrl: latestPdf.filePathUrl,
        } : null,
        attachments: o.attachments.map((a) => ({
          id: a.id,
          labOrderId: o.id,
          fileName: a.fileName,
          uploadedAt: a.uploadedAt.toISOString().replace('T', ' ').slice(0, 16),
          size: `${a.fileSizeKb} KB`,
          filePathUrl: a.filePathUrl,
        })),
      };
    });

    return {
      items: formattedOrders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        pendingCount,
        completedCount,
        pdfCount,
        bannerSummary: `${pendingCount} pending · ${completedCount} completed · ${pdfCount} PDF reports`,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.labOrder.findFirst({
      where: {
        OR: [
          { id },
          { id: { equals: id, mode: 'insensitive' } },
        ],
      },
      include: {
        patient: true,
        doctor: true,
        technicianUser: true,
        approvedByDoctorUser: true,
        branch: true,
        items: true,
        attachments: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Lab order '${id}' not found`);
    }

    return order;
  }
}
