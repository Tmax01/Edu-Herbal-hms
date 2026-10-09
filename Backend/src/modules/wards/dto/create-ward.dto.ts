import { IsNotEmpty, IsString, IsOptional, IsInt, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWardDto {
  @ApiPropertyOptional({ example: 'ward-general-001' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'accra-main-branch-001' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'Inpatient Ward A (Male Medical)' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Male', default: 'Mixed' })
  @IsOptional()
  @IsString()
  genderAllocation?: string = 'Mixed';

  @ApiProperty({ example: 20 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  totalBeds: number;
}

export class CreateBedDto {
  @ApiProperty({ example: 'ward-general-001' })
  @IsNotEmpty()
  @IsString()
  wardId: string;

  @ApiProperty({ example: 'accra-main-branch-001' })
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'BED-A1-04' })
  @IsNotEmpty()
  @IsString()
  bedNumber: string;
}
