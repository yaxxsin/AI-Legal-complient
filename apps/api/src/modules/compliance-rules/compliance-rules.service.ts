import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ComplianceRulesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.complianceRule.create({
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        priority: data.priority || 'medium',
        conditions: data.conditions || {},
        legalReferences: data.legalReferences || [],
        dueDateLogic: data.dueDateLogic || {},
        guidanceText: data.guidanceText || '',
        isPublished: data.isPublished !== undefined ? data.isPublished : false,
      },
    });
  }

  async findAll() {
    return this.prisma.complianceRule.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllCategories() {
    return this.prisma.complianceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.complianceRule.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!rule) throw new NotFoundException('Rule not found');
    return rule;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.complianceRule.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.complianceRule.delete({
      where: { id },
    });
  }
}
