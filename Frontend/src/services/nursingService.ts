import { apiClient } from './apiClient';
import { NursingNote, CreateNursingNoteDto, InpatientOverview } from '../types/nursing';

export const nursingService = {
  /**
   * Record inpatient shift charting, medication administration, or observation note
   */
  async createNote(data: CreateNursingNoteDto): Promise<NursingNote> {
    return await apiClient.post('/nursing/notes', data);
  },

  /**
   * Query inpatient nursing notes and vitals timeline
   */
  async getNotes(params?: { branchId?: string; bedId?: string; patientId?: string; limit?: number }): Promise<NursingNote[]> {
    const query: Record<string, any> = {};
    if (params?.branchId && params.branchId !== 'All') query.branchId = params.branchId;
    if (params?.bedId) query.bedId = params.bedId;
    if (params?.patientId) query.patientId = params.patientId;
    if (params?.limit) query.limit = params.limit;
    return await apiClient.get('/nursing/notes', { params: query });
  },

  /**
   * Retrieve currently admitted inpatients across ward beds
   */
  async getInpatients(branchId?: string): Promise<InpatientOverview[]> {
    const params: Record<string, any> = {};
    if (branchId && branchId !== 'All') params.branchId = branchId;
    return await apiClient.get('/nursing/inpatients', { params });
  },

  /**
   * Retrieve historical nursing notes and shift chartings for a specific patient
   */
  async getNotesByPatient(patientId: string, limit = 20): Promise<NursingNote[]> {
    return await apiClient.get(`/nursing/patient/${patientId}`, { params: { limit } });
  },
};

export default nursingService;
