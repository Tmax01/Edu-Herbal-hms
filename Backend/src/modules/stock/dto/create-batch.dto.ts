import { IsNotEmpty, IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ example: 'STK-MED-001' })
  @IsNotEmpty()
  @IsString()
  stockItemId: string;

  @ApiProperty({ example: 'BAT-2026-049' })
  @IsNotEmpty()
  @IsString()
  batchNumber: string;

  @ApiPropertyOptional({ example: 'SUP-001' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ example: 500 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: '2028-06-30' })
  @IsNotEmpty()
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({ example: '2026-09-02' })
  @IsOptional()
  @IsDateString()
  dateReceived?: string;
}
