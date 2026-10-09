import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import hrService from '../../services/hrService';
import userService from '../../services/userService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('HR & User Management Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /hr/leave-requests - submits staff annual leave application', async () => {
    const leaveDto = { staffId: 'USR-003', staffName: 'Dr. Mensah', type: 'Annual' as const, from: '2026-09-01', to: '2026-09-07', days: 7, reason: 'Vacation' };
    (apiClient.post as any).mockResolvedValue({ id: 'LV-001', ...leaveDto, status: 'Pending' });

    const res = await hrService.createLeaveRequest(leaveDto as any);

    expect(apiClient.post).toHaveBeenCalledWith('/hr/leave-requests', leaveDto);
    expect(res.status).toBe('Pending');
  });

  it('GET /users - fetches staff roster with role filter', async () => {
    (apiClient.get as any).mockResolvedValue([{ id: 'USR-003', fullName: 'Dr. Mensah', role: 'doctor' }]);

    const users = await userService.getUsers({ role: 'doctor' });

    expect(apiClient.get).toHaveBeenCalledWith('/users', { params: { role: 'doctor' } });
    expect(users[0].role).toBe('doctor');
  });
});
