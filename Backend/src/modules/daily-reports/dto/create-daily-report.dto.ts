import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDailyReportDto {
  @ApiPropertyOptional({ example: 'dept-triage-005', description: 'Department UUID (auto-derived if omitted)' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'Front Desk', description: 'Department name alias' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001', description: 'Branch UUID (auto-derived if omitted)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra', description: 'Branch name alias' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: '2026-09-09', description: 'Report date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  reportDate?: string;

  @ApiPropertyOptional({ example: '2026-09-09', description: 'Report date alias (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'Registered 3 new patients. Checked in 14 appointment patients.' })
  @IsOptional()
  @IsString()
  activities?: string;

  @ApiPropertyOptional({ example: ['Registered new patients and created records', 'Managed appointment scheduling'] })
  @IsOptional()
  tasks?: string[] | any;

  @ApiPropertyOptional({ example: 14, default: 0 })
  @IsOptional()
  @IsNumber()
  patientsHandled?: number = 0;

  @ApiPropertyOptional({ example: 'Appointment double booking at 10:00 AM' })
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiPropertyOptional({ example: 'Implement appointment confirmation SMS 24 hours prior.' })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ example: 'Implement appointment confirmation SMS 24 hours prior.', description: 'Notes & recommendations alias' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Attached supporting document URL or filename' })
  @IsOptional()
  @IsString()
  attachment?: string;

  @ApiPropertyOptional({ description: 'Attached supporting document URL alias' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class ReviewDailyReportDto {
  @ApiProperty({ example: 'Noted', enum: ['Reviewed', 'Noted', 'Approved', 'Flagged'], description: 'Review status' })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Good initiative. Appointment SMS reminders being evaluated.' })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
