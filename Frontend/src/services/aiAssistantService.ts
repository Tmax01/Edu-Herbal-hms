import { apiClient } from './apiClient';
import {
  DifferentialDiagnosisQueryDto,
  DifferentialDiagnosisResponse,
  DrugSafetyQueryDto,
  DrugSafetyResponse,
} from '../types';

export const aiAssistantService = {
  /**
   * Generate AI-driven differential diagnoses, investigations, and clinical red flags
   * POST /api/v1/ai-assistant/differential-diagnosis
   */
  async getDifferentialDiagnosis(dto: DifferentialDiagnosisQueryDto): Promise<DifferentialDiagnosisResponse> {
    const payload = {
      chiefComplaintAndHpi: dto.chiefComplaintAndHpi || (dto.symptoms ? dto.symptoms.join(', ') : 'Unspecified symptoms'),
      vitalsSummary: dto.vitalsSummary,
      patientDemographics: dto.patientDemographics || (dto.age || dto.gender ? `${dto.age || ''}yo ${dto.gender || ''}`.trim() : undefined),
    };
    const response = await apiClient.post<unknown, DifferentialDiagnosisResponse>(
      '/ai-assistant/differential-diagnosis',
      payload
    );
    return response;
  },

  /**
   * AI multi-drug interaction, allergy contradiction, and safety review
   * POST /api/v1/ai-assistant/drug-safety
   */
  async checkDrugSafety(dto: DrugSafetyQueryDto): Promise<DrugSafetyResponse> {
    const payload = {
      medicationList: dto.medicationList || dto.drugNames || [],
      knownAllergies: dto.knownAllergies || dto.patientAllergies,
      coMorbidities: dto.coMorbidities,
    };
    const response = await apiClient.post<unknown, DrugSafetyResponse>('/ai-assistant/drug-safety', payload);
    return response;
  },

  /**
   * Auto-synthesize structured hospital discharge summary from inpatient chart notes
   * POST /api/v1/ai-assistant/discharge-summary
   */
  async generateDischargeSummary(dto: {
    admissionId?: string;
    notes?: string;
    clinicalCourseAndDiagnosis?: string;
    dischargeMedications?: string;
    followUpInstructions?: string;
  }): Promise<any> {
    const payload = {
      clinicalCourseAndDiagnosis: dto.clinicalCourseAndDiagnosis || dto.notes || 'Inpatient admission treated successfully.',
      dischargeMedications: dto.dischargeMedications || 'Oral antibiotics and analgesics as prescribed.',
      followUpInstructions: dto.followUpInstructions || 'Follow-up review in 2 weeks.',
    };
    const response = await apiClient.post<unknown, any>('/ai-assistant/discharge-summary', payload);
    return response;
  },
};
