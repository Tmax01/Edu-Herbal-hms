import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { HerbalProductionService } from './herbal-production.service';
import { CreateProductionBatchDto, UpdateProductionStageDto } from './dto/create-production-batch.dto';
import { QueryProductionDto } from './dto/query-production.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Herbal Production')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('herbal-production')
export class HerbalProductionController {
  constructor(private readonly productionService: HerbalProductionService) {}

  @Post('batches')
  @Roles('cto', 'admin', 'pharmacist', 'doctor', 'store_officer')
  @ApiOperation({ summary: 'Initiate a new herbal medicine manufacturing lot/batch' })
  create(@Body() dto: CreateProductionBatchDto) {
    return this.productionService.create(dto);
  }

  @Patch('batches/:id/stage')
  @Roles('cto', 'admin', 'pharmacist', 'doctor')
  @ApiParam({ name: 'id', example: 'PROD-2026-001' })
  @ApiOperation({ summary: 'Advance production workflow stage (e.g. Mixing -> Quality Control -> Bottling)' })
  updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateProductionStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productionService.updateStage(id, dto, user.id);
  }

  @Patch('batches/:id/advance')
  @Roles('cto', 'admin', 'pharmacist', 'doctor')
  @ApiParam({ name: 'id', example: 'PROD-001' })
  @ApiOperation({ summary: 'Advance production workflow to next stage in sequence' })
  advanceStagePatch(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productionService.advanceStage(id, user.id);
  }

  @Post('batches/:id/advance')
  @Roles('cto', 'admin', 'pharmacist', 'doctor')
  @ApiParam({ name: 'id', example: 'PROD-001' })
  @ApiOperation({ summary: 'Advance production workflow to next stage in sequence (POST alias)' })
  advanceStagePost(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productionService.advanceStage(id, user.id);
  }


  @Get('batches')
  @ApiOperation({ summary: 'Query production batches with manufacturing stage and lot number filters' })
  findAll(@Query() query: QueryProductionDto) {
    return this.productionService.findAll(query);
  }

  @Get('batches/:id')
  @ApiParam({ name: 'id', example: 'PROD-2026-001' })
  @ApiOperation({ summary: 'Retrieve full manufacturing batch audit history, lot sizes, and QC approvals' })
  findOne(@Param('id') id: string) {
    return this.productionService.findOne(id);
  }
}
