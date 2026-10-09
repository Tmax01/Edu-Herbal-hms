import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLaboratory } from '../../hooks/useLaboratory';
import { useWards } from '../../hooks/useWards';
import { laboratoryService } from '../../services/laboratoryService';
import wardService from '../../services/wardService';

vi.mock('../../services/laboratoryService');
vi.mock('../../services/wardService');

describe('Integration Tests: Laboratory & Wards Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useLaboratory & useWards: manages lab results input and bed occupancy states', async () => {
    (laboratoryService.getOrders as any).mockResolvedValue([{ id: 'LAB-001', patientId: 'PAT-001', doctorName: 'Dr. Mensah', tests: ['Full Blood Count'], status: 'Pending', orderedDate: '2026-08-22', branch: 'Accra' }]);
    (wardService.getWards as any).mockResolvedValue([{ id: 'WARD-001', name: 'Ward A', branchId: 'Accra', beds: [{ id: 'BED-A01', bedNumber: 'A-01', status: 'Available' }] }]);

    const labHook = renderHook(() => useLaboratory('Accra'));
    const wardHook = renderHook(() => useWards('Accra'));

    await waitFor(() => {
      expect(labHook.result.current.loading).toBe(false);
      expect(wardHook.result.current.loading).toBe(false);
    });

    expect(labHook.result.current.orders[0].status).toBe('Pending');
    expect(wardHook.result.current.beds[0].status).toBe('Available');
  });
});
