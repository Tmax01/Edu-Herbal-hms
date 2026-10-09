import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_PERMISSION_KEY, RequiredPermission } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<RequiredPermission>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Access denied: Unauthenticated user');
    }

    if (user.role === 'cto' || user.role === 'admin') {
      return true;
    }

    const permission = await this.prisma.userModulePermission.findUnique({
      where: {
        userId_moduleKey: {
          userId: user.id,
          moduleKey: requirement.moduleKey,
        },
      },
    });

    if (!permission || !permission[requirement.action]) {
      throw new ForbiddenException(
        `Access denied: Missing '${requirement.action}' permission for module '${requirement.moduleKey}'`,
      );
    }

    return true;
  }
}
