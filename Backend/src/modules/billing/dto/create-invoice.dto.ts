import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsDateString, ValidateNested, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceLineItemInputDto {
  @ApiProperty({ example: 'Consultation', description: 'Consultation, Pharmacy, Laboratory, Ward, Procedure' })
  @IsNotEmpty()
  @IsString()
  itemType: string;

  @ApiPropertyOptional({ example: 'RX-001 or LAB-001', description: 'Originating reference ID' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ example: 'Consultation Fee – General Medicine' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 150.00, description: 'Unit price in GHS (GH₵)' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ example: 'INV-2026-0041', description: 'Auto-generated if omitted' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'PAT-001', description: 'Patient UUID or MRN' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Adjoa Mensah', description: 'Patient name, MRN, or ID alias' })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiPropertyOptional({ example: 'Adjoa Mensah', description: 'Patient alias' })
  @IsOptional()
  @IsString()
  patient?: string;

  @ApiPropertyOptional({ description: 'Associated consultation encounter UUID' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001', description: 'Billing branch facility UUID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra', description: 'Branch name alias' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: '2026-09-02', description: 'Visit date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @ApiPropertyOptional({ example: 'Cash', description: 'Payment method (Cash, Mobile Money, Bank Transfer, POS / Card, NHIS)' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Consultation, Lab tests, Medication...', description: 'Services description summary' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 320.00, description: 'Total invoice amount in GHS' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: 320.00, description: 'Total invoice amount alias' })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({ type: [InvoiceLineItemInputDto], description: 'Itemized clinical/pharmacy line items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemInputDto)
  lineItems?: InvoiceLineItemInputDto[];
}
