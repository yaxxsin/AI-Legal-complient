import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentReviewService } from './document-review.service';
import { DocumentReviewController } from './document-review.controller';
import { ReviewProcessor } from './review.processor';
import { PrismaModule } from '../../database/prisma.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    PrismaModule,
    ChatModule, // Reusing ChatService for interacting with Ollama
    BullModule.registerQueue({
      name: 'document-review-queue',
    }),
  ],
  controllers: [DocumentReviewController],
  providers: [DocumentReviewService, ReviewProcessor],
})
export class DocumentReviewModule {}
