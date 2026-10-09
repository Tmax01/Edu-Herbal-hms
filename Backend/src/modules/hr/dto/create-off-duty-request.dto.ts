import { IsNotEmpty, IsString, IsOptional, IsUUID, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SHIFT_TYPES = ['Morning Shift', 'Afternoon Shift', 'Night Shift', 'Weekend Call'] as const;

export class CreateOffDutyRequestDto {
  @ApiPropertyOptional({ description: 'Target staff member UUID/ID' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ example: 'dept-gen-med-001' })
  @IsNotEmpty()
  @IsUUID()
  departmentId: string;

  @ApiProperty({ example: 'accra-main-branch-001' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsNotEmpty()
  @IsDateString()
  requestDate: string;

  @ApiProperty({ example: 'Night Shift', enum: SHIFT_TYPES })
  @IsNotEmpty()
  @IsIn(SHIFT_TYPES)
  shiftType: string;

  @ApiProperty({ example: 'Swap shift with Nurse Mensah due to medical appointment' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class ApproveOffDutyDto {
  @ApiProperty({ example: 'Approved', enum: ['Approved', 'Rejected'] })
  @IsNotEmpty()
  @IsIn(['Approved', 'Rejected'])
  status: string;
}
