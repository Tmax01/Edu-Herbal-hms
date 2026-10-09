import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { CreatePatientDto, EmergencyContactInputDto, PatientAllergyInputDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  async create(dto: CreatePatientDto, registeredByStaffId: string) {
    const fullName = (dto.fullName || dto.name || '').trim();
    const phone = (dto.phone || '').trim();
    const dob = dto.dateOfBirth || dto.dob;

    if (!fullName) {
      throw new ConflictException('Patient full name is required');
    }
    if (!dob) {
      throw new ConflictException('Patient date of birth is required');
    }

    const existing = await this.prisma.patient.findFirst({
      where: {
        phone,
        fullName: { equals: fullName, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(`Patient with name '${fullName}' and phone '${phone}' already exists`);
    }

    // Resolve branch
    const branchQuery = dto.registrationBranchId || dto.branch || 'Accra';
    let branch = await this.prisma.branch.findFirst({
      where: {
        OR: [
          { id: branchQuery },
          { code: { equals: branchQuery, mode: 'insensitive' } },
          { name: { contains: branchQuery, mode: 'insensitive' } },
        ],
      },
    });

    if (!branch) {
      branch = await this.prisma.branch.findFirst({ where: { isActive: true } });
    }

    const branchId = branch?.id || 'accra-main-branch-001';
    const mrn = await this.generateMRN();
    const patientId = `PAT-${Date.now()}`;

    // Format emergency contacts
    const emergencyContactsList: { contactName: string; relationship: string; phone: string }[] = [];
    if (dto.emergencyContacts && Array.isArray(dto.emergencyContacts)) {
      emergencyContactsList.push(...dto.emergencyContacts);
    } else if (dto.emergencyContact && dto.emergencyPhone) {
      emergencyContactsList.push({
        contactName: dto.emergencyContact,
        relationship: 'Emergency Contact',
        phone: dto.emergencyPhone,
      });
    }

    // Format allergies
    const allergiesList: { allergenName: string; severity: string; reaction?: string }[] = [];
    if (typeof dto.allergies === 'string' && dto.allergies.trim()) {
      const split = dto.allergies.split(',').map((s: string) => s.trim()).filter(Boolean);
      for (const item of split) {
        allergiesList.push({ allergenName: item, severity: 'Moderate' });
      }
    } else if (Array.isArray(dto.allergies)) {
      for (const item of dto.allergies) {
        if (typeof item === 'string') {
          allergiesList.push({ allergenName: item.trim(), severity: 'Moderate' });
        } else if (item && item.allergenName) {
          allergiesList.push({
            allergenName: item.allergenName,
            severity: item.severity || 'Moderate',
            reaction: item.reaction,
          });
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          id: patientId,
          mrn,
          fullName,
          dateOfBirth: new Date(dob),
          gender: dto.gender,
          phone,
          email: dto.email || null,
          address: dto.address || 'Address not provided',
          bloodGroup: dto.bloodGroup || null,
          nhisId: dto.nhisId || null,
          registrationBranchId: branchId,
          registeredBy: registeredByStaffId,
          photoUrl: dto.photoUrl || null,
          generalNotes: dto.generalNotes || dto.notes || null,
        },
      });

      if (emergencyContactsList.length > 0) {
        await tx.patientEmergencyContact.createMany({
          data: emergencyContactsList.map((c) => ({
            patientId: patient.id,
            contactName: c.contactName,
            relationship: c.relationship,
            phone: c.phone,
          })),
        });
      }

      if (allergiesList.length > 0) {
        await tx.patientAllergy.createMany({
          data: allergiesList.map((a) => ({
            patientId: patient.id,
            allergenName: a.allergenName,
            severity: a.severity || 'Moderate',
            reaction: a.reaction || null,
            recordedBy: registeredByStaffId,
          })),
        });
      }

      // Initial Vitals Recording
      if (dto.vitals_bp || dto.vitals_sugar || dto.vitals_weight || dto.vitals_height) {
        let bpSystolic: number | null = null;
        let bpDiastolic: number | null = null;
        if (dto.vitals_bp && dto.vitals_bp.includes('/')) {
          const parts = dto.vitals_bp.split('/');
          bpSystolic = parseInt(parts[0], 10) || null;
          bpDiastolic = parseInt(parts[1], 10) || null;
        }

        await tx.patientVitals.create({
          data: {
            patientId: patient.id,
            bpSystolic,
            bpDiastolic,
            bloodSugar: dto.vitals_sugar ? parseFloat(dto.vitals_sugar) : null,
            weightKg: dto.vitals_weight ? parseFloat(String(dto.vitals_weight)) : null,
            heightCm: dto.vitals_height ? parseFloat(String(dto.vitals_height)) : null,
            recordedBy: registeredByStaffId,
          },
        });
      }

      // Welcome SMS dispatch if requested
      if (dto.sendWelcomeSms && phone) {
        const firstName = fullName.split(' ')[0] || 'Patient';
        const welcomeMsg = [
          `Dear ${firstName},`,
          `Welcome to Edu Herbal Clinic (EduHMS)!`,
          `Your Good Health Is Our Concern.`,
          `MRN: ${mrn}`,
          dto.bloodGroup ? `• Blood Group: ${dto.bloodGroup}` : '',
          dto.vitals_bp ? `• BP: ${dto.vitals_bp} mmHg` : '',
          dto.vitals_sugar ? `• Blood Sugar: ${dto.vitals_sugar} mmol/L` : '',
          dto.nhisId ? `• NHIS: ${dto.nhisId}` : '',
          `For enquiries call your branch reception desk.`,
          `— EduHMS Team`,
        ].filter(Boolean).join('\n');

        this.smsService.sendSms({ recipientPhone: phone, message: welcomeMsg }, registeredByStaffId).catch(() => {});
      }

      return tx.patient.findUnique({
        where: { id: patient.id },
        include: {
          emergencyContacts: true,
          allergies: true,
          vitals: { take: 5, orderBy: { recordedAt: 'desc' } },
          registrationBranch: { select: { id: true, name: true, code: true } },
        },
      });
    });
  }

  async findAll(query: QueryPatientsDto) {
    const { search, branchId, branch, gender, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    const branchQuery = (branchId || branch || '').trim();
    if (branchQuery && branchQuery !== 'all' && branchQuery !== 'All' && branchQuery !== 'All Branches') {
      const branchRecord = await this.prisma.branch.findFirst({
        where: {
          OR: [
            { id: branchQuery },
            { code: { equals: branchQuery, mode: 'insensitive' } },
            { name: { contains: branchQuery, mode: 'insensitive' } },
          ],
        },
      });
      if (branchRecord) {
        where.registrationBranchId = branchRecord.id;
      } else {
        where.registrationBranchId = branchQuery;
      }
    }

    if (gender && gender !== 'all' && gender !== 'All') {
      where.gender = { equals: gender, mode: 'insensitive' };
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { fullName: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
        { mrn: { contains: s, mode: 'insensitive' } },
        { nhisId: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { registeredDate: 'desc' },
        include: {
          registrationBranch: { select: { id: true, name: true, code: true } },
          allergies: true,
          emergencyContacts: true,
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

  async findOne(id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [{ id }, { mrn: id }],
      },
      include: {
        registrationBranch: true,
        emergencyContacts: true,
        allergies: true,
        vitals: { take: 10, orderBy: { recordedAt: 'desc' } },
        appointments: {
          take: 10,
          orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }],
          include: {
            doctor: { select: { id: true, fullName: true, role: true } },
            department: { select: { id: true, name: true } },
          },
        },
        consultations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { select: { id: true, fullName: true } },
          },
        },
        prescriptions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { select: { id: true, fullName: true } },
            items: { include: { stockItem: true } },
          },
        },
        labOrders: {
          take: 10,
          orderBy: { orderedAt: 'desc' },
          include: {
            doctor: { select: { id: true, fullName: true } },
            technicianUser: { select: { id: true, fullName: true } },
            items: true,
          },
        },
        admissions: {
          take: 5,
          orderBy: { admissionDate: 'desc' },
          include: {
            bed: { include: { ward: true } },
            doctor: { select: { id: true, fullName: true } },
          },
        },
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            lineItems: true,
            payments: true,
          },
        },
        followUps: {
          take: 10,
          orderBy: { dueDate: 'desc' },
          include: {
            doctorUser: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID or MRN '${id}' not found`);
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto) {
    const patient = await this.findOne(id);
    return this.prisma.patient.update({
      where: { id: patient.id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async addEmergencyContact(patientId: string, dto: EmergencyContactInputDto) {
    await this.findOne(patientId);
    return this.prisma.patientEmergencyContact.create({
      data: {
        patientId,
        ...dto,
      },
    });
  }

  async addAllergy(patientId: string, dto: PatientAllergyInputDto, staffId: string) {
    await this.findOne(patientId);
    return this.prisma.patientAllergy.create({
      data: {
        patientId,
        allergenName: dto.allergenName,
        severity: dto.severity || 'Moderate',
        reaction: dto.reaction || null,
        recordedBy: staffId,
      },
    });
  }

  async scheduleFollowUp(
    patientId: string,
    dto: { dueDate: string; notes?: string; condition?: string },
    staffId: string,
  ) {
    const patient = await this.findOne(patientId);
    const id = `FLW-${Date.now()}`;
    return this.prisma.patientFollowUp.create({
      data: {
        id,
        patientId: patient.id,
        doctorId: staffId,
        branchId: patient.registrationBranchId,
        condition: dto.condition || 'General Review',
        dueDate: new Date(dto.dueDate),
        lastVisit: new Date(),
        status: 'Scheduled',
        notes: dto.notes || null,
      },
      include: {
        doctorUser: { select: { id: true, fullName: true } },
      },
    });
  }

  private async generateMRN(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.patient.count();
    const sequential = (count + 1).toString().padStart(4, '0');
    return `MRN-${year}-${sequential}`;
  }
}
