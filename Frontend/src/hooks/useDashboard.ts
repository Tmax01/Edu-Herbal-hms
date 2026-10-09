import { useState, useEffect, useCallback } from 'react';
import { DashboardOverview } from '../types/dashboard';
import { dashboardService } from '../services/dashboardService';

export function useDashboard(branchFilter?: string) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    const data = await dashboardService.getOverview(branchFilter);
    setOverview(data);
    setLoading(false);
  }, [branchFilter]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { overview, loading, refresh: fetchOverview };
}
