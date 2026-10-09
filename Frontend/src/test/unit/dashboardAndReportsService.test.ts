import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import { dashboardService } from '../../services/dashboardService';
import { reportsService } from '../../services/reportsService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Dashboard & Consolidated Reports Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /dashboard/overview - fetches live clinical and bed occupancy metrics', async () => {
    const mockOverview = { totalPatients: 150, todayAppointments: 12, occupiedBeds: 5, totalBeds: 20 };
    (apiClient.get as any).mockResolvedValue({ data: mockOverview });

    const res = await dashboardService.getOverview('Accra');

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/overview?branch=Accra');
    expect(res?.totalPatients).toBe(150);
  });

  it('GET /reports - fetches dynamic consolidated hospital metrics', async () => {
    const mockReport = { totalBilled: 5000, totalCollected: 4200, totalPatients: 85 };
    (apiClient.get as any).mockResolvedValue({ data: mockReport });

    const res = await reportsService.getReport({ reportType: 'revenue', branch: 'Accra' });

    expect(apiClient.get).toHaveBeenCalledWith('/reports?reportType=revenue&branch=Accra');
    expect(res?.totalBilled).toBe(5000);
  });
});
