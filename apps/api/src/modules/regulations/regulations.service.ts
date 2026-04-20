import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RagService } from '../rag/rag.service';
import { CreateRegulationDto } from './dto';

@Injectable()
export class RegulationsService {
  private readonly logger = new Logger(RegulationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rag: RagService,
  ) {}

  /** Create regulation + auto-trigger indexing */
  async create(dto: CreateRegulationDto) {
    const regulation = await this.prisma.regulation.create({
      data: {
        title: dto.title,
        regulationNumber: dto.regulationNumber,
        type: dto.type,
        issuedBy: dto.issuedBy,
        issuedDate: new Date(dto.issuedDate),
        effectiveDate: new Date(dto.effectiveDate),
        status: dto.status,
        sectorTags: dto.sectorTags ?? ['all'],
        sourceUrl: dto.sourceUrl,
        contentRaw: dto.contentRaw,
      },
    });

    // Fire indexing async (don't block response)
    this.indexRegulation(regulation.id).catch((err) =>
      this.logger.error(`Auto-index failed: ${err.message}`),
    );

    return regulation;
  }

  /** List regulations (paginated) */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.regulation.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          regulationNumber: true,
          type: true,
          issuedBy: true,
          status: true,
          pineconeIndexed: true,
          chunkCount: true,
          createdAt: true,
        },
      }),
      this.prisma.regulation.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Get single regulation detail */
  async findOne(id: string) {
    const regulation = await this.prisma.regulation.findUnique({
      where: { id },
      include: {
        chunks: {
          select: { id: true, chunkIndex: true, pineconeId: true },
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!regulation) {
      throw new NotFoundException('Regulasi tidak ditemukan');
    }

    return regulation;
  }

  /** Delete regulation + clean Pinecone vectors */
  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Clean Pinecone vectors
    await this.rag.deleteRegulationVectors(id).catch((err) =>
      this.logger.warn(`Pinecone cleanup failed: ${err.message}`),
    );

    await this.prisma.regulation.delete({ where: { id } });
    this.logger.log(`Regulation deleted: ${id}`);
  }

  /** Full indexing pipeline: split → embed → upsert */
  async indexRegulation(id: string) {
    const regulation = await this.findOne(id);

    this.logger.log(`Indexing regulation: ${regulation.title}`);

    // 1. Split text into chunks
    const chunks = await this.rag.splitText(regulation.contentRaw);
    this.logger.log(`Split into ${chunks.length} chunks`);

    // 2. Delete old vectors + chunks
    await this.rag.deleteRegulationVectors(id);
    await this.prisma.regulationChunk.deleteMany({
      where: { regulationId: id },
    });

    // 3. Upsert to Pinecone + save chunks to DB
    const results = await this.rag.upsertChunks(id, chunks);

    await this.prisma.regulationChunk.createMany({
      data: results.map((r) => ({
        regulationId: id,
        chunkIndex: r.chunkIndex,
        content: r.content,
        pineconeId: r.pineconeId,
        metadata: { regulationNumber: regulation.regulationNumber },
      })),
    });

    // 4. Update regulation status
    await this.prisma.regulation.update({
      where: { id },
      data: {
        pineconeIndexed: true,
        chunkCount: chunks.length,
      },
    });

    this.logger.log(`✅ Indexed ${chunks.length} chunks for: ${regulation.title}`);
    return { chunksIndexed: chunks.length };
  }
}
