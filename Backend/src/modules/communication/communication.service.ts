import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

  async createAnnouncement(dto: CreateAnnouncementDto, staffId: string) {
    return this.prisma.internalAnnouncement.create({
      data: {
        title: dto.title,
        content: dto.content,
        priority: dto.priority || 'Medium',
        targetRole: dto.targetRole || null,
        branchId: dto.branchId || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: staffId,
      },
      include: {
        createdByUser: { select: { id: true, fullName: true, role: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findActiveAnnouncements(role?: string, branchId?: string) {
    const now = new Date();

    const where: any = {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    if (role) {
      where.AND = [{ OR: [{ targetRole: null }, { targetRole: role }] }];
    }

    if (branchId) {
      where.AND = [...(where.AND || []), { OR: [{ branchId: null }, { branchId }] }];
    }

    return this.prisma.internalAnnouncement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        createdByUser: { select: { id: true, fullName: true, role: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
