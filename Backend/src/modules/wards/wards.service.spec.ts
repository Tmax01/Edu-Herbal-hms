import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WardsService } from './wards.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('WardsService Bed Allocation & Admission Invariant Tests', () => {
  let service: WardsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      ward: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      wardBed: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      admission: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      patient: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WardsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WardsService>(WardsService);
  });

  describe('Admit Patient Invariants', () => {
    it('ADVERSARIAL: Rejects admission if bed does not exist', async () => {
      prisma.wardBed.findUnique.mockResolvedValue(null);
      await expect(
        service.admitPatient({ bedId: 'BED-NONEXISTENT', patientId: 'PAT-1' } as any, 'doc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('ADVERSARIAL: Rejects admission if bed status is not Available (e.g. Occupied)', async () => {
      prisma.wardBed.findUnique.mockResolvedValue({
        id: 'BED-101',
        bedNumber: 'B-01',
        status: 'Occupied',
        branchId: 'branch-1',
      });

      await expect(
        service.admitPatient({ bedId: 'BED-101', patientId: 'PAT-1' } as any, 'doc-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('ADVERSARIAL: Rejects admission if bed status is Maintenance', async () => {
      prisma.wardBed.findUnique.mockResolvedValue({
        id: 'BED-102',
        bedNumber: 'B-02',
        status: 'Maintenance',
        branchId: 'branch-1',
      });

      await expect(
        service.admitPatient({ bedId: 'BED-102', patientId: 'PAT-1' } as any, 'doc-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('SUCCESS: Marks bed as Occupied and creates admission record when bed is Available', async () => {
      prisma.wardBed.findUnique.mockResolvedValue({
        id: 'BED-103',
        bedNumber: 'B-03',
        status: 'Available',
        branchId: 'branch-1',
      });

      prisma.wardBed.update.mockResolvedValue({ id: 'BED-103', status: 'Occupied' });
      prisma.admission.create.mockResolvedValue({
        id: 'ADM-101',
        bedId: 'BED-103',
        patientId: 'PAT-101',
        status: 'Admitted',
      });

      const res = await service.admitPatient(
        { bedId: 'BED-103', patientId: 'PAT-101', admissionDiagnosis: 'Malaria Inpatient' } as any,
        'doc-1',
      );

      expect(prisma.wardBed.update).toHaveBeenCalledWith({
        where: { id: 'BED-103' },
        data: { status: 'Occupied' },
      });
      expect(res.status).toBe('Admitted');
    });
  });

  describe('Discharge Patient Invariants', () => {
    it('ADVERSARIAL: Rejects discharge if admission does not exist', async () => {
      prisma.admission.findUnique.mockResolvedValue(null);
      await expect(service.dischargePatient('ADM-NONEXISTENT')).rejects.toThrow(NotFoundException);
    });

    it('ADVERSARIAL: Rejects duplicate discharge of already Discharged patient', async () => {
      prisma.admission.findUnique.mockResolvedValue({
        id: 'ADM-101',
        status: 'Discharged',
        bedId: 'BED-101',
      });

      await expect(service.dischargePatient('ADM-101')).rejects.toThrow(BadRequestException);
    });

    it('SUCCESS: Frees up bed to Available and updates admission to Discharged', async () => {
      prisma.admission.findUnique.mockResolvedValue({
        id: 'ADM-102',
        status: 'Admitted',
        bedId: 'BED-105',
      });

      prisma.wardBed.update.mockResolvedValue({ id: 'BED-105', status: 'Available' });
      prisma.admission.update.mockResolvedValue({
        id: 'ADM-102',
        status: 'Discharged',
        dischargeSummary: 'Recovered fully',
      });

      const res = await service.dischargePatient('ADM-102', { dischargeSummary: 'Recovered fully' });

      expect(prisma.wardBed.update).toHaveBeenCalledWith({
        where: { id: 'BED-105' },
        data: { status: 'Available' },
      });
      expect(res.status).toBe('Discharged');
    });
  });
});
