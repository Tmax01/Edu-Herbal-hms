import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWardDto, CreateBedDto } from './dto/create-ward.dto';
import { CreateAdmissionDto, DischargeAdmissionDto } from './dto/create-admission.dto';
import { QueryAdmissionsDto } from './dto/query-admissions.dto';

@Injectable()
export class WardsService {
  constructor(private prisma: PrismaService) {}

  async createWard(dto: CreateWardDto) {
    const id = dto.id || `WARD-${Date.now()}`;
    return this.prisma.ward.create({
      data: {
        id,
        branchId: dto.branchId,
        name: dto.name,
        genderAllocation: dto.genderAllocation || 'Mixed',
        totalBeds: dto.totalBeds,
        isActive: true,
      },
    });
  }

  async createBed(dto: CreateBedDto) {
    const id = `BED-${Date.now()}`;
    return this.prisma.wardBed.create({
      data: {
        id,
        wardId: dto.wardId,
        branchId: dto.branchId,
        bedNumber: dto.bedNumber,
        status: 'Available',
      },
      include: {
        ward: true,
      },
    });
  }

  async findWards(branchId?: string) {
    const where: any = {};
    if (branchId && branchId !== 'All') {
      where.OR = [
        { branchId },
        { branch: { name: { contains: branchId, mode: 'insensitive' } } },
        { branch: { code: { contains: branchId, mode: 'insensitive' } } },
      ];
    }

    const wards = await this.prisma.ward.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        wardBeds: {
          orderBy: { bedNumber: 'asc' },
          include: {
            admissions: {
              where: { status: 'Admitted' },
              take: 1,
              orderBy: { admissionDate: 'desc' },
              include: {
                patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
              },
            },
            branch: { select: { id: true, name: true, code: true } },
          },
        },
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    let overallOccupied = 0;
    let overallAvailable = 0;
    let overallMaintenance = 0;
    let overallTotal = 0;

    const decoratedWards = wards.map((w) => {
      const decoratedBeds = w.wardBeds.map((b) => {
        const activeAdmission = b.admissions && b.admissions.length > 0 ? b.admissions[0] : null;
        return {
          id: b.id,
          ward: w.name,
          wardId: w.id,
          bedNumber: b.bedNumber,
          status: b.status,
          branch: b.branch?.name || w.branch?.name || 'Accra',
          patientName: activeAdmission?.patient?.fullName || undefined,
          patientId: activeAdmission?.patient?.id || undefined,
          admittedDate: activeAdmission ? activeAdmission.admissionDate.toISOString().slice(0, 10) : undefined,
          admissionId: activeAdmission?.id || undefined,
          admissionDiagnosis: activeAdmission?.admissionDiagnosis || undefined,
        };
      });

      const occupied = decoratedBeds.filter((b) => b.status === 'Occupied').length;
      const available = decoratedBeds.filter((b) => b.status === 'Available').length;
      const maintenance = decoratedBeds.filter((b) => b.status === 'Maintenance').length;
      const total = decoratedBeds.length;
      const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0';

      overallOccupied += occupied;
      overallAvailable += available;
      overallMaintenance += maintenance;
      overallTotal += total;

      return {
        id: w.id,
        name: w.name,
        branch: w.branch?.name,
        branchId: w.branchId,
        genderAllocation: w.genderAllocation,
        totalBeds: w.totalBeds,
        metrics: {
          total,
          occupied,
          available,
          maintenance,
          occupancyRatePercent: `${occupancyRate}%`,
        },
        wardBeds: decoratedBeds,
      };
    });

    return {
      summary: {
        occupied: overallOccupied,
        available: overallAvailable,
        maintenance: overallMaintenance,
        total: overallTotal,
      },
      wards: decoratedWards,
    };
  }

