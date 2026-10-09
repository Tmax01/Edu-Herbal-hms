import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: '7-day rotating refresh JWT string' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
