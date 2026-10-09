import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import { laboratoryService } from '../../services/laboratoryService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Laboratory Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /laboratory/orders/:id/results - submits lab technician findings', async () => {
    const resultDto = { results: 'Hb: 12.5 g/dL (Normal)', status: 'Completed' as const };
    (apiClient.post as any).mockResolvedValue({ id: 'LAB-001', ...resultDto });

    const res = await laboratoryService.submitResults('LAB-001', resultDto as any);

    expect(apiClient.post).toHaveBeenCalledWith('/laboratory/orders/LAB-001/results', resultDto);
    expect(res.status).toBe('Completed');
  });
});
