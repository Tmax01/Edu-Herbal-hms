import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryReportsDto {
  @ApiPropertyOptional({
    description: 'Category of report to generate',
    enum: ['revenue', 'patients', 'appointments', 'inventory'],
    example: 'revenue',
  })
  @IsOptional()
  @IsString()
  @IsIn(['revenue', 'patients', 'appointments', 'inventory'])
  type?: 'revenue' | 'patients' | 'appointments' | 'inventory';

  @ApiPropertyOptional({
    description: 'Category of report to generate (alias for type)',
    enum: ['revenue', 'patients', 'appointments', 'inventory'],
    example: 'revenue',
  })
  @IsOptional()
  @IsString()
  @IsIn(['revenue', 'patients', 'appointments', 'inventory'])
  reportType?: 'revenue' | 'patients' | 'appointments' | 'inventory';

  @ApiPropertyOptional({ description: 'Branch name or ID filter (e.g. Accra, Mankessim, All)', example: 'Accra' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ description: 'Branch ID', example: 'accra-main-branch-001' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Start date of reporting period (YYYY-MM-DD)', example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Alias for startDate', example: '2026-08-01' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date of reporting period (YYYY-MM-DD)', example: '2026-08-22' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Alias for endDate', example: '2026-08-22' })
  @IsOptional()
  @IsString()
  to?: string;
}
