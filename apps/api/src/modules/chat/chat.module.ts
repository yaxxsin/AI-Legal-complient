import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PasalService } from './pasal.service';
import { PrismaModule } from '../../database/prisma.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [ChatController],
  providers: [ChatService, PasalService],
  exports: [ChatService],
})
export class ChatModule {}
