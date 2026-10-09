import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'Accra Central Hospital' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'ACC', description: 'Unique facility identifier code' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: '14 Independence Avenue, Ridge, Accra' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: '+233 24 100 0001' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'accra@eduhms.gh' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
