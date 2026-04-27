import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  regulationId?: string;
  actionUrl?: string;
}

interface ListNotificationsQuery {
  userId: string;
  type?: string;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a single notification */
  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        regulationId: input.regulationId,
        actionUrl: input.actionUrl,
      },
    });
  }

  /** Create notifications in batch (for cron jobs) */
  async createBatch(inputs: CreateNotificationInput[]) {
    return this.prisma.notification.createMany({
      data: inputs.map((i) => ({
        userId: i.userId,
        type: i.type,
        title: i.title,
        body: i.body,
        regulationId: i.regulationId,
        actionUrl: i.actionUrl,
      })),
    });
  }

  /** List notifications for a user with pagination */
  async list(query: ListNotificationsQuery) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const where = {
      userId: query.userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.isRead !== undefined ? { isRead: query.isRead } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          regulation: {
            select: { id: true, title: true, type: true },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Get unread count for badge */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /** Mark a single notification as read */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /** Mark all notifications as read */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  /** Delete a notification */
  async delete(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true };
  }

  /** Send regulatory change alerts to matching users */
  async sendRegulatoryAlert(regulationId: string) {
    const regulation = await this.prisma.regulation.findUnique({
      where: { id: regulationId },
    });

    if (!regulation) return { sent: 0 };

    const sectorTags = regulation.sectorTags as string[];

    // Find business profiles matching regulation sector tags
    const matchingProfiles = await this.prisma.businessProfile.findMany({
      where: {
        sector: {
          code: { in: sectorTags },
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    if (matchingProfiles.length === 0) return { sent: 0 };

    const notifications = matchingProfiles.map((p) => ({
      userId: p.userId,
      type: 'regulatory_alert',
      title: `📋 Regulasi Baru: ${regulation.title}`,
      body: `Regulasi "${regulation.title}" (${regulation.type}) telah diterbitkan dan relevan dengan bisnis Anda.`,
      regulationId: regulation.id,
      actionUrl: `/dashboard/regulations/${regulation.id}`,
    }));

    await this.createBatch(notifications);
    return { sent: notifications.length };
  }
}
