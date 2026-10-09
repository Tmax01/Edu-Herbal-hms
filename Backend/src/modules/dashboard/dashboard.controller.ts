import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Retrieve live clinical, financial, bed occupancy, inventory alerts, and appointments overview' })
  @ApiQuery({ name: 'branch', required: false, type: String, description: 'Branch name alias (Accra, Mankessim, All)' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  getOverview(
    @Query('branch') branch?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.dashboardService.getOverview(branchId || branch);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Retrieve operational intelligence, staff composition, 6-month trends, and branch comparisons' })
  @ApiQuery({ name: 'branch', required: false, type: String, description: 'Branch name alias' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month'] })
  getAnalytics(
    @Query('branch') branch?: string,
    @Query('period') period?: 'today' | 'week' | 'month',
  ) {
    return this.dashboardService.getAnalytics(branch, period);
  }
}

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Retrieve operational intelligence and analytics dashboard data' })
  @ApiQuery({ name: 'branch', required: false, type: String })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month'] })
  getOverview(
    @Query('branch') branch?: string,
    @Query('period') period?: 'today' | 'week' | 'month',
  ) {
    return this.dashboardService.getAnalytics(branch, period);
  }
}
