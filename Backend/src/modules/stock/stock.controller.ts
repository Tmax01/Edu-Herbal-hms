import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { StockTransactionDto } from './dto/stock-transaction.dto';
import { QueryStockDto } from './dto/query-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Stock')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('items')
  @Roles('cto', 'admin', 'pharmacist', 'store_officer')
  @ApiOperation({ summary: 'Register a new stock item catalog entry' })
  createItem(@Body() dto: CreateStockItemDto) {
    return this.stockService.createItem(dto);
  }

  @Post('batches')
  @Roles('cto', 'admin', 'pharmacist', 'store_officer')
  @ApiOperation({ summary: 'Receive new inventory shipment batch with FEFO expiry tracking' })
  addBatch(@Body() dto: CreateBatchDto) {
    return this.stockService.addBatch(dto);
  }

  @Post('transfer')
  @Roles('cto', 'admin', 'pharmacist', 'store_officer')
  @ApiOperation({ summary: 'Transfer stock inventory between hospital branches (Accra <-> Mankessim)' })
  transferStock(@Body() dto: TransferStockDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stockService.transferStock(dto, user.id);
  }

  @Post('transactions')
  @Roles('cto', 'admin', 'pharmacist', 'store_officer')
  @ApiOperation({ summary: 'Record manual inventory adjustments, returns, or write-offs' })
  recordTransaction(@Body() dto: StockTransactionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stockService.recordTransaction(dto, user.id);
  }

  @Get()
  @Roles('cto', 'admin', 'pharmacist', 'store_officer', 'doctor', 'nurse', 'accountant')
  @ApiOperation({ summary: 'Query inventory stock levels, batch expiries, and reorder alerts' })
  findAll(@Query() query: QueryStockDto) {
    return this.stockService.findAll(query);
  }
}
