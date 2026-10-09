import { IsNotEmpty, IsString, IsEmail, IsOptional, IsUUID, IsIn, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const USER_ROLES = [
  'cto',
  'admin',
  'doctor',
  'nurse',
  'pharmacist',
  'lab_tech',
  'receptionist',
  'accountant',
  'call_centre',
  'store_officer',
  'hr',
] as const;

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'USR-013' })
  @IsOptional()
  @IsString()
  staffNumber?: string;

  @ApiPropertyOptional({ example: 'USR-013' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'dr.asare@eduhms.gh' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Password123!', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'Dr. Nana Asare' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Dr. Nana Asare' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'doctor', enum: USER_ROLES })
  @IsNotEmpty()
  @IsIn(USER_ROLES)
  role: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  primaryBranchId?: string;

  @ApiPropertyOptional({ example: 'Accra', enum: ['Accra', 'Mankessim', 'All'] })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 'dept-gen-med-001' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'General Medicine' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: '+233 24 999 8888' })
  @IsOptional()
  @IsString()
  phone?: string;
}

