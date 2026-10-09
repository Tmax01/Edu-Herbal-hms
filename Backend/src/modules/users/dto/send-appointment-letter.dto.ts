import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SendAppointmentLetterDto {
  @ApiPropertyOptional({ example: '2026-09-10' })
  @IsOptional()
  @IsString()
  effectiveDate?: string;

  @ApiPropertyOptional({ example: 'Chief Administrative Officer' })
  @IsOptional()
  @IsString()
  signatoryTitle?: string;

  @ApiPropertyOptional({ example: 'Standard terms apply.' })
  @IsOptional()
  @IsString()
  customNotes?: string;
}
