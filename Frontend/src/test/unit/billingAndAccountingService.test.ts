import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import billingService from '../../services/billingService';
import accountingService from '../../services/accountingService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Billing & Accounting Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /billing/payments - processes invoice payment settlement', async () => {
    const paymentDto = { invoiceId: 'INV-001', amountPaid: 250, paymentMethod: 'Cash' as const };
    (apiClient.post as any).mockResolvedValue({ id: 'INV-001', paid: 250, status: 'Paid' });

    const res = await billingService.recordPayment(paymentDto);

    expect(apiClient.post).toHaveBeenCalledWith('/billing/payments', paymentDto);
    expect(res.status).toBe('Paid');
  });

  it('GET /accounting/overview - fetches expense and payroll financial entries', async () => {
    (apiClient.get as any).mockResolvedValue({ totalRevenue: 15000, totalExpenses: 4500, netProfit: 10500, totalSalaryExpenses: 3000, collectionRate: 95, totalBilled: 15000, totalOutstanding: 0 });

    const res = await accountingService.getOverview('Accra');

    expect(apiClient.get).toHaveBeenCalledWith('/accounting/overview', { params: { branch: 'Accra' } });
    expect(res.netProfit).toBe(10500);
  });
});
