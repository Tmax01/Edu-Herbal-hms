import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { QueryConsultationsDto } from './dto/query-consultations.dto';
import { ConsultationLabRequestDto } from './dto/consultation-lab-request.dto';
import { CreateReferralDto } from './dto/referral.dto';
import { SendVitalsSmsDto } from './dto/vitals-sms.dto';

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  async create(dto: CreateConsultationDto, doctorId: string) {
    // 1. Resolve Patient
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [{ id: dto.patientId }, { mrn: dto.patientId }],
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID or MRN '${dto.patientId}' was not found.`);
    }

    // 2. Resolve Branch
    let branchId = dto.branchId;
    if (!branchId && dto.branch) {
      const matchedBranch = await this.prisma.branch.findFirst({
        where: {
          OR: [
            { id: dto.branch },
            { code: dto.branch },
            { name: { contains: dto.branch, mode: 'insensitive' } },
          ],
        },
      });
      if (matchedBranch) branchId = matchedBranch.id;
    }

    if (!branchId) {
      branchId = patient.registrationBranchId;
    }

    // Ensure branch exists
    const branchExists = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branchExists) {
      const defaultBranch = await this.prisma.branch.findFirst();
      branchId = defaultBranch?.id || branchId;
    }

    // 3. Create Consultation Encounter
    const consultation = await this.prisma.consultation.create({
      data: {
        appointmentId: dto.appointmentId || null,
        patientId: patient.id,
        doctorId,
        branchId,
        consultationType: dto.consultationType || 'Conventional',
        chiefComplaint: dto.chiefComplaint || dto.complaint || 'Clinical consultation',
        historyPresentingIllness: dto.historyPresentingIllness || null,
        physicalExamination: dto.physicalExamination || null,
        primaryDiagnosis: dto.primaryDiagnosis || dto.diagnosis || 'Clinical evaluation',
        secondaryDiagnosis: dto.secondaryDiagnosis || null,
        treatmentPlan: dto.treatmentPlan || dto.notes || 'Routine follow-up',
        doctorNotes: dto.doctorNotes || dto.notes || null,
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true, phone: true, bloodGroup: true } },
        doctor: { select: { id: true, fullName: true, role: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    // 4. Record Vitals if present
    const bpString = dto.vitals?.vitals_bp || dto.vitals?.bp || dto.vitals_bp;
    const pulseRaw = dto.vitals?.vitals_pulse || dto.vitals_pulse;
    const tempRaw = dto.vitals?.vitals_temp || dto.vitals_temp;
    const weightRaw = dto.vitals?.vitals_weight || dto.vitals_weight;
    const heightRaw = dto.vitals?.vitals_height || dto.vitals_height;
    const sugarRaw = dto.vitals?.vitals_sugar || dto.vitals_sugar;

    if (bpString || pulseRaw || tempRaw || weightRaw || heightRaw || sugarRaw) {
      let bpSystolic: number | null = null;
      let bpDiastolic: number | null = null;

      if (bpString && typeof bpString === 'string') {
        const parts = bpString.split('/');
        if (parts.length === 2) {
          bpSystolic = parseInt(parts[0].trim(), 10) || null;
          bpDiastolic = parseInt(parts[1].trim(), 10) || null;
        } else {
          bpSystolic = parseInt(bpString.trim(), 10) || null;
        }
      }

      await this.prisma.patientVitals.create({
        data: {
          patientId: patient.id,
          consultationId: consultation.id,
          bpSystolic: bpSystolic || null,
          bpDiastolic: bpDiastolic || null,
          pulseRate: pulseRaw ? parseInt(String(pulseRaw), 10) || null : null,
          temperature: tempRaw ? parseFloat(String(tempRaw)) || null : null,
          bloodSugar: sugarRaw ? parseFloat(String(sugarRaw)) || null : null,
          weightKg: weightRaw ? parseFloat(String(weightRaw)) || null : null,
          heightCm: heightRaw ? parseFloat(String(heightRaw)) || null : null,
          recordedBy: doctorId,
        },
      });
    }

    // 5. Create Prescription & Line Items if drugs/herbs were prescribed
    const drugItems = dto.prescribedItems || dto.prescriptions || [];
    let prescriptionRecord: any = null;

    if (Array.isArray(drugItems) && drugItems.length > 0) {
      const rxCount = await this.prisma.prescription.count();
      const rxId = `RX-${String(rxCount + 1).padStart(3, '0')}`;
      const isHerbal = (dto.consultationType || '').toLowerCase().includes('herbal');

      prescriptionRecord = await this.prisma.prescription.create({
        data: {
          id: rxId,
          consultationId: consultation.id,
          patientId: patient.id,
          doctorId,
          branchId,
          prescriptionType: isHerbal ? 'Herbal' : 'Conventional',
          status: 'Pending',
          notes: dto.doctorNotes || dto.notes || 'Dispatched from consultation',
          items: {
            create: drugItems.map((item) => ({
              drugName: item.drug,
              dosage: item.dosage || 'Standard dose',
              frequency: item.frequency || 'Once daily',
              duration: item.duration || '7 days',
              quantityPrescribed: item.qty ? Number(item.qty) : 1,
              quantityDispensed: 0,
              itemStatus: 'Pending',
            })),
          },
        },
        include: {
          items: true,
        },
      });
    }

    // 6. Automatically mark linked Appointment as Completed
    if (dto.appointmentId) {
      await this.prisma.appointment.updateMany({
        where: { id: dto.appointmentId },
        data: {
          status: 'Completed',
          completedAt: new Date(),
        },
      });
    }

    // 7. Optional automatic Vitals SMS dispatch
    let smsDispatchResult: any = null;
    if (dto.sendVitalsSms && patient.phone) {
      try {
        smsDispatchResult = await this.sendVitalsSms(
          {
            patientId: patient.id,
            phone: patient.phone,
            vitals: {
              vitals_bp: bpString,
              vitals_pulse: pulseRaw,
              vitals_temp: tempRaw,
              vitals_weight: weightRaw,
              vitals_height: heightRaw,
              vitals_sugar: sugarRaw,
            },
          },
          doctorId,
        );
      } catch (err: any) {
        this.logger.warn(`Could not dispatch automatic vitals SMS: ${err.message}`);
      }
    }

    // Return complete encounter details
    return this.findOne(consultation.id);
  }

  async requestLabTests(dto: ConsultationLabRequestDto, doctorId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [{ id: dto.patientId }, { mrn: dto.patientId }],
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID or MRN '${dto.patientId}' was not found.`);
    }

    // Parse tests
    let testNames: string[] = [];
    if (Array.isArray(dto.tests)) {
      testNames = dto.tests;
    } else if (typeof dto.tests === 'string') {
      testNames = dto.tests
        .split(/[,;\n]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    if (testNames.length === 0) {
      testNames = ['General Screening Panel'];
    }

    const labCount = await this.prisma.labOrder.count();
    const labOrderId = `LAB-${String(labCount + 1).padStart(3, '0')}`;

    const order = await this.prisma.labOrder.create({
      data: {
        id: labOrderId,
        consultationId: dto.consultationId || null,
        patientId: patient.id,
        doctorId,
        branchId: patient.registrationBranchId,
        priority: dto.priority || 'Routine',
        status: 'Pending',
        resultSummary: dto.notes || null,
        items: {
          create: testNames.map((testName) => ({
            testName,
            flag: 'Normal',
          })),
        },
      },
      include: {
        patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
        doctor: { select: { id: true, fullName: true, role: true } },
        branch: { select: { id: true, name: true, code: true } },
        items: true,
      },
    });

    return {
      message: 'Lab request successfully submitted to laboratory queue',
      labOrder: order,
    };
  }

  async createReferral(dto: CreateReferralDto, doctorId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [{ id: dto.patientId }, { mrn: dto.patientId }],
      },
      include: {
        registrationBranch: true,
        allergies: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID or MRN '${dto.patientId}' was not found.`);
    }

    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, fullName: true, role: true },
    });

    const referralCode = `REF-${Date.now().toString().slice(-6)}`;

    // Persist as a PatientFollowUp / Referral audit record in DB
    const followUp = await this.prisma.patientFollowUp.create({
      data: {
        id: referralCode,
        patientId: patient.id,
        doctorId,
        branchId: patient.registrationBranchId,
        condition: `Referral to ${dto.specialist}: ${dto.reason.slice(0, 60)}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        lastVisit: new Date(),
        status: 'Due',
        notes: `Specialist: ${dto.specialist} | Reason: ${dto.reason}${dto.notes ? ` | Additional: ${dto.notes}` : ''}`,
      },
    });

    return {
      success: true,
      referralCode,
      generatedAt: new Date().toISOString(),
      referralLetter: {
        clinic: 'Edu Herbal Clinic (EduHMS)',
        motto: 'Your Good Health Is Our Concern',
        branch: patient.registrationBranch.name,
        referringDoctor: doctor?.fullName || 'Attending Physician',
        patient: {
          id: patient.id,
          mrn: patient.mrn,
          fullName: patient.fullName,
          phone: patient.phone,
          allergies: patient.allergies.map((a) => a.allergenName),
        },
        specialistDepartment: dto.specialist,
        clinicalReason: dto.reason,
        additionalNotes: dto.notes || 'None',
      },
      followUpRecordId: followUp.id,
    };
  }

  async sendVitalsSms(dto: SendVitalsSmsDto, senderStaffId?: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [{ id: dto.patientId }, { mrn: dto.patientId }],
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID or MRN '${dto.patientId}' was not found.`);
    }

    const recipientPhone = dto.phone || patient.phone;
    if (!recipientPhone) {
      throw new NotFoundException(`No phone number available for patient ${patient.fullName}`);
    }

    let smsMessage = dto.message;
    if (!smsMessage) {
      const v = dto.vitals || {};
      const firstName = patient.fullName.split(' ')[0];
      const lines = [
        `Dear ${firstName},`,
        `Welcome to Edu Herbal Clinic (EduHMS). Your Good Health Is Our Concern.`,
        ``,
        `Your vitals recorded today:`,
        v.vitals_bp || v.bp ? `• Blood Pressure: ${v.vitals_bp || v.bp} mmHg` : null,
        v.vitals_sugar ? `• Blood Sugar: ${v.vitals_sugar} mmol/L` : null,
        v.vitals_temp ? `• Temperature: ${v.vitals_temp}°C` : null,
        v.vitals_pulse ? `• Pulse: ${v.vitals_pulse} bpm` : null,
        v.vitals_weight ? `• Weight: ${v.vitals_weight} kg` : null,
        v.vitals_height ? `• Height: ${v.vitals_height} cm` : null,
        patient.bloodGroup ? `• Blood Group: ${patient.bloodGroup}` : null,
        ``,
        `Please follow your doctor's instructions. For enquiries call: 030-XXX-XXXX`,
        `— EduHMS Team`,
      ].filter((l): l is string => l !== null);

      smsMessage = lines.join('\n');
    }

    const smsLog = await this.smsService.sendSms(
      {
        patientId: patient.id,
        recipientPhone,
        message: smsMessage,
        purpose: 'Vitals & Consultation Notification',
      },
      senderStaffId,
    );

    return {
      success: true,
      message: `SMS successfully queued for dispatch to ${recipientPhone}`,
      smsLog,
    };
  }

  async findAll(query: QueryConsultationsDto) {
    const { patientId, doctorId, branchId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (branchId) where.branchId = branchId;

    const [total, items] = await Promise.all([
      this.prisma.consultation.count({ where }),
      this.prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, mrn: true, fullName: true, phone: true } },
          doctor: { select: { id: true, fullName: true, role: true } },
          branch: { select: { id: true, name: true, code: true } },
          vitals: { orderBy: { recordedAt: 'desc' }, take: 1 },
          prescriptions: { include: { items: true } },
          labOrders: { include: { items: true } },
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
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            allergies: true,
            emergencyContacts: true,
          },
        },
        doctor: { select: { id: true, fullName: true, role: true, staffNumber: true } },
        branch: true,
        vitals: { orderBy: { recordedAt: 'desc' } },
        prescriptions: { include: { items: true } },
        labOrders: { include: { items: true } },
      },
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation encounter with ID ${id} not found`);
    }

    return consultation;
  }
}

