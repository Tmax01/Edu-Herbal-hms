import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Purchase of Diesel for Hospital Backup Generator' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'Utilities', description: 'Utilities, Medical Supplies, Logistics, Maintenance, Administrative' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 4500.00, description: 'Expense amount in GHS (GH₵)' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: '2026-09-02' })
  @IsOptional()
  @IsString()
  expenseDate?: string;

  @ApiPropertyOptional({ example: '2026-09-02', description: 'Expense date alias' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra', description: 'Branch name alias' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiProperty({ example: 'Bank Transfer', description: 'Cash, Bank Transfer, Cheque, Mobile Money' })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'https://minio.eduhms.gh/receipts/rec-001.pdf' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
