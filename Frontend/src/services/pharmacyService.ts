import { apiClient } from './apiClient';
import { BackendPrescription, DispensePrescriptionDto, QueryPrescriptionsDto, DrugSafetyResponse, } from '../types';

export const pharmacyService = {
  /**
   * Query prescriptions with status, branch, and patient filters
   * GET /api/v1/pharmacy/prescriptions
   */
  async getPrescriptions(query?: QueryPrescriptionsDto): Promise<BackendPrescription[]> {
    const response = await apiClient.get<unknown, BackendPrescription[]>('/pharmacy/prescriptions', {
      params: query,
    });
    return response;
  },

  /**
   * Retrieve prescription details, patient allergies, and dispensing status
   * GET /api/v1/pharmacy/prescriptions/:id
   */
  async getPrescription(id: string): Promise<BackendPrescription> {
    const response = await apiClient.get<unknown, BackendPrescription>(`/pharmacy/prescriptions/${id}`);
    return response;
  },

  /**
   * Dispense prescription medications and automatically trigger FEFO inventory deduction
   * POST /api/v1/pharmacy/prescriptions/:id/dispense
   */
  async dispensePrescription(id: string, dto: DispensePrescriptionDto): Promise<BackendPrescription> {
    const response = await apiClient.post<unknown, BackendPrescription>(`/pharmacy/prescriptions/${id}/dispense`, dto);
    return response;
  },

  /**
   * Cross-examine drug combinations against clinical interaction database
   * POST /api/v1/pharmacy/cdss/check-interactions
   */
  async checkInteractions(drugNames: string[]): Promise<DrugSafetyResponse | any> {
    const response = await apiClient.post<unknown, any>('/pharmacy/cdss/check-interactions', { drugNames });
    return response;
  },
};
