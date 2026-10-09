import { IsNotEmpty, IsString, IsOptional, IsInt, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockItemDto {
  @ApiPropertyOptional({ example: 'STK-MED-001' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Paracetamol 500mg Tablets' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Pharmaceuticals', description: 'Pharmaceuticals, Herbal, Lab Reagents, Consumables' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 'accra-main-branch-001' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'Boxes (10x10)' })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: 50, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number = 100;
}
