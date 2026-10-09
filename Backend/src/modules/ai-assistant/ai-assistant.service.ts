import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DifferentialDiagnosisQueryDto, DrugSafetyQueryDto, GenerateDischargeSummaryDto } from './dto/clinical-assistant.dto';
import OpenAI from 'openai';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private openai: OpenAI | null = null;
  private readonly modelName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.modelName = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o');

    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async getDifferentialDiagnosis(dto: DifferentialDiagnosisQueryDto) {
    const systemPrompt = `You are EduHMS Clinical Copilot, an expert clinical decision support AI for licensed physicians and healthcare professionals in Ghana and West Africa.
Analyze presenting complaints, physiological vitals, and demographics to suggest:
1. Top 3 Differential Diagnoses (with clinical rationale and probability).
2. Recommended Diagnostic Laboratory & Imaging Investigations.
3. Urgent 'Red Flag' Warning Signs requiring immediate emergency stabilization.
Format output cleanly in Markdown with medical precision.`;

    const userPrompt = `Patient Demographics: ${dto.patientDemographics || 'Not specified'}
Vitals: ${dto.vitalsSummary || 'Not provided'}
Chief Complaint & History: ${dto.chiefComplaintAndHpi}`;

    return this.queryOpenAI(systemPrompt, userPrompt);
  }

  async checkDrugSafety(dto: DrugSafetyQueryDto) {
    const systemPrompt = `You are EduHMS Pharmacy Clinical AI. Review the provided medication regimen against known allergies and comorbidities.
Evaluate:
1. Significant Drug-Drug interactions.
2. Allergy contraindications.
3. Dosage adjustments needed for co-morbidities.
4. Summary recommendation for the prescribing clinician.`;

    const userPrompt = `Medications: ${dto.medicationList.join(', ')}
Known Allergies: ${(dto.knownAllergies || []).join(', ') || 'None reported'}
Co-morbidities: ${dto.coMorbidities || 'None specified'}`;

    return this.queryOpenAI(systemPrompt, userPrompt);
  }

  async generateDischargeSummary(dto: GenerateDischargeSummaryDto) {
    const systemPrompt = `You are EduHMS Medical Scribe AI. Synthesize the provided inpatient stay history into a professional Hospital Discharge Summary for the patient's medical file. Include:
- Admission & Final Diagnoses
- Hospital Course & Procedures
- Discharge Medications & Regimen
- Dietary & Activity Advice
- Follow-up Schedule and Emergency Return Precautions`;

    const userPrompt = `Clinical Course: ${dto.clinicalCourseAndDiagnosis}
Discharge Medications: ${dto.dischargeMedications}
Follow-up: ${dto.followUpInstructions || 'Standard 2-week review'}`;

    return this.queryOpenAI(systemPrompt, userPrompt);
  }

  private async queryOpenAI(systemPrompt: string, userPrompt: string) {
    if (!this.openai) {
      // Mock response for development when API key is not yet set
      return {
        source: 'EduHMS AI Copilot (Simulation Mode)',
        model: this.modelName,
        response: `### Clinical Decision Support\n\n*Based on the clinical presentation provided, consider:*\n\n1. **Primary Differential:** Uncomplicated Acute Febrile Illness (e.g. Malaria, Typhoid, Dengue).\n2. **Recommended Tests:** Malaria RDT & Microscopy, Full Blood Count (FBC), Widal/Blood Culture, Urinalysis.\n3. **Red Flags:** Altered mental status, persistent vomiting, SpO2 < 95%, severe hypotension.\n\n*(Connect OPENAI_API_KEY in .env for live GPT-4o inferences).*`,
        generatedAt: new Date().toISOString(),
      };
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2, // Low temperature for high clinical precision
      });

      return {
        source: 'OpenAI GPT-4o Clinical Intelligence',
        model: this.modelName,
        response: completion.choices[0]?.message?.content || 'No response generated',
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.error(`OpenAI Request Error: ${err.message}`);
      throw err;
    }
  }
}
