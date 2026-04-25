import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PasalService } from './pasal.service';
import { PrismaModule } from '../../database/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { OllamaProvider } from './ai-providers/ollama.provider';
import { GeminiProvider } from './ai-providers/gemini.provider';
import { AiProviderFactory } from './ai-providers/ai-provider.factory';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    PasalService,
    OllamaProvider,
    GeminiProvider,
    AiProviderFactory,
  ],
  exports: [ChatService],
})
export class ChatModule {}
