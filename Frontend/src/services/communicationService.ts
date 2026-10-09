import { apiClient } from './apiClient';
import { Announcement, CreateAnnouncementDto } from '../types/communication';

export const communicationService = {
  /**
   * Post an internal bulletin announcement
   */
  async createAnnouncement(dto: CreateAnnouncementDto): Promise<Announcement> {
    return await apiClient.post('/communication/announcements', dto);
  },

  /**
   * Retrieve active bulletin announcements tailored for authenticated user
   */
  async getAnnouncements(branchId?: string): Promise<Announcement[]> {
    const params: Record<string, any> = {};
    if (branchId && branchId !== 'All') params.branchId = branchId;
    return await apiClient.get('/communication/announcements', { params });
  },
};

export default communicationService;
