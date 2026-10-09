import { IsNotEmpty, IsString, IsOptional, IsUUID, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const APPOINTMENT_STATUSES = [
  'Scheduled',
  'Checked-in',
  'In Progress',
  'Completed',
  'No-show',
  'Cancelled',
] as const;

export class CreateAppointmentDto {
  @ApiPropertyOptional({ example: 'PAT-001', description: 'Patient UUID, MRN, or ID' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Adjoa Mensah', description: 'Patient name, MRN, or ID alias' })
  @IsOptional()
  @IsString()
  patient?: string;

  @ApiPropertyOptional({ example: 'USR-003', description: 'Assigned doctor user UUID/ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'USR-003', description: 'Assigned doctor user UUID/ID alias' })
  @IsOptional()
  @IsString()
  doctor?: string;

  @ApiPropertyOptional({ example: 'dept-gen-med-001', description: 'Department UUID (optional, auto-derived from doctor if omitted)' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'General Medicine', description: 'Department name alias' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001', description: 'Branch UUID (optional, auto-derived if omitted)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra', description: 'Branch name alias' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: '2026-09-02', description: 'Appointment date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  appointmentDate?: string;

  @ApiPropertyOptional({ example: '2026-09-02', description: 'Appointment date alias (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: '09:30:00', description: 'Scheduled time slot' })
  @IsOptional()
  @IsString()
  appointmentTime?: string;

  @ApiPropertyOptional({ example: '09:30', description: 'Scheduled time slot alias' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({ example: 'Follow-up chronic headache and recurring fever' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Scheduled', enum: APPOINTMENT_STATUSES, description: 'Appointment status' })
  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  status?: string;
}

