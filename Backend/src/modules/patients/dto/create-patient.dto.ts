import { IsNotEmpty, IsString, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmergencyContactInputDto {
  @ApiProperty({ example: 'Kofi Mensah' })
  @IsNotEmpty()
  @IsString()
  contactName: string;

  @ApiProperty({ example: 'Spouse' })
  @IsNotEmpty()
  @IsString()
  relationship: string;

  @ApiProperty({ example: '+233 24 999 8888' })
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class PatientAllergyInputDto {
  @ApiProperty({ example: 'Penicillin' })
  @IsNotEmpty()
  @IsString()
  allergenName: string;

  @ApiPropertyOptional({ example: 'Severe', default: 'Moderate' })
  @IsOptional()
  @IsString()
  severity?: string = 'Moderate';

  @ApiPropertyOptional({ example: 'Facial swelling and hives' })
  @IsOptional()
  @IsString()
  reaction?: string;
}

export class CreatePatientDto {
  @ApiPropertyOptional({ example: 'Adjoa Mensah' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Adjoa Mensah' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '1992-05-18' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '1992-05-18' })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiProperty({ example: 'Female' })
  @IsNotEmpty()
  @IsString()
  gender: string;

  @ApiProperty({ example: '+233 24 555 1234' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'adjoa.mensah@gmail.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'House 45, Ring Road Central, Accra' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'O+' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 'NHIS-GH-8839201' })
  @IsOptional()
  @IsString()
  nhisId?: string;

  @ApiPropertyOptional({ example: 'accra-main-branch-001 or Accra' })
  @IsOptional()
  @IsString()
  registrationBranchId?: string;

  @ApiPropertyOptional({ example: 'Accra' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 'https://minio.eduhms.gh/patients/photo-001.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ example: 'Known asthmatic since childhood' })
  @IsOptional()
  @IsString()
  generalNotes?: string;

  @ApiPropertyOptional({ example: 'Any pre-existing conditions, notes, etc.' })
  @IsOptional()
  @IsString()
  notes?: string;

  // Flat emergency contact fields from frontend
  @ApiPropertyOptional({ example: 'Kwame Mensah' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: '+233 55 765 4321' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiPropertyOptional({ type: [EmergencyContactInputDto] })
  @IsOptional()
  emergencyContacts?: EmergencyContactInputDto[];

  // Allergies: can be comma-separated string e.g. "Penicillin, Sulfa drugs", string array, or object array
  @ApiPropertyOptional({ example: 'Penicillin, Sulfa drugs' })
  @IsOptional()
  allergies?: any;

  // Initial vitals
  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional()
  @IsString()
  vitals_bp?: string;

  @ApiPropertyOptional({ example: '5.4' })
  @IsOptional()
  @IsString()
  vitals_sugar?: string;

  @ApiPropertyOptional({ example: '65' })
  @IsOptional()
  vitals_weight?: number | string;

  @ApiPropertyOptional({ example: '170' })
  @IsOptional()
  vitals_height?: number | string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  sendWelcomeSms?: boolean;
}
