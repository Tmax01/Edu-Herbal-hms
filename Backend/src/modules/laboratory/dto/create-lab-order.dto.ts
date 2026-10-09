import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LabOrderItemInputDto {
  @ApiProperty({ example: 'Full Blood Count' })
  @IsNotEmpty()
  @IsString()
  testName: string;

  @ApiPropertyOptional({ example: '12.0 - 16.0 g/dL' })
  @IsOptional()
  @IsString()
  referenceRange?: string;

  @ApiPropertyOptional({ example: 'g/dL' })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateLabOrderDto {
  @ApiPropertyOptional({ example: 'LAB-2026-005' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Originating consultation UUID' })
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiProperty({ example: 'PAT-001' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

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

  @ApiPropertyOptional({ example: 'USR-003' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'Urgent', enum: ['Routine', 'Urgent', 'STAT'], default: 'Routine' })
  @IsOptional()
  @IsIn(['Routine', 'Urgent', 'STAT'])
  priority?: string = 'Routine';

  @ApiPropertyOptional({ example: ['Full Blood Count', 'Renal Function Test'] })
  @IsOptional()
  @IsArray()
  tests?: string[];

  @ApiPropertyOptional({ type: [LabOrderItemInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabOrderItemInputDto)
  items?: LabOrderItemInputDto[];
}
