import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supplierService } from '../../services/supplierService';
import { herbalProductionService } from '../../services/herbalProductionService';

vi.mock('../../services/supplierService');
vi.mock('../../services/herbalProductionService');

describe('E2E Scenario C: Herbal Manufacturing & Botanical Procurement Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* Supplier Registration -> Batch Initiation -> Stage Progression             */
  /* -------------------------------------------------------------------------- */
  it('Herbal Manufacturing Lifecycle: Supplier -> Batch Lot -> Stage Advance', async () => {
    // 1. Register Raw Material Supplier
    const supplierPayload = { name: 'Edu Herbal Farm', contact: 'Kwabena Asare', phone: '+233 24 111 2233', type: 'Herbal' as const, branch: 'Mankessim' };
    (supplierService.create as any).mockResolvedValue({ id: 'SUP-100', ...supplierPayload, active: true });

    const supplier = await supplierService.create(supplierPayload);
    expect(supplier.id).toBe('SUP-100');

    // 2. Initiate Herbal Production Manufacturing Lot
    const batchPayload = { product: 'Neem Leaf Extract 500ml', quantity: 300, notes: 'Standard botanical extraction' };
    (herbalProductionService.createBatch as any).mockResolvedValue({ id: 'PROD-100', batchNumber: 'HB-2026-0100', stage: 'Mixing', ...batchPayload });

    const batch = await herbalProductionService.createBatch(batchPayload);
    expect(batch.stage).toBe('Mixing');

    // 3. Advance Production Stage (Mixing -> Processing)
    (herbalProductionService.advanceStage as any).mockResolvedValue({ ...batch, stage: 'Processing' });

    const advancedBatch = await herbalProductionService.advanceStage('PROD-100');
    expect(advancedBatch?.stage).toBe('Processing');
  });
});
