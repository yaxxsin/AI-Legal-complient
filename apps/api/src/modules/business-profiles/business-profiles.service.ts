import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBusinessProfileDto, UpdateBusinessProfileDto, UpdateStepDto } from './dto';

/** Plan-based profile limits */
const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 2,
  growth: 3,
  business: 10,
};

@Injectable()
export class BusinessProfilesService {
  private readonly logger = new Logger(BusinessProfilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Create new business profile (check plan limit) */
  async create(userId: string, userPlan: string, dto: CreateBusinessProfileDto) {
    const limit = PLAN_LIMITS[userPlan] ?? 1;
    const count = await this.prisma.businessProfile.count({
      where: { userId },
    });

    if (count >= limit) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT_REACHED',
        message: `Paket ${userPlan} hanya mendukung ${limit} profil bisnis`,
      });
    }

    return this.prisma.businessProfile.create({
      data: {
        userId,
        businessName: '',
        entityType: dto.entityType,
        isDraft: true,
        onboardingStep: 1,
      },
    });
  }

  /** List all profiles for a user */
  async findAllByUser(userId: string) {
    return this.prisma.businessProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { sector: { select: { id: true, name: true, icon: true } } },
    });
  }

  /** Get single profile by ID (with ownership check) */
  async findOne(id: string, userId: string) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { id },
      include: { sector: { select: { id: true, name: true, icon: true } } },
    });

    if (!profile) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Profil bisnis tidak ditemukan',
      });
    }

    if (profile.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Akses ditolak',
      });
    }

    return profile;
  }

  /** Full update + finalize (set isDraft = false) */
  async updateFull(id: string, userId: string, dto: UpdateBusinessProfileDto) {
    await this.findOne(id, userId);

    return this.prisma.businessProfile.update({
      where: { id },
      data: {
        ...(dto.entityType !== undefined && { entityType: dto.entityType }),
        ...(dto.businessName !== undefined && { businessName: dto.businessName }),
        ...(dto.establishmentDate !== undefined && {
          establishmentDate: new Date(dto.establishmentDate),
        }),
        ...(dto.sectorId !== undefined && { sectorId: dto.sectorId }),
        ...(dto.subSectorIds !== undefined && { subSectorIds: dto.subSectorIds }),
        ...(dto.employeeCount !== undefined && { employeeCount: dto.employeeCount }),
        ...(dto.annualRevenue !== undefined && { annualRevenue: dto.annualRevenue }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.province !== undefined && { province: dto.province }),
        ...(dto.hasNib !== undefined && { hasNib: dto.hasNib }),
        ...(dto.nibNumber !== undefined && { nibNumber: dto.nibNumber }),
        ...(dto.npwp !== undefined && { npwp: dto.npwp }),
        ...(dto.isOnlineBusiness !== undefined && { isOnlineBusiness: dto.isOnlineBusiness }),
        isDraft: false,
        onboardingStep: 5,
      },
    });
  }

  /** Auto-save per wizard step */
  async updateStep(id: string, userId: string, dto: UpdateStepDto) {
    await this.findOne(id, userId);

    const stepData = this.mapStepData(dto.step, dto.data ?? {});

    return this.prisma.businessProfile.update({
      where: { id },
      data: {
        ...stepData,
        onboardingStep: dto.step,
      },
    });
  }

  /** Delete profile (ownership check) */
  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.businessProfile.delete({ where: { id } });
    this.logger.log(`Profile deleted: ${id}`);
  }

  /** Map wizard step number to DB fields */
  private mapStepData(
    step: number,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    switch (step) {
      case 1:
        return {
          ...(data.entityType !== undefined && { entityType: data.entityType }),
        };
      case 2:
        return {
          ...(data.sectorId !== undefined && { sectorId: data.sectorId }),
          ...(data.subSectorIds !== undefined && { subSectorIds: data.subSectorIds }),
        };
      case 3:
        return {
          ...(data.businessName !== undefined && { businessName: data.businessName }),
          ...(data.establishmentDate !== undefined && {
            establishmentDate: new Date(data.establishmentDate as string),
          }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.province !== undefined && { province: data.province }),
        };
      case 4:
        return {
          ...(data.employeeCount !== undefined && { employeeCount: Number(data.employeeCount) }),
          ...(data.annualRevenue !== undefined && { annualRevenue: data.annualRevenue }),
          ...(data.isOnlineBusiness !== undefined && { isOnlineBusiness: data.isOnlineBusiness }),
        };
      case 5:
        return {
          ...(data.hasNib !== undefined && { hasNib: data.hasNib }),
          ...(data.nibNumber !== undefined && { nibNumber: data.nibNumber }),
          ...(data.npwp !== undefined && { npwp: data.npwp }),
        };
      default:
        throw new BadRequestException('Step tidak valid (1-5)');
    }
  }
}
