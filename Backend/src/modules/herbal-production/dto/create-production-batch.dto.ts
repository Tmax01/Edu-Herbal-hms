import { IsNotEmpty, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PRODUCTION_STAGES = [
  'Mixing',
  'Processing',
  'QC',
  'Packaging',
  'Completed',
  'Raw Material Intake',
  'Maceration/Boiling',
  'Formulation & Mixing',
  'Filtration',
  'Quality Control (QC)',
  'Bottling & Packaging',
  'Rejected',
] as const;

export class CreateProductionBatchDto {
  @ApiPropertyOptional({ example: 'Neem Leaf Extract 500ml' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ example: 'Neem Leaf Extract 500ml' })
  @IsOptional()
  @IsString()
  product?: string;

  @ApiPropertyOptional({ example: 'HB-2026-0005' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: 'Mixing', enum: PRODUCTION_STAGES, default: 'Mixing' })
  @IsOptional()
  @IsString()
  stage?: string = 'Mixing';

  @ApiPropertyOptional({ example: '2026-08-22' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-12' })
  @IsOptional()
  completionDate?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 300, description: 'Target units to produce' })
  @IsOptional()
  plannedQuantity?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 'Standard botanical decoction with Cryptolepis sanguinolenta.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProductionStageDto {
  @ApiProperty({ example: 'QC', enum: PRODUCTION_STAGES })
  @IsNotEmpty()
  @IsString()
  stage: string;

  @ApiPropertyOptional({ example: 'Batch passes microbial and pH specification tests.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

