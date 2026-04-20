import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone, type Index } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import OpenAI from 'openai';
import { PINECONE_CLIENT } from './pinecone.provider';

interface ChunkResult {
  chunkIndex: number;
  content: string;
  pineconeId: string;
}

interface QueryResult {
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly openai: OpenAI;
  private readonly indexName: string;
  private readonly splitter: RecursiveCharacterTextSplitter;

  constructor(
    @Inject(PINECONE_CLIENT)
    private readonly pinecone: Pinecone,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY', ''),
    });
    this.indexName = this.config.get<string>(
      'PINECONE_INDEX',
      'localcompliance',
    );
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 700,
      chunkOverlap: 100,
    });
  }

  /** Split text into chunks */
  async splitText(content: string): Promise<string[]> {
    return this.splitter.splitText(content);
  }

  /** Generate embedding for a single text */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  /** Upsert chunks to Pinecone */
  async upsertChunks(
    regulationId: string,
    chunks: string[],
    namespace = 'peraturan',
  ): Promise<ChunkResult[]> {
    const index = this.getIndex();
    const results: ChunkResult[] = [];

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const vectors = await Promise.all(
        batch.map(async (chunk, batchIdx) => {
          const chunkIndex = i + batchIdx;
          const pineconeId = `${regulationId}_chunk_${chunkIndex}`;
          const embedding = await this.generateEmbedding(chunk);

          return {
            id: pineconeId,
            values: embedding,
            metadata: {
              regulationId,
              chunkIndex,
              content: chunk.slice(0, 1000),
            },
          };
        }),
      );

      await index.namespace(namespace).upsert({ records: vectors });

      results.push(
        ...batch.map((content, batchIdx) => ({
          chunkIndex: i + batchIdx,
          content,
          pineconeId: `${regulationId}_chunk_${i + batchIdx}`,
        })),
      );

      this.logger.log(
        `Upserted batch ${Math.floor(i / batchSize) + 1} (${vectors.length} vectors)`,
      );
    }

    return results;
  }

  /** Query relevant chunks from Pinecone */
  async queryRelevant(
    query: string,
    topK = 5,
    namespace = 'peraturan',
    filter?: Record<string, unknown>,
  ): Promise<QueryResult[]> {
    const embedding = await this.generateEmbedding(query);
    const index = this.getIndex();

    const result = await index.namespace(namespace).query({
      vector: embedding,
      topK,
      includeMetadata: true,
      filter,
    });

    return (result.matches ?? []).map((match) => ({
      content: (match.metadata?.content as string) ?? '',
      score: match.score ?? 0,
      metadata: (match.metadata as Record<string, unknown>) ?? {},
    }));
  }

  /** Delete all vectors for a regulation */
  async deleteRegulationVectors(
    regulationId: string,
    namespace = 'peraturan',
  ): Promise<void> {
    try {
      const index = this.getIndex();
      await index.namespace(namespace).deleteMany({
        filter: { regulationId: { $eq: regulationId } },
      });
      this.logger.log(`Deleted vectors for regulation: ${regulationId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to delete vectors: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /** Get Pinecone index handle */
  private getIndex(): Index {
    return this.pinecone.index(this.indexName);
  }
}
