import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  moduleKey: string;
  action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete';
}

export const REQUIRE_PERMISSION_KEY = 'requirePermission';
export const RequirePermission = (moduleKey: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') =>
  SetMetadata(REQUIRE_PERMISSION_KEY, { moduleKey, action });
