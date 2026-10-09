import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { QueryConsultationsDto } from './dto/query-consultations.dto';
import { ConsultationLabRequestDto } from './dto/consultation-lab-request.dto';
import { CreateReferralDto } from './dto/referral.dto';
import { SendVitalsSmsDto } from './dto/vitals-sms.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Consultations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @Roles('cto', 'admin', 'doctor')
  @ApiOperation({ summary: 'Record an outpatient doctor consultation encounter (SOAP note) with vitals and prescriptions' })
  create(@Body() dto: CreateConsultationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.consultationsService.create(dto, user.id);
  }

  @Post('lab-requests')
  @Roles('cto', 'admin', 'doctor')
  @ApiOperation({ summary: 'Submit a lab test order request directly from consultation' })
  requestLabTests(@Body() dto: ConsultationLabRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.consultationsService.requestLabTests(dto, user.id);
  }

  @Post('referrals')
  @Roles('cto', 'admin', 'doctor')
  @ApiOperation({ summary: 'Refer patient to a specialist doctor or department' })
  createReferral(@Body() dto: CreateReferralDto, @CurrentUser() user: AuthenticatedUser) {
    return this.consultationsService.createReferral(dto, user.id);
  }

  @Post('vitals-sms')
  @Roles('cto', 'admin', 'doctor', 'nurse')
  @ApiOperation({ summary: 'Send recorded patient vitals SMS with clinic greeting' })
  sendVitalsSms(@Body() dto: SendVitalsSmsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.consultationsService.sendVitalsSms(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Query consultation encounters with patient/doctor/branch filters' })
  findAll(@Query() query: QueryConsultationsDto) {
    return this.consultationsService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 'UUID of consultation' })
  @ApiOperation({ summary: 'Retrieve full consultation details, associated vitals, prescriptions, and lab orders' })
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }
}

