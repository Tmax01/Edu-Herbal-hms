import { apiClient } from './apiClient';

export interface CreateVitalsDto {
  patientId: string;
  systolicBp?: number;
  diastolicBp?: number;
  bp?: string;
  pulseRate?: number;
  temperature?: number;
  weightKg?: number;
  heightCm?: number;
  respiratoryRate?: number;
  spo2?: number;
  bloodSugar?: number | string;
  notes?: string;
}

export interface BackendVitals {
  id: string;
  patientId: string;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  temperature?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  respiratoryRate?: number;
  spo2?: number;
  notes?: string;
  recordedById?: string;
  recordedBy?: { fullName: string };
  createdAt: string;
}

export const vitalsService = {
  /**
   * Record triage physiological vitals with automated clinical alerts & BMI calculation
   * POST /api/v1/vitals
   */
  async recordVitals(dto: CreateVitalsDto): Promise<BackendVitals> {
    const response = await apiClient.post<unknown, BackendVitals>('/vitals', dto);
    return response;
  },

  /**
   * Retrieve historical vital sign records and trend analyses for a patient
   * GET /api/v1/vitals/patient/:patientId
   */
  async getPatientVitals(patientId: string, limit: number = 10): Promise<BackendVitals[]> {
    const response = await apiClient.get<unknown, BackendVitals[]>(`/vitals/patient/${patientId}`, {
      params: { limit },
    });
    return response;
  },
};
