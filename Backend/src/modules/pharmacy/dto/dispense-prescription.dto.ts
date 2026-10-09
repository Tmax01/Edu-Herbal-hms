import { IsOptional, IsString, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DispenseItemInputDto {
  @ApiPropertyOptional({ description: 'Prescription Item UUID' })
  @IsOptional()
  @IsString()
  prescriptionItemId?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantityToDispense?: number;
}

export class DispensePrescriptionDto {
  @ApiPropertyOptional({
    type: [DispenseItemInputDto],
    description: 'Specific line items to dispense. If omitted, all items are fully dispensed.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispenseItemInputDto)
  dispensedItems?: DispenseItemInputDto[];
}
