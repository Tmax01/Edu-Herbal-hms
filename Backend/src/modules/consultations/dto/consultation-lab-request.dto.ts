import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsultationLabRequestDto {
  @ApiProperty({ example: 'PAT-001' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ example: 'consultation-uuid' })
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiProperty({ example: 'FBC (Full Blood Count), Malaria RDT, Blood Sugar' })
  @IsNotEmpty()
  tests: string | string[];

  @ApiPropertyOptional({ example: 'Routine', enum: ['Routine', 'Urgent', 'Stat'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'Patient has recurrent chills and elevated temperature' })
  @IsOptional()
  @IsString()
  notes?: string;
}
