import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VitalsInputDto } from './create-consultation.dto';

export class SendVitalsSmsDto {
  @ApiProperty({ example: 'PAT-001' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ example: '+233 55 123 4567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: VitalsInputDto })
  @IsOptional()
  vitals?: VitalsInputDto;

  @ApiPropertyOptional({ example: 'Welcome to Edu Herbal Clinic. Your vitals today: BP 120/80...' })
  @IsOptional()
  @IsString()
  message?: string;
}
