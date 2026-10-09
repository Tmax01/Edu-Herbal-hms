import { useState, useEffect, useCallback } from 'react';
import billingService from '../services/billingService';
import { Invoice, CreateInvoiceDto, RecordPaymentDto, InvoiceStatus } from '../types/billing';
export function useBilling(branchId?: string, statusFilter?: InvoiceStatus | 'All') {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await billingService.getInvoices({
        branchId: branchId && branchId !== 'All' ? branchId : undefined,
        status: statusFilter && statusFilter !== 'All' ? statusFilter : undefined,
      });
      if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [branchId, statusFilter]);


  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const createInvoice = async (dto: CreateInvoiceDto, fallbackPatientName?: string, activeBranchName?: string) => {
    let created: Invoice | null = null;
    try {
      const res = await billingService.createInvoice(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend invoice creation failed, applying local state update:', err);
    }

    const totalAmt = dto.items.reduce((s, i) => s + (i.amount || 0), 0);
    const newInv: Invoice = created || {
      id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      patientId: dto.patientId || 'PAT-NEW',
      patientName: fallbackPatientName || dto.patientName || 'Patient',
      visitDate: new Date().toISOString().slice(0, 10),
      lineItems: dto.items,
      total: totalAmt,
      paid: 0,
      status: 'Unpaid',
      branch: (activeBranchName === 'All' ? 'Accra' : activeBranchName || 'Accra') as any,
    };

    setInvoices((prev) => [newInv, ...prev]);
    return newInv;
  };

  const recordPayment = async (dto: RecordPaymentDto) => {
    try {
      await billingService.recordPayment(dto);
    } catch (err: any) {
      console.warn('Backend payment record failed, applying local state update:', err);
    }

    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id === dto.invoiceId) {
          const newPaid = Math.min(i.paid + dto.amountPaid, i.total);
          const newStatus: InvoiceStatus = newPaid >= i.total ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
          return { ...i, paid: newPaid, status: newStatus, paymentMethod: dto.paymentMethod };
        }
        return i;
      })
    );
  };

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices,
    createInvoice,
    recordPayment,
  };
}

export default useBilling;
