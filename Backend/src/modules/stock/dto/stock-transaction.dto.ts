import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockTransactionDto {
  @ApiProperty({ example: 'STK-MED-001' })
  @IsNotEmpty()
  @IsString()
  stockItemId: string;

  @ApiProperty({ example: 'accra-main-branch-001' })
  @IsNotEmpty()
  @IsString()
  branchId: string;

  @ApiProperty({ example: 'DISPENSE', description: 'RESTOCK, DISPENSE, ADJUSTMENT, RETURN, WRITE_OFF' })
  @IsNotEmpty()
  @IsString()
  transactionType: string;

  @ApiProperty({ example: -10, description: 'Positive for incoming stock, negative for deductions' })
  @IsNotEmpty()
  @IsInt()
  quantityDelta: number;

  @ApiPropertyOptional({ example: 'RX-2026-001' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}
