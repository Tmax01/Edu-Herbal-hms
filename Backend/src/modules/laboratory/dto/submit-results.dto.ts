import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResultItemInputDto {
  @ApiPropertyOptional({ description: 'Lab order item UUID' })
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiPropertyOptional({ example: 'Full Blood Count' })
  @IsOptional()
  @IsString()
  testName?: string;

  @ApiPropertyOptional({ example: { hemoglobin: 11.2, wbc: 7.2 } })
  @IsOptional()
  parameterResults?: any;

  @ApiPropertyOptional({ example: 'Normal', enum: ['Normal', 'Low', 'High', 'Critical'], default: 'Normal' })
  @IsOptional()
  @IsString()
  flag?: string = 'Normal';
}

export class SubmitResultsDto {
  @ApiPropertyOptional({
    example: 'Hb: 11.2 g/dL (Low), WBC: 7.2 x10³/μL (Normal), Creatinine: 0.9 mg/dL (Normal)',
    description: 'Free-text or consolidated diagnostic result summary',
  })
  @IsOptional()
  @IsString()
  resultSummary?: string;

  @ApiPropertyOptional({
    example: 'Hb: 11.2 g/dL (Low), WBC: 7.2 x10³/μL (Normal), Creatinine: 0.9 mg/dL (Normal)',
    description: 'Alias for resultSummary from frontend modal',
  })
  @IsOptional()
  @IsString()
  resultText?: string;

  @ApiPropertyOptional({
    example: 'Hb: 11.2 g/dL (Low), WBC: 7.2 x10³/μL (Normal)',
    description: 'String results or parameter array',
  })
  @IsOptional()
  results?: any;

  @ApiPropertyOptional({ example: 'Awaiting Approval', default: 'Awaiting Approval' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'LAB-002_HbA1c_Kofi_Acheampong.pdf', description: 'Attached PDF file name' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 284, description: 'File size in Kilobytes' })
  @IsOptional()
  @IsNumber()
  fileSizeKb?: number;

  @ApiPropertyOptional({ example: '284 KB', description: 'Formatted file size' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: '/uploads/lab/LAB-002_HbA1c.pdf' })
  @IsOptional()
  @IsString()
  filePathUrl?: string;
}
