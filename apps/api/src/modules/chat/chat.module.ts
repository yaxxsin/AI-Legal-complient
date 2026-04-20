import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module';
import { OllamaProvider } from './ollama.provider';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [RagModule],
  controllers: [ChatController],
  providers: [OllamaProvider, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
