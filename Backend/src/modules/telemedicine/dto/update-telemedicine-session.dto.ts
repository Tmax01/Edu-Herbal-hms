import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateTelemedicineSessionDto } from './create-telemedicine-session.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateTelemedicineSessionDto extends PartialType(CreateTelemedicineSessionDto) {
  @ApiPropertyOptional({
    description: 'Status of the session',
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No-show'],
  })
  @IsOptional()
  @IsIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No-show'])
  status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No-show';

  @ApiPropertyOptional({ description: 'Doctor consultation notes recorded during or after the session' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteTelemedicineSessionDto {
  @ApiPropertyOptional({ description: 'Consultation notes recorded during the call', example: 'Patient blood pressure normal. Prescription renewed for 30 days.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
