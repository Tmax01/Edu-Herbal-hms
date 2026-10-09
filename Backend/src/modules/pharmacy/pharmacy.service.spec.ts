import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../stock/stock.service';

describe('PharmacyService Adversarial & FEFO Dispensing Tests', () => {
  let service: PharmacyService;
  let prisma: any;
  let stockService: any;

  beforeEach(async () => {
    prisma = {
      prescription: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      prescriptionItem: {
        update: jest.fn(),
      },
      patient: {
        findFirst: jest.fn(),
      },
      branch: {
        findFirst: jest.fn(),
      },
      drugInteractionsCatalog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    stockService = {
      deductStockFEFO: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PharmacyService,
        { provide: PrismaService, useValue: prisma },
        { provide: StockService, useValue: stockService },
      ],
    }).compile();

    service = module.get<PharmacyService>(PharmacyService);
  });

  describe('Adversarial Dispensing Invariants', () => {
    it('ADVERSARIAL: Rejects dispensing when prescription is not found', async () => {
      prisma.prescription.findFirst.mockResolvedValue(null);
      await expect(
        service.dispense('RX-NONEXISTENT', {} as any, 'staff-pharmacist'),
      ).rejects.toThrow(NotFoundException);
    });

    it('ADVERSARIAL: Rejects duplicate dispensing of an already dispensed prescription', async () => {
      prisma.prescription.findFirst.mockResolvedValue({
        id: 'RX-101',
        status: 'Dispensed', // already dispensed
        items: [],
      });

      await expect(
        service.dispense('RX-101', {} as any, 'staff-pharmacist'),
      ).rejects.toThrow(BadRequestException);
    });

    it('REGRESSION FINDING-02: MUST propagate stock deduction failure rather than swallowing it', async () => {
      prisma.prescription.findFirst.mockResolvedValue({
        id: 'RX-202',
        branchId: 'branch-accra',
        status: 'Pending',
        items: [
          {
            id: 'item-1',
            drugName: 'Artemether-Lumefantrine 20/120',
            quantityPrescribed: 24,
            quantityDispensed: 0,
            stockItemId: 'STK-MALARIA-01',
          },
        ],
      });

      // StockService throws Insufficient Inventory
      stockService.deductStockFEFO.mockRejectedValue(
        new BadRequestException('Insufficient inventory for Artemether-Lumefantrine. Available: 5, Requested: 24'),
      );

      // Must NOT swallow exception! Must reject with BadRequestException
      await expect(
        service.dispense('RX-202', {} as any, 'staff-pharmacist'),
      ).rejects.toThrow(BadRequestException);

      // Invariant: Prescription overall status must NOT have been marked 'Dispensed'
      expect(prisma.prescription.update).not.toHaveBeenCalled();
    });

    it('SUCCESS: Deducts stock and marks prescription as Dispensed when stock is sufficient', async () => {
      prisma.prescription.findFirst.mockResolvedValue({
        id: 'RX-303',
        branchId: 'branch-accra',
        status: 'Pending',
        items: [
          {
            id: 'item-1',
            drugName: 'Paracetamol 500mg',
            quantityPrescribed: 10,
            quantityDispensed: 0,
            stockItemId: 'STK-PCM-01',
          },
        ],
      });

      stockService.deductStockFEFO.mockResolvedValue({});
      prisma.prescription.findUnique.mockResolvedValue({
        id: 'RX-303',
        status: 'Dispensed',
      });

      const res = await service.dispense('RX-303', {} as any, 'staff-pharmacist');

      expect(stockService.deductStockFEFO).toHaveBeenCalledWith(
        'STK-PCM-01',
        10,
        'branch-accra',
        'staff-pharmacist',
        'RX-303',
      );
      expect(prisma.prescription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Dispensed',
            dispensedBy: 'staff-pharmacist',
          }),
        }),
      );
    });
  });

  describe('CDSS Drug Interactions Check', () => {
    it('returns empty array when drug list is empty', async () => {
      const alerts = await service.checkInteractions([]);
      expect(alerts).toEqual([]);
    });

    it('queries interaction catalog when multiple drugs are prescribed', async () => {
      prisma.drugInteractionsCatalog.findMany.mockResolvedValue([
        {
          drugA: 'Warfarin',
          drugB: 'Aspirin',
          severity: 'Severe',
          description: 'Increased bleeding risk',
        },
      ]);

      const alerts = await service.checkInteractions(['Warfarin', 'Aspirin']);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('Severe');
    });
  });
});
