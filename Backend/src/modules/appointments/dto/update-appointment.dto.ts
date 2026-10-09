import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAppointmentDto, APPOINTMENT_STATUSES } from './create-appointment.dto';
import { IsOptional, IsIn } from 'class-validator';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @ApiPropertyOptional({ example: 'Checked-in', enum: APPOINTMENT_STATUSES })
  @IsOptional()
  @IsIn(APPOINTMENT_STATUSES)
  status?: string;
}
