export type InvoiceStatus = 'Unpaid' | 'Partial' | 'Paid' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'POS / Card' | 'NHIS' | 'Insurance';

export interface InvoiceLineItem {
  id?: string;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  prescriptionItemId?: string;
  labOrderId?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  visitDate: string;
  lineItems: InvoiceLineItem[];
  total: number;
  paid: number;
  status: InvoiceStatus;
  branch?: string;
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  createdAt?: string;
}


export interface CreateInvoiceDto {
  patientId: string;
  patientName?: string;
  branchId?: string;
  items: Array<{
    description: string;
    amount: number;
    quantity?: number;
    prescriptionItemId?: string;
    labOrderId?: string;
  }>;
  notes?: string;
}

export interface RecordPaymentDto {
  invoiceId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
}

export interface QueryInvoicesDto {
  status?: InvoiceStatus;
  branchId?: string;
  patientId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}
