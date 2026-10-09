import { IsNotEmpty, IsString, IsOptional, IsUUID, IsDateString, IsInt, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Maternity Leave', 'Study Leave', 'Compassionate Leave'] as const;

export class CreateLeaveRequestDto {
  @ApiPropertyOptional({ description: 'Target staff member UUID/ID (defaults to authenticated user)' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ example: 'accra-main-branch-001' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'Annual Leave', enum: LEAVE_TYPES })
  @IsNotEmpty()
  @IsIn(LEAVE_TYPES)
  leaveType: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @ApiProperty({ example: '2026-10-14' })
  @IsNotEmpty()
  @IsDateString()
  toDate: string;

  @ApiProperty({ example: 10, description: 'Number of working days requested' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  days: number;

  @ApiProperty({ example: 'Annual scheduled leave for family travel' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ApproveLeaveRequestDto {
  @ApiProperty({ example: 'Approved', enum: ['Approved', 'Rejected'] })
  @IsNotEmpty()
  @IsIn(['Approved', 'Rejected'])
  status: string;
}
