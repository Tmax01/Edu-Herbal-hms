import { IsNotEmpty, IsString, IsEmail, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiPropertyOptional({ example: 'SUP-001' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'PharmaChem Ghana Ltd' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Kojo Acheampong' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'Kojo Acheampong' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiProperty({ example: '+233 30 277 8800' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'orders@pharmachm.gh' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Industrial Area, Accra' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Drug' })
  @IsOptional()
  @IsString()
  supplierType?: string;

  @ApiPropertyOptional({ example: 'Drug' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Net 30 days', default: 'Net 30 days' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ example: 4.5, default: 4.0 })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  rating?: number = 4.0;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 'Amlodipine, Metformin, Lisinopril' })
  @IsOptional()
  items?: any;
}
