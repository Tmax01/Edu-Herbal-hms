import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNursingNoteDto {
  @ApiPropertyOptional({ description: 'Originating admission UUID' })
  @IsOptional()
  @IsUUID()
  admissionId?: string;

  @ApiPropertyOptional({ example: 'PAT-001' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Ama Asante' })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiProperty({ example: 'BED-A01' })
  @IsNotEmpty()
  @IsString()
  bedId: string;

  @ApiPropertyOptional({ example: 'Routine', enum: ['Routine', 'Medication', 'Observation', 'Incident'] })
  @IsOptional()
  @IsString()
  noteType?: string;

  @ApiPropertyOptional({ example: 'Routine' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional()
  @IsString()
  vitalsBp?: string;

  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional()
  @IsString()
  bp?: string;

  @ApiPropertyOptional({ example: '76' })
  @IsOptional()
  @IsString()
  vitalsPulse?: string;

  @ApiPropertyOptional({ example: '76' })
  @IsOptional()
  @IsString()
  pulse?: string;

  @ApiPropertyOptional({ example: '36.8' })
  @IsOptional()
  @IsString()
  vitalsTemp?: string;

  @ApiPropertyOptional({ example: '36.8' })
  @IsOptional()
  @IsString()
  temp?: string;

  @ApiPropertyOptional({ example: '98%' })
  @IsOptional()
  @IsString()
  vitalsSpo2?: string;

  @ApiPropertyOptional({ example: '98%' })
  @IsOptional()
  @IsString()
  spo2?: string;

  @ApiPropertyOptional({ example: { bp: '120/80', pulse: '76', temp: '36.8', spo2: '98%' } })
  @IsOptional()
  vitals?: { bp?: string; pulse?: string; temp?: string; spo2?: string };

  @ApiPropertyOptional({ example: 'Administered IV Paracetamol 1g as prescribed.' })
  @IsOptional()
  @IsString()
  clinicalNote?: string;

  @ApiPropertyOptional({ example: 'Administered IV Paracetamol 1g as prescribed.' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: '2026-08-22 06:00' })
  @IsOptional()
  recordedAt?: string;
}

