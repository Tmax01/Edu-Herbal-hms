import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySuppliersDto } from './dto/query-suppliers.dto';

import { resolveBranchId } from '../../common/services/branch-resolver.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  private async resolveBranchId(identifier?: string): Promise<string | null> {
    return resolveBranchId(this.prisma, identifier);
  }

  async create(dto: CreateSupplierDto) {
    const id = dto.id || `SUP-${Date.now()}`;
    const branchId = await this.resolveBranchId(dto.branchId || dto.branch);

    return this.prisma.supplier.create({
      data: {
        id,
        name: dto.name,
        contactPerson: dto.contactPerson || dto.contact || 'Main Contact',
        phone: dto.phone,
        email: dto.email || `${id.toLowerCase()}@eduhms.gh`,
        address: dto.address || 'Accra, Ghana',
        supplierType: dto.supplierType || dto.type || 'Drug',
        paymentTerms: dto.paymentTerms || 'Net 30 days',
        rating: dto.rating !== undefined ? dto.rating : 4.0,
        branchId: branchId || null,
        active: true,
      },
    });
  }

  async findAll(query: QuerySuppliersDto) {
    const { supplierType, type, branch, branchId, search, active, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Active status filter (if explicitly passed)
    if (active !== undefined) {
      where.active = active;
    }

    // 2. Branch Filter
    const resolvedBranchId = await this.resolveBranchId(branchId || branch);
    if (resolvedBranchId) {
      where.branchId = resolvedBranchId;
    }

    // 3. Category / Type Filter
    const targetType = type || supplierType;
    if (targetType && targetType.toLowerCase() !== 'all') {
      where.supplierType = { equals: targetType, mode: 'insensitive' };
    }

    // 4. Search Filter
    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { contactPerson: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, suppliers, activeCount, inactiveCount] = await Promise.all([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          stockBatches: {
            take: 10,
            include: { stockItem: { select: { name: true, category: true } } },
          },
        },
      }),
      this.prisma.supplier.count({
        where: {
          ...(where.branchId ? { branchId: where.branchId } : {}),
          active: true,
        },
      }),
      this.prisma.supplier.count({
        where: {
          ...(where.branchId ? { branchId: where.branchId } : {}),
          active: false,
        },
      }),
    ]);

    // Format output matching SuppliersPage.tsx
    const defaultSuppliesMap: Record<string, string[]> = {
      'SUP-001': ['Amlodipine', 'Metformin', 'Lisinopril', 'Atenolol'],
      'SUP-002': ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Omeprazole'],
      'SUP-003': ['Neem Leaf Extract', 'Moringa Capsules', 'Raw Neem Leaves', 'Ginger Root'],
      'SUP-004': ['IV Cannula', 'Syringes', 'Gloves', 'Masks', 'Bandages'],
      'SUP-005': ['Artemether/Lumefantrine', 'Ceftriaxone', 'Ciprofloxacin'],
      'SUP-006': ['ECG Machine Consumables', 'Centrifuge Parts', 'Autoclave Supplies'],
    };

    const formatted = suppliers.map((s) => {
      // Collect supplied items from batches or fallback catalog
      const batchItems = Array.from(new Set(s.stockBatches.map((b) => b.stockItem?.name).filter(Boolean))) as string[];
      const items = batchItems.length > 0 ? batchItems : defaultSuppliesMap[s.id] || ['General Medical Supplies'];

      return {
        id: s.id,
        name: s.name,
        contact: s.contactPerson,
        phone: s.phone,
        email: s.email,
        address: s.address,
        type: s.supplierType,
        items,
        paymentTerms: s.paymentTerms,
        rating: Number(s.rating || 4.0),
        lastOrder: s.lastOrderDate ? s.lastOrderDate.toISOString().split('T')[0] : '—',
        branch: s.branch?.name || 'Accra',
        active: s.active,
      };
    });

    return {
      items: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        activeCount,
        inactiveCount,
        summary: `${activeCount} active suppliers`,
      },
    };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        OR: [
          { id },
          { id: { equals: id, mode: 'insensitive' } },
        ],
      },
      include: {
        branch: true,
        stockBatches: {
          take: 10,
          orderBy: { dateReceived: 'desc' },
          include: { stockItem: true },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }
}
