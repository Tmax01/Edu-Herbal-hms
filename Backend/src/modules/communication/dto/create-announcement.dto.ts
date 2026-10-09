import { IsNotEmpty, IsString, IsOptional, IsUUID, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'General Staff Clinical Meeting: Friday 08:00 AM' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'All medical officers and nursing supervisors are required to attend in the main auditorium.' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'High', enum: ['Low', 'Medium', 'High', 'Emergency'], default: 'Medium' })
  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Emergency'])
  priority?: string = 'Medium';

  @ApiPropertyOptional({ example: 'doctor', description: 'Target user role or null for all staff' })
  @IsOptional()
  @IsString()
  targetRole?: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001', description: 'Target branch facility UUID or null for all' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: '2026-09-30T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
