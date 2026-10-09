import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Shared branch resolution utility for all domain services.
 * Eliminates duplicate resolveBranchId() methods across services.
 */
export async function resolveBranchId(
  prisma: PrismaService,
  identifier?: string | null,
  fallbackId?: string | null,
): Promise<string | null> {
  if (!identifier) return fallbackId || null;

  const trimmed = identifier.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'all' || lower === 'both') {
    return null;
  }

  const branch = await prisma.branch.findFirst({
    where: {
      OR: [
        { id: trimmed },
        { code: { equals: trimmed, mode: 'insensitive' } },
        { name: { contains: trimmed, mode: 'insensitive' } },
      ],
    },
  });

  return branch?.id || fallbackId || null;
}

@Injectable()
export class BranchResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(identifier?: string | null, fallbackId?: string | null): Promise<string | null> {
    return resolveBranchId(this.prisma, identifier, fallbackId);
  }
}
