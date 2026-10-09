import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReferralDto {
  @ApiProperty({ example: 'PAT-001' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiProperty({ example: 'Cardiologist', description: 'Specialist specialty or name' })
  @IsNotEmpty()
  @IsString()
  specialist: string;

  @ApiPropertyOptional({ example: 'Cardiology' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: 'Patient presents with persistent arrhythmia and chest tightness.' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Currently on Amlodipine 5mg. Allergy: Aspirin.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
