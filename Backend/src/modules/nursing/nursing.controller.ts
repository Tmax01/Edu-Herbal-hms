import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NursingService } from './nursing.service';
import { CreateNursingNoteDto } from './dto/create-nursing-note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Nursing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('nursing')
export class NursingController {
  constructor(private readonly nursingService: NursingService) {}

  @Post('notes')
  @Roles('cto', 'admin', 'nurse', 'doctor')
  @ApiOperation({ summary: 'Record inpatient shift charting, medication administration, or observation note' })
  createNote(@Body() dto: CreateNursingNoteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.nursingService.create(dto, user.id);
  }

  @Get('notes')
  @ApiOperation({ summary: 'Query inpatient nursing notes and vitals timeline' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'bedId', required: false, type: String })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('bedId') bedId?: string,
    @Query('patientId') patientId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.nursingService.findAll({ branchId, bedId, patientId, limit: limit ? Number(limit) : undefined });
  }

  @Get('inpatients')
  @ApiOperation({ summary: 'Retrieve currently admitted inpatients across ward beds' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getInpatients(@Query('branchId') branchId?: string) {
    return this.nursingService.getInpatients(branchId);
  }

  @Get('patient/:patientId')
  @ApiParam({ name: 'patientId', example: 'PAT-001' })
  @ApiOperation({ summary: 'Retrieve historical nursing notes and shift chartings for a patient' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByPatient(
    @Param('patientId') patientId: string,
    @Query('limit') limit?: number,
  ) {
    return this.nursingService.findByPatient(patientId, limit ? Number(limit) : 20);
  }

}
