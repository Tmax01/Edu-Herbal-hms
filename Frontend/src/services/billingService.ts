import { apiClient } from './apiClient';
import { Invoice, CreateInvoiceDto, RecordPaymentDto, QueryInvoicesDto } from '../types/billing';

export const billingService = {
  /**
   * Generate an itemized invoice for clinical/pharmacy/laboratory charges
   */
  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    return await apiClient.post('/billing/invoices', dto);
  },

  /**
   * Record a cash, mobile money, POS, or bank payment and generate receipt
   */
  async recordPayment(dto: RecordPaymentDto): Promise<Invoice> {
    return await apiClient.post('/billing/payments', dto);
  },

  /**
   * Query patient invoices with payment status, branch, and date filters
   */
  async getInvoices(query?: QueryInvoicesDto): Promise<Invoice[]> {
    return await apiClient.get('/billing/invoices', { params: query });
  },

  /**
   * Retrieve full itemized invoice details and payment transaction history
   */
  async getInvoice(id: string): Promise<Invoice> {
    return await apiClient.get(`/billing/invoices/${id}`);
  },
};

export default billingService;
