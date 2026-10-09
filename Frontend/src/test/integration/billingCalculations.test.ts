import { describe, it, expect } from 'vitest';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function computeInvoiceTotals(lineItems: LineItem[], discountPercent: number = 0, taxPercent: number = 0) {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }
  if (taxPercent < 0) {
    throw new Error('Tax percentage cannot be negative');
  }

  const subtotal = lineItems.reduce((sum, item) => {
    if (item.quantity < 0 || item.unitPrice < 0) {
      throw new Error('Line item quantities and unit prices cannot be negative');
    }
    return sum + item.quantity * item.unitPrice;
  }, 0);

  const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round(((taxableAmount * taxPercent) / 100) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxAmount,
    totalAmount,
  };
}

export function computeSettlementProgress(totalAmount: number, paidAmount: number) {
  if (totalAmount < 0 || paidAmount < 0) {
    throw new Error('Amounts cannot be negative');
  }
  if (paidAmount > totalAmount) {
    throw new Error('Paid amount cannot exceed total amount');
  }
  const remainingBalance = Math.round((totalAmount - paidAmount) * 100) / 100;
  const percentagePaid = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 1000) / 10 : 100;
  const status = remainingBalance === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';

  return { remainingBalance, percentagePaid, status };
}

describe('Billing Calculations & Financial Invariants', () => {
  describe('Invoice Itemization & Tax / Discount Math', () => {
    it('accurately computes subtotal from multiple items', () => {
      const items: LineItem[] = [
        { description: 'OPD Consultation Fee', quantity: 1, unitPrice: 120.0 },
        { description: 'Malaria RDT Lab Test', quantity: 1, unitPrice: 45.5 },
        { description: 'Coartem 20/120 Dispensing', quantity: 2, unitPrice: 35.0 },
      ];

      const res = computeInvoiceTotals(items, 0, 0);
      // 120 + 45.5 + 70 = 235.5
      expect(res.subtotal).toBe(235.5);
      expect(res.totalAmount).toBe(235.5);
      expect(res.discountAmount).toBe(0);
    });

    it('correctly applies percentage discount and VAT tax', () => {
      const items: LineItem[] = [
        { description: 'Private Ward (2 nights)', quantity: 2, unitPrice: 200.0 },
      ];
      // Subtotal = 400. 10% discount = 40. Taxable = 360. 5% tax = 18. Total = 378.
      const res = computeInvoiceTotals(items, 10, 5);
      expect(res.subtotal).toBe(400);
      expect(res.discountAmount).toBe(40);
      expect(res.taxAmount).toBe(18);
      expect(res.totalAmount).toBe(378);
    });

    it('ADVERSARIAL: Rejects negative quantity or unit price', () => {
      const badItems: LineItem[] = [
        { description: 'Fraudulent Refund', quantity: -1, unitPrice: 50.0 },
      ];
      expect(() => computeInvoiceTotals(badItems)).toThrow('Line item quantities and unit prices cannot be negative');
    });

    it('ADVERSARIAL: Rejects invalid discount percentage (> 100 or < 0)', () => {
      const items: LineItem[] = [{ description: 'Test', quantity: 1, unitPrice: 100 }];
      expect(() => computeInvoiceTotals(items, 120)).toThrow('Discount percentage must be between 0 and 100');
      expect(() => computeInvoiceTotals(items, -10)).toThrow('Discount percentage must be between 0 and 100');
    });
  });

  describe('Settlement Progress Invariants', () => {
    it('identifies Unpaid invoice with 0 paid', () => {
      const res = computeSettlementProgress(500, 0);
      expect(res.remainingBalance).toBe(500);
      expect(res.percentagePaid).toBe(0);
      expect(res.status).toBe('Unpaid');
    });

    it('identifies Partial invoice with intermediate payment', () => {
      const res = computeSettlementProgress(500, 250);
      expect(res.remainingBalance).toBe(250);
      expect(res.percentagePaid).toBe(50);
      expect(res.status).toBe('Partial');
    });

    it('identifies Paid invoice with exact total paid', () => {
      const res = computeSettlementProgress(500, 500);
      expect(res.remainingBalance).toBe(0);
      expect(res.percentagePaid).toBe(100);
      expect(res.status).toBe('Paid');
    });

    it('ADVERSARIAL: Rejects overpayment exceeding total amount', () => {
      expect(() => computeSettlementProgress(500, 550)).toThrow('Paid amount cannot exceed total amount');
    });
  });
});
