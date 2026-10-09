import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { HerbalProductionService } from './herbal-production.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('HerbalProductionService State Machine & Adversarial Tests', () => {
  let service: HerbalProductionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      productionBatch: {
        count: jest.fn().mockResolvedValue(10),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HerbalProductionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<HerbalProductionService>(HerbalProductionService);
  });

  describe('Batch Creation & Validation', () => {
    it('ADVERSARIAL: Rejects batch creation without a product name', async () => {
      await expect(
        service.create({ product: '' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('ADVERSARIAL: Rejects duplicate batch numbers with ConflictException', async () => {
      prisma.productionBatch.findFirst.mockResolvedValue({
        id: 'PROD-001',
        batchNumber: 'HB-2026-0001',
      });

      await expect(
        service.create({ product: 'Herbal Cough Syrup', batchNumber: 'HB-2026-0001' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('SUCCESS: Generates formatted batch upon valid creation', async () => {
      prisma.productionBatch.findFirst.mockResolvedValue(null);
      prisma.productionBatch.create.mockResolvedValue({
        id: 'PROD-999',
        productName: 'Moringa Immunity Booster',
        batchNumber: 'HB-2026-0011',
        stage: 'Mixing',
        startDate: new Date('2026-10-01'),
        plannedQuantity: 500,
      });

      const res = await service.create({
        product: 'Moringa Immunity Booster',
        plannedQuantity: 500,
      } as any);

      expect(res?.product).toBe('Moringa Immunity Booster');
      expect(res?.stage).toBe('Mixing');
      expect(res?.quantity).toBe(500);
    });
  });

  describe('Stage Transitions & State Machine Invariants', () => {
    it('INVARIANT: Sequentially advances batch from Mixing to Processing', async () => {
      prisma.productionBatch.findFirst.mockResolvedValue({
        id: 'PROD-001',
        stage: 'Mixing',
      });
      prisma.productionBatch.update.mockResolvedValue({
        id: 'PROD-001',
        productName: 'Herbal Tonic',
        stage: 'Processing',
      });

      const res = await service.advanceStage('PROD-001');
      expect(prisma.productionBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stage: 'Processing' }),
        }),
      );
      expect(res?.stage).toBe('Processing');
    });

    it('INVARIANT: Sets qcApproverId when transitioning to QC stage', async () => {
      prisma.productionBatch.findFirst.mockResolvedValue({
        id: 'PROD-001',
        stage: 'Processing',
      });
      prisma.productionBatch.update.mockResolvedValue({
        id: 'PROD-001',
        stage: 'QC',
      });

      await service.advanceStage('PROD-001', 'staff-qc-lead');
      expect(prisma.productionBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stage: 'QC',
            qcApproverId: 'staff-qc-lead',
          }),
        }),
      );
    });

    it('REGRESSION FINDING-03: Throws BadRequestException when attempting to advance an already Completed batch', async () => {
      prisma.productionBatch.findFirst.mockResolvedValue({
        id: 'PROD-001',
        stage: 'Completed',
      });

      await expect(service.advanceStage('PROD-001')).rejects.toThrow(BadRequestException);
      expect(prisma.productionBatch.update).not.toHaveBeenCalled();
    });

    it('ADVERSARIAL: Throws NotFoundException if batch ID is not found', async () => {
      prisma.productionBatch.findFirst.mockResolvedValue(null);
      await expect(service.advanceStage('PROD-NONEXISTENT')).rejects.toThrow(NotFoundException);
    });
  });
});
