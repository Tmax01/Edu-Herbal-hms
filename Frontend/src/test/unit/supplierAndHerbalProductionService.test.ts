import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import { supplierService } from '../../services/supplierService';
import { herbalProductionService } from '../../services/herbalProductionService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Supplier & Herbal Production Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /suppliers - registers a new raw material or drug supplier', async () => {
    const supplierPayload = { name: 'Edu Herbal Farm', contact: 'Kwabena Asare', phone: '+233 24 111 2233', type: 'Herbal' as const };
    (apiClient.post as any).mockResolvedValue({ data: { id: 'SUP-001', ...supplierPayload } });

    const created = await supplierService.create(supplierPayload);

    expect(apiClient.post).toHaveBeenCalledWith('/suppliers', supplierPayload);
    expect(created.id).toBe('SUP-001');
  });

  it('PATCH /herbal-production/batches/:id/advance - advances manufacturing batch stage', async () => {
    (apiClient.patch as any).mockResolvedValue({ data: { id: 'PROD-001', stage: 'Processing' } });

    const updated = await herbalProductionService.advanceStage('PROD-001');

    expect(apiClient.patch).toHaveBeenCalledWith('/herbal-production/batches/PROD-001/advance', {});
    expect(updated?.stage).toBe('Processing');
  });
});
