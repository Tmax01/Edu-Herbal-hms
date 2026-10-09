import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { WardsService } from './wards.service';
import { CreateWardDto, CreateBedDto } from './dto/create-ward.dto';
import { CreateAdmissionDto, DischargeAdmissionDto } from './dto/create-admission.dto';
import { QueryAdmissionsDto } from './dto/query-admissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wards')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wards')
export class WardsController {
  constructor(private readonly wardsService: WardsService) {}

  @Post()
  @Roles('cto', 'admin')
  @ApiOperation({ summary: 'Create an inpatient ward unit' })
  createWard(@Body() dto: CreateWardDto) {
    return this.wardsService.createWard(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve wards, individual bed statuses, and real-time occupancy rates' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  findWards(@Query('branchId') branchId?: string) {
    return this.wardsService.findWards(branchId);
  }

  @Post('beds')
  @Roles('cto', 'admin', 'nurse')
  @ApiOperation({ summary: 'Register a bed unit in a ward' })
  createBed(@Body() dto: CreateBedDto) {
    return this.wardsService.createBed(dto);
  }

  @Post('admissions')
  @Roles('cto', 'admin', 'doctor', 'nurse')
  @ApiOperation({ summary: 'Admit a patient to an available ward bed' })
  admitPatient(@Body() dto: CreateAdmissionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.wardsService.admitPatient(dto, user.id);
  }

  @Post('beds/:bedId/admit')
  @Roles('cto', 'admin', 'doctor', 'nurse')
  @ApiParam({ name: 'bedId', example: 'BED-A01' })
  @ApiOperation({ summary: 'Admit a patient directly to a specific bed' })
  admitToBed(
    @Param('bedId') bedId: string,
    @Body() dto: CreateAdmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wardsService.admitPatient({ ...dto, bedId }, user.id);
  }

  @Patch('admissions/:id/discharge')
  @Roles('cto', 'admin', 'doctor', 'nurse')
  @ApiParam({ name: 'id', example: 'UUID of admission' })
  @ApiOperation({ summary: 'Discharge an admitted patient and automatically release the bed' })
  dischargePatient(@Param('id') id: string, @Body() dto: DischargeAdmissionDto) {
    return this.wardsService.dischargePatient(id, dto);
  }

  @Post('beds/:bedId/discharge')
  @Roles('cto', 'admin', 'doctor', 'nurse')
  @ApiParam({ name: 'bedId', example: 'BED-A01' })
  @ApiOperation({ summary: 'Discharge a patient occupying a specific bed' })
  dischargeBedPost(@Param('bedId') bedId: string, @Body() dto?: DischargeAdmissionDto) {
    return this.wardsService.dischargeBed(bedId, dto?.dischargeSummary);
  }

  @Patch('beds/:bedId/discharge')
  @Roles('cto', 'admin', 'doctor', 'nurse')
  @ApiParam({ name: 'bedId', example: 'BED-A01' })
  @ApiOperation({ summary: 'Discharge a patient occupying a specific bed (PATCH alias)' })
  dischargeBedPatch(@Param('bedId') bedId: string, @Body() dto?: DischargeAdmissionDto) {
    return this.wardsService.dischargeBed(bedId, dto?.dischargeSummary);
  }


  @Get('admissions')
  @ApiOperation({ summary: 'Query inpatient admission history and current stays' })
  findAdmissions(@Query() query: QueryAdmissionsDto) {
    return this.wardsService.findAdmissions(query);
  }

  @Get('admissions/:id')
  @ApiParam({ name: 'id', example: 'UUID of admission' })
  @ApiOperation({ summary: 'Retrieve inpatient stay details, chartings, and nursing notes' })
  findAdmission(@Param('id') id: string) {
    return this.wardsService.findAdmission(id);
  }
}
