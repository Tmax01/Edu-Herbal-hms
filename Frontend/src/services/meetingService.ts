import { apiClient } from './apiClient';
import { Meeting, CreateMeetingDto } from '../types/communication';

export const meetingService = {
  /**
   * Schedule an individual, branch, or hospital-wide staff meeting
   */
  async createMeeting(dto: CreateMeetingDto): Promise<Meeting> {
    return await apiClient.post('/meetings', dto);
  },

  /**
   * Retrieve scheduled hospital meetings
   */
  async getMeetings(branchId?: string, tab = 'upcoming'): Promise<Meeting[]> {
    const params: Record<string, any> = { tab };
    if (branchId && branchId !== 'All') params.branch = branchId;
    return await apiClient.get('/meetings', { params });
  },

  /**
   * Update meeting status and record minutes
   */
  async updateMeetingStatus(id: string, status: string, minutes?: string): Promise<Meeting> {
    return await apiClient.patch(`/meetings/${id}/status`, { status, minutes });
  },
};

export default meetingService;
