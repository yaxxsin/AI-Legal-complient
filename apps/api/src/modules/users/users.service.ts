import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Find user by ID */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        plan: true,
        emailVerified: true,
        onboardingCompleted: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'User tidak ditemukan',
      });
    }

    return user;
  }

  /** Update user profile (name, phone, avatar) */
  async updateProfile(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        plan: true,
        emailVerified: true,
        onboardingCompleted: true,
      },
    });
  }

  /** Change password — verify old password first via bcrypt */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'User tidak ditemukan',
      });
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Password lama salah',
      });
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    this.logger.log(`Password changed for user ${userId}`);
  }

  /** Soft delete account — mark as deleted */
  async softDeleteAccount(userId: string): Promise<void> {
    await this.findById(userId);

    // For MVP: mark user as deleted by clearing password hash and email
    // Full soft delete (deletedAt column) can be added later
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: null },
    });

    this.logger.log(`Account soft-deleted: ${userId}`);
  }

  // =====================================
  // ADMIN METHODS
  // =====================================

  /** List all users with pagination and search */
  async findAll({ page = 1, limit = 10, search }: { page?: number; limit?: number; search?: string }) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          plan: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Update user role for admin purposes */
  async updateRole(userId: string, role: string) {
    if (!['user', 'admin', 'banned'].includes(role)) {
      throw new BadRequestException('Role tidak diizinkan');
    }

    await this.findById(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    this.logger.log(`User ${userId} role updated to ${role}`);
    return user;
  }

  /** Update user plan for admin purposes — syncs both User and Subscription */
  async updatePlan(userId: string, plan: string) {
    const allowedPlans = ['free', 'starter', 'growth', 'business'];
    if (!allowedPlans.includes(plan)) {
      throw new BadRequestException(`Plan tidak valid. Pilihan: ${allowedPlans.join(', ')}`);
    }

    await this.findById(userId);

    // Sync both User.plan and Subscription.plan atomically
    const user = await this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { plan },
        select: { id: true, email: true, plan: true },
      });

      // Also sync subscription if exists
      const sub = await tx.subscription.findUnique({ where: { userId } });
      if (sub) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { plan, status: plan === 'free' ? 'active' : sub.status },
        });
      } else if (plan !== 'free') {
        // Create subscription record if upgrading from no-subscription state
        await tx.subscription.create({
          data: {
            userId,
            plan,
            billingCycle: 'monthly',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return updated;
    });

    this.logger.log(`[Admin] User ${userId} plan updated to ${plan} (synced)`);
    return user;
  }

  /** Admin hard-delete a user account */
  async adminDeleteUser(userId: string, adminId: string): Promise<{ deleted: true; id: string }> {
    if (userId === adminId) {
      throw new BadRequestException('Tidak bisa menghapus akun sendiri');
    }

    await this.findById(userId);

    await this.prisma.user.delete({ where: { id: userId } });

    this.logger.log(`User ${userId} deleted by admin ${adminId}`);
    return { deleted: true, id: userId };
  }
}
