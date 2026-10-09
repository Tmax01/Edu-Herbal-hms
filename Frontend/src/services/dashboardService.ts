import { apiClient } from './apiClient';
import { DashboardOverview, AnalyticsOverview } from '../types/dashboard';

export const dashboardService = {
  getOverview: async (branch?: string): Promise<DashboardOverview | null> => {
    try {
      const query = branch && branch !== 'All' ? `?branch=${encodeURIComponent(branch)}` : '';
      const res = await apiClient.get<DashboardOverview>(`/dashboard/overview${query}`);
      return (res as any)?.data || res || null;
    } catch (err) {
      console.warn('dashboardService.getOverview failed:', err);
      return null;
    }
  },

  getAnalytics: async (branch?: string, period: 'today' | 'week' | 'month' = 'month'): Promise<AnalyticsOverview | null> => {
    try {
      const query = new URLSearchParams();
      if (branch && branch !== 'All') query.append('branch', branch);
      query.append('period', period);
      const res = await apiClient.get<AnalyticsOverview>(`/dashboard/analytics?${query.toString()}`);
      return (res as any)?.data || res || null;
    } catch (err) {
      console.warn('dashboardService.getAnalytics failed:', err);
      return null;
    }
  },
};
