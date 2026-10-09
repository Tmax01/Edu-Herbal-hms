import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty({ example: '0245551234', description: 'Recipient Ghanaian phone number' })
  @IsNotEmpty()
  @IsString()
  recipientPhone: string;

  @ApiProperty({ example: 'Dear Adjoa, your EduHMS appointment is confirmed for tomorrow at 09:30 AM.' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'PAT-001', description: 'Patient ID if notification is linked to patient' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Appointment Reminder', default: 'General Notification' })
  @IsOptional()
  @IsString()
  purpose?: string = 'General Notification';
}
