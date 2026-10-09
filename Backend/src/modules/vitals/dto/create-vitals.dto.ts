import { IsNotEmpty, IsString, IsOptional, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVitalsDto {
  @ApiProperty({ example: 'PAT-001' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ example: 'UUID of consultation if recorded inside consultation room' })
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiPropertyOptional({ example: 120, description: 'Systolic blood pressure (mmHg)' })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(300)
  bpSystolic?: number;

  @ApiPropertyOptional({ example: 80, description: 'Diastolic blood pressure (mmHg)' })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  bpDiastolic?: number;

  @ApiPropertyOptional({ example: 72, description: 'Heart / Pulse rate (beats per minute)' })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(250)
  pulseRate?: number;

  @ApiPropertyOptional({ example: 36.8, description: 'Body temperature in Celsius (°C)' })
  @IsOptional()
  @IsNumber()
  @Min(30.0)
  @Max(45.0)
  temperature?: number;

  @ApiPropertyOptional({ example: 5.8, description: 'Random / Fasting blood glucose (mmol/L)' })
  @IsOptional()
  @IsNumber()
  bloodSugar?: number;

  @ApiPropertyOptional({ example: 70.5, description: 'Body weight in Kilograms (kg)' })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(400.0)
  weightKg?: number;

  @ApiPropertyOptional({ example: 175.0, description: 'Height in Centimeters (cm)' })
  @IsOptional()
  @IsNumber()
  @Min(30.0)
  @Max(250.0)
  heightCm?: number;

  @ApiPropertyOptional({ example: 98, description: 'Blood oxygen saturation percentage (%)' })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(100)
  spo2?: number;
}
