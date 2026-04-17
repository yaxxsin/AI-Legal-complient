import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SectorsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get root sectors (parentId = null, active only) */
  async findRootSectors() {
    return this.prisma.sector.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        icon: true,
      },
    });
  }

  /** Get sub-sectors for a parent */
  async findSubSectors(parentId: string) {
    return this.prisma.sector.findMany({
      where: { parentId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        icon: true,
      },
    });
  }
}
