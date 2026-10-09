import { apiClient } from './apiClient';
import {
  CreateConsultationDto,
  BackendConsultation,
  QueryConsultationsDto,
  ConsultationLabRequestDto,
  CreateReferralDto,
  SendVitalsSmsDto,
} from '../types';

export const consultationService = {
  /**
   * Record an outpatient doctor consultation encounter (SOAP note) with vitals and prescriptions
   * POST /api/v1/consultations
   */
  async createConsultation(dto: CreateConsultationDto): Promise<BackendConsultation> {
    const response = await apiClient.post<unknown, BackendConsultation>('/consultations', dto);
    return response;
  },

  /**
   * Submit a lab test order request directly from consultation
   * POST /api/v1/consultations/lab-requests
   */
  async requestLabTests(dto: ConsultationLabRequestDto): Promise<any> {
    const response = await apiClient.post<unknown, any>('/consultations/lab-requests', dto);
    return response;
  },

  /**
   * Refer patient to a specialist doctor or department
   * POST /api/v1/consultations/referrals
   */
  async createReferral(dto: CreateReferralDto): Promise<any> {
    const response = await apiClient.post<unknown, any>('/consultations/referrals', dto);
    return response;
  },

  /**
   * Send recorded patient vitals SMS with clinic greeting
   * POST /api/v1/consultations/vitals-sms
   */
  async sendVitalsSms(dto: SendVitalsSmsDto): Promise<any> {
    const response = await apiClient.post<unknown, any>('/consultations/vitals-sms', dto);
    return response;
  },

  /**
   * Query consultation encounters with patient/doctor/branch filters
   * GET /api/v1/consultations
   */
  async getConsultations(query?: QueryConsultationsDto): Promise<BackendConsultation[]> {
    const response = await apiClient.get<unknown, BackendConsultation[]>('/consultations', { params: query });
    return response;
  },

  /**
   * Retrieve full consultation details, associated vitals, prescriptions, and lab orders
   * GET /api/v1/consultations/:id
   */
  async getConsultation(id: string): Promise<BackendConsultation> {
    const response = await apiClient.get<unknown, BackendConsultation>(`/consultations/${id}`);
    return response;
  },
};
