import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTelemedicineSessionDto } from './dto/create-telemedicine-session.dto';
import { UpdateTelemedicineSessionDto, CompleteTelemedicineSessionDto } from './dto/update-telemedicine-session.dto';
import { QueryTelemedicineDto } from './dto/query-telemedicine.dto';

import { resolveBranchId } from '../../common/services/branch-resolver.service';

@Injectable()
export class TelemedicineService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveBranchId(branchInput?: string): Promise<string | undefined> {
    const res = await resolveBranchId(this.prisma, branchInput);
    return res || undefined;
  }

  async findAll(query: QueryTelemedicineDto) {
    const branchId = await this.resolveBranchId(query.branchId || query.branch);

    const where: any = {};
    if (branchId) {
      where.branchId = branchId;
    }
    if (query.doctorId) {
      where.doctorId = query.doctorId;
    }
    if (query.patientId) {
      where.patientId = query.patientId;
    }
    if (query.type) {
      where.sessionType = query.type;
    }
    if (query.status) {
      where.status = query.status;
    } else if (query.tab === 'upcoming') {
      where.status = { in: ['Scheduled', 'In Progress'] };
    } else if (query.tab === 'completed') {
      where.status = { in: ['Completed', 'Cancelled', 'No-show'] };
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { patient: { fullName: { contains: q, mode: 'insensitive' } } },
        { doctorUser: { fullName: { contains: q, mode: 'insensitive' } } },
        { chiefComplaint: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [allSessions, totalCount] = await Promise.all([
      this.prisma.telemedicineSession.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: {
            select: { id: true, fullName: true, phone: true, email: true, gender: true },
          },
          doctorUser: {
            select: { id: true, fullName: true, role: true, email: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      this.prisma.telemedicineSession.count({ where }),
    ]);

    // Compute top-level summary metrics across the branch scope
    const summaryWhere: any = branchId ? { branchId } : {};
    const [scheduledCount, completedCount, noShowCount, totalThisMonth] = await Promise.all([
      this.prisma.telemedicineSession.count({ where: { ...summaryWhere, status: 'Scheduled' } }),
      this.prisma.telemedicineSession.count({ where: { ...summaryWhere, status: 'Completed' } }),
      this.prisma.telemedicineSession.count({ where: { ...summaryWhere, status: 'No-show' } }),
      this.prisma.telemedicineSession.count({ where: summaryWhere }),
    ]);

    const formattedSessions = allSessions.map((s) => {
      const branchName = s.branch.name.includes('Mankessim') ? 'Mankessim' : 'Accra';
      const scheduledDateStr = s.scheduledAt.toISOString().replace('T', ' ').slice(0, 16);

      return {
        id: s.id,
        patientId: s.patientId,
        patientName: s.patient.fullName,
        patientPhone: s.patient.phone,
        doctorId: s.doctorId,
        doctorName: s.doctorUser.fullName,
        scheduledAt: scheduledDateStr,
        duration: s.duration,
        status: s.status,
        type: s.sessionType,
        sessionType: s.sessionType,
        chiefComplaint: s.chiefComplaint,
        notes: s.notes || undefined,
        branch: branchName as 'Accra' | 'Mankessim',
        branchId: s.branchId,
        branchName: s.branch.name,
        meetingLink: s.meetingLink || `meet.eduhms.gh/tm-${s.id.toLowerCase().replace('tlm-', '')}`,
        createdAt: s.createdAt,
      };
    });

    const upcoming = formattedSessions.filter((s) => ['Scheduled', 'In Progress'].includes(s.status));
    const completed = formattedSessions.filter((s) => ['Completed', 'Cancelled', 'No-show'].includes(s.status));

    return {
      summary: {
        scheduled: scheduledCount,
        completed: completedCount,
        noShows: noShowCount,
        thisMonth: totalThisMonth,
      },
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      total: totalCount,
      items: formattedSessions,
      upcoming,
      completed,
    };
  }

  async findOne(id: string) {
    const session = await this.prisma.telemedicineSession.findFirst({
      where: { OR: [{ id }, { id: id.toUpperCase() }] },
      include: {
        patient: true,
        doctorUser: true,
        branch: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Telemedicine session '${id}' not found`);
    }

    const branchName = session.branch.name.includes('Mankessim') ? 'Mankessim' : 'Accra';
    return {
      id: session.id,
      patientId: session.patientId,
      patientName: session.patient.fullName,
      patientPhone: session.patient.phone,
      doctorId: session.doctorId,
      doctorName: session.doctorUser.fullName,
      scheduledAt: session.scheduledAt.toISOString().replace('T', ' ').slice(0, 16),
      duration: session.duration,
      status: session.status,
      type: session.sessionType,
      sessionType: session.sessionType,
      chiefComplaint: session.chiefComplaint,
      notes: session.notes,
      branch: branchName,
      branchId: session.branchId,
      branchName: session.branch.name,
      meetingLink: session.meetingLink || `meet.eduhms.gh/tm-${session.id.toLowerCase().replace('tlm-', '')}`,
      createdAt: session.createdAt,
    };
  }

  async create(dto: CreateTelemedicineSessionDto) {
    let branchId = dto.branchId;
    if (!branchId && dto.branch) {
      branchId = await this.resolveBranchId(dto.branch);
    }
    if (!branchId) {
      const defaultBranch = await this.prisma.branch.findFirst({
        where: { code: 'ACC' },
      });
      branchId = defaultBranch?.id || (await this.prisma.branch.findFirst())?.id || '';
    }

    const count = await this.prisma.telemedicineSession.count();
    const sessionId = `TLM-${String(count + 1).padStart(3, '0')}`;
    const meetingCode = `tm-${String(count + 1).padStart(3, '0')}`;
    const meetingLink = dto.meetingLink || `meet.eduhms.gh/${meetingCode}`;

    const sessionType = dto.sessionType || dto.type || 'Video';
    const duration = dto.duration ? Number(dto.duration) : 30;

    const scheduledDate = new Date(dto.scheduledAt);

    const created = await this.prisma.telemedicineSession.create({
      data: {
        id: sessionId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        branchId,
        scheduledAt: isNaN(scheduledDate.getTime()) ? new Date() : scheduledDate,
        duration,
        sessionType,
        status: 'Scheduled',
        chiefComplaint: dto.chiefComplaint,
        meetingLink,
      },
      include: {
        patient: true,
        doctorUser: true,
        branch: true,
      },
    });

    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateTelemedicineSessionDto) {
    await this.findOne(id);

    const data: any = {};
    if (dto.patientId) data.patientId = dto.patientId;
    if (dto.doctorId) data.doctorId = dto.doctorId;
    if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.duration !== undefined) data.duration = Number(dto.duration);
    if (dto.type || dto.sessionType) data.sessionType = dto.sessionType || dto.type;
    if (dto.status) data.status = dto.status;
    if (dto.chiefComplaint) data.chiefComplaint = dto.chiefComplaint;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.meetingLink) data.meetingLink = dto.meetingLink;
    if (dto.branchId) data.branchId = dto.branchId;

    await this.prisma.telemedicineSession.update({
      where: { id },
      data,
    });

    return this.findOne(id);
  }

  async completeSession(id: string, dto: CompleteTelemedicineSessionDto) {
    const session = await this.findOne(id);

    await this.prisma.telemedicineSession.update({
      where: { id: session.id },
      data: {
        status: 'Completed',
        notes: dto.notes !== undefined ? dto.notes : session.notes,
      },
    });

    return {
      success: true,
      id: session.id,
      status: 'Completed',
      notes: dto.notes,
      message: `Telemedicine session ${session.id} marked as Completed with consultation notes recorded.`,
    };
  }

  async startSession(id: string) {
    const session = await this.findOne(id);

    await this.prisma.telemedicineSession.update({
      where: { id: session.id },
      data: {
        status: 'In Progress',
      },
    });

    return {
      success: true,
      id: session.id,
      status: 'In Progress',
      meetingLink: session.meetingLink,
      message: `Telemedicine session ${session.id} started.`,
    };
  }

  async updateStatus(id: string, status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No-show') {
    const session = await this.findOne(id);

    await this.prisma.telemedicineSession.update({
      where: { id: session.id },
      data: { status },
    });

    return {
      success: true,
      id: session.id,
      status,
      message: `Telemedicine session ${session.id} status changed to ${status}.`,
    };
  }
}
