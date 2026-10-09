import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DailyReportsService } from './daily-reports.service';
import { CreateDailyReportDto, ReviewDailyReportDto } from './dto/create-daily-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Daily Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly reportsService: DailyReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit facility daily departmental activity and clinical report' })
  create(@Body() dto: CreateDailyReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.create(dto, user.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Retrieve daily reports submitted by the logged-in staff member' })
  getMyReports(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.findAll({ staffId: user.id });
  }

  @Patch(':id/review')
  @Roles('cto', 'admin', 'doctor', 'accountant')
  @ApiParam({ name: 'id', example: 'RPT-005' })
  @ApiOperation({ summary: 'Review and sign off on a departmental daily report (Mark as Reviewed, Noted, Approved)' })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewDailyReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.review(id, dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Query daily departmental operational reports with staff, branch, and date filters' })
  @ApiQuery({ name: 'staffId', required: false, type: String })
  @ApiQuery({ name: 'view', required: false, enum: ['my', 'all'], description: 'Set to my to filter by logged-in user' })
  @ApiQuery({ name: 'branch', required: false, type: String, description: 'Branch name alias (Accra, Mankessim, All)' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'department', required: false, type: String, description: 'Department name alias' })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2026-08-21' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('staffId') staffId?: string,
    @Query('view') view?: string,
    @Query('branch') branch?: string,
    @Query('branchId') branchId?: string,
    @Query('department') department?: string,
    @Query('departmentId') departmentId?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    const targetStaffId = view === 'my' ? user.id : staffId;
    return this.reportsService.findAll({
      staffId: targetStaffId,
      branch,
      branchId,
      department,
      departmentId,
      date,
      startDate,
      endDate,
      status,
    });
  }
}
