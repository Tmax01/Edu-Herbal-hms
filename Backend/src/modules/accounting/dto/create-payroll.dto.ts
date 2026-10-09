import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePayrollDto {
  @ApiProperty({ example: 'USR-003', description: 'Staff member UUID/ID, staffNumber, or name' })
  @IsNotEmpty()
  @IsString()
  staffId: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra', description: 'Branch name alias' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiProperty({ example: '2026-09', description: 'Payroll month (YYYY-MM)' })
  @IsNotEmpty()
  @IsString()
  payrollMonth: string;

  @ApiProperty({ example: 8500.00, description: 'Basic salary in GHS' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basicSalary: number;

  @ApiPropertyOptional({ example: 1200.00, default: 0.0, description: 'Allowances in GHS' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  allowances?: number = 0;

  @ApiPropertyOptional({ example: 850.00, default: 0.0, description: 'Deductions (SSNIT, Tax) in GHS' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deductions?: number = 0;
}
