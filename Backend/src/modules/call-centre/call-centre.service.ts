import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCallLogDto, CreatePatientFollowUpDto } from './dto/create-call-log.dto';

@Injectable()
export class CallCentreService {
  constructor(private prisma: PrismaService) {}

  async createCallLog(dto: CreateCallLogDto, agentId: string) {
    const id = `CL-${Date.now().toString().slice(-4)}`;

    let branchId = dto.branchId;
    if (!branchId) {
      if (dto.branch) {
        const b = await this.prisma.branch.findFirst({
          where: { name: { contains: dto.branch, mode: 'insensitive' } },
        });
        if (b) branchId = b.id;
      }
      if (!branchId) {
        const defaultBranch = await this.prisma.branch.findFirst({ where: { code: 'ACCRA-MAIN' } });
        branchId = defaultBranch?.id || (await this.prisma.branch.findFirst())?.id || '';
      }
    }

    return this.prisma.callLog.create({
      data: {
        id,
        patientId: dto.patientId || null,
        patientName: dto.patientName,
        agentId,
        branchId,
        reason: dto.reason,
        notes: dto.notes,
        outcome: dto.outcome,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      },
      include: {
        agentUser: { select: { id: true, fullName: true, role: true } },
        patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async findAllCallLogs(branchId?: string, search?: string) {
    const where: any = {};
    if (branchId && branchId !== 'All') {
      where.branch = {
        OR: [
          { id: branchId },
          { name: { contains: branchId, mode: 'insensitive' } },
          { code: { contains: branchId, mode: 'insensitive' } },
        ],
      };
    }

    if (search) {
      where.OR = [
        { patientName: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { outcome: { contains: search, mode: 'insensitive' } },
      ];
    }

    const logs = await this.prisma.callLog.findMany({
      where,
      orderBy: { callDate: 'desc' },
      include: {
        agentUser: { select: { id: true, fullName: true } },
        patient: { select: { id: true, mrn: true, fullName: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    const items = logs.map((l) => ({
      id: l.id,
      patientName: l.patientName,
      patientId: l.patientId,
      agentName: l.agentUser?.fullName || 'Agent',
      reason: l.reason,
      notes: l.notes,
      outcome: l.outcome,
      callDate: l.callDate.toISOString().replace('T', ' ').slice(0, 16),
      followUpDate: l.followUpDate ? l.followUpDate.toISOString().slice(0, 10) : undefined,
      branch: l.branch?.name || 'Accra',
    }));

    const complaints = items.filter((l) => l.outcome === 'Complaint');
    const followUps = items.filter((l) => l.outcome === 'Follow-up Scheduled');

    return {
      summary: {
        totalCalls: items.length,
        openComplaintsCount: complaints.length,
        followUpsScheduledCount: followUps.length,
      },
      complaints,
      followUpsDue: followUps,
      items,
    };
  }

  async createFollowUp(dto: CreatePatientFollowUpDto, doctorId: string) {
    const id = `FU-${Date.now().toString().slice(-4)}`;

    let branchId = dto.branchId;
    if (!branchId && dto.branch) {
      const b = await this.prisma.branch.findFirst({
        where: { name: { contains: dto.branch, mode: 'insensitive' } },
      });
      if (b) branchId = b.id;
    }
    if (!branchId) {
      const defaultBranch = await this.prisma.branch.findFirst({ where: { code: 'ACCRA-MAIN' } });
      branchId = defaultBranch?.id || (await this.prisma.branch.findFirst())?.id || '';
    }

    return this.prisma.patientFollowUp.create({
      data: {
        id,
        patientId: dto.patientId,
        doctorId,
        branchId,
        condition: dto.condition,
        dueDate: new Date(dto.dueDate),
        lastVisit: new Date(dto.lastVisit),
        status: dto.status || 'Due',
        effectiveness: dto.effectiveness || null,
        notes: dto.notes || null,
        nextDate: dto.nextDate ? new Date(dto.nextDate) : null,
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
        doctorUser: { select: { id: true, fullName: true } },
      },
    });
  }

  async recordReview(id: string, dto: { notes: string; effectiveness?: string; nextDate?: string }) {
    const item = await this.prisma.patientFollowUp.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Follow-up ${id} not found`);

    return this.prisma.patientFollowUp.update({
      where: { id },
      data: {
        status: 'Completed',
        notes: dto.notes,
        effectiveness: dto.effectiveness || item.effectiveness,
        nextDate: dto.nextDate ? new Date(dto.nextDate) : item.nextDate,
      },
      include: {
        patient: true,
        doctorUser: true,
      },
    });
  }

  async updateFollowUpStatus(id: string, status: string, notes?: string) {
    const item = await this.prisma.patientFollowUp.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Follow-up ${id} not found`);

    return this.prisma.patientFollowUp.update({
      where: { id },
      data: {
        status,
        notes: notes || item.notes,
      },
    });
  }

  async findAllFollowUps(status?: string, branchId?: string) {
    const where: any = {};
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

    const followUps = await this.prisma.patientFollowUp.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
        doctorUser: { select: { id: true, fullName: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    const items = followUps.map((f) => ({
      id: f.id,
      patientId: f.patientId,
      patientName: f.patient?.fullName || 'Unknown Patient',
      doctorName: f.doctorUser?.fullName || 'Consultant',
      dueDate: f.dueDate.toISOString().slice(0, 10),
      condition: f.condition,
      lastVisit: f.lastVisit.toISOString().slice(0, 10),
      status: f.status,
      notes: f.notes || undefined,
      nextDate: f.nextDate ? f.nextDate.toISOString().slice(0, 10) : undefined,
      effectiveness: f.effectiveness || undefined,
      branch: f.branch?.name || 'Accra',
    }));

    const overdue = items.filter((f) => f.status === 'Overdue');
    const due = items.filter((f) => f.status === 'Due');
    const completed = items.filter((f) => f.status === 'Completed');

    return {
      summary: {
        overdueCount: overdue.length,
        dueCount: due.length,
        completedCount: completed.length,
        totalCount: items.length,
      },
      overdue,
      due,
      completed,
      items,
    };
  }

}
