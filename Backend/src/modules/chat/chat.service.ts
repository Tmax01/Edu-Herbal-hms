import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChannelDto, SendMessageDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private async resolveOrCreateChannel(channelIdentifier?: string) {
    if (!channelIdentifier) {
      throw new BadRequestException('Channel identifier is required');
    }

    const trimmed = channelIdentifier.trim();

    let channel = await this.prisma.chatChannel.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { name: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
    });

    if (channel) return channel;

    // Auto-create DM channel or recognized named channel on-the-fly
    const isDm = trimmed.startsWith('dm_');
    let name = trimmed;
    let description: string | null = null;
    let icon = '💬';

    if (trimmed.toLowerCase() === 'general') {
      name = 'general';
      description = 'Hospital-wide announcements and general discussion';
      icon = '📢';
    } else if (trimmed.toLowerCase() === 'clinical' || trimmed.toLowerCase() === 'clinical-team') {
      name = 'clinical-team';
      description = 'Clinical staff coordination';
      icon = '🩺';
    } else if (trimmed.toLowerCase() === 'accra' || trimmed.toLowerCase() === 'accra-branch') {
      name = 'accra-branch';
      description = 'Accra branch staff';
      icon = '🏥';
    } else if (trimmed.toLowerCase() === 'mankessim' || trimmed.toLowerCase() === 'mankessim-branch') {
      name = 'mankessim-branch';
      description = 'Mankessim herbal centre staff';
      icon = '🌿';
    } else if (trimmed.toLowerCase() === 'pharmacy') {
      name = 'pharmacy';
      description = 'Pharmacy and stock coordination';
      icon = '💊';
    } else if (trimmed.toLowerCase() === 'lab' || trimmed.toLowerCase() === 'laboratory') {
      name = 'laboratory';
      description = 'Lab team and result notifications';
      icon = '🔬';
    } else if (trimmed.toLowerCase() === 'admin' || trimmed.toLowerCase() === 'administration') {
      name = 'administration';
      description = 'Administrative coordination';
      icon = '📋';
    }

    return this.prisma.chatChannel.create({
      data: {
        id: trimmed,
        name,
        description,
        icon,
        isDm,
      },
    });
  }

  async createChannel(dto: CreateChannelDto) {
    const id = dto.id || dto.name.toLowerCase().replace(/\s+/g, '-');

    const existing = await this.prisma.chatChannel.findFirst({
      where: {
        OR: [{ id }, { name: dto.name }],
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.chatChannel.create({
      data: {
        id,
        name: dto.name,
        description: dto.description || null,
        icon: dto.icon || '💬',
        isDm: dto.isDm || false,
      },
    });
  }

  async findAllChannels() {
    const channels = await this.prisma.chatChannel.findMany({
      where: { isDm: false },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return channels.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      messagesCount: c._count.messages,
    }));
  }

  async sendMessage(dto: SendMessageDto, senderId: string) {
    const targetChannel = dto.channelId || dto.channel;
    const channel = await this.resolveOrCreateChannel(targetChannel);

    const id = `MSG-${Date.now()}`;
    const messageType = dto.messageType || dto.type || 'text';

    const msg = await this.prisma.chatMessage.create({
      data: {
        id,
        channelId: channel.id,
        senderId,
        messageType,
        content: dto.content,
        attachmentUrl: dto.attachmentUrl || null,
        fileName: dto.fileName || null,
      },
      include: {
        senderUser: {
          select: {
            id: true,
            fullName: true,
            role: true,
            primaryBranch: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    const timestamp = msg.createdAt.toISOString().replace('T', ' ').slice(0, 16);

    return {
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderUser.fullName,
      senderRole: msg.senderUser.role,
      channel: channel.id,
      channelId: channel.id,
      content: msg.content,
      timestamp,
      type: msg.messageType,
      fileName: msg.fileName,
      attachmentUrl: msg.attachmentUrl,
      createdAt: msg.createdAt,
    };
  }

  async getChannelMessages(channelIdentifier: string, limit: number = 100) {
    const channel = await this.resolveOrCreateChannel(channelIdentifier);

    const messages = await this.prisma.chatMessage.findMany({
      where: { channelId: channel.id },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        senderUser: {
          select: {
            id: true,
            fullName: true,
            role: true,
            primaryBranch: { select: { name: true, code: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    return messages.map((msg) => {
      const timestamp = msg.createdAt.toISOString().replace('T', ' ').slice(0, 16);
      return {
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderUser.fullName,
        senderRole: msg.senderUser.role,
        channel: channel.id,
        channelId: channel.id,
        content: msg.content,
        timestamp,
        type: msg.messageType,
        fileName: msg.fileName,
        attachmentUrl: msg.attachmentUrl,
        createdAt: msg.createdAt,
      };
    });
  }

  async getStaffList(currentUserId?: string) {
    const users = await this.prisma.user.findMany({
      where: currentUserId ? { id: { not: currentUserId }, isActive: true } : { isActive: true },
      orderBy: { fullName: 'asc' },
      include: {
        department: { select: { name: true } },
        primaryBranch: { select: { name: true, code: true } },
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.fullName,
      email: u.email,
      role: u.role,
      department: u.department?.name || 'General',
      branch: u.primaryBranch?.code === 'MKS' ? 'Mankessim' : 'Accra',
      online: true,
    }));
  }
}
