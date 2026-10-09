import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-status.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('cto', 'admin', 'doctor', 'nurse', 'receptionist', 'call_centre')
  @ApiOperation({ summary: 'Schedule a new outpatient doctor appointment' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Search and query appointments with filters and pagination' })
  findAll(@Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get('queue/today')
  @ApiOperation({ summary: "Retrieve today's active waiting room triage queue (or all today appointments if allStatuses=true)" })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'doctorId', required: false, type: String })
  @ApiQuery({ name: 'allStatuses', required: false, type: Boolean, description: 'Set to true to include No-show and Completed appointments' })
  getTodayQueue(
    @Query('branchId') branchId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('allStatuses') allStatuses?: string,
  ) {
    return this.appointmentsService.getTodayQueue(branchId, doctorId, allStatuses === 'true' || allStatuses === '1');
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 'APT-001' })
  @ApiOperation({ summary: 'Retrieve appointment details by ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/check-in')
  @ApiParam({ name: 'id', example: 'APT-001' })
  @Roles('cto', 'admin', 'doctor', 'nurse', 'receptionist')
  @ApiOperation({ summary: 'Mark patient as checked-in at the clinic reception desk' })
  checkIn(@Param('id') id: string) {
    return this.appointmentsService.checkIn(id);
  }

  @Patch(':id/status')
  @ApiParam({ name: 'id', example: 'APT-001' })
  @Roles('cto', 'admin', 'doctor', 'nurse', 'receptionist')
  @ApiOperation({ summary: 'Update appointment status (In Progress, Completed, Cancelled, No-show)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, dto.status);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', example: 'APT-001' })
  @Roles('cto', 'admin', 'doctor', 'nurse', 'receptionist')
  @ApiOperation({ summary: 'Reschedule or modify appointment details' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }
}
