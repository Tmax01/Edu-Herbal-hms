import { IsNotEmpty, IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'General Medicine' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'GEN_MED', description: 'Department code identifier' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Primary medical consultations and diagnosis' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Branch facility ID (omit/null if department is shared across entire hospital)',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ default: true, description: 'True for clinical units, false for administrative/finance' })
  @IsOptional()
  @IsBoolean()
  isClinical?: boolean = true;
}
