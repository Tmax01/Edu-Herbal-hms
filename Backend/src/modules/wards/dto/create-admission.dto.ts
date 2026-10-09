import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdmissionDto {
  @ApiPropertyOptional({ example: 'PAT-001' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Ama Asante' })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiPropertyOptional({ example: 'Ama Asante' })
  @IsOptional()
  @IsString()
  patient?: string;

  @ApiProperty({ example: 'BED-A01' })
  @IsNotEmpty()
  @IsString()
  bedId: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: '2026-08-22' })
  @IsOptional()
  admissionDate?: string;

  @ApiPropertyOptional({ example: 'Severe Malaria with persistent vomiting and dehydration' })
  @IsOptional()
  @IsString()
  admissionDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Reason for admission, clinical notes...' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdmitBedDto {
  @ApiProperty({ example: 'Ama Asante' })
  @IsNotEmpty()
  @IsString()
  patient: string;

  @ApiPropertyOptional({ example: 'Reason for admission, clinical notes...' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class DischargeAdmissionDto {
  @ApiPropertyOptional({ example: 'Patient recovered fully, afebrile for 48h, stable vitals. Discharged on oral medications.' })
  @IsOptional()
  @IsString()
  dischargeSummary?: string;
}

