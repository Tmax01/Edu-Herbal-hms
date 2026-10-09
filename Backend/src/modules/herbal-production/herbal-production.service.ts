import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductionBatchDto, UpdateProductionStageDto } from './dto/create-production-batch.dto';
import { QueryProductionDto } from './dto/query-production.dto';

@Injectable()
export class HerbalProductionService {
  constructor(private prisma: PrismaService) {}

  private formatBatch(b: any) {
    if (!b) return null;
    return {
      id: b.id,
      product: b.productName,
      productName: b.productName,
      batchNumber: b.batchNumber,
      stage: b.stage,
      startDate: b.startDate instanceof Date ? b.startDate.toISOString().slice(0, 10) : String(b.startDate || '').slice(0, 10),
      completionDate: b.completionDate ? (b.completionDate instanceof Date ? b.completionDate.toISOString().slice(0, 10) : String(b.completionDate).slice(0, 10)) : undefined,
      expiryDate: b.expiryDate ? (b.expiryDate instanceof Date ? b.expiryDate.toISOString().slice(0, 10) : String(b.expiryDate).slice(0, 10)) : undefined,
      quantity: b.plannedQuantity,
      plannedQuantity: b.plannedQuantity,
      qcApprover: b.qcApproverUser?.fullName || b.qcApproverId || undefined,
      notes: b.notes || undefined,
    };

  }

  async create(dto: CreateProductionBatchDto) {
    const productName = dto.productName || dto.product;
    if (!productName) {
      throw new ConflictException('Product name is required');
    }

    let batchNumber = dto.batchNumber;
    if (!batchNumber) {
      const count = await this.prisma.productionBatch.count();
      batchNumber = `HB-2026-${String(count + 1).padStart(4, '0')}`;
    }

    const existing = await this.prisma.productionBatch.findFirst({
      where: {
        batchNumber: { equals: batchNumber, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(`Production batch '${batchNumber}' already exists`);
    }

    const id = `PROD-${Date.now().toString().slice(-4)}`;
    const plannedQuantity = Number(dto.plannedQuantity || dto.quantity || 100);
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();

    const created = await this.prisma.productionBatch.create({
      data: {
        id,
        productName,
        batchNumber,
        stage: dto.stage || 'Mixing',
        startDate,
        completionDate: dto.completionDate ? new Date(dto.completionDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        plannedQuantity,
        notes: dto.notes || null,
      },
      include: {
        qcApproverUser: { select: { id: true, fullName: true, role: true } },
      },
    });

    return this.formatBatch(created);
  }

  async advanceStage(id: string, staffId?: string) {
    const batch = await this.prisma.productionBatch.findFirst({
      where: {
        OR: [
          { id },
          { id: { equals: id, mode: 'insensitive' } },
          { batchNumber: { equals: id, mode: 'insensitive' } },
        ],
      },
    });

    if (!batch) {
      throw new NotFoundException(`Production batch with ID ${id} not found`);
    }

    const stageOrder = ['Mixing', 'Processing', 'QC', 'Packaging', 'Completed'];
    const currentIdx = stageOrder.indexOf(batch.stage);

    if (batch.stage === 'Completed') {
      throw new BadRequestException('Production batch is already completed');
    }

    if (currentIdx === -1) {
      throw new BadRequestException(`Cannot advance batch from invalid stage '${batch.stage}'`);
    }

    const nextStage = stageOrder[currentIdx + 1];

    const data: any = {
      stage: nextStage,
    };

    if (nextStage === 'Completed') {
      data.completionDate = new Date();
    }

    if ((nextStage === 'QC' || nextStage === 'Quality Control (QC)') && staffId) {
      data.qcApproverId = staffId;
    }

    const updated = await this.prisma.productionBatch.update({
      where: { id: batch.id },
      data,
      include: {
        qcApproverUser: { select: { id: true, fullName: true, role: true } },
      },
    });

    return this.formatBatch(updated);
  }

  async updateStage(id: string, dto: UpdateProductionStageDto, staffId?: string) {
    const batch = await this.prisma.productionBatch.findFirst({
      where: {
        OR: [
          { id },
          { id: { equals: id, mode: 'insensitive' } },
          { batchNumber: { equals: id, mode: 'insensitive' } },
        ],
      },
    });

    if (!batch) {
      throw new NotFoundException(`Production batch with ID ${id} not found`);
    }

    const data: any = {
      stage: dto.stage,
      notes: dto.notes || batch.notes,
    };

    if (dto.stage === 'Completed') {
      data.completionDate = new Date();
    }

    if ((dto.stage === 'Quality Control (QC)' || dto.stage === 'QC') && staffId) {
      data.qcApproverId = staffId;
    }

    const updated = await this.prisma.productionBatch.update({
      where: { id: batch.id },
      data,
      include: {
        qcApproverUser: { select: { id: true, fullName: true, role: true } },
      },
    });

    return this.formatBatch(updated);
  }

  async findAll(query: QueryProductionDto) {
    const { stage, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (stage && stage !== 'All') where.stage = stage;
    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [allBatches, filteredBatches] = await Promise.all([
      this.prisma.productionBatch.findMany(),
      this.prisma.productionBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          qcApproverUser: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    const stageSummary = {
      mixing: allBatches.filter((b) => b.stage === 'Mixing').length,
      processing: allBatches.filter((b) => b.stage === 'Processing').length,
      qc: allBatches.filter((b) => b.stage === 'QC' || b.stage === 'Quality Control (QC)').length,
      packaging: allBatches.filter((b) => b.stage === 'Packaging' || b.stage === 'Bottling & Packaging').length,
      completed: allBatches.filter((b) => b.stage === 'Completed').length,
      total: allBatches.length,
    };

    const formattedItems = filteredBatches.map((b) => this.formatBatch(b));

    return {
      summary: stageSummary,
      items: formattedItems,
      meta: {
        total: allBatches.length,
        page,
        limit,
        totalPages: Math.ceil(allBatches.length / limit),
      },
    };
  }

  async findOne(id: string) {
    const batch = await this.prisma.productionBatch.findFirst({
      where: {
        OR: [
          { id },
          { id: { equals: id, mode: 'insensitive' } },
          { batchNumber: { equals: id, mode: 'insensitive' } },
        ],
      },
      include: {
        qcApproverUser: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(`Production batch ${id} not found`);
    }

    return this.formatBatch(batch);
  }
}
