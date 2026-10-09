import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferStockDto {
  @ApiProperty({ example: 'STK-001', description: 'Stock item ID to transfer' })
  @IsNotEmpty()
  @IsString()
  stockItemId: string;

  @ApiProperty({ example: 50, description: 'Quantity to transfer' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Mankessim', description: 'Destination branch name or UUID' })
  @IsNotEmpty()
  @IsString()
  destinationBranch: string;
}
