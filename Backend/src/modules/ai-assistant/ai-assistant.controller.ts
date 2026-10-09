import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiAssistantService } from './ai-assistant.service';
import { DifferentialDiagnosisQueryDto, DrugSafetyQueryDto, GenerateDischargeSummaryDto } from './dto/clinical-assistant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('AI Assistant')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiService: AiAssistantService) {}

  @Post('differential-diagnosis')
  @Roles('cto', 'admin', 'doctor')
  @ApiOperation({ summary: 'Generate AI-driven differential diagnoses, investigations, and clinical red flags' })
  getDifferentialDiagnosis(@Body() dto: DifferentialDiagnosisQueryDto) {
    return this.aiService.getDifferentialDiagnosis(dto);
  }

  @Post('drug-safety')
  @Roles('cto', 'admin', 'doctor', 'pharmacist')
  @ApiOperation({ summary: 'AI multi-drug interaction, allergy contradiction, and safety review' })
  checkDrugSafety(@Body() dto: DrugSafetyQueryDto) {
    return this.aiService.checkDrugSafety(dto);
  }

  @Post('discharge-summary')
  @Roles('cto', 'admin', 'doctor')
  @ApiOperation({ summary: 'Auto-synthesize structured hospital discharge summary from inpatient chart notes' })
  generateDischargeSummary(@Body() dto: GenerateDischargeSummaryDto) {
    return this.aiService.generateDischargeSummary(dto);
  }
}
