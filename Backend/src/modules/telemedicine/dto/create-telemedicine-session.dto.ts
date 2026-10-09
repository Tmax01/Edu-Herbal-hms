import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateTelemedicineSessionDto {
  @ApiProperty({ description: 'Patient ID', example: 'PAT-001' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Doctor Staff ID', example: 'USR-003' })
  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @ApiProperty({ description: 'Scheduled date and time (ISO or YYYY-MM-DD HH:mm)', example: '2026-08-25 10:00' })
  @IsNotEmpty()
  @IsString()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Session duration in minutes', default: 30, example: 30 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Session modality type', enum: ['Video', 'Audio', 'Chat'], default: 'Video' })
  @IsOptional()
  @IsIn(['Video', 'Audio', 'Chat'])
  type?: 'Video' | 'Audio' | 'Chat';

  @ApiPropertyOptional({ description: 'Alias for session modality type', enum: ['Video', 'Audio', 'Chat'] })
  @IsOptional()
  @IsIn(['Video', 'Audio', 'Chat'])
  sessionType?: 'Video' | 'Audio' | 'Chat';

  @ApiProperty({ description: 'Chief complaint or reason for consultation', example: 'Blood pressure follow-up — requesting prescription renewal' })
  @IsNotEmpty()
  @IsString()
  chiefComplaint: string;

  @ApiPropertyOptional({ description: 'Hospital branch name or ID', example: 'Accra' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ description: 'Hospital branch ID', example: 'branch-accra-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Optional virtual meeting room link', example: 'meet.eduhms.gh/tm-001' })
  @IsOptional()
  @IsString()
  meetingLink?: string;
}
