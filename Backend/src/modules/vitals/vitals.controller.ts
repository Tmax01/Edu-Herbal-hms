import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { VitalsService } from './vitals.service';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Vitals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vitals')
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @Roles('cto', 'admin', 'nurse', 'doctor', 'receptionist')
  @ApiOperation({ summary: 'Record triage physiological vitals with automated clinical alerts & BMI calculation' })
  create(@Body() dto: CreateVitalsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.vitalsService.create(dto, user.id);
  }

  @Get('patient/:patientId')
  @ApiParam({ name: 'patientId', example: 'PAT-001' })
  @ApiOperation({ summary: 'Retrieve historical vital sign records and trend analyses for a patient' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('limit') limit?: number,
  ) {
    return this.vitalsService.findByPatient(patientId, limit ? Number(limit) : 10);
  }
}
