import { apiClient } from './apiClient';
import { CallLog, PatientFollowUp, CreateCallLogDto, CreatePatientFollowUpDto } from '../types/callcentre';

export const callcentreService = {
  /**
   * Log an inbound or outbound patient call interaction
   */
  async createCallLog(dto: CreateCallLogDto): Promise<CallLog> {
    return await apiClient.post('/call-centre/logs', dto);
  },

  /**
   * Query patient interaction call logs
   */
  async getCallLogs(branchId?: string, search?: string): Promise<CallLog[]> {
    const params: Record<string, any> = {};
    if (branchId && branchId !== 'All') params.branchId = branchId;
    if (search) params.search = search;
    return await apiClient.get('/call-centre/logs', { params });
  },

  /**
   * Schedule a clinical or medication follow-up tracker for a patient
   */
  async createFollowUp(dto: CreatePatientFollowUpDto): Promise<PatientFollowUp> {
    return await apiClient.post('/call-centre/follow-ups', dto);
  },

  /**
   * Record clinical follow-up review assessment and effectiveness
   */
  async recordReview(id: string, dto: { notes: string; effectiveness?: string; nextDate?: string }): Promise<PatientFollowUp> {
    return await apiClient.post(`/call-centre/follow-ups/${id}/review`, dto);
  },

  /**
   * Update clinical follow-up status (Due, Completed, Overdue)
   */
  async updateFollowUpStatus(id: string, status: string, notes?: string): Promise<PatientFollowUp> {
    return await apiClient.patch(`/call-centre/follow-ups/${id}/status`, { status, notes });
  },

  /**
   * Retrieve scheduled patient follow-up lists
   */
  async getFollowUps(status?: string, branchId?: string): Promise<PatientFollowUp[]> {
    const params: Record<string, any> = {};
    if (status && status !== 'All') params.status = status;
    if (branchId && branchId !== 'All') params.branchId = branchId;
    return await apiClient.get('/call-centre/follow-ups', { params });
  },
};

export default callcentreService;
