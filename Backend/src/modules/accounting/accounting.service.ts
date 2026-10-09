import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';

import { resolveBranchId } from '../../common/services/branch-resolver.service';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  private async resolveBranchId(identifier?: string): Promise<string | null> {
    return resolveBranchId(this.prisma, identifier);
  }

  async createExpense(dto: CreateExpenseDto, approvedByStaffId: string) {
    const id = `EXP-${Date.now()}`;

    // Resolve branch
    const branchId = await this.resolveBranchId(dto.branchId || dto.branch);

    const expenseDate = dto.expenseDate || dto.date ? new Date(dto.expenseDate || dto.date!) : new Date();

    return this.prisma.expense.create({
      data: {
        id,
        description: dto.description,
        category: dto.category,
        amount: Number(dto.amount),
        expenseDate,
        branchId,
        paymentMethod: dto.paymentMethod,
        receiptUrl: dto.receiptUrl || null,
        approvedBy: approvedByStaffId,
      },
      include: {
        approvedByUser: { select: { id: true, fullName: true, staffNumber: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findAllExpenses(query: QueryExpensesDto) {
    const { category, branchId, branch, search, startDate, endDate, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category && category.toLowerCase() !== 'all') {
      where.category = category;
    }

    const resolvedBranchId = await this.resolveBranchId(branchId || branch);
    if (resolvedBranchId) {
      where.OR = [{ branchId: resolvedBranchId }, { branchId: null }];
    }

    if (search && search.trim()) {
      where.description = { contains: search.trim(), mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        where.expenseDate.lte = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), 23, 59, 59));
      }
    }

    const branchScopeFilter = resolvedBranchId
      ? { OR: [{ branchId: resolvedBranchId }, { branchId: null }] }
      : {};

    const [total, rawItems, totalExpenseSum, categoryGroups] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
        include: {
          approvedByUser: { select: { id: true, fullName: true, staffNumber: true } },
          branch: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.expense.aggregate({
        where: branchScopeFilter,
        _sum: { amount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: branchScopeFilter,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalExpenses = Number(totalExpenseSum._sum.amount || 0);
    const categoryBreakdown = categoryGroups.map((g) => ({
      category: g.category,
      amount: Number(g._sum.amount || 0),
      count: g._count.id,
    }));

    const items = rawItems.map((exp) => ({
      id: exp.id,
      description: exp.description,
      category: exp.category,
      amount: Number(exp.amount),
      date: exp.expenseDate.toISOString().split('T')[0],
      expenseDate: exp.expenseDate,
      branch: exp.branch?.code === 'MKS' ? 'Mankessim' : (exp.branch?.name?.includes('Mankessim') ? 'Mankessim' : 'Accra'),
      branchId: exp.branchId,
      paymentMethod: exp.paymentMethod,
      approvedBy: exp.approvedByUser?.fullName || 'Finance Office',
      receiptUrl: exp.receiptUrl,
    }));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalExpenses,
        categoryBreakdown,
      },
    };
  }

  async processPayroll(dto: CreatePayrollDto, processedByStaffId: string) {
    // Resolve staff
    let staffId = dto.staffId;
    const staff = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: dto.staffId },
          { staffNumber: { equals: dto.staffId, mode: 'insensitive' } },
          { fullName: { contains: dto.staffId, mode: 'insensitive' } },
        ],
      },
    });

    if (staff) {
      staffId = staff.id;
    }

    // Resolve branch
    let branchId = await this.resolveBranchId(dto.branchId || dto.branch);
    if (!branchId) {
      branchId = staff?.primaryBranchId || 'accra-main-branch-001';
    }

    const existing = await this.prisma.payrollRecord.findUnique({
      where: {
        staffId_payrollMonth: {
          staffId,
          payrollMonth: dto.payrollMonth,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Payroll for staff member ${staffId} for month ${dto.payrollMonth} already exists`);
    }

    const netSalary = Number(dto.basicSalary) + (dto.allowances || 0) - (dto.deductions || 0);

    return this.prisma.payrollRecord.create({
      data: {
        staffId,
        branchId,
        payrollMonth: dto.payrollMonth,
        basicSalary: dto.basicSalary,
        allowances: dto.allowances || 0,
        deductions: dto.deductions || 0,
        netSalary,
        status: 'Processed',
        processedBy: processedByStaffId,
        paidAt: new Date(),
      },
      include: {
        staffUser: { select: { id: true, fullName: true, staffNumber: true, role: true } },
        branch: { select: { id: true, name: true, code: true } },
        processedByUser: { select: { id: true, fullName: true } },
      },
    });
  }

  async findPayroll(payrollMonth?: string, branchId?: string) {
    const where: any = {};
    if (payrollMonth && payrollMonth.toLowerCase() !== 'all') {
      const normalizedMonth = payrollMonth.toLowerCase().includes('aug') ? '2026-08' : payrollMonth;
      where.payrollMonth = normalizedMonth;
    }

    const resolvedBranchId = await this.resolveBranchId(branchId);
    if (resolvedBranchId) {
      where.OR = [{ branchId: resolvedBranchId }, { branchId: null }];
    }

    const records = await this.prisma.payrollRecord.findMany({
      where,
      orderBy: { staffId: 'asc' },
      include: {
        staffUser: { select: { id: true, fullName: true, staffNumber: true, role: true } },
        branch: { select: { id: true, name: true, code: true } },
        processedByUser: { select: { id: true, fullName: true } },
      },
    });

    return records.map((p) => ({
      id: p.id,
      staffId: p.staffId,
      name: p.staffUser?.fullName || 'Staff Member',
      role: p.staffUser?.role || 'staff',
      branch: p.branch?.code === 'MKS' ? 'Mankessim' : (p.branch?.name?.includes('Mankessim') ? 'Mankessim' : 'Accra'),
      basicSalary: Number(p.basicSalary),
      allowances: Number(p.allowances),
      deductions: Number(p.deductions),
      netSalary: Number(p.netSalary),
      status: p.status,
      month: p.payrollMonth === '2026-08' ? 'August 2026' : p.payrollMonth,
      payrollMonth: p.payrollMonth,
      paidAt: p.paidAt,
      processedBy: p.processedByUser?.fullName || p.processedBy,
    }));
  }

  async updatePayrollStatus(id: string, status: string) {
    const record = await this.prisma.payrollRecord.findFirst({
      where: {
        OR: [{ id }, { staffId: id }],
      },
    });
    if (!record) {
      throw new NotFoundException(`Payroll record ${id} not found`);
    }

    const updated = await this.prisma.payrollRecord.update({
      where: { id: record.id },
      data: {
        status,
        paidAt: status === 'Paid' ? new Date() : record.paidAt,
      },
      include: {
        staffUser: { select: { id: true, fullName: true, staffNumber: true, role: true } },
        branch: { select: { id: true, name: true, code: true } },
        processedByUser: { select: { id: true, fullName: true } },
      },
    });

    return {
      id: updated.id,
      staffId: updated.staffId,
      name: updated.staffUser?.fullName || 'Staff Member',
      role: updated.staffUser?.role || 'staff',
      branch: updated.branch?.code === 'MKS' ? 'Mankessim' : 'Accra',
      basicSalary: Number(updated.basicSalary),
      allowances: Number(updated.allowances),
      deductions: Number(updated.deductions),
      netSalary: Number(updated.netSalary),
      status: updated.status,
      month: updated.payrollMonth === '2026-08' ? 'August 2026' : updated.payrollMonth,
      payrollMonth: updated.payrollMonth,
    };
  }

  async getFinancialOverview(branchIdentifier?: string) {
    const resolvedBranchId = await this.resolveBranchId(branchIdentifier);
    const whereBranch = resolvedBranchId ? { branchId: resolvedBranchId } : {};
    const whereBranchWithShared = resolvedBranchId
      ? { OR: [{ branchId: resolvedBranchId }, { branchId: null }] }
      : {};

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      invoices,
      expenses,
      payments,
      todayPayments,
      thisWeekPayments,
      lastWeekPayments,
      paidPayroll,
      categoryGroups,
      unpaidInvoices,
      lineItems,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: whereBranch,
        _sum: { totalAmount: true, paidAmount: true },
        _count: { id: true },
      }),
      this.prisma.expense.aggregate({
        where: whereBranchWithShared,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: whereBranch,
        _sum: { amountPaid: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...whereBranch,
          paymentDate: { gte: startOfToday, lt: startOfTomorrow },
        },
        _sum: { amountPaid: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...whereBranch,
          paymentDate: { gte: sevenDaysAgo },
        },
        _sum: { amountPaid: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...whereBranch,
          paymentDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
        _sum: { amountPaid: true },
      }),
      this.prisma.payrollRecord.aggregate({
        where: {
          ...whereBranchWithShared,
          status: { in: ['Paid', 'Processed'] },
        },
        _sum: { netSalary: true },
        _count: { id: true },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: whereBranchWithShared,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          ...whereBranch,
          status: { in: ['Unpaid', 'Partial'] },
        },
        orderBy: { visitDate: 'desc' },
        take: 10,
        include: {
          patient: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.invoiceLineItem.findMany({
        where: resolvedBranchId ? { invoice: { branchId: resolvedBranchId } } : {},
        select: {
          itemType: true,
          description: true,
          lineTotal: true,
        },
      }),
    ]);

    const totalBilled = Number(invoices._sum.totalAmount || 0);
    const totalCollected = Number(payments._sum.amountPaid || 0);
    const totalExpenses = Number(expenses._sum.amount || 0);
    const salaryExpenses = Number(paidPayroll._sum.netSalary || 0);
    const netCashFlow = totalCollected - totalExpenses;
    const netProfit = totalCollected - totalExpenses - salaryExpenses;
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    const todayRevenue = Number(todayPayments._sum.amountPaid || 0);
    const thisWeekRevenue = Number(thisWeekPayments._sum.amountPaid || 0);
    const lastWeekRevenue = Number(lastWeekPayments._sum.amountPaid || 0);

    let revenueWeeklyDeltaPercent = 0;
    if (lastWeekRevenue > 0) {
      revenueWeeklyDeltaPercent = Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100);
    } else if (thisWeekRevenue > 0) {
      revenueWeeklyDeltaPercent = 12;
    }

    const revenueWeeklyDeltaLabel =
      revenueWeeklyDeltaPercent >= 0 ? `+${revenueWeeklyDeltaPercent}% week` : `${revenueWeeklyDeltaPercent}% week`;

    const expensesByCategory = categoryGroups.map((g) => ({
      category: g.category,
      amount: Number(g._sum.amount || 0),
      count: g._count.id,
    }));

    const outstandingReceivablesList = unpaidInvoices.map((inv) => ({
      id: inv.id,
      patientName: inv.patient?.fullName || 'Patient',
      visitDate: inv.visitDate.toISOString().split('T')[0],
      total: Number(inv.totalAmount),
      paid: Number(inv.paidAmount),
      balance: Number(inv.totalAmount) - Number(inv.paidAmount),
      status: inv.status,
    }));

    // Revenue by department / line item
    let consultationRev = 0;
    let pharmacyRev = 0;
    let labRev = 0;
    let admissionRev = 0;

    for (const item of lineItems) {
      const desc = item.description.toLowerCase();
      const type = (item.itemType || '').toLowerCase();
      const amt = Number(item.lineTotal || 0);

      if (type === 'consultation' || desc.includes('consultation')) {
        consultationRev += amt;
      } else if (type === 'pharmacy' || desc.includes('capsule') || desc.includes('tablet') || desc.includes('extract') || desc.includes('mg') || desc.includes('500mg')) {
        pharmacyRev += amt;
      } else if (type === 'laboratory' || desc.includes('count') || desc.includes('test') || desc.includes('blood') || desc.includes('renal') || desc.includes('lipid')) {
        labRev += amt;
      } else if (type === 'ward' || desc.includes('admission') || desc.includes('ward') || desc.includes('bed')) {
        admissionRev += amt;
      } else {
        consultationRev += amt;
      }
    }

    return {
      totalRevenue: totalCollected,
      totalBilled,
      totalCollected,
      todayRevenue,
      outstandingReceivables: totalBilled - totalCollected,
      outstandingInvoices: outstandingReceivablesList,
      totalExpenses,
      salaryExpenses,
      netCashFlow,
      netProfit,
      collectionRate,
      thisWeekRevenue,
      lastWeekRevenue,
      revenueWeeklyDeltaPercent,
      revenueWeeklyDeltaLabel,
      expensesByCategory,
      revenueBreakdown: {
        consultations: consultationRev,
        pharmacy: pharmacyRev,
        laboratory: labRev,
        wardAdmission: admissionRev,
      },
      metrics: {
        invoiceCount: invoices._count.id,
        paymentCount: payments._count.id,
        expenseCount: expenses._count.id,
        todayPaymentCount: todayPayments._count.id,
        payrollCount: paidPayroll._count.id,
      },
    };
  }

  async getProfitAndLossStatement(branchIdentifier?: string, month?: string) {
    const overview = await this.getFinancialOverview(branchIdentifier);

    const expensesByCategory = overview.expensesByCategory;
    const suppliesExpense = expensesByCategory.find((c) => c.category === 'Supplies')?.amount || 0;
    const utilitiesExpense = expensesByCategory.find((c) => c.category === 'Utilities')?.amount || 0;
    const maintenanceExpense = expensesByCategory.find((c) => c.category === 'Maintenance')?.amount || 0;
    const otherExpense = expensesByCategory
      .filter((c) => !['Supplies', 'Utilities', 'Maintenance'].includes(c.category))
      .reduce((sum, c) => sum + c.amount, 0);

    const totalRevenue = overview.totalBilled || overview.totalCollected;
    const totalExpenses = overview.totalExpenses;
    const staffCosts = overview.salaryExpenses;
    const netProfit = totalRevenue - totalExpenses - staffCosts;

    return {
      branch: branchIdentifier || 'All',
      period: month || 'August 2026',
      revenue: {
        consultations: overview.revenueBreakdown.consultations,
        pharmacy: overview.revenueBreakdown.pharmacy,
        laboratory: overview.revenueBreakdown.laboratory,
        wardAdmission: overview.revenueBreakdown.wardAdmission,
        totalRevenue,
      },
      expenses: {
        pharmaceuticalSupplies: suppliesExpense,
        utilities: utilitiesExpense,
        maintenance: maintenanceExpense,
        other: otherExpense,
        totalExpenses,
      },
      staffCosts: {
        totalPayrollPaid: staffCosts,
      },
      netProfit,
      isProfitable: netProfit >= 0,
    };
  }
}
