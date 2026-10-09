import { IsNotEmpty, IsString, IsOptional, IsUUID, IsArray, ValidateNested, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PrescriptionItemInputDto {
  @ApiPropertyOptional({ example: 'STK-MED-001' })
  @IsOptional()
  @IsString()
  stockItemId?: string;

  @ApiProperty({ example: 'Amoxicillin 500mg' })
  @IsNotEmpty()
  @IsString()
  drugName: string;

  @ApiProperty({ example: '500mg' })
  @IsNotEmpty()
  @IsString()
  dosage: string;

  @ApiProperty({ example: 'Three times daily (TDS)' })
  @IsNotEmpty()
  @IsString()
  frequency: string;

  @ApiProperty({ example: '5 days' })
  @IsNotEmpty()
  @IsString()
  duration: string;

  @ApiProperty({ example: 15 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantityPrescribed: number;
}

export class CreatePrescriptionDto {
  @ApiPropertyOptional({ example: 'RX-001' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Originating consultation UUID' })
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiPropertyOptional({ example: 'PAT-001' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Adjoa Mensah' })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Accra' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 'Conventional', enum: ['Conventional', 'Herbal', 'Integrated'] })
  @IsOptional()
  @IsIn(['Conventional', 'Herbal', 'Integrated'])
  prescriptionType?: string = 'Conventional';

  @ApiPropertyOptional({ example: 'Take after meals' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [PrescriptionItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemInputDto)
  items: PrescriptionItemInputDto[];
}

