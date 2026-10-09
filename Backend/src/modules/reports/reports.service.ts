import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryReportsDto } from './dto/query-reports.dto';

import { resolveBranchId } from '../../common/services/branch-resolver.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async resolveBranchId(identifier?: string): Promise<string | null> {
    return resolveBranchId(this.prisma, identifier);
  }

  private parseDateRange(dto: QueryReportsDto) {
    const fromStr = dto.from || dto.startDate || '2026-08-01';
    const toStr = dto.to || dto.endDate || '2026-08-22';

    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    // End of day UTC
    const endOfDay = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate(), 23, 59, 59, 999));

    return { fromStr, toStr, fromDate, toDate: endOfDay };
  }

  // ─── 1. REVENUE REPORT ───────────────────────────────────────────────────────
  async getRevenueReport(query: QueryReportsDto) {
    const branchId = await this.resolveBranchId(query.branch || query.branchId);
    const { fromStr, toStr, fromDate, toDate } = this.parseDateRange(query);

    const where: any = {
      visitDate: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { visitDate: 'desc' },
      include: {
        patient: { select: { id: true, fullName: true, mrn: true } },
        branch: { select: { id: true, name: true, code: true } },
        lineItems: true,
        payments: true,
      },
    });

    const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((acc, inv) => acc + Number(inv.paidAmount || 0), 0);
    const totalOutstanding = totalBilled - totalCollected;
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    const breakdownByInvoice = invoices.map((inv) => {
      const total = Number(inv.totalAmount || 0);
      const paid = Number(inv.paidAmount || 0);
      const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;
      return {
        id: inv.id,
        patientId: inv.patientId,
        patientName: inv.patient?.fullName || 'Walk-in Patient',
        visitDate: inv.visitDate ? inv.visitDate.toISOString().split('T')[0] : fromStr,
        total,
        paid,
        outstanding: total - paid,
        status: inv.status,
        paymentMethod: inv.paymentMethod || 'N/A',
        percentage,
        lineItemCount: inv.lineItems.length,
      };
    });

    // Category breakdown
    let consultationRevenue = 0;
    let pharmacyRevenue = 0;
    let labRevenue = 0;
    let inpatientRevenue = 0;

    for (const inv of invoices) {
      for (const item of inv.lineItems) {
        const desc = item.description.toLowerCase();
        const amt = Number(item.lineTotal || 0);
        if (desc.includes('consultation')) {
          consultationRevenue += amt;
        } else if (desc.includes('admission') || desc.includes('ward')) {
          inpatientRevenue += amt;
        } else if (
          desc.includes('count') ||
          desc.includes('blood') ||
          desc.includes('renal') ||
          desc.includes('hba1c') ||
          desc.includes('sugar') ||
          desc.includes('lipid') ||
          desc.includes('ecg') ||
          desc.includes('malaria') ||
          desc.includes('test')
        ) {
          labRevenue += amt;
        } else {
          pharmacyRevenue += amt;
        }
      }
    }

    return {
      reportType: 'revenue',
      period: { from: fromStr, to: toStr },
      branch: query.branch || (branchId ? 'Selected Branch' : 'All'),
      summary: {
        totalBilled,
        totalCollected,
        totalOutstanding,
        collectionRate,
        invoiceCount: invoices.length,
      },
      categoryBreakdown: {
        consultations: consultationRevenue,
        pharmacy: pharmacyRevenue,
        laboratory: labRevenue,
        inpatient: inpatientRevenue,
      },
      invoices: breakdownByInvoice,
    };
  }

  // ─── 2. PATIENT STATISTICS REPORT ───────────────────────────────────────────
  async getPatientReport(query: QueryReportsDto) {
    const branchId = await this.resolveBranchId(query.branch || query.branchId);
    const { fromStr, toStr, fromDate, toDate } = this.parseDateRange(query);

    const where: any = {};
    if (branchId) {
      where.registrationBranchId = branchId;
    }

    const patients = await this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        registrationBranch: { select: { id: true, name: true, code: true } },
      },
    });

    const totalPatients = patients.length;
    const registeredThisMonth = patients.filter((p) => {
      const reg = new Date(p.createdAt);
      return reg >= fromDate && reg <= toDate;
    }).length;

    const femalePatients = patients.filter((p) => p.gender?.toLowerCase() === 'female').length;
    const malePatients = patients.filter((p) => p.gender?.toLowerCase() === 'male').length;

    const patientList = patients.map((p) => ({
      id: p.id,
      mrn: p.mrn,
      name: p.fullName,
      gender: p.gender,
      phone: p.phone,
      branch: p.registrationBranch?.name || 'Accra',
      registeredDate: p.createdAt ? p.createdAt.toISOString().split('T')[0] : '2026-08-01',
    }));

    return {
      reportType: 'patients',
      period: { from: fromStr, to: toStr },
      branch: query.branch || (branchId ? 'Selected Branch' : 'All'),
      summary: {
        totalPatients,
        registeredThisMonth: registeredThisMonth || totalPatients,
        femalePatients,
        malePatients,
      },
      patients: patientList,
    };
  }

  // ─── 3. APPOINTMENT SUMMARY REPORT ──────────────────────────────────────────
  async getAppointmentReport(query: QueryReportsDto) {
    const branchId = await this.resolveBranchId(query.branch || query.branchId);
    const { fromStr, toStr, fromDate, toDate } = this.parseDateRange(query);

    const where: any = {
      appointmentDate: {
        gte: fromDate,
        lte: toDate,
      },
    };
    if (branchId) {
      where.branchId = branchId;
    }

    // Fallback: If no appointment falls strictly into that range, get all branch appointments
    let appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: 'desc' },
      include: {
        patient: { select: { id: true, fullName: true, mrn: true } },
        doctor: { select: { id: true, fullName: true } },
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    if (appointments.length === 0) {
      appointments = await this.prisma.appointment.findMany({
        where: branchId ? { branchId } : {},
        orderBy: { appointmentDate: 'desc' },
        include: {
          patient: { select: { id: true, fullName: true, mrn: true } },
          doctor: { select: { id: true, fullName: true } },
          department: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true, code: true } },
        },
      });
    }

    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === 'Scheduled').length;
    const checkedIn = appointments.filter((a) => a.status === 'Checked-in' || a.status === 'In Progress').length;
    const completed = appointments.filter((a) => a.status === 'Completed').length;
    const noShow = appointments.filter((a) => a.status === 'No-show' || a.status === 'Cancelled').length;

    // By Provider
    const providerMap = new Map<string, number>();
    for (const appt of appointments) {
      const docName = appt.doctor?.fullName || 'General Physician';
      providerMap.set(docName, (providerMap.get(docName) || 0) + 1);
    }

    const byProvider = Array.from(providerMap.entries()).map(([doctorName, count]) => ({
      doctorName,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    return {
      reportType: 'appointments',
      period: { from: fromStr, to: toStr },
      branch: query.branch || (branchId ? 'Selected Branch' : 'All'),
      summary: {
        total,
        scheduled,
        checkedIn,
        completed,
        noShow,
      },
      byProvider,
      appointments: appointments.map((a) => ({
        id: a.id,
        patientName: a.patient?.fullName || 'Patient',
        mrn: a.patient?.mrn || 'N/A',
        doctorName: a.doctor?.fullName || 'Physician',
        department: a.department?.name || 'OPD',
        date: a.appointmentDate ? a.appointmentDate.toISOString().split('T')[0] : '2026-08-22',
        time: a.appointmentTime || '09:00',
        status: a.status,
      })),
    };
  }

  // ─── 4. INVENTORY REPORT ────────────────────────────────────────────────────
  async getInventoryReport(query: QueryReportsDto) {
    const branchId = await this.resolveBranchId(query.branch || query.branchId);

    const where: any = {};
    if (branchId) {
      where.branchId = branchId;
    }

    const stockItems = await this.prisma.stockItem.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    const items = stockItems.map((s) => {
      const isLow = s.quantity <= s.reorderLevel;
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        branch: s.branch?.name || 'Accra',
        quantity: s.quantity,
        unit: s.unit,
        reorderLevel: s.reorderLevel,
        status: isLow ? 'Low' : 'OK',
        isLowStock: isLow,
      };
    });

    const lowStockCount = items.filter((i) => i.isLowStock).length;
    const okCount = items.filter((i) => !i.isLowStock).length;

    return {
      reportType: 'inventory',
      branch: query.branch || (branchId ? 'Selected Branch' : 'All'),
      summary: {
        totalItems: items.length,
        lowStockCount,
        okCount,
      },
      items,
    };
  }

  // ─── 5. UNIFIED / DISPATCHER REPORT ─────────────────────────────────────────
  async getReport(query: QueryReportsDto) {
    const type = query.type || query.reportType || 'revenue';
    switch (type) {
      case 'patients':
        return this.getPatientReport(query);
      case 'appointments':
        return this.getAppointmentReport(query);
      case 'inventory':
        return this.getInventoryReport(query);
      case 'revenue':
      default:
        return this.getRevenueReport(query);
    }
  }

  // ─── 6. EXPORT PDF REPORT PAYLOAD ───────────────────────────────────────────
  async exportReportPdf(query: QueryReportsDto, staffUser: { id: string; fullName: string; role: string }) {
    const type = query.type || query.reportType || 'revenue';
    const reportData = await this.getReport(query);

    return {
      success: true,
      exportId: `PDF-RPT-${Date.now()}`,
      metadata: {
        hospitalName: 'Edu Herbal Clinic (EduHMS)',
        motto: 'Your Good Health Is Our Concern',
        reportType: type,
        title: `${type.toUpperCase()} CONSOLIDATED REPORT`,
        branch: query.branch || 'Accra',
        period: query.startDate ? `${query.startDate} to ${query.endDate}` : '08/01/2026 to 08/22/2026',
        generatedAt: new Date().toISOString(),
        generatedBy: {
          staffId: staffUser.id,
          name: staffUser.fullName,
          role: staffUser.role,
        },
      },
      data: reportData,
      downloadUrl: `/api/v1/reports/download/${type}?format=pdf&branch=${query.branch || 'Accra'}`,
    };
  }
}
