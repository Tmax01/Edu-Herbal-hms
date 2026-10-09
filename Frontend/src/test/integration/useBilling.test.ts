import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBilling } from '../../hooks/useBilling';
import billingService from '../../services/billingService';

vi.mock('../../services/billingService');

describe('Integration Tests: Billing & Invoicing Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useBilling: manages patient invoice fetching and optimistic payment settlement', async () => {
    const mockInvoices = [{ id: 'INV-001', patientId: 'PAT-001', patientName: 'Adjoa Mensah', visitDate: '2026-08-22', lineItems: [{ description: 'Consultation', amount: 80 }], total: 80, paid: 0, status: 'Unpaid' as const, branch: 'Accra' }];
    (billingService.getInvoices as any).mockResolvedValue(mockInvoices);

    const { result } = renderHook(() => useBilling('Accra'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.invoices[0].status).toBe('Unpaid');

    (billingService.recordPayment as any).mockResolvedValue({ ...mockInvoices[0], paid: 80, status: 'Paid' });

    await act(async () => {
      await result.current.recordPayment({ invoiceId: 'INV-001', amountPaid: 80, paymentMethod: 'Cash' });
    });

    expect(result.current.invoices[0].status).toBe('Paid');
  });
});
