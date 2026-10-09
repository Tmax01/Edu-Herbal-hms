import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyReportDto, ReviewDailyReportDto } from './dto/create-daily-report.dto';

import { resolveBranchId } from '../../common/services/branch-resolver.service';

@Injectable()
export class DailyReportsService {
  constructor(private prisma: PrismaService) {}

  private async resolveBranch(identifier?: string, fallbackId?: string | null): Promise<string> {
    const res = await resolveBranchId(this.prisma, identifier, fallbackId || 'accra-main-branch-001');
    return res || 'accra-main-branch-001';
  }

  private async resolveDepartment(identifier?: string, fallbackId?: string | null): Promise<string> {
    if (identifier && identifier.trim().toLowerCase() !== 'all') {
      const trimmed = identifier.trim();
      // Map front desk to triage / reception
      const searchTerms = trimmed.toLowerCase() === 'front desk' ? ['Front Desk', 'Reception', 'RECEPT'] : [trimmed];

      for (const term of searchTerms) {
        const dept = await this.prisma.department.findFirst({
          where: {
            OR: [
              { id: term },
              { code: { equals: term, mode: 'insensitive' } },
              { name: { contains: term, mode: 'insensitive' } },
            ],
          },
        });
        if (dept) return dept.id;
      }
    }
    return fallbackId || 'dept-triage-005';
  }

  private formatReport(r: any) {
    const dateStr = r.reportDate.toISOString().split('T')[0];
    const branchName = r.branch?.code === 'MKS' ? 'Mankessim' : 'Accra';
    const deptName = r.department?.name || 'Front Desk';

    return {
      id: r.id,
      staffId: r.staffId,
      staffName: r.staffUser?.fullName || 'Staff Member',
      role: r.staffUser?.role || 'receptionist',
      department: deptName,
      branch: branchName,
      date: dateStr,
      reportDate: dateStr,
      activities: r.activities,
      patientsHandled: r.patientsHandled,
      challenges: r.challenges || '',
      recommendations: r.recommendations || '',
      status: r.status,
      reviewedBy: r.reviewedByUser?.fullName || r.reviewedBy || undefined,
      reviewNotes: r.reviewNotes || undefined,
      submittedAt: r.submittedAt ? r.submittedAt.toISOString().replace('T', ' ').slice(0, 16) : undefined,
    };
  }

  async create(dto: CreateDailyReportDto, staffId: string) {
    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
    });

    const branchId = await this.resolveBranch(dto.branchId || dto.branch, staff?.primaryBranchId);
    const departmentId = await this.resolveDepartment(dto.departmentId || dto.department, staff?.departmentId);

    const rawDate = dto.reportDate || dto.date || new Date().toISOString().split('T')[0];
    const reportDate = new Date(rawDate);
    const recommendations = dto.recommendations || dto.notes || null;
    const patientsHandled = Number(dto.patientsHandled ?? 0);

    let activities = dto.activities;
    if (!activities && Array.isArray(dto.tasks) && dto.tasks.length > 0) {
      activities = dto.tasks.filter((t: any) => typeof t === 'string').join('. ');
    }
    if (!activities) {
      activities = dto.notes || 'Routine departmental duties and workflows completed.';
    }

    const existing = await this.prisma.dailyReport.findUnique({
      where: {
        staffId_reportDate: {
          staffId,
          reportDate,
        },
      },
    });

    let savedReport;
    if (existing) {
      savedReport = await this.prisma.dailyReport.update({
        where: { id: existing.id },
        data: {
          departmentId,
          branchId,
          activities,
          patientsHandled,
          challenges: dto.challenges || existing.challenges,
          recommendations,
          status: 'Submitted',
        },
        include: {
          staffUser: true,
          department: true,
          branch: true,
          reviewedByUser: true,
        },
      });
    } else {
      const id = `RPT-${Date.now().toString().slice(-4)}`;
      savedReport = await this.prisma.dailyReport.create({
        data: {
          id,
          staffId,
          departmentId,
          branchId,
          reportDate,
          activities,
          patientsHandled,
          challenges: dto.challenges || null,
          recommendations,
          status: 'Submitted',
        },
        include: {
          staffUser: true,
          department: true,
          branch: true,
          reviewedByUser: true,
        },
      });
    }

    return this.formatReport(savedReport);
  }

  async review(id: string, dto: ReviewDailyReportDto, reviewerId: string) {
    const report = await this.prisma.dailyReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException(`Daily report ${id} not found`);

    const updated = await this.prisma.dailyReport.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedBy: reviewerId,
        reviewNotes: dto.reviewNotes || null,
      },
      include: {
        staffUser: true,
        department: true,
        branch: true,
        reviewedByUser: true,
      },
    });

    return this.formatReport(updated);
  }

  async findAll(params: {
    staffId?: string;
    branch?: string;
    branchId?: string;
    department?: string;
    departmentId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const where: any = {};

    if (params.staffId) {
      where.staffId = params.staffId;
    }

    const branchIdentifier = params.branchId || params.branch;
    if (branchIdentifier && branchIdentifier.toLowerCase() !== 'all') {
      const b = await this.prisma.branch.findFirst({
        where: {
          OR: [
            { id: branchIdentifier },
            { code: { equals: branchIdentifier, mode: 'insensitive' } },
            { name: { contains: branchIdentifier, mode: 'insensitive' } },
          ],
        },
      });
      if (b) where.branchId = b.id;
    }

    const deptIdentifier = params.departmentId || params.department;
    if (deptIdentifier && deptIdentifier.toLowerCase() !== 'all') {
      const d = await this.prisma.department.findFirst({
        where: {
          OR: [
            { id: deptIdentifier },
            { code: { equals: deptIdentifier, mode: 'insensitive' } },
            { name: { contains: deptIdentifier, mode: 'insensitive' } },
          ],
        },
      });
      if (d) where.departmentId = d.id;
    }

    if (params.status && params.status.toLowerCase() !== 'all') {
      where.status = params.status;
    }

    if (params.date) {
      where.reportDate = new Date(params.date);
    } else if (params.startDate || params.endDate) {
      where.reportDate = {};
      if (params.startDate) where.reportDate.gte = new Date(params.startDate);
      if (params.endDate) where.reportDate.lte = new Date(params.endDate);
    }

    const reports = await this.prisma.dailyReport.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      include: {
        staffUser: { select: { id: true, fullName: true, role: true } },
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
        reviewedByUser: { select: { id: true, fullName: true } },
      },
    });

    return reports.map((r) => this.formatReport(r));
  }
}
