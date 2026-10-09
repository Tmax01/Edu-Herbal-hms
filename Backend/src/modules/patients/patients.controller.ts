import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, EmergencyContactInputDto, PatientAllergyInputDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles('cto', 'admin', 'receptionist', 'nurse', 'doctor')
  @ApiOperation({ summary: 'Register a new patient with auto-generated MRN, emergency contacts & allergies' })
  create(@Body() createPatientDto: CreatePatientDto, @CurrentUser() user: AuthenticatedUser) {
    return this.patientsService.create(createPatientDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Search and query patients with full-text filter, branch filter, and pagination' })
  findAll(@Query() query: QueryPatientsDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 'PAT-001 or MRN-2026-0001' })
  @ApiOperation({ summary: 'Retrieve comprehensive patient profile, EMR history, vitals, and allergies' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles('cto', 'admin', 'receptionist', 'nurse', 'doctor')
  @ApiParam({ name: 'id', example: 'PAT-001' })
  @ApiOperation({ summary: 'Update patient demographic information' })
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Post(':id/emergency-contacts')
  @Roles('cto', 'admin', 'receptionist', 'nurse')
  @ApiParam({ name: 'id', example: 'PAT-001' })
  @ApiOperation({ summary: 'Append an emergency contact to a patient' })
  addEmergencyContact(@Param('id') id: string, @Body() dto: EmergencyContactInputDto) {
    return this.patientsService.addEmergencyContact(id, dto);
  }

  @Post(':id/allergies')
  @Roles('cto', 'admin', 'nurse', 'doctor')
  @ApiParam({ name: 'id', example: 'PAT-001' })
  @ApiOperation({ summary: 'Record a clinical allergy or drug reaction for a patient' })
  addAllergy(
    @Param('id') id: string,
    @Body() dto: PatientAllergyInputDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.patientsService.addAllergy(id, dto, user.id);
  }

  @Post(':id/follow-ups')
  @Roles('cto', 'admin', 'receptionist', 'nurse', 'doctor')
  @ApiParam({ name: 'id', example: 'PAT-001' })
  @ApiOperation({ summary: 'Schedule a patient review / follow-up visit' })
  scheduleFollowUp(
    @Param('id') id: string,
    @Body() dto: { dueDate: string; notes?: string; condition?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.patientsService.scheduleFollowUp(id, dto, user.id);
  }
}

