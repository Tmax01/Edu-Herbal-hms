import { apiClient } from './apiClient';
import { DailyReport, CreateDailyReportDto, ReviewDailyReportDto } from '../types/communication';

export const dailyReportService = {
  /**
   * Submit facility daily departmental activity and clinical report
   */
  async createReport(dto: CreateDailyReportDto): Promise<DailyReport> {
    return await apiClient.post('/daily-reports', dto);
  },

  /**
   * Retrieve daily reports submitted by the logged-in staff member
   */
  async getMyReports(): Promise<DailyReport[]> {
    return await apiClient.get('/daily-reports/my');
  },

  /**
   * Review and sign off on a departmental daily report
   */
  async reviewReport(id: string, dto: ReviewDailyReportDto): Promise<DailyReport> {
    return await apiClient.patch(`/daily-reports/${id}/review`, dto);
  },

  /**
   * Query daily departmental operational reports
   */
  async getReports(params?: Record<string, any>): Promise<DailyReport[]> {
    return await apiClient.get('/daily-reports', { params });
  },
};

export default dailyReportService;
