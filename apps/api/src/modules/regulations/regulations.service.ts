import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RegulationsService {
  private readonly logger = new Logger(RegulationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.regulation.create({
      data: {
        title: data.title,
        regulationNumber: data.regulationNumber,
        type: data.type,
        issuedBy: data.issuedBy,
        issuedDate: new Date(data.issuedDate),
        effectiveDate: new Date(data.effectiveDate),
        status: data.status || 'Active',
        sectorTags: data.sectorTags || [],
        sourceUrl: data.sourceUrl || '',
        contentRaw: data.contentRaw || '',
        pineconeIndexed: false,
      },
    });
  }

  async findAll({ page = 1, limit = 10, search }: { page?: number; limit?: number; search?: string }) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { regulationNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [regulations, total] = await Promise.all([
      this.prisma.regulation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedDate: 'desc' },
      }),
      this.prisma.regulation.count({ where }),
    ]);

    return {
      data: regulations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const reg = await this.prisma.regulation.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Regulation not found');
    return reg;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    if (data.issuedDate) data.issuedDate = new Date(data.issuedDate);
    if (data.effectiveDate) data.effectiveDate = new Date(data.effectiveDate);

    return this.prisma.regulation.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.regulation.delete({ where: { id } });
  }

  async triggerIndex(id: string) {
    const reg = await this.findOne(id);
    
    // TODO: Phase 16 -> Trigger asynchronous task to embed and send to Pinecone
    this.logger.log(`[Stub] Triggering Pinecone indexing for Regulation: ${reg.regulationNumber}`);
    
    // Mark as indexed for testing purposes
    return this.prisma.regulation.update({
      where: { id },
      data: { pineconeIndexed: true },
    });
  }
}
