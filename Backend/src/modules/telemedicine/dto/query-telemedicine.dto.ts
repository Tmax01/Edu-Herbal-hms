import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class QueryTelemedicineDto {
  @ApiPropertyOptional({ description: 'Branch filter (Accra, Mankessim, All)' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Status filter', enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No-show'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Active tab view filter', enum: ['upcoming', 'completed'] })
  @IsOptional()
  @IsIn(['upcoming', 'completed'])
  tab?: 'upcoming' | 'completed';

  @ApiPropertyOptional({ description: 'Session type filter', enum: ['Video', 'Audio', 'Chat'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Doctor User ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Patient ID' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Search term for patient or doctor name' })
  @IsOptional()
  @IsString()
  search?: string;
}
