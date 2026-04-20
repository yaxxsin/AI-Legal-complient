import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';

export const PINECONE_CLIENT = 'PINECONE_CLIENT';

export const PineconeProvider: Provider = {
  provide: PINECONE_CLIENT,
  useFactory: (config: ConfigService): Pinecone | null => {
    const apiKey = config.get<string>('PINECONE_API_KEY', '');

    if (!apiKey) {
      console.warn('⚠️ PINECONE_API_KEY not set — RAG features will be disabled');
      return null;
    }

    return new Pinecone({ apiKey });
  },
  inject: [ConfigService],
};
