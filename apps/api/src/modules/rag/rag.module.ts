import { Module } from '@nestjs/common';
import { PineconeProvider } from './pinecone.provider';
import { RagService } from './rag.service';

@Module({
  providers: [PineconeProvider, RagService],
  exports: [RagService],
})
export class RagModule {}
