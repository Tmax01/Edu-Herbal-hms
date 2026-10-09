import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Billing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @Roles('cto', 'admin', 'accountant', 'receptionist')
  @ApiOperation({ summary: 'Generate an itemized invoice for clinical/pharmacy/laboratory charges' })
  createInvoice(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.billingService.createInvoice(dto, user.id);
  }

  @Post('payments')
  @Roles('cto', 'admin', 'accountant', 'receptionist')
  @ApiOperation({ summary: 'Record a cash, mobile money, POS, or bank payment and generate receipt' })
  recordPayment(@Body() dto: RecordPaymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.billingService.recordPayment(dto, user.id);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Query patient invoices with payment status, branch, and date filters' })
  findAllInvoices(@Query() query: QueryInvoicesDto) {
    return this.billingService.findAll(query);
  }

  @Get('invoices/:id')
  @ApiParam({ name: 'id', example: 'INV-2026-0041' })
  @ApiOperation({ summary: 'Retrieve full itemized invoice details and payment transaction history' })
  findOneInvoice(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }
}
