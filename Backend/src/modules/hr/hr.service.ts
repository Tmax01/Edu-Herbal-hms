import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveRequestDto, ApproveLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateOffDutyRequestDto, ApproveOffDutyDto } from './dto/create-off-duty-request.dto';
import { QueryHrDto } from './dto/query-hr.dto';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async createLeaveRequest(dto: CreateLeaveRequestDto, currentUserId: string) {
    const id = `LV-${Date.now()}`;
    const staffId = dto.staffId || currentUserId;

    return this.prisma.leaveRequest.create({
      data: {
        id,
        staffId,
        branchId: dto.branchId,
        leaveType: dto.leaveType,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
        days: dto.days,
        reason: dto.reason,
        status: 'Pending',
      },
      include: {
        staffUser: { select: { id: true, fullName: true, staffNumber: true, role: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async approveLeaveRequest(id: string, dto: ApproveLeaveRequestDto, supervisorId: string) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException(`Leave request ${id} not found`);

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.status,
        approvedBy: supervisorId,
      },
      include: {
        staffUser: { select: { id: true, fullName: true } },
        approvedByUser: { select: { id: true, fullName: true } },
      },
    });
  }

  async getOverview(branchId?: string) {
    const branchFilter: any = {};
    if (branchId && branchId !== 'All') {
      branchFilter.branch = {
        OR: [
          { id: branchId },
          { name: { contains: branchId, mode: 'insensitive' } },
          { code: { contains: branchId, mode: 'insensitive' } },
        ],
      };
    }

    const [activeStaffCount, totalStaffCount, pendingLeaveCount, pendingOffDutyCount, departments] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            isActive: true,
            ...(branchId && branchId !== 'All'
              ? {
                  OR: [
                    { primaryBranch: { name: { contains: branchId, mode: 'insensitive' } } },
                    { primaryBranchId: null },
                  ],
                }
              : {}),
          },
        }),
        this.prisma.user.count(),
        this.prisma.leaveRequest.count({
          where: {
            status: 'Pending',
            ...branchFilter,
          },
        }),
        this.prisma.offDutyRequest.count({
          where: {
            status: 'Pending',
            ...branchFilter,
          },
        }),
        this.prisma.department.findMany({
          include: {
            users: { select: { id: true, fullName: true, role: true, isActive: true } },
          },
        }),
      ]);

    return {
      activeStaffCount,
      totalStaffCount,
      pendingLeaveCount,
      pendingOffDutyCount,
      departmentsCount: departments.length,
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        staffCount: d.users.length,
        staff: d.users,
      })),
    };
  }

  async findAllLeave(query: QueryHrDto) {
    const { staffId, status, branchId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (staffId) where.staffId = staffId;
    if (status && status !== 'All') where.status = status;
    if (branchId && branchId !== 'All') {
      where.branch = {
        OR: [
          { id: branchId },
          { name: { contains: branchId, mode: 'insensitive' } },
          { code: { contains: branchId, mode: 'insensitive' } },
        ],
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.leaveRequest.count({ where }),
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staffUser: { select: { id: true, fullName: true, staffNumber: true, role: true } },
          approvedByUser: { select: { id: true, fullName: true } },
          branch: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    const formatted = items.map((l) => ({
      id: l.id,
      staffId: l.staffId,
      staffName: l.staffUser?.fullName || 'Staff Member',
      type: l.leaveType,
      from: l.fromDate.toISOString().slice(0, 10),
      to: l.toDate.toISOString().slice(0, 10),
      days: l.days,
      reason: l.reason,
      status: l.status,
      approvedBy: l.approvedByUser?.fullName || l.approvedBy || undefined,
      branch: l.branch?.name || 'Accra',
    }));

    return {
      summary: {
        pending: formatted.filter((l) => l.status === 'Pending').length,
        approved: formatted.filter((l) => l.status === 'Approved').length,
        rejected: formatted.filter((l) => l.status === 'Rejected').length,
        total,
      },
      items: formatted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createOffDutyRequest(dto: CreateOffDutyRequestDto, currentUserId: string) {
    const id = `OD-${Date.now().toString().slice(-4)}`;
    const staffId = dto.staffId || currentUserId;

    let branchId = dto.branchId;
    let departmentId = dto.departmentId;

    if (!branchId || !departmentId) {
      const staff = await this.prisma.user.findUnique({
        where: { id: staffId },
        include: { department: true, primaryBranch: true },
      });
      if (!branchId) branchId = staff?.primaryBranchId || (await this.prisma.branch.findFirst())?.id || '';
      if (!departmentId) departmentId = staff?.departmentId || (await this.prisma.department.findFirst())?.id || '';
    }


    return this.prisma.offDutyRequest.create({
      data: {
        id,
        staffId,
        departmentId,
        branchId,
        requestDate: new Date(dto.requestDate),
        shiftType: dto.shiftType,
        reason: dto.reason,
        status: 'Pending',
      },
      include: {
        staffUser: { select: { id: true, fullName: true, staffNumber: true } },
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async approveOffDutyRequest(id: string, dto: ApproveOffDutyDto, supervisorId: string) {
    const request = await this.prisma.offDutyRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException(`Off-duty request ${id} not found`);

    return this.prisma.offDutyRequest.update({
      where: { id },
      data: {
        status: dto.status,
        approvedBy: supervisorId,
      },
      include: {
        staffUser: { select: { id: true, fullName: true } },
        approvedByUser: { select: { id: true, fullName: true } },
      },
    });
  }

  async findAllOffDuty(query: QueryHrDto) {
    const { staffId, status, branchId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (staffId) where.staffId = staffId;
    if (status && status !== 'All') where.status = status;
    if (branchId && branchId !== 'All') {
      where.branch = {
        OR: [
          { id: branchId },
          { name: { contains: branchId, mode: 'insensitive' } },
          { code: { contains: branchId, mode: 'insensitive' } },
        ],
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.offDutyRequest.count({ where }),
      this.prisma.offDutyRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          staffUser: { select: { id: true, fullName: true, staffNumber: true } },
          department: { select: { id: true, name: true } },
          approvedByUser: { select: { id: true, fullName: true } },
          branch: { select: { id: true, name: true } },
        },
      }),
    ]);

    const formatted = items.map((o) => ({
      id: o.id,
      staffId: o.staffId,
      staffName: o.staffUser?.fullName || 'Staff Member',
      department: o.department?.name || 'Department',
      branch: o.branch?.name || 'Accra',
      date: o.requestDate.toISOString().slice(0, 10),
      shiftType: o.shiftType,
      reason: o.reason,
      status: o.status,
      approvedBy: o.approvedByUser?.fullName || o.approvedBy || undefined,
      submittedAt: o.submittedAt.toISOString().replace('T', ' ').slice(0, 16),
    }));

    return {
      summary: {
        pending: formatted.filter((o) => o.status === 'Pending').length,
        approved: formatted.filter((o) => o.status === 'Approved').length,
        rejected: formatted.filter((o) => o.status === 'Rejected').length,
        total,
      },
      items: formatted,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

}
