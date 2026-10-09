import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard Adversarial & RBAC Invariant Tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
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

  it('allows access when no roles are required on route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ id: 'usr-1', role: 'nurse' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('ADVERSARIAL: throws ForbiddenException when user object is missing or has no role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['doctor', 'admin']);
    const ctx = createMockContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);

    const ctxNoRole = createMockContext({ id: 'usr-2' });
    expect(() => guard.canActivate(ctxNoRole)).toThrow(ForbiddenException);
  });

  it('ADVERSARIAL: denies unauthorized role attempting privileged access', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['doctor']);
    const ctx = createMockContext({ id: 'usr-rec', role: 'receptionist' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows user with matching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['pharmacist', 'admin']);
    const ctx = createMockContext({ id: 'usr-pharm', role: 'pharmacist' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('INVARIANT: CTO and Admin have global access across all endpoints regardless of role list', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['doctor']);
    const ctoCtx = createMockContext({ id: 'usr-cto', role: 'cto' });
    expect(guard.canActivate(ctoCtx)).toBe(true);

    const adminCtx = createMockContext({ id: 'usr-admin', role: 'admin' });
    expect(guard.canActivate(adminCtx)).toBe(true);
  });
});
