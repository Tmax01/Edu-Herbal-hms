import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCallLogDto {
  @ApiPropertyOptional({ example: 'PAT-001' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiProperty({ example: 'Adjoa Mensah' })
  @IsNotEmpty()
  @IsString()
  patientName: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiProperty({ example: 'Appointment Inquiry' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({ example: 'Patient called to confirm appointment time. Confirmed 8:30 AM slot.' })
  @IsNotEmpty()
  @IsString()
  notes: string;

  @ApiProperty({ example: 'Resolved', description: 'Resolved, Follow-up Scheduled, Complaint, Escalated, No Answer' })
  @IsNotEmpty()
  @IsString()
  outcome: string;

  @ApiPropertyOptional({ example: '2026-08-25' })
  @IsOptional()
  followUpDate?: string;
}

export class CreatePatientFollowUpDto {
  @ApiProperty({ example: 'PAT-001' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ example: 'Adjoa Mensah' })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiProperty({ example: 'Hypertension — Medication Review' })
  @IsNotEmpty()
  @IsString()
  condition: string;

  @ApiProperty({ example: '2026-08-22' })
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ example: '2026-07-22' })
  @IsNotEmpty()
  lastVisit: string;

  @ApiPropertyOptional({ example: 'Due', enum: ['Due', 'Completed', 'Overdue', 'Cancelled'] })
  @IsOptional()
  @IsString()
  status?: string = 'Due';

  @ApiPropertyOptional({ example: 'Excellent', enum: ['Excellent', 'Good', 'Fair', 'Poor'] })
  @IsOptional()
  @IsString()
  effectiveness?: string;

  @ApiPropertyOptional({ example: 'Wound healing well. No signs of infection.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '2026-09-22' })
  @IsOptional()
  nextDate?: string;
}

export class RecordReviewDto {
  @ApiProperty({ example: 'Patient reports mild improvement in symptoms. Continue protocol.' })
  @IsNotEmpty()
  @IsString()
  notes: string;

  @ApiPropertyOptional({ example: 'Good', enum: ['Excellent', 'Good', 'Fair', 'Poor'] })
  @IsOptional()
  @IsString()
  effectiveness?: string;

  @ApiPropertyOptional({ example: '2026-09-22' })
  @IsOptional()
  nextDate?: string;
}

