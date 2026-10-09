import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChannelDto {
  @ApiPropertyOptional({ example: 'general', description: 'Channel ID (optional)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'general' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Hospital-wide announcements and general discussion' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '📢' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDm?: boolean = false;
}

export class SendMessageDto {
  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiPropertyOptional({ example: 'general', description: 'Channel ID or name alias (e.g. general, clinical, dm_USR-001_USR-006)' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiProperty({ example: 'Good morning team! Reminder that the All-Hands meeting is scheduled for August 28th.' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'text', default: 'text' })
  @IsOptional()
  @IsString()
  messageType?: string = 'text';

  @ApiPropertyOptional({ example: 'text', description: 'Message type alias (text, alert, file)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'https://minio.eduhms.gh/chat/ecg-scan.pdf' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ example: 'ecg-scan.pdf' })
  @IsOptional()
  @IsString()
  fileName?: string;
}
