import { IsNotEmpty, IsString, IsBoolean, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionEntryDto {
  @ApiProperty({ example: 'PATIENTS', description: 'Unique module key' })
  @IsNotEmpty()
  @IsString()
  moduleKey: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  canView: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  canCreate: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  canEdit: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  canDelete: boolean;
}

export class SetPermissionsDto {
  @ApiPropertyOptional({ type: [PermissionEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionEntryDto)
  permissions?: PermissionEntryDto[];

  @ApiPropertyOptional({ example: ['dashboard', 'patients', 'billing'], description: 'List of module keys enabled for user' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedModules?: string[];
}