  async admitPatient(dto: CreateAdmissionDto, doctorId: string) {
    const bed = await this.prisma.wardBed.findUnique({
      where: { id: dto.bedId },
      include: { branch: true },
    });

    if (!bed) {
      throw new NotFoundException(`Bed with ID ${dto.bedId} not found`);
    }

    if (bed.status !== 'Available') {
      throw new BadRequestException(`Bed ${bed.bedNumber} is currently ${bed.status}`);
    }

    let patientId = dto.patientId;
    const patientNameInput = dto.patient || dto.patientName;

    if (!patientId && patientNameInput) {
      const matchedPatient = await this.prisma.patient.findFirst({
        where: {
          fullName: { contains: patientNameInput, mode: 'insensitive' },
        },
      });

      if (!matchedPatient) {
        throw new NotFoundException(`Patient '${patientNameInput}' not found in registry. Please register the patient before admitting to a ward.`);
      }
      patientId = matchedPatient.id;
    }

    if (!patientId) {
      throw new BadRequestException('A valid patientId or patient name must be provided');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark bed as occupied
      await tx.wardBed.update({
        where: { id: dto.bedId },
        data: { status: 'Occupied' },
      });

      // 2. Create admission record
      const admission = await tx.admission.create({
        data: {
          patientId,
          bedId: dto.bedId,
          doctorId,
          branchId: dto.branchId || bed.branchId,
          admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : new Date(),
          admissionDiagnosis: dto.admissionDiagnosis || dto.notes || 'Inpatient Admission',
          status: 'Admitted',
        },
        include: {
          patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
          bed: { include: { ward: true } },
          doctor: { select: { id: true, fullName: true } },
        },
      });

      return admission;
    });
  }

  async dischargePatient(admissionId: string, dto?: DischargeAdmissionDto) {
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new NotFoundException(`Admission ${admissionId} not found`);
    }

    if (admission.status === 'Discharged') {
      throw new BadRequestException('Patient is already discharged');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Free up bed
      await tx.wardBed.update({
        where: { id: admission.bedId },
        data: { status: 'Available' },
      });

      // 2. Update admission record
      return tx.admission.update({
        where: { id: admissionId },
        data: {
          status: 'Discharged',
          dischargeDate: new Date(),
          dischargeSummary: dto?.dischargeSummary || 'Discharged from inpatient care',
        },
        include: {
          patient: true,
          bed: { include: { ward: true } },
        },
      });
    });
  }

  async dischargeBed(bedId: string, dischargeSummary?: string) {
    const bed = await this.prisma.wardBed.findUnique({
      where: { id: bedId },
      include: {
        admissions: {
          where: { status: 'Admitted' },
          take: 1,
          orderBy: { admissionDate: 'desc' },
        },
      },
    });

    if (!bed) {
      throw new NotFoundException(`Bed ${bedId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Free bed
      await tx.wardBed.update({
        where: { id: bedId },
        data: { status: 'Available' },
      });

      // If active admission found, discharge it
      if (bed.admissions && bed.admissions.length > 0) {
        return tx.admission.update({
          where: { id: bed.admissions[0].id },
          data: {
            status: 'Discharged',
            dischargeDate: new Date(),
            dischargeSummary: dischargeSummary || 'Discharged from inpatient stay',
          },
          include: {
            patient: true,
            bed: { include: { ward: true } },
          },
        });
      }

      return { bedId, status: 'Available', message: 'Bed successfully marked as Available' };
    });
  }


  async findAdmissions(query: QueryAdmissionsDto) {
    const { patientId, status, branchId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;

    const [total, items] = await Promise.all([
      this.prisma.admission.count({ where }),
      this.prisma.admission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { admissionDate: 'desc' },
        include: {
          patient: { select: { id: true, mrn: true, fullName: true } },
          bed: { include: { ward: true } },
          doctor: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAdmission(id: string) {
    const admission = await this.prisma.admission.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            allergies: true,
            emergencyContacts: true,
          },
        },
        bed: { include: { ward: true } },
        doctor: true,
        nursingNotes: {
          orderBy: { recordedAt: 'desc' },
          include: { nurseUser: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!admission) {
      throw new NotFoundException(`Admission ${id} not found`);
    }

    return admission;
  }
}
