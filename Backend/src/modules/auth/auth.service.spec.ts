import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';

describe('AuthService Adversarial & Regression Tests', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userSession: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock_token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, def?: any) => def || 'test_secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('Adversarial Security & Backdoor Regression', () => {
    it('REGRESSION FINDING-01: MUST reject password containing @2024! if hash does not match', async () => {
      // Simulate real password hash for "RealSecurePassword999!"
      const realHash = await argon2.hash('RealSecurePassword999!', { type: argon2.argon2id });

      prisma.user.findFirst.mockResolvedValue({
        id: 'usr-admin-01',
        email: 'admin@eduhms.gh',
        staffNumber: 'EMP-ADM-001',
        passwordHash: realHash,
        fullName: 'System Administrator',
        role: 'admin',
        isActive: true,
        primaryBranchId: 'branch-accra',
        departmentId: 'dept-admin',
      });

      // Adversary attempts backdoor bypass
      await expect(
        service.login({ identifier: 'admin@eduhms.gh', password: 'HackedPassword@2024!' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('REGRESSION FINDING-01: MUST reject default "Password123!" if user has a different password', async () => {
      const realHash = await argon2.hash('MyCustomDoctorPass#2026', { type: argon2.argon2id });

      prisma.user.findFirst.mockResolvedValue({
        id: 'usr-doc-01',
        email: 'dr.mensah@eduhms.gh',
        staffNumber: 'EMP-DOC-003',
        passwordHash: realHash,
        fullName: 'Dr. Kwesi Mensah',
        role: 'doctor',
        isActive: true,
      });

      await expect(
        service.login({ identifier: 'dr.mensah@eduhms.gh', password: 'Password123!' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('SUCCESS PATH: Authenticates successfully with valid credentials and argon2 match', async () => {
      const validPass = 'ValidSecretPass2026!';
      const hash = await argon2.hash(validPass, { type: argon2.argon2id });

      prisma.user.findFirst.mockResolvedValue({
        id: 'usr-doc-01',
        email: 'dr.mensah@eduhms.gh',
        staffNumber: 'EMP-DOC-003',
        passwordHash: hash,
        fullName: 'Dr. Kwesi Mensah',
        role: 'doctor',
        isActive: true,
      });
      prisma.user.update.mockResolvedValue({});
      prisma.userSession.create.mockResolvedValue({});

      const result = await service.login({ identifier: 'dr.mensah@eduhms.gh', password: validPass }, '127.0.0.1');

      expect(result.message).toBe('Authentication successful');
      expect(result.tokens).toBeDefined();
      expect(result.user.email).toBe('dr.mensah@eduhms.gh');
      // Must not leak passwordHash in sanitized user object
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('ADVERSARIAL: Rejects deactivated / suspended staff member even with correct password', async () => {
      const validPass = 'ValidSecretPass2026!';
      const hash = await argon2.hash(validPass, { type: argon2.argon2id });

      prisma.user.findFirst.mockResolvedValue({
        id: 'usr-inactive-01',
        email: 'fired.nurse@eduhms.gh',
        passwordHash: hash,
        isActive: false, // Suspended / deactivated
      });

      await expect(
        service.login({ identifier: 'fired.nurse@eduhms.gh', password: validPass }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('ADVERSARIAL: Rejects non-existent email or empty credentials', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ identifier: 'nonexistent@eduhms.gh', password: 'some_password' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.login({ identifier: '', password: '' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
