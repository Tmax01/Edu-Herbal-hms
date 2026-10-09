import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useHerbalProduction } from '../../hooks/useHerbalProduction';
import { supplierService } from '../../services/supplierService';
import { herbalProductionService } from '../../services/herbalProductionService';

vi.mock('../../services/supplierService');
vi.mock('../../services/herbalProductionService');

describe('Integration Tests: Supplier Directory & Herbal Production Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useSuppliers: fetches suppliers and prepends newly registered vendor to state', async () => {
    const mockList = [
      { id: 'SUP-001', name: 'PharmaChem Ghana', contact: 'Kojo Acheampong', phone: '+233 30 277 8800', type: 'Drug', items: ['Amlodipine'], paymentTerms: 'Net 30', rating: 4.5, branch: 'Accra', active: true },
    ];
    (supplierService.getAll as any).mockResolvedValue(mockList);

    const { result } = renderHook(() => useSuppliers('Accra'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.suppliers).toHaveLength(1);

    const newSupplier = { id: 'SUP-002', name: 'HealthMeds Ltd', contact: 'Yaa Mensah', phone: '+233 24 555 6677', type: 'Consumable' as const, items: ['Syringes'], paymentTerms: 'Net 15', rating: 4.0, branch: 'Accra', active: true };
    (supplierService.create as any).mockResolvedValue(newSupplier);

    await act(async () => {
      await result.current.addSupplier({ name: 'HealthMeds Ltd', contact: 'Yaa Mensah', phone: '+233 24 555 6677', type: 'Consumable', branch: 'Accra' });
    });

    expect(result.current.suppliers).toHaveLength(2);
    expect(result.current.suppliers[0].name).toBe('HealthMeds Ltd');
  });

  it('useHerbalProduction: tracks manufacturing lot creation & sequential stage progression', async () => {
    const mockBatches = [
      { id: 'PROD-001', product: 'Neem Leaf Extract 500ml', batchNumber: 'HB-2026-0001', stage: 'Mixing' as const, startDate: '2026-08-22', quantity: 200, branch: 'Mankessim' },
    ];
    (herbalProductionService.getAll as any).mockResolvedValue(mockBatches);

    const { result } = renderHook(() => useHerbalProduction('Mankessim'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.batches[0].stage).toBe('Mixing');

    (herbalProductionService.advanceStage as any).mockResolvedValue({ ...mockBatches[0], stage: 'Processing' });

    await act(async () => {
      await result.current.advanceStage('PROD-001');
    });

    expect(result.current.batches[0].stage).toBe('Processing');
  });
});
