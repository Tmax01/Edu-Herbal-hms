import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto, createdByStaffId: string) {
    const id = `APT-${Date.now()}`;

    // 1. Resolve Patient
    const patientIdentifier = (dto.patientId || dto.patient || '').trim();
    if (!patientIdentifier) {
      throw new NotFoundException('Patient is required for booking');
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

    // 2. Resolve Doctor
    const doctorIdentifier = (dto.doctorId || dto.doctor || '').trim();
    if (!doctorIdentifier) {
      throw new NotFoundException('Doctor/Provider is required for booking');
    }

    const doctor = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: doctorIdentifier },
          { staffNumber: { equals: doctorIdentifier, mode: 'insensitive' } },
          { fullName: { contains: doctorIdentifier, mode: 'insensitive' } },
        ],
      },
      include: {
        department: true,
        primaryBranch: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor '${doctorIdentifier}' not found`);
    }

    // 3. Resolve Department
    let departmentId = dto.departmentId;
    if (!departmentId) {
      if (dto.department) {
        const dept = await this.prisma.department.findFirst({
          where: {
            OR: [
              { id: dto.department },
              { name: { contains: dto.department, mode: 'insensitive' } },
              { code: { equals: dto.department, mode: 'insensitive' } },
            ],
          },
        });
        departmentId = dept?.id;
      }
      if (!departmentId && doctor.departmentId) {
        departmentId = doctor.departmentId;
      }
      if (!departmentId) {
        const fallbackDept = await this.prisma.department.findFirst();
        departmentId = fallbackDept?.id || 'dept-gen-med-001';
      }
    }

    // 4. Resolve Branch
    const branchIdentifier = (dto.branchId || dto.branch || '').trim();
    let branchId: string | null = null;
    if (branchIdentifier) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          OR: [
            { id: branchIdentifier },
            { code: { equals: branchIdentifier, mode: 'insensitive' } },
            { name: { contains: branchIdentifier, mode: 'insensitive' } },
          ],
        },
      });
      branchId = branch?.id || null;
    }
    if (!branchId) {
      branchId = doctor.primaryBranchId || patient.registrationBranchId || 'accra-main-branch-001';
    }

    // 5. Resolve Date and Time
    const rawDate = dto.appointmentDate || dto.date || new Date().toISOString().split('T')[0];
    const rawTime = dto.appointmentTime || dto.time || '09:00';

    return this.prisma.appointment.create({
      data: {
        id,
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId,
        branchId,
        appointmentDate: new Date(rawDate),
        appointmentTime: rawTime,
        status: 'Scheduled',
        notes: dto.notes || null,
        createdBy: createdByStaffId,
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
        doctor: { select: { id: true, fullName: true, role: true } },
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findAll(query: QueryAppointmentsDto) {
    const { date, startDate, endDate, doctorId, patientId, branchId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
      where.appointmentDate = {
        gte: startOfDay,
        lt: endOfDay,
      };
    } else if (startDate && endDate) {
      const s = new Date(startDate);
      const startOfDay = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
      const e = new Date(endDate);
      const endOfDay = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate() + 1));
      where.appointmentDate = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const yesterdayUtc = new Date(todayUtc);
    yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);
    const tomorrowUtc = new Date(todayUtc);
    tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1);

    const branchFilter = branchId ? { branchId } : {};

    const [total, items, todayCount, yesterdayCount, completedTodayCount] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'asc' }],
        include: {
          patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
          doctor: { select: { id: true, fullName: true, role: true } },
          department: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...branchFilter,
          appointmentDate: { gte: todayUtc, lt: tomorrowUtc },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...branchFilter,
          appointmentDate: { gte: yesterdayUtc, lt: todayUtc },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...branchFilter,
          appointmentDate: { gte: todayUtc, lt: tomorrowUtc },
          status: 'Completed',
        },
      }),
    ]);

    const appointmentDelta = todayCount - yesterdayCount;
    const todayDeltaLabel = appointmentDelta >= 0 ? `+${appointmentDelta} today` : `${appointmentDelta} today`;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        todayCount,
        completedTodayCount,
        appointmentDelta,
        todayDeltaLabel,
      },
    };
  }

  async getTodayQueue(branchId?: string, doctorId?: string, allStatuses: boolean = false) {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const where: any = {
      appointmentDate: {
        gte: today,
        lt: tomorrow,
      },
    };

    if (!allStatuses) {
      where.status = { in: ['Checked-in', 'In Progress', 'Scheduled'] };
    }

    if (branchId) where.branchId = branchId;
    if (doctorId) where.doctorId = doctorId;

    return this.prisma.appointment.findMany({
      where,
      orderBy: [{ status: 'asc' }, { checkedInAt: 'asc' }, { appointmentTime: 'asc' }],
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            fullName: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
            vitals: { take: 1, orderBy: { recordedAt: 'desc' } },
          },
        },
        doctor: { select: { id: true, fullName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            allergies: true,
            emergencyContacts: true,
            vitals: { take: 5, orderBy: { recordedAt: 'desc' } },
          },
        },
        doctor: true,
        department: true,
        branch: true,
        consultations: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async checkIn(id: string) {
    await this.findOne(id);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'Checked-in',
        checkedInAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    const data: any = { status };
    if (status === 'Completed') {
      data.completedAt = new Date();
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.findOne(id);

    const data: Prisma.AppointmentUncheckedUpdateInput = {};

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'Checked-in') {
        data.checkedInAt = new Date();
      } else if (dto.status === 'Completed') {
        data.completedAt = new Date();
      }
    }

    if (dto.appointmentDate || dto.date) {
      data.appointmentDate = new Date(dto.appointmentDate || dto.date!);
    }

    if (dto.appointmentTime || dto.time) {
      data.appointmentTime = dto.appointmentTime || dto.time;
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    if (dto.patientId) {
      data.patientId = dto.patientId;
    } else if (dto.patient) {
      const p = await this.prisma.patient.findFirst({
        where: {
          OR: [
            { id: dto.patient },
            { mrn: { equals: dto.patient, mode: 'insensitive' } },
            { fullName: { contains: dto.patient, mode: 'insensitive' } },
          ],
        },
      });
      if (p) data.patientId = p.id;
    }

    if (dto.doctorId) {
      data.doctorId = dto.doctorId;
    } else if (dto.doctor) {
      const doc = await this.prisma.user.findFirst({
        where: {
          OR: [
            { id: dto.doctor },
            { staffNumber: { equals: dto.doctor, mode: 'insensitive' } },
            { fullName: { contains: dto.doctor, mode: 'insensitive' } },
          ],
        },
      });
      if (doc) data.doctorId = doc.id;
    }

    if (dto.departmentId) {
      data.departmentId = dto.departmentId;
    } else if (dto.department) {
      const dept = await this.prisma.department.findFirst({
        where: {
          OR: [
            { id: dto.department },
            { name: { contains: dto.department, mode: 'insensitive' } },
            { code: { equals: dto.department, mode: 'insensitive' } },
          ],
        },
      });
      if (dept) data.departmentId = dept.id;
    }

    if (dto.branchId) {
      data.branchId = dto.branchId;
    } else if (dto.branch) {
      const br = await this.prisma.branch.findFirst({
        where: {
          OR: [
            { id: dto.branch },
            { code: { equals: dto.branch, mode: 'insensitive' } },
            { name: { contains: dto.branch, mode: 'insensitive' } },
          ],
        },
      });
      if (br) data.branchId = br.id;
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
        doctor: { select: { id: true, fullName: true, role: true } },
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
