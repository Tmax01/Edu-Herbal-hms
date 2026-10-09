import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('PermissionsGuard Adversarial & Granular Module Invariant Tests', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let prisma: any;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      userModulePermission: {
        findUnique: jest.fn(),
      },
    };
    guard = new PermissionsGuard(reflector, prisma as PrismaService);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access when no permissions decorator is present', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ id: 'usr-1', role: 'nurse' });
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('ADVERSARIAL: throws ForbiddenException if user is unauthenticated', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ moduleKey: 'billing', action: 'canCreate' });
    const ctx = createMockContext(null);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('INVARIANT: CTO and Admin bypass permission checks', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ moduleKey: 'billing', action: 'canDelete' });
    const ctoCtx = createMockContext({ id: 'usr-cto', role: 'cto' });
    expect(await guard.canActivate(ctoCtx)).toBe(true);

    const adminCtx = createMockContext({ id: 'usr-adm', role: 'admin' });
    expect(await guard.canActivate(adminCtx)).toBe(true);
  });

  it('ADVERSARIAL: denies user who lacks the specific permission action', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ moduleKey: 'billing', action: 'canDelete' });
    const ctx = createMockContext({ id: 'usr-acc', role: 'accountant' });
    prisma.userModulePermission.findUnique.mockResolvedValue({
      userId: 'usr-acc',
      moduleKey: 'billing',
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false, // Cannot delete
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('allows user who has the required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ moduleKey: 'pharmacy', action: 'canCreate' });
    const ctx = createMockContext({ id: 'usr-pharm', role: 'pharmacist' });
    prisma.userModulePermission.findUnique.mockResolvedValue({
      userId: 'usr-pharm',
      moduleKey: 'pharmacy',
      canCreate: true,
    });

    expect(await guard.canActivate(ctx)).toBe(true);
  });
});
