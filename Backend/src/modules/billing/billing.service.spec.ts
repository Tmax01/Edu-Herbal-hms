import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BillingService Financial Invariant & Adversarial Tests', () => {
  let service: BillingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      patient: {
        findFirst: jest.fn(),
      },
      branch: {
        findFirst: jest.fn(),
      },
      invoice: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('Invoice Generation & Mathematical Accuracy', () => {
    it('ADVERSARIAL: Rejects invoice generation when patient identifier is missing or whitespace', async () => {
      await expect(
        service.createInvoice({ patientId: '   ' } as any, 'usr-staff'),
      ).rejects.toThrow(BadRequestException);
    });

    it('ADVERSARIAL: Throws NotFoundException if patient does not exist in registry', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);
      await expect(
        service.createInvoice({ patientId: 'NONEXISTENT-PAT' } as any, 'usr-staff'),
      ).rejects.toThrow(NotFoundException);
    });

    it('INVARIANT: Mathematically sums all line items correctly (sum of unitPrice * quantity)', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'pat-101', registrationBranchId: 'branch-accra' });
      prisma.invoice.create.mockImplementation(({ data }) => Promise.resolve(data));

      const lineItems = [
        { itemType: 'Consultation', description: 'General Practice', quantity: 1, unitPrice: 150.0 },
        { itemType: 'Pharmacy', description: 'Amoxicillin 500mg', quantity: 3, unitPrice: 25.5 },
        { itemType: 'Laboratory', description: 'Full Blood Count (FBC)', quantity: 2, unitPrice: 80.0 },
      ];
      // Expected: 150*1 + 25.5*3 + 80*2 = 150 + 76.5 + 160 = 386.5
      const expectedTotal = 150 * 1 + 25.5 * 3 + 80 * 2;

      const created = await service.createInvoice(
        {
          patientId: 'pat-101',
          lineItems,
        } as any,
        'usr-accountant',
      );

      expect(created.totalAmount).toBe(expectedTotal);
      expect(created.paidAmount).toBe(0.0);
      expect(created.status).toBe('Unpaid');
      expect((created.lineItems as any).create).toHaveLength(3);
    });
  });

  describe('Payment Settlement & Financial Invariants', () => {
    it('ADVERSARIAL: Rejects recording payment on an already fully paid invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'INV-2026-001',
        totalAmount: 200,
        paidAmount: 200,
        status: 'Paid',
      });

      await expect(
        service.recordPayment({ invoiceId: 'INV-2026-001', amountPaid: 50 } as any, 'staff-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('ADVERSARIAL: Rejects negative or zero payment amounts', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'INV-2026-001',
        totalAmount: 200,
        paidAmount: 0,
        status: 'Unpaid',
      });

      await expect(
        service.recordPayment({ invoiceId: 'INV-2026-001', amountPaid: 0 } as any, 'staff-1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.recordPayment({ invoiceId: 'INV-2026-001', amountPaid: -50 } as any, 'staff-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('ADVERSARIAL: Rejects payment that exceeds the remaining balance', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'INV-2026-001',
        totalAmount: 200,
        paidAmount: 150, // remaining is 50
        status: 'Partial',
      });

      await expect(
        service.recordPayment({ invoiceId: 'INV-2026-001', amountPaid: 75 } as any, 'staff-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('INVARIANT: Partial payment correctly transitions invoice status to "Partial"', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'INV-2026-001',
        patientId: 'pat-1',
        branchId: 'branch-1',
        totalAmount: 300,
        paidAmount: 0,
        status: 'Unpaid',
      });

      prisma.invoice.update.mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'INV-2026-001' }));
      prisma.payment.create.mockResolvedValue({ id: 'PAY-1', amountPaid: 100 });

      const res = await service.recordPayment(
        { invoiceId: 'INV-2026-001', amountPaid: 100, paymentMethod: 'Cash' } as any,
        'staff-cashier',
      );

      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAmount: 100,
            status: 'Partial',
          }),
        }),
      );
    });

    it('INVARIANT: Full balance payment transitions invoice status to "Paid"', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'INV-2026-001',
        patientId: 'pat-1',
        branchId: 'branch-1',
        totalAmount: 300,
        paidAmount: 100,
        status: 'Partial',
      });

      prisma.invoice.update.mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'INV-2026-001' }));
      prisma.payment.create.mockResolvedValue({ id: 'PAY-2', amountPaid: 200 });

      const res = await service.recordPayment(
        { invoiceId: 'INV-2026-001', amountPaid: 200, paymentMethod: 'Mobile Money' } as any,
        'staff-cashier',
      );

      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAmount: 300,
            status: 'Paid',
          }),
        }),
      );
    });
  });
});
