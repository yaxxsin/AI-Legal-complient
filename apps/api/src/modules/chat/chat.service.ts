import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../database/prisma.service';
import { RagService } from '../rag/rag.service';
import { OLLAMA_CLIENT } from './ollama.provider';
import {
  COMPLIANCE_BOT_SYSTEM_PROMPT,
  generateTitle,
} from './chat.constants';
import { CreateConversationDto, SendMessageDto } from './dto';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly model: string;

  constructor(
    @Inject(OLLAMA_CLIENT)
    private readonly ollama: OpenAI,
    private readonly prisma: PrismaService,
    private readonly rag: RagService,
    private readonly config: ConfigService,
  ) {
    this.model = this.config.get<string>('OLLAMA_MODEL', 'qwen2.5');
  }

  /** Create a new conversation */
  async createConversation(userId: string, dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        userId,
        businessProfileId: dto.businessProfileId,
        title: dto.title ?? 'Percakapan Baru',
      },
    });
  }

  /** List conversations for a user (paginated) */
  async listConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          businessProfileId: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.conversation.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Get messages for a conversation */
  async getMessages(userId: string, conversationId: string) {
    await this.verifyOwnership(userId, conversationId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Update conversation title */
  async updateConversation(
    userId: string,
    conversationId: string,
    title: string,
  ) {
    await this.verifyOwnership(userId, conversationId);

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /** Delete conversation */
  async deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    await this.verifyOwnership(userId, conversationId);
    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  /** Submit message feedback */
  async submitFeedback(
    userId: string,
    messageId: string,
    feedback: string,
    comment?: string,
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { select: { userId: true } } },
    });

    if (!message || message.conversation.userId !== userId) {
      throw new NotFoundException('Pesan tidak ditemukan');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { feedback, feedbackComment: comment },
    });
  }

  /** Send message + get AI streaming response */
  async sendMessage(userId: string, dto: SendMessageDto) {
    const conversation = await this.verifyOwnership(
      userId,
      dto.conversationId,
    );

    // Check rate limit for free users
    await this.checkRateLimit(userId);

    // 1. Save user message
    await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        role: 'user',
        content: dto.message,
      },
    });

    // 2. Auto-generate title from first message
    const messageCount = await this.prisma.message.count({
      where: { conversationId: dto.conversationId },
    });
    if (messageCount === 1) {
      await this.prisma.conversation.update({
        where: { id: dto.conversationId },
        data: { title: generateTitle(dto.message) },
      });
    }

    // 3. Get RAG context
    const ragContext = await this.buildRagContext(dto.message);

    // 4. Build message history (last 10 messages)
    const history = await this.buildMessageHistory(
      dto.conversationId,
    );

    // 5. Build prompt with RAG context
    const messages = this.buildPromptMessages(
      history,
      ragContext,
    );

    // 6. Stream response from Ollama/Qwen
    return this.streamResponse(
      dto.conversationId,
      messages,
    );
  }

  /** Build RAG context from Pinecone */
  private async buildRagContext(query: string): Promise<string> {
    try {
      const results = await this.rag.queryRelevant(query, 5);

      if (results.length === 0) {
        return '';
      }

      const contextParts = results.map(
        (r, i) =>
          `[Sumber ${i + 1}] (skor: ${r.score.toFixed(2)})\n${r.content}`,
      );

      return `\n\n--- KONTEKS REGULASI TERKAIT ---\n${contextParts.join('\n\n')}\n--- AKHIR KONTEKS ---`;
    } catch (error) {
      this.logger.warn(
        `RAG query failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return '';
    }
  }

  /** Get last 10 messages as chat history */
  private async buildMessageHistory(
    conversationId: string,
  ): Promise<ChatMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { role: true, content: true },
    });

    return messages
      .reverse()
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  /** Compose the full prompt with system + RAG + history */
  private buildPromptMessages(
    history: ChatMessage[],
    ragContext: string,
  ): ChatMessage[] {
    const systemContent = ragContext
      ? `${COMPLIANCE_BOT_SYSTEM_PROMPT}${ragContext}`
      : COMPLIANCE_BOT_SYSTEM_PROMPT;

    return [
      { role: 'system', content: systemContent },
      ...history,
    ];
  }

  /** Stream response from Ollama and save to DB */
  async *streamResponse(
    conversationId: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    try {
      const stream = await this.ollama.chat.completions.create({
        model: this.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content ?? '';
        if (content) {
          fullResponse += content;
          yield content;
        }
      }

      // Save complete AI response
      await this.prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: fullResponse,
          tokensUsed: fullResponse.length, // approximate
        },
      });

      // Touch conversation updatedAt
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      const errMsg = error instanceof Error
        ? error.message
        : 'AI service unavailable';
      this.logger.error(`Ollama streaming failed: ${errMsg}`);
      yield `\n\n⚠️ Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.`;
    }
  }

  /** Check free plan rate limit (10 queries/day) */
  private async checkRateLimit(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (user?.plan !== 'free') return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queryCount = await this.prisma.message.count({
      where: {
        conversation: { userId },
        role: 'user',
        createdAt: { gte: today },
      },
    });

    if (queryCount >= 10) {
      throw new ForbiddenException(
        'Batas 10 pertanyaan/hari untuk plan Free telah tercapai. Upgrade ke Starter untuk unlimited.',
      );
    }
  }

  /** Verify conversation belongs to user */
  private async verifyOwnership(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Percakapan tidak ditemukan');
    }

    return conversation;
  }
}
