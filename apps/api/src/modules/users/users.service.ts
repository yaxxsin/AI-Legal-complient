import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly supabase: SupabaseClient | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const url = this.config.get<string>('SUPABASE_URL', '');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY', '');

    if (!url || url.includes('your-project') || !key || key === 'your-service-role-key') {
      this.supabase = null;
    } else {
      this.supabase = createClient(url, key);
    }
  }

  /** Guard helper */
  private requireSupabase(): SupabaseClient {
    if (!this.supabase) {
      throw new BadRequestException('Supabase belum dikonfigurasi.');
    }
    return this.supabase;
  }

  /** Find user by Supabase auth ID */
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

  /** Change password — verify old password first via Supabase */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'User tidak ditemukan',
      });
    }

    // Verify old password via Supabase sign-in
    const sb = this.requireSupabase();
    const { error: verifyError } =
      await sb.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

    if (verifyError) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Password lama salah',
      });
    }

    // Update password via admin API
    const { error: updateError } =
      await sb.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      this.logger.error(`Password update failed: ${updateError.message}`);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Gagal mengubah password. Coba lagi.',
      });
    }
  }

  /** Soft delete account — set deletedAt, grace period 30 days */
  async softDeleteAccount(userId: string): Promise<void> {
    await this.findById(userId);

    // For MVP: disable Supabase auth user (ban)
    const sb = this.requireSupabase();
    const { error } = await sb.auth.admin.updateUserById(
      userId,
      { ban_duration: '876000h' }, // ~100 years = effectively disabled
    );

    if (error) {
      this.logger.error(`Account disable failed: ${error.message}`);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Gagal menghapus akun. Coba lagi.',
      });
    }

    this.logger.log(`Account soft-deleted: ${userId}`);
  }
}
