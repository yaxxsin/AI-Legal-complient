import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FeatureFlagsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.featureFlag.create({
      data: {
        key: data.key,
        enabled: data.enabled !== undefined ? data.enabled : false,
        targetPlans: data.targetPlans || [],
        targetUsers: data.targetUsers || [],
      },
    });
  }

  async findAll() {
    return this.prisma.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    return this.prisma.featureFlag.findMany({
      select: { key: true, enabled: true, targetPlans: true, targetUsers: true },
    });
  }

  async findOne(id: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException('Feature flag not found');
    return flag;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.featureFlag.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.featureFlag.delete({ where: { id } });
  }
}
