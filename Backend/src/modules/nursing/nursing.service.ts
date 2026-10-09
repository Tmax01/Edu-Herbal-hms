import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNursingNoteDto } from './dto/create-nursing-note.dto';

@Injectable()
export class NursingService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNursingNoteDto, nurseId: string) {
    const id = `NN-${Date.now().toString().slice(-4)}`;

    let patientId = dto.patientId;
    let admissionId = dto.admissionId || null;

    // If patientId is not provided, look up the active admission on the bed
    if (!patientId && dto.bedId) {
      const activeAdmission = await this.prisma.admission.findFirst({
        where: { bedId: dto.bedId, status: 'Admitted' },
        orderBy: { admissionDate: 'desc' },
      });

      if (activeAdmission) {
        patientId = activeAdmission.patientId;
        admissionId = activeAdmission.id;
      } else if (dto.patientName) {
        const p = await this.prisma.patient.findFirst({
          where: { fullName: { contains: dto.patientName, mode: 'insensitive' } },
        });
        if (p) patientId = p.id;
      }
    }

    if (!patientId) {
      throw new BadRequestException('Could not resolve patient for the specified bed');
    }

    const noteType = dto.type || dto.noteType || 'Routine';
    const vitalsBp = dto.bp || dto.vitals?.bp || dto.vitalsBp || null;
    const vitalsPulse = dto.pulse || dto.vitals?.pulse || dto.vitalsPulse || null;
    const vitalsTemp = dto.temp || dto.vitals?.temp || dto.vitalsTemp || null;
    const vitalsSpo2 = dto.spo2 || dto.vitals?.spo2 || dto.vitalsSpo2 || null;
    const clinicalNote = dto.note || dto.clinicalNote || 'Nursing note recorded';

    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();

    const created = await this.prisma.nursingNote.create({
      data: {
        id,
        admissionId,
        patientId,
        bedId: dto.bedId,
        nurseId,
        noteType,
        vitalsBp,
        vitalsPulse,
        vitalsTemp,
        vitalsSpo2,
        clinicalNote,
        recordedAt,
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true } },
        bed: { include: { ward: true } },
        nurseUser: { select: { id: true, fullName: true, role: true } },
      },
    });

    return {
      id: created.id,
      patientName: created.patient.fullName,
      bedId: created.bedId,
      nurseName: created.nurseUser.fullName,
      timestamp: created.recordedAt.toISOString().replace('T', ' ').slice(0, 16),
      vitals: {
        bp: created.vitalsBp || '120/80',
        pulse: created.vitalsPulse || '72',
        temp: created.vitalsTemp || '36.6',
        spo2: created.vitalsSpo2 || '98%',
      },
      note: created.clinicalNote,
      type: created.noteType,
    };
  }

  async findAll(query?: { branchId?: string; bedId?: string; patientId?: string; limit?: number }) {
    const where: any = {};
    if (query?.bedId) where.bedId = query.bedId;
    if (query?.patientId) where.patientId = query.patientId;

    if (query?.branchId && query.branchId !== 'All') {
      where.bed = {
        branch: {
          OR: [
            { id: query.branchId },
            { name: { contains: query.branchId, mode: 'insensitive' } },
            { code: { contains: query.branchId, mode: 'insensitive' } },
          ],
        },
      };
    }

    const [notes, inpatients] = await Promise.all([
      this.prisma.nursingNote.findMany({
        where,
        take: query?.limit || 100,
        orderBy: { recordedAt: 'desc' },
        include: {
          patient: { select: { id: true, mrn: true, fullName: true } },
          bed: { include: { ward: true } },
          nurseUser: { select: { id: true, fullName: true } },
        },
      }),
      this.getInpatients(query?.branchId),
    ]);

    const formattedNotes = notes.map((n) => ({
      id: n.id,
      patientName: n.patient?.fullName || 'Unknown Patient',
      patientId: n.patientId,
      bedId: n.bedId,
      nurseName: n.nurseUser?.fullName || 'Duty Nurse',
      timestamp: n.recordedAt.toISOString().replace('T', ' ').slice(0, 16),
      vitals: {
        bp: n.vitalsBp || '120/80',
        pulse: n.vitalsPulse || '72',
        temp: n.vitalsTemp || '36.6',
        spo2: n.vitalsSpo2 || '98%',
      },
      note: n.clinicalNote,
      type: n.noteType,
    }));

    return {
      summary: {
        totalInpatients: inpatients.length,
        notesToday: formattedNotes.length,
      },
      inpatients,
      notes: formattedNotes,
    };
  }

  async getInpatients(branchId?: string) {
    const where: any = { status: 'Occupied' };
    if (branchId && branchId !== 'All') {
      where.branch = {
        OR: [
          { id: branchId },
          { name: { contains: branchId, mode: 'insensitive' } },
          { code: { contains: branchId, mode: 'insensitive' } },
        ],
      };
    }

    const occupiedBeds = await this.prisma.wardBed.findMany({
      where,
      orderBy: { bedNumber: 'asc' },
      include: {
        ward: true,
        branch: true,
        admissions: {
          where: { status: 'Admitted' },
          take: 1,
          orderBy: { admissionDate: 'desc' },
          include: { patient: true },
        },
      },
    });

    return occupiedBeds.map((b) => {
      const adm = b.admissions[0];
      return {
        id: b.id,
        bedNumber: b.bedNumber,
        ward: b.ward.name,
        branch: b.branch.name,
        patientName: adm?.patient?.fullName || 'Occupied',
        patientId: adm?.patient?.id,
        admittedDate: adm ? adm.admissionDate.toISOString().slice(0, 10) : undefined,
        admissionId: adm?.id,
      };
    });
  }

  async findByPatient(patientId: string, limit = 20) {
    const notes = await this.prisma.nursingNote.findMany({
      where: { patientId },
      take: limit,
      orderBy: { recordedAt: 'desc' },
      include: {
        patient: true,
        bed: { include: { ward: true } },
        nurseUser: { select: { id: true, fullName: true } },
      },
    });

    return notes.map((n) => ({
      id: n.id,
      patientName: n.patient?.fullName,
      bedId: n.bedId,
      nurseName: n.nurseUser?.fullName,
      timestamp: n.recordedAt.toISOString().replace('T', ' ').slice(0, 16),
      vitals: {
        bp: n.vitalsBp || '120/80',
        pulse: n.vitalsPulse || '72',
        temp: n.vitalsTemp || '36.6',
        spo2: n.vitalsSpo2 || '98%',
      },
      note: n.clinicalNote,
      type: n.noteType,
    }));
  }
}

