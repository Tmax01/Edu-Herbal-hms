import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryReportsDto } from './dto/query-reports.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles('accountant', 'admin', 'cto', 'receptionist')
  @ApiOperation({ summary: 'Generate dynamic consolidated hospital report (Revenue, Patients, Appointments, Inventory)' })
  getReport(@Query() query: QueryReportsDto) {
    return this.reportsService.getReport(query);
  }

  @Get('summary')
  @Roles('accountant', 'admin', 'cto', 'receptionist')
  @ApiOperation({ summary: 'Retrieve summary metrics across selected report category' })
  getReportSummary(@Query() query: QueryReportsDto) {
    return this.reportsService.getReport(query);
  }

  @Get('revenue')
  @Roles('accountant', 'admin', 'cto', 'receptionist')
  @ApiOperation({ summary: 'Generate detailed Revenue Report: total billed, collected, outstanding & invoice breakdown' })
  getRevenueReport(@Query() query: QueryReportsDto) {
    return this.reportsService.getRevenueReport(query);
  }

  @Get('patients')
  @Roles('accountant', 'admin', 'cto', 'receptionist')
  @ApiOperation({ summary: 'Generate Patient Statistics: registration volumes, demographics & patient roster' })
  getPatientReport(@Query() query: QueryReportsDto) {
    return this.reportsService.getPatientReport(query);
  }

  @Get('appointments')
  @Roles('accountant', 'admin', 'cto', 'receptionist')
  @ApiOperation({ summary: 'Generate Appointment Summary: statuses (Scheduled/Checked-in/Completed) & provider breakdown' })
  getAppointmentReport(@Query() query: QueryReportsDto) {
    return this.reportsService.getAppointmentReport(query);
  }

  @Get('inventory')
  @Roles('accountant', 'admin', 'cto', 'receptionist', 'pharmacist', 'store_officer')
  @ApiOperation({ summary: 'Generate Stock Status Report: current quantities, units & reorder alert status' })
  getInventoryReport(@Query() query: QueryReportsDto) {
    return this.reportsService.getInventoryReport(query);
  }

  @Get('export-pdf')
  @Roles('accountant', 'admin', 'cto', 'receptionist')
  @ApiOperation({ summary: 'Generate exportable PDF formatted report document payload with clinic branding' })
  exportPdfGet(@Query() query: QueryReportsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.exportReportPdf(query, user);
  }

  @Post('export-pdf')
  @Roles('accountant', 'admin', 'cto', 'receptionist')
  @ApiOperation({ summary: 'Generate exportable PDF formatted report document payload via POST' })
  exportPdfPost(@Query() query: QueryReportsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.exportReportPdf(query, user);
  }
}
