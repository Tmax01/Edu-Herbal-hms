import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, InvoiceLineItemInputDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { resolveBranchId } from '../../common/services/branch-resolver.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(dto: CreateInvoiceDto, billedByStaffId: string) {
    // 1. Resolve Patient
    const patientIdentifier = (dto.patientId || dto.patientName || dto.patient || '').trim();
    if (!patientIdentifier) {
      throw new BadRequestException('Patient is required to generate an invoice');
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
    const branchIdentifier = dto.branchId || dto.branch;
    let branchId = await resolveBranchId(this.prisma, branchIdentifier);

    if (!branchId) {
      branchId = patient.registrationBranchId || 'accra-main-branch-001';
    }

    // 3. Resolve Line Items
    let itemsToCreate: InvoiceLineItemInputDto[] = [];
    if (dto.lineItems && dto.lineItems.length > 0) {
      itemsToCreate = dto.lineItems;
    } else {
      const fallbackAmount = Number(dto.amount ?? dto.totalAmount ?? 0);
      const fallbackDesc = (dto.description || 'Clinical / Hospital Services').trim();
      itemsToCreate = [
        {
          itemType: 'Services',
          description: fallbackDesc,
          quantity: 1,
          unitPrice: fallbackAmount,
        },
      ];
    }

    const totalAmount = itemsToCreate.reduce(
      (sum, item) => sum + Number(item.unitPrice) * (item.quantity || 1),
      0,
    );

    const id = dto.id || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    return this.prisma.invoice.create({
      data: {
        id,
        patientId: patient.id,
        consultationId: dto.consultationId || null,
        branchId,
        visitDate: dto.visitDate ? new Date(dto.visitDate) : new Date(),
        totalAmount,
        paidAmount: 0.0,
        status: 'Unpaid',
        paymentMethod: dto.paymentMethod || null,
        billedBy: billedByStaffId,
        lineItems: {
          create: itemsToCreate.map((item) => ({
            itemType: item.itemType || 'Services',
            referenceId: item.referenceId || null,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            lineTotal: Number(item.unitPrice) * (item.quantity || 1),
          })),
        },
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
        branch: { select: { id: true, name: true, code: true } },
        lineItems: true,
        payments: true,
      },
    });
  }

  async recordPayment(dto: RecordPaymentDto, receivedByStaffId: string) {
    const invoiceId = (dto.invoiceId || dto.id || '').trim();
    if (!invoiceId) {
      throw new BadRequestException('Invoice ID is required to record payment');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [
          { id: invoiceId },
          { id: { equals: invoiceId, mode: 'insensitive' } },
        ],
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.status === 'Paid') {
      throw new BadRequestException('Invoice is already fully settled');
    }

    const paymentAmount = Number(dto.amountPaid ?? dto.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new BadRequestException('Valid payment amount is required');
    }

    const currentPaid = Number(invoice.paidAmount);
    const total = Number(invoice.totalAmount);
    const newPaidAmount = currentPaid + paymentAmount;

    if (newPaidAmount > total) {
      throw new BadRequestException(
        `Payment amount of GHS ${paymentAmount} exceeds remaining balance of GHS ${(total - currentPaid).toFixed(2)}`,
      );
    }

    const newStatus = newPaidAmount >= total ? 'Paid' : 'Partial';
    const paymentId = `PAY-${Date.now()}`;
    const normalizedMethod = dto.paymentMethod?.replace(' / Card', '') || 'Cash';

    return this.prisma.$transaction(async (tx) => {
      // 1. Create payment receipt
      const payment = await tx.payment.create({
        data: {
          id: paymentId,
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          branchId: invoice.branchId,
          amountPaid: paymentAmount,
          paymentMethod: dto.paymentMethod || normalizedMethod,
          transactionReference: dto.transactionReference || null,
          receivedBy: receivedByStaffId,
        },
      });

      // 2. Update invoice status & total paid
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paymentMethod: dto.paymentMethod || normalizedMethod,
        },
        include: {
          patient: true,
          branch: true,
          lineItems: true,
          payments: true,
        },
      });

      return {
        payment,
        invoice: updatedInvoice,
      };
    });
  }

  async findAll(query: QueryInvoicesDto) {
    const { patientId, status, branchId, branch, search, startDate, endDate, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Branch Filter
    const resolvedBranchId = await resolveBranchId(this.prisma, branchId || branch);
    if (resolvedBranchId) {
      where.branchId = resolvedBranchId;
    }

    // 2. Status Filter
    if (status && status.toLowerCase() !== 'all') {
      where.status = status;
    }

    // 3. Patient Filter
    if (patientId) {
      where.patientId = patientId;
    }

    // 4. Search Filter (patient name, MRN, invoice ID)
    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { id: { contains: s, mode: 'insensitive' } },
        { patient: { fullName: { contains: s, mode: 'insensitive' } } },
        { patient: { mrn: { contains: s, mode: 'insensitive' } } },
      ];
    }

    // 5. Date Range Filter
    if (startDate || endDate) {
      where.visitDate = {};
      if (startDate) where.visitDate.gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        where.visitDate.lte = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), 23, 59, 59));
      }
    }

    // Aggregate metrics across this branch scope (for summary cards)
    const branchScopeFilter = where.branchId ? { branchId: where.branchId } : {};

    const [total, items, totalsAggregate, paidCount, partialCount, unpaidCount] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
        include: {
          patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
          branch: { select: { id: true, name: true, code: true } },
          lineItems: true,
          payments: true,
        },
      }),
      this.prisma.invoice.aggregate({
        where: branchScopeFilter,
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),
      this.prisma.invoice.count({ where: { ...branchScopeFilter, status: 'Paid' } }),
      this.prisma.invoice.count({ where: { ...branchScopeFilter, status: 'Partial' } }),
      this.prisma.invoice.count({ where: { ...branchScopeFilter, status: 'Unpaid' } }),
    ]);

    const totalBilled = Number(totalsAggregate._sum.totalAmount || 0);
    const totalCollected = Number(totalsAggregate._sum.paidAmount || 0);
    const totalOutstanding = totalBilled - totalCollected;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalBilled,
        totalCollected,
        totalOutstanding,
        paidCount,
        partialCount,
        unpaidCount,
      },
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [
          { id },
          { id: { equals: id, mode: 'insensitive' } },
        ],
      },
      include: {
        patient: true,
        branch: true,
        billedByUser: { select: { id: true, fullName: true, staffNumber: true, role: true } },
        lineItems: true,
        payments: {
          include: {
            receivedByUser: { select: { id: true, fullName: true, staffNumber: true } },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return invoice;
  }
}
