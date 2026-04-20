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
}
