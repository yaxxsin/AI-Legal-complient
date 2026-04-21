import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DocumentReviewService {
  private readonly logger = new Logger(DocumentReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('document-review-queue') private readonly reviewQueue: Queue,
  ) {}

  /** Upload and queue document for review */
  async queueForReview(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size must be under 10MB');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx'].includes(ext || '')) {
      throw new BadRequestException('Only PDF or DOCX files are supported');
    }

    // 1. Create DB Record
    const documentReview = await this.prisma.documentReview.create({
      data: {
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        status: 'pending',
      },
    });

    // 2. Add to BullMQ Queue (pass file buffer safely by converting to base64, or use MinIO. For MVP we pass buffer in memory/Redis, but it's large. Usually, we upload to MinIO first, then pass URL. For testing, we can pass buffer directly if file < 10MB)
    // To avoid Redis payload limits, uploading to real Storage (S3) first is necessary.
    // For this boilerplate MVP, we simulate upload and base64.
    const fileBase64 = file.buffer.toString('base64');

    await this.reviewQueue.add('process-document', {
      reviewId: documentReview.id,
      fileBase64,
      fileName: file.originalname,
      mimeType: file.mimetype,
    });

    this.logger.log(`Queued document ${documentReview.id} for processing`);

    return documentReview;
  }

  /** Get review status/result */
  async getReviewStatus(reviewId: string, userId: string) {
    const review = await this.prisma.documentReview.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== userId) {
      throw new NotFoundException('Document review not found');
    }

    return review;
  }
}
