import { IsNotEmpty, IsString, MinLength, ValidateIf, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'dr.mensah@eduhms.gh or EMP-DOC-003',
    description: 'Work email address or Staff ID / Number',
  })
  @ValidateIf((o) => !o.identifier && !o.staffNumber)
  @IsNotEmpty({ message: 'Email or Staff ID is required' })
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: 'EMP-DOC-003 or dr.mensah@eduhms.gh',
    description: 'Staff ID / Number or Work email',
  })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({
    example: 'EMP-DOC-003',
    description: 'Staff ID / Number',
  })
  @IsOptional()
  @IsString()
  staffNumber?: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

