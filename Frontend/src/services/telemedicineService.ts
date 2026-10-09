import { apiClient } from './apiClient';
import { TelemedicineSession, CreateTelemedicineSessionDto, CompleteTelemedicineSessionDto, QueryTelemedicineDto, TelemedicineStatus, } from '../types/telemedicine';

export const telemedicineService = {
  /**
   * Retrieve telemedicine consultation sessions with stats, tabs, and filters
   */
  async getSessions(query?: QueryTelemedicineDto): Promise<TelemedicineSession[]> {
    return await apiClient.get('/telemedicine/sessions', { params: query });
  },

  /**
   * Retrieve details for a single telemedicine consultation session
   */
  async getSession(id: string): Promise<TelemedicineSession> {
    return await apiClient.get(`/telemedicine/sessions/${id}`);
  },

  /**
   * Schedule a new telemedicine consultation session
   */
  async createSession(dto: CreateTelemedicineSessionDto): Promise<TelemedicineSession> {
    return await apiClient.post('/telemedicine/sessions', dto);
  },

  /**
   * Start a telemedicine session call
   */
  async startSession(id: string): Promise<TelemedicineSession> {
    return await apiClient.post(`/telemedicine/sessions/${id}/start`);
  },

  /**
   * Complete session and save consultation notes from the virtual call room
   */
  async completeSession(id: string, dto: CompleteTelemedicineSessionDto): Promise<TelemedicineSession> {
    return await apiClient.post(`/telemedicine/sessions/${id}/complete`, dto);
  },

  /**
   * Update session status (e.g. No-show, Cancelled)
   */
  async updateStatus(id: string, status: TelemedicineStatus): Promise<TelemedicineSession> {
    return await apiClient.patch(`/telemedicine/sessions/${id}/status`, { status });
  },
};

export default telemedicineService;
