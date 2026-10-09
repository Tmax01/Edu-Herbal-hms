import { apiClient } from './apiClient';
import { QueryReportsDto } from '../types/reports';

export const reportsService = {
  getReport: async (query: QueryReportsDto): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (query.reportType) {
        params.append('reportType', query.reportType);
      } else if (query.type) {
        params.append('type', query.type);
      }
      if (query.startDate) {
        params.append('startDate', query.startDate);
      }
      if (query.endDate) {
        params.append('endDate', query.endDate);
      }
      if (query.branch && query.branch !== 'All') {
        params.append('branch', query.branch);
      }

      const res = await apiClient.get<any>(`/reports?${params.toString()}`);
      return (res as any)?.data || res || null;
    } catch (err) {
      console.warn('reportsService.getReport failed:', err);
      return null;
    }
  },

  exportPdf: async (query: QueryReportsDto): Promise<{ exportId?: string; metadata?: any; data?: any; downloadUrl?: string } | null> => {
    try {
      const params = new URLSearchParams();
      if (query.reportType) {
        params.append('reportType', query.reportType);
      } else if (query.type) {
        params.append('type', query.type);
      }
      if (query.startDate) {
        params.append('startDate', query.startDate);
      }
      if (query.endDate) {
        params.append('endDate', query.endDate);
      }
      if (query.branch && query.branch !== 'All') {
        params.append('branch', query.branch);
      }

      const res = await apiClient.get<any>(`/reports/export-pdf?${params.toString()}`);
      return (res as any)?.data || res || null;
    } catch (err) {
      console.warn('reportsService.exportPdf failed:', err);
      return null;
    }
  },
};
