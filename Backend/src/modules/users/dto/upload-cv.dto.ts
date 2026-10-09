import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadCvDto {
  @ApiProperty({ example: 'CV_Dr_Nana_Asare.pdf' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiPropertyOptional({ example: 'data:application/pdf;base64,...' })
  @IsOptional()
  @IsString()
  dataUrl?: string;

  @ApiPropertyOptional({ example: '/uploads/cv/USR-003_cv.pdf' })
  @IsOptional()
  @IsString()
  filePathUrl?: string;
}
