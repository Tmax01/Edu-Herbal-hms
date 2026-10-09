import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { QuerySmsLogsDto } from './dto/query-sms-logs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('SMS')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @Roles('cto', 'admin', 'doctor', 'nurse', 'receptionist', 'call_centre')
  @ApiOperation({ summary: 'Dispatch SMS notifications to patients via Arkesel Ghana gateway' })
  sendSms(@Body() dto: SendSmsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.smsService.sendSms(dto, user.id);
  }

  @Get('logs')
  @Roles('cto', 'admin', 'call_centre')
  @ApiOperation({ summary: 'Audit SMS gateway logs, delivery receipts, and recipient telephone records' })
  findAllLogs(@Query() query: QuerySmsLogsDto) {
    return this.smsService.findAllLogs(query);
  }
}
