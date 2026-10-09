import { apiClient } from './apiClient';
import { Ward, Bed, InpatientAdmission, CreateWardDto, CreateBedDto, CreateAdmissionDto, DischargeAdmissionDto } from '../types/ward';

export const wardService = {
  /**
   * Retrieve all wards with bed statuses and occupancy rates
   */
  async getWards(branchId?: string): Promise<Ward[]> {
    const params: Record<string, any> = {};
    if (branchId && branchId !== 'All') params.branchId = branchId;
    return await apiClient.get('/wards', { params });
  },

  /**
   * Create a new ward unit
   */
  async createWard(data: CreateWardDto): Promise<Ward> {
    return await apiClient.post('/wards', data);
  },

  /**
   * Register a bed unit in a ward
   */
  async createBed(data: CreateBedDto): Promise<Bed> {
    return await apiClient.post('/wards/beds', data);
  },

  /**
   * Admit a patient to an available ward bed
   */
  async admitPatient(data: CreateAdmissionDto): Promise<InpatientAdmission> {
    return await apiClient.post('/wards/admissions', data);
  },

  /**
   * Admit a patient directly to a specific bed
   */
  async admitToBed(bedId: string, data: CreateAdmissionDto): Promise<InpatientAdmission> {
    return await apiClient.post(`/wards/beds/${bedId}/admit`, data);
  },

  /**
   * Discharge an admitted patient and release the bed
   */
  async dischargePatient(admissionId: string, dto?: DischargeAdmissionDto): Promise<InpatientAdmission> {
    return await apiClient.patch(`/wards/admissions/${admissionId}/discharge`, dto || {});
  },

  /**
   * Discharge a patient occupying a specific bed
   */
  async dischargeBed(bedId: string, dischargeSummary?: string): Promise<any> {
    return await apiClient.patch(`/wards/beds/${bedId}/discharge`, { dischargeSummary });
  },

  /**
   * Query inpatient admission history and active stays
   */
  async getAdmissions(query?: Record<string, any>): Promise<InpatientAdmission[]> {
    return await apiClient.get('/wards/admissions', { params: query });
  },

  /**
   * Retrieve inpatient stay details
   */
  async getAdmission(id: string): Promise<InpatientAdmission> {
    return await apiClient.get(`/wards/admissions/${id}`);
  },
};

export default wardService;
