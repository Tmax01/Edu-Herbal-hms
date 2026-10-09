import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMeetingDto {
  @ApiProperty({ example: 'Monthly Clinical Review' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Staff Meeting',
    description: 'Staff Meeting, Performance Review, Training, Department Briefing, Emergency Meeting, Board Meeting, Clinical, Departmental, Executive, General',
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    example: 'Branch',
    description: 'Individual, Branch, Hospital-wide, Facility, Departmental, Global',
  })
  @IsNotEmpty()
  @IsString()
  scope: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  targetBranchId?: string;

  @ApiPropertyOptional({ example: 'Accra', description: 'Target branch name alias (Accra, Mankessim)' })
  @IsOptional()
  @IsString()
  targetBranch?: string;

  @ApiPropertyOptional({ example: 'Accra', description: 'Branch alias' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 'USR-003', description: 'Selected staff ID for Individual sessions' })
  @IsOptional()
  @IsString()
  targetStaffId?: string;

  @ApiPropertyOptional({ example: ['USR-003'], description: 'Staff IDs for Individual session' })
  @IsOptional()
  @IsArray()
  targetStaffIds?: string[];

  @ApiPropertyOptional({ example: '2026-08-25' })
  @IsOptional()
  @IsString()
  meetingDate?: string;

  @ApiPropertyOptional({ example: '2026-08-25', description: 'Meeting date alias' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  meetingTime?: string;

  @ApiPropertyOptional({ example: '09:00', description: 'Meeting time alias' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty({ example: '2 hours' })
  @IsNotEmpty()
  @IsString()
  duration: string;

  @ApiProperty({ example: 'Conference Room A, Accra' })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({ example: '1. Review of patient outcomes\n2. Protocol updates\n3. Any Other Business' })
  @IsNotEmpty()
  @IsString()
  agenda: string;

  @ApiPropertyOptional({ example: 'Upcoming' })
  @IsOptional()
  @IsString()
  status?: string = 'Upcoming';

  @ApiPropertyOptional({ example: ['Dr. Kofi Mensah', 'Dr. Adwoa Nimako'], description: 'List of attendee names' })
  @IsOptional()
  @IsArray()
  attendees?: string[];
}

export class UpdateMeetingStatusDto {
  @ApiProperty({ example: 'Completed', enum: ['Upcoming', 'In Progress', 'Completed', 'Cancelled'] })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Reviewed hypertensive medication protocol and agreed on August clinical audit.' })
  @IsOptional()
  @IsString()
  minutes?: string;
}
