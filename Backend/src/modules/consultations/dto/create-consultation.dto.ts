import { IsNotEmpty, IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VitalsInputDto {
  @ApiPropertyOptional({ example: '120/80', description: 'Blood Pressure in mmHg (Systolic/Diastolic)' })
  @IsOptional()
  @IsString()
  vitals_bp?: string;

  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional()
  @IsString()
  bp?: string;

  @ApiPropertyOptional({ example: '72', description: 'Pulse rate in bpm' })
  @IsOptional()
  vitals_pulse?: any;

  @ApiPropertyOptional({ example: '36.6', description: 'Body temperature in Celsius' })
  @IsOptional()
  vitals_temp?: any;

  @ApiPropertyOptional({ example: '65', description: 'Patient body weight in kg' })
  @IsOptional()
  vitals_weight?: any;

  @ApiPropertyOptional({ example: '170', description: 'Patient height in cm' })
  @IsOptional()
  vitals_height?: any;

  @ApiPropertyOptional({ example: '5.5', description: 'Blood sugar level in mmol/L' })
  @IsOptional()
  vitals_sugar?: any;
}

export class PrescribedDrugItemDto {
  @ApiProperty({ example: 'Neem Leaf Extract' })
  @IsNotEmpty()
  @IsString()
  drug: string;

  @ApiPropertyOptional({ example: '10ml' })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional({ example: 'Three times daily' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ example: '14 days' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  qty?: number;
}

export class CreateConsultationDto {
  @ApiPropertyOptional({ description: 'Originating appointment UUID (if patient was scheduled)' })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty({ example: 'PAT-001' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 'Herbal', enum: ['Conventional', 'Herbal', 'conventional', 'herbal'] })
  @IsOptional()
  @IsString()
  consultationType?: string = 'Conventional';

  @ApiPropertyOptional({ example: 'Severe frontal headache, fever, and chills for 3 days' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({ example: 'Severe frontal headache, fever, and chills for 3 days' })
  @IsOptional()
  @IsString()
  complaint?: string;

  @ApiPropertyOptional({ example: 'Patient reports fever starting 3 days ago accompanied by fatigue.' })
  @IsOptional()
  @IsString()
  historyPresentingIllness?: string;

  @ApiPropertyOptional({ example: 'BP 120/80, chest clear, soft non-tender abdomen.' })
  @IsOptional()
  @IsString()
  physicalExamination?: string;

  @ApiPropertyOptional({ example: 'Uncomplicated Plasmodium Falciparum Malaria' })
  @IsOptional()
  @IsString()
  primaryDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Herbal/traditional assessment, constitution type, lifestyle notes' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Mild Dehydration' })
  @IsOptional()
  @IsString()
  secondaryDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Detailed observations, plan, follow-up instructions' })
  @IsOptional()
  @IsString()
  doctorNotes?: string;

  @ApiPropertyOptional({ example: 'Detailed observations, plan, follow-up instructions' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Prescribe Artemether-Lumefantrine + Paracetamol. Order FBC & RDT.' })
  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional()
  @IsString()
  vitals_bp?: string;

  @ApiPropertyOptional({ example: '72' })
  @IsOptional()
  vitals_pulse?: any;

  @ApiPropertyOptional({ example: '36.6' })
  @IsOptional()
  vitals_temp?: any;

  @ApiPropertyOptional({ example: '65' })
  @IsOptional()
  vitals_weight?: any;

  @ApiPropertyOptional({ example: '170' })
  @IsOptional()
  vitals_height?: any;

  @ApiPropertyOptional({ example: '5.5' })
  @IsOptional()
  vitals_sugar?: any;

  @ApiPropertyOptional({ type: VitalsInputDto })
  @IsOptional()
  vitals?: VitalsInputDto;

  @ApiPropertyOptional({ type: [PrescribedDrugItemDto] })
  @IsOptional()
  @IsArray()
  prescribedItems?: PrescribedDrugItemDto[];

  @ApiPropertyOptional({ type: [PrescribedDrugItemDto] })
  @IsOptional()
  @IsArray()
  prescriptions?: PrescribedDrugItemDto[];

  @ApiPropertyOptional({ example: true, description: 'Whether to dispatch vitals SMS to patient upon save' })
  @IsOptional()
  @IsBoolean()
  sendVitalsSms?: boolean;
}
