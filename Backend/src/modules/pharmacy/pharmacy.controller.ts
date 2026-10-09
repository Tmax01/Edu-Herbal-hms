import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { PharmacyService } from './pharmacy.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import { QueryPrescriptionsDto } from './dto/query-prescriptions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Pharmacy')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Post('prescriptions')
  @Roles('cto', 'admin', 'doctor')
  @ApiOperation({ summary: 'Issue a prescription with automated CDSS drug-drug interaction safety screening' })
  createPrescription(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pharmacyService.create(dto, user.id);
  }

  @Post('prescriptions/:id/dispense')
  @Roles('cto', 'admin', 'pharmacist')
  @ApiParam({ name: 'id', example: 'RX-2026-001' })
  @ApiOperation({ summary: 'Dispense prescription medications and automatically trigger FEFO inventory deduction' })
  dispensePrescription(
    @Param('id') id: string,
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pharmacyService.dispense(id, dto, user.id);
  }

  @Post('cdss/check-interactions')
  @ApiOperation({ summary: 'Cross-examine drug combinations against clinical interaction database' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        drugNames: {
          type: 'array',
          items: { type: 'string' },
          example: ['Aspirin', 'Warfarin', 'Ciprofloxacin'],
        },
      },
    },
  })
  checkInteractions(@Body('drugNames') drugNames: string[]) {
    return this.pharmacyService.checkInteractions(drugNames || []);
  }

  @Get('prescriptions')
  @ApiOperation({ summary: 'Query prescriptions with status, branch, and patient filters' })
  findAllPrescriptions(@Query() query: QueryPrescriptionsDto) {
    return this.pharmacyService.findAll(query);
  }

  @Get('prescriptions/:id')
  @ApiParam({ name: 'id', example: 'RX-2026-001' })
  @ApiOperation({ summary: 'Retrieve prescription details, patient allergies, and dispensing status' })
  findOnePrescription(@Param('id') id: string) {
    return this.pharmacyService.findOne(id);
  }
}
