import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVitalsDto } from './dto/create-vitals.dto';

@Injectable()
export class VitalsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVitalsDto, recordedByStaffId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID '${dto.patientId}' not found`);
    }

    const vitals = await this.prisma.patientVitals.create({
      data: {
        patientId: dto.patientId,
        consultationId: dto.consultationId || null,
        bpSystolic: dto.bpSystolic || null,
        bpDiastolic: dto.bpDiastolic || null,
        pulseRate: dto.pulseRate || null,
        temperature: dto.temperature !== undefined ? dto.temperature : null,
        bloodSugar: dto.bloodSugar !== undefined ? dto.bloodSugar : null,
        weightKg: dto.weightKg !== undefined ? dto.weightKg : null,
        heightCm: dto.heightCm !== undefined ? dto.heightCm : null,
        spo2: dto.spo2 || null,
        recordedBy: recordedByStaffId,
      },
      include: {
        recordedByUser: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    const analysis = this.analyzeVitals(dto);

    return {
      vitals,
      analysis,
    };
  }

  async findByPatient(patientId: string, limit = 10) {
    const items = await this.prisma.patientVitals.findMany({
      where: { patientId },
      take: limit,
      orderBy: { recordedAt: 'desc' },
      include: {
        recordedByUser: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    return items.map((v) => ({
      ...v,
      analysis: this.analyzeVitals({
        patientId: v.patientId,
        bpSystolic: v.bpSystolic || undefined,
        bpDiastolic: v.bpDiastolic || undefined,
        pulseRate: v.pulseRate || undefined,
        temperature: v.temperature ? Number(v.temperature) : undefined,
        weightKg: v.weightKg ? Number(v.weightKg) : undefined,
        heightCm: v.heightCm ? Number(v.heightCm) : undefined,
        spo2: v.spo2 || undefined,
      }),
    }));
  }

  private analyzeVitals(dto: CreateVitalsDto) {
    const flags: string[] = [];
    let bmi: number | null = null;
    let bmiCategory: string | null = null;

    if (dto.weightKg && dto.heightCm && dto.heightCm > 0) {
      const heightInMeters = dto.heightCm / 100;
      bmi = parseFloat((dto.weightKg / (heightInMeters * heightInMeters)).toFixed(1));

      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi < 25) bmiCategory = 'Normal weight';
      else if (bmi < 30) bmiCategory = 'Overweight';
      else bmiCategory = 'Obese';
    }

    if (dto.bpSystolic && dto.bpDiastolic) {
      if (dto.bpSystolic >= 140 || dto.bpDiastolic >= 90) {
        flags.push('Hypertension Stage 2');
      } else if (dto.bpSystolic >= 130 || dto.bpDiastolic >= 80) {
        flags.push('Hypertension Stage 1');
      } else if (dto.bpSystolic < 90 || dto.bpDiastolic < 60) {
        flags.push('Hypotension (Low BP)');
      }
    }

    if (dto.temperature) {
      if (dto.temperature >= 38.0) flags.push('Fever (Pyrexia)');
      else if (dto.temperature < 35.5) flags.push('Hypothermia');
    }

    if (dto.spo2 && dto.spo2 < 95) {
      flags.push('Hypoxemia (Low SpO2)');
    }

    if (dto.pulseRate) {
      if (dto.pulseRate > 100) flags.push('Tachycardia (Elevated Pulse)');
      else if (dto.pulseRate < 60) flags.push('Bradycardia (Low Pulse)');
    }

    return {
      bmi,
      bmiCategory,
      flags,
      isAbnormal: flags.length > 0,
    };
  }
}
