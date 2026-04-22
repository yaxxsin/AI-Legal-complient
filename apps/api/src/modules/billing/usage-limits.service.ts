import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Plan-based usage limits.
 * -1 = unlimited
 */
const LIMITS: Record<string, {
  chatPerDay: number;
  docsPerMonth: number;
  reviewPerMonth: number;
  profiles: number;
}> = {
  free:     { chatPerDay: 10,  docsPerMonth: 2,  reviewPerMonth: 0,  profiles: 1 },
  starter:  { chatPerDay: -1,  docsPerMonth: 10, reviewPerMonth: 0,  profiles: 1 },
  growth:   { chatPerDay: -1,  docsPerMonth: -1, reviewPerMonth: 3,  profiles: 3 },
  business: { chatPerDay: -1,  docsPerMonth: -1, reviewPerMonth: 20, profiles: 10 },
};

@Injectable()
export class UsageLimitService {
  private readonly logger = new Logger(UsageLimitService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Get limits for a plan */
  getLimits(plan: string) {
    return LIMITS[plan] ?? LIMITS.free;
  }

  /** Check chat usage — throws if over limit */
  async checkChatLimit(userId: string, plan: string): Promise<void> {
    const limits = this.getLimits(plan);
    if (limits.chatPerDay === -1) return; // unlimited

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.message.count({
      where: {
        conversation: { userId },
        role: 'user',
        createdAt: { gte: todayStart },
      },
    });

    if (count >= limits.chatPerDay) {
      throw new ForbiddenException({
        code: 'USAGE_LIMIT',
        message: `Batas ${limits.chatPerDay} chat/hari untuk paket ${plan} tercapai. Upgrade untuk unlimited.`,
        limit: limits.chatPerDay,
        used: count,
      });
    }
  }

  /** Check document generation usage — throws if over limit */
  async checkDocumentLimit(userId: string, plan: string): Promise<void> {
    const limits = this.getLimits(plan);
    if (limits.docsPerMonth === -1) return;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.generatedDocument.count({
      where: {
        userId,
        generatedAt: { gte: monthStart },
      },
    });

    if (count >= limits.docsPerMonth) {
      throw new ForbiddenException({
        code: 'USAGE_LIMIT',
        message: `Batas ${limits.docsPerMonth} dokumen/bulan untuk paket ${plan} tercapai. Upgrade untuk lebih banyak.`,
        limit: limits.docsPerMonth,
        used: count,
      });
    }
  }

  /** Check document review usage — throws if over limit */
  async checkReviewLimit(userId: string, plan: string): Promise<void> {
    const limits = this.getLimits(plan);
    if (limits.reviewPerMonth === -1) return;

    if (limits.reviewPerMonth === 0) {
      throw new ForbiddenException({
        code: 'USAGE_LIMIT',
        message: `Fitur Review Dokumen AI tidak tersedia untuk paket ${plan}. Upgrade ke Growth atau Business.`,
        limit: 0,
        used: 0,
      });
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.documentReview.count({
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
    });

    if (count >= limits.reviewPerMonth) {
      throw new ForbiddenException({
        code: 'USAGE_LIMIT',
        message: `Batas ${limits.reviewPerMonth} review/bulan untuk paket ${plan} tercapai. Upgrade untuk lebih banyak.`,
        limit: limits.reviewPerMonth,
        used: count,
      });
    }
  }

  /** Get usage summary for a user (for dashboard display) */
  async getUsageSummary(userId: string, plan: string) {
    const limits = this.getLimits(plan);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [chatCount, docCount, reviewCount, profileCount] = await Promise.all([
      this.prisma.message.count({
        where: { conversation: { userId }, role: 'user', createdAt: { gte: todayStart } },
      }),
      this.prisma.generatedDocument.count({
        where: { userId, generatedAt: { gte: monthStart } },
      }),
      this.prisma.documentReview.count({
        where: { userId, createdAt: { gte: monthStart } },
      }),
      this.prisma.businessProfile.count({
        where: { userId, isDraft: false },
      }),
    ]);

    return {
      chat: { used: chatCount, limit: limits.chatPerDay, period: 'day' },
      documents: { used: docCount, limit: limits.docsPerMonth, period: 'month' },
      reviews: { used: reviewCount, limit: limits.reviewPerMonth, period: 'month' },
      profiles: { used: profileCount, limit: limits.profiles, period: 'total' },
    };
  }
}
