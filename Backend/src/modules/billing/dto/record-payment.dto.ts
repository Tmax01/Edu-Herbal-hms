import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordPaymentDto {
  @ApiPropertyOptional({ example: 'INV-2026-0041' })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({ example: 'INV-2026-0041', description: 'Invoice ID alias' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 150.00, description: 'Amount paid in GHS (GH₵)' })
  @IsOptional()
  @IsNumber()
  amountPaid?: number;

  @ApiPropertyOptional({ example: 150.00, description: 'Amount paid alias' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ example: 'Mobile Money', description: 'Cash, Mobile Money, POS / Card, Bank Transfer, NHIS' })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'MOMO-REF-9988231', description: 'MoMo transaction ID or check number' })
  @IsOptional()
  @IsString()
  transactionReference?: string;
}
