import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { StockTransactionDto } from './dto/stock-transaction.dto';
import { QueryStockDto } from './dto/query-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

import { resolveBranchId } from '../../common/services/branch-resolver.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  private async resolveBranchId(identifier?: string): Promise<string | null> {
    return resolveBranchId(this.prisma, identifier);
  }

  async createItem(dto: CreateStockItemDto) {
    const id = dto.id || `STK-${Date.now()}`;
    return this.prisma.stockItem.create({
      data: {
        id,
        name: dto.name,
        category: dto.category,
        branchId: dto.branchId,
        unit: dto.unit,
        reorderLevel: dto.reorderLevel || 100,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async addBatch(dto: CreateBatchDto) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id: dto.stockItemId },
    });

    if (!item) {
      throw new NotFoundException(`Stock item with ID ${dto.stockItemId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.stockBatch.create({
        data: {
          stockItemId: dto.stockItemId,
          batchNumber: dto.batchNumber,
          supplierId: dto.supplierId || null,
          quantity: dto.quantity,
          expiryDate: new Date(dto.expiryDate),
          dateReceived: dto.dateReceived ? new Date(dto.dateReceived) : new Date(),
        },
      });

      // Increment overall item stock
      await tx.stockItem.update({
        where: { id: dto.stockItemId },
        data: { quantity: { increment: dto.quantity } },
      });

      return batch;
    });
  }

  async deductStockFEFO(stockItemId: string, quantityToDeduct: number, branchId: string, staffId: string, referenceId?: string) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id: stockItemId },
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' }, // FEFO: First Expired, First Out
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Stock item with ID ${stockItemId} not found`);
    }

    if (item.quantity < quantityToDeduct) {
      throw new BadRequestException(
        `Insufficient inventory for ${item.name}. Available: ${item.quantity}, Requested: ${quantityToDeduct}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let remainingToDeduct = quantityToDeduct;

      for (const batch of item.batches) {
        if (remainingToDeduct <= 0) break;

        const deductFromBatch = Math.min(batch.quantity, remainingToDeduct);

        await tx.stockBatch.update({
          where: { id: batch.id },
          data: { quantity: { decrement: deductFromBatch } },
        });

        remainingToDeduct -= deductFromBatch;
      }

      const updatedItem = await tx.stockItem.update({
        where: { id: stockItemId },
        data: { quantity: { decrement: quantityToDeduct } },
      });

      await tx.stockTransaction.create({
        data: {
          stockItemId,
          branchId,
          transactionType: 'DISPENSE',
          quantityDelta: -quantityToDeduct,
          balanceAfter: updatedItem.quantity,
          referenceId: referenceId || null,
          userId: staffId,
        },
      });

      return updatedItem;
    });
  }

  async transferStock(dto: TransferStockDto, staffId: string) {
    const sourceItem = await this.prisma.stockItem.findFirst({
      where: {
        OR: [
          { id: dto.stockItemId },
          { id: { equals: dto.stockItemId, mode: 'insensitive' } },
        ],
      },
      include: { branch: true },
    });

    if (!sourceItem) {
      throw new NotFoundException(`Source stock item ${dto.stockItemId} not found`);
    }

    if (sourceItem.quantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for transfer. Available: ${sourceItem.quantity} ${sourceItem.unit}, Requested: ${dto.quantity}`,
      );
    }

    const destBranchId = await this.resolveBranchId(dto.destinationBranch);
    if (!destBranchId) {
      throw new BadRequestException(`Destination branch '${dto.destinationBranch}' not found`);
    }

    if (sourceItem.branchId === destBranchId) {
      throw new BadRequestException('Destination branch must be different from source branch');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Deduct from source branch item
      const updatedSource = await tx.stockItem.update({
        where: { id: sourceItem.id },
        data: { quantity: { decrement: dto.quantity } },
      });

      await tx.stockTransaction.create({
        data: {
          stockItemId: sourceItem.id,
          branchId: sourceItem.branchId,
          transactionType: 'TRANSFER_OUT',
          quantityDelta: -dto.quantity,
          balanceAfter: updatedSource.quantity,
          referenceId: `TRANSFER-TO-${dto.destinationBranch}`,
          userId: staffId,
        },
      });

      // 2. Add to destination branch item (or create if doesn't exist)
      let destItem = await tx.stockItem.findFirst({
        where: {
          branchId: destBranchId,
          name: { equals: sourceItem.name, mode: 'insensitive' },
        },
      });

      if (destItem) {
        destItem = await tx.stockItem.update({
          where: { id: destItem.id },
          data: { quantity: { increment: dto.quantity } },
        });
      } else {
        destItem = await tx.stockItem.create({
          data: {
            id: `STK-TR-${Date.now()}`,
            name: sourceItem.name,
            category: sourceItem.category,
            branchId: destBranchId,
            quantity: dto.quantity,
            unit: sourceItem.unit,
            reorderLevel: sourceItem.reorderLevel,
          },
        });
      }

      await tx.stockTransaction.create({
        data: {
          stockItemId: destItem.id,
          branchId: destBranchId,
          transactionType: 'TRANSFER_IN',
          quantityDelta: dto.quantity,
          balanceAfter: destItem.quantity,
          referenceId: `TRANSFER-FROM-${sourceItem.branch?.name || sourceItem.branchId}`,
          userId: staffId,
        },
      });

      return {
        success: true,
        transferredQuantity: dto.quantity,
        sourceItem: updatedSource,
        destinationItem: destItem,
      };
    });
  }

  async recordTransaction(dto: StockTransactionDto, staffId: string) {
    const item = await this.prisma.stockItem.findUnique({
      where: { id: dto.stockItemId },
    });

    if (!item) {
      throw new NotFoundException(`Stock item ${dto.stockItemId} not found`);
    }

    const newBalance = item.quantity + dto.quantityDelta;
    if (newBalance < 0) {
      throw new BadRequestException('Transaction would result in negative inventory balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.stockItem.update({
        where: { id: dto.stockItemId },
        data: { quantity: newBalance },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          stockItemId: dto.stockItemId,
          branchId: dto.branchId,
          transactionType: dto.transactionType,
          quantityDelta: dto.quantityDelta,
          balanceAfter: newBalance,
          referenceId: dto.referenceId || null,
          userId: staffId,
        },
      });

      return { updatedItem, transaction };
    });
  }

  async findAll(query: QueryStockDto) {
    const { search, category, branchId, branch, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    const resolvedBranchId = await this.resolveBranchId(branchId || branch);
    if (resolvedBranchId) {
      where.branchId = resolvedBranchId;
    }

    if (category && category.toLowerCase() !== 'all') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { category: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.stockItem.count({ where }),
      this.prisma.stockItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          batches: {
            orderBy: { expiryDate: 'asc' },
            include: { supplier: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    const formattedItems = items.map((item) => {
      const isLow = item.quantity <= item.reorderLevel;
      const latestBatch = item.batches[0] || null;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        branch: item.branch?.name || 'Accra',
        quantity: item.quantity,
        unit: item.unit,
        reorderLevel: item.reorderLevel,
        supplier: latestBatch?.supplier?.name || (item.category === 'Herbal' ? 'Edu Herbal Farm' : 'PharmaChem Ghana'),
        batchNo: latestBatch?.batchNumber || 'BT-2025-0012',
        expiryDate: latestBatch?.expiryDate ? latestBatch.expiryDate.toISOString().split('T')[0] : '2027-06-30',
        isLowStock: isLow,
        status: isLow ? 'Low Stock' : 'OK',
        stockStatus: isLow ? 'Low Stock' : 'Adequate',
      };
    });

    const lowStockCount = formattedItems.filter((i) => i.isLowStock).length;
    const adequateCount = formattedItems.filter((i) => !i.isLowStock).length;

    return {
      items: formattedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        lowStockCount,
        adequateCount,
        summary: `${total} items · ${lowStockCount > 0 ? `${lowStockCount} low stock` : 'All stock OK'}`,
      },
    };
  }
}
