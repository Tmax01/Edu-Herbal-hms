import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Accounting')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('expenses')
  @Roles('cto', 'admin', 'accountant')
  @ApiOperation({ summary: 'Record operational and administrative hospital expenses' })
  createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.accountingService.createExpense(dto, user.id);
  }

  @Get('expenses')
  @Roles('cto', 'admin', 'accountant')
  @ApiOperation({ summary: 'Query hospital operational expense entries with category and branch filters' })
  findAllExpenses(@Query() query: QueryExpensesDto) {
    return this.accountingService.findAllExpenses(query);
  }

  @Post('payroll')
  @Roles('cto', 'admin', 'accountant')
  @ApiOperation({ summary: 'Process monthly staff payroll with allowances, deductions, and net calculation' })
  processPayroll(@Body() dto: CreatePayrollDto, @CurrentUser() user: AuthenticatedUser) {
    return this.accountingService.processPayroll(dto, user.id);
  }

  @Get('payroll')
  @Roles('cto', 'admin', 'accountant')
  @ApiOperation({ summary: 'Retrieve monthly staff payroll records' })
  @ApiQuery({ name: 'payrollMonth', required: false, type: String, example: '2026-08' })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'Payroll month alias' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'branch', required: false, type: String, description: 'Branch name alias' })
  findPayroll(
    @Query('payrollMonth') payrollMonth?: string,
    @Query('month') month?: string,
    @Query('branchId') branchId?: string,
    @Query('branch') branch?: string,
  ) {
    return this.accountingService.findPayroll(payrollMonth || month, branchId || branch);
  }

  @Patch('payroll/:id/status')
  @Roles('cto', 'admin', 'accountant')
  @ApiOperation({ summary: 'Update staff payroll payment status (Paid, Pending, On Hold)' })
  updatePayrollStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.accountingService.updatePayrollStatus(id, status);
  }

  @Get('overview')
  @Roles('cto', 'admin', 'accountant', 'receptionist')
  @ApiOperation({ summary: 'Retrieve executive financial summary: revenue, collections, expenses, and net cash flow' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'branch', required: false, type: String, description: 'Branch name alias (Accra, Mankessim, All)' })
  getOverview(
    @Query('branchId') branchId?: string,
    @Query('branch') branch?: string,
  ) {
    return this.accountingService.getFinancialOverview(branchId || branch);
  }

  @Get('pl-statement')
  @Roles('cto', 'admin', 'accountant')
  @ApiOperation({ summary: 'Generate facility Profit & Loss (P&L) Statement itemized by revenue source and expense category' })
  @ApiQuery({ name: 'branch', required: false, type: String, description: 'Branch name alias' })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'Month (e.g. August 2026 or 2026-08)' })
  getPlStatement(
    @Query('branch') branch?: string,
    @Query('month') month?: string,
  ) {
    return this.accountingService.getProfitAndLossStatement(branch, month);
  }
}
