import { IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { APPOINTMENT_STATUSES } from './create-appointment.dto';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    example: 'In Progress',
    enum: APPOINTMENT_STATUSES,
    description: 'Scheduled, Checked-in, In Progress, Completed, No-show, Cancelled',
  })
  @IsNotEmpty()
  @IsIn(APPOINTMENT_STATUSES)
  status: string;
}
