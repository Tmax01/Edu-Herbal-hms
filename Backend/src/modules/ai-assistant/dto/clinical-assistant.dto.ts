import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DifferentialDiagnosisQueryDto {
  @ApiProperty({ example: 'High fever 39.2C, severe joint pain, frontal headache, and vomiting for 3 days' })
  @IsNotEmpty()
  @IsString()
  chiefComplaintAndHpi: string;

  @ApiPropertyOptional({ example: 'BP: 130/85, Pulse: 104 bpm, Temp: 39.2 C, SpO2: 97%' })
  @IsOptional()
  @IsString()
  vitalsSummary?: string;

  @ApiPropertyOptional({ example: 'Adult male, 32 years old, no known chronic illness' })
  @IsOptional()
  @IsString()
  patientDemographics?: string;
}

export class DrugSafetyQueryDto {
  @ApiProperty({ example: ['Aspirin 75mg', 'Warfarin 5mg', 'Ciprofloxacin 500mg'] })
  @IsNotEmpty()
  @IsArray()
  medicationList: string[];

  @ApiPropertyOptional({ example: ['Penicillin', 'Peanuts'] })
  @IsOptional()
  @IsArray()
  knownAllergies?: string[];

  @ApiPropertyOptional({ example: 'Chronic kidney disease stage 2' })
  @IsOptional()
  @IsString()
  coMorbidities?: string;
}

export class GenerateDischargeSummaryDto {
  @ApiProperty({ example: 'Admitted on 2026-08-28 with Severe Malaria and Dehydration. Managed with IV Artesunate, IV Fluids, and Paracetamol. Afebrile for 48h.' })
  @IsNotEmpty()
  @IsString()
  clinicalCourseAndDiagnosis: string;

  @ApiProperty({ example: 'Oral Artemether-Lumefantrine 80/480mg for 3 days, Oral Paracetamol 1g TDS PRN.' })
  @IsNotEmpty()
  @IsString()
  dischargeMedications: string;

  @ApiPropertyOptional({ example: 'Review in 2 weeks at General Medicine OPD.' })
  @IsOptional()
  @IsString()
  followUpInstructions?: string;
}
