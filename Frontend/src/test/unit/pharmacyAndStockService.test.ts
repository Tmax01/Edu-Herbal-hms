import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import { pharmacyService } from '../../services/pharmacyService';
import { stockService } from '../../services/stockService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Pharmacy & Stock Inventory Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /pharmacy/prescriptions/:id/dispense - triggers FEFO stock deduction and dispenses prescription', async () => {
    const dispenseDto = { items: [{ drugName: 'Amoxicillin 500mg', dispensedQuantity: 20, batchNumber: 'BT-001' }] };
    (apiClient.post as any).mockResolvedValue({ id: 'RX-001', status: 'Dispensed' });

    const res = await pharmacyService.dispensePrescription('RX-001', dispenseDto);

    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/prescriptions/RX-001/dispense', dispenseDto);
    expect(res.status).toBe('Dispensed');
  });

  it('GET /stock - retrieves current drug and raw botanical stock levels', async () => {
    (apiClient.get as any).mockResolvedValue([{ id: 'STK-001', name: 'Paracetamol', totalQuantity: 500, category: 'Analgesic', unitOfMeasure: 'Tablets', reorderLevel: 50 }]);

    const items = await stockService.getStock({ branch: 'Accra' });

    expect(apiClient.get).toHaveBeenCalledWith('/stock', { params: { branch: 'Accra' } });
    expect(items[0].totalQuantity).toBe(500);
  });
});
