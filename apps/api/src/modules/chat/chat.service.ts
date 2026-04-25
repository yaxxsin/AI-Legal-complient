import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { PasalService } from './pasal.service';
import { AiProviderFactory, ChatMessage } from './ai-providers';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly pasalService: PasalService,
    private readonly aiFactory: AiProviderFactory,
  ) {}

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        model: true,
        provider: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async getConversation(id: string, userId: string) {
    const convo = await this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!convo || convo.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    return convo;
  }

  /** Send a message using the selected AI model */
  async chat(
    message: string,
    userId: string,
    userPlan: string,
    conversationId?: string,
    modelId?: string,
  ) {
    // Resolve model + provider
    const resolvedModelId = modelId ?? this.aiFactory.getDefaultModel(userPlan);
    const { provider, model: modelDef } = this.aiFactory.getProviderForModel(resolvedModelId, userPlan);

    let convoId = conversationId;

    if (!convoId) {
      const newConvo = await this.prisma.conversation.create({
        data: {
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          model: modelDef.id,
          provider: modelDef.provider,
        },
      });
      convoId = newConvo.id;
    } else {
      const exists = await this.prisma.conversation.findUnique({ where: { id: convoId } });
      if (!exists || exists.userId !== userId) {
        throw new NotFoundException('Conversation not found');
      }
      await this.prisma.conversation.update({
        where: { id: convoId },
        data: { updatedAt: new Date(), model: modelDef.id, provider: modelDef.provider },
      });
    }

    // Save user message
    await this.prisma.message.create({
      data: { conversationId: convoId, role: 'user', content: message },
    });

    // Retrieve conversation history
    const history = await this.prisma.message.findMany({
      where: { conversationId: convoId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // RAG-lite: retrieve relevant context
    const [dbContext, pasalContext] = await Promise.all([
      this.retrieveContext(message),
      this.pasalService.searchForContext(message),
    ]);
    const systemPrompt = this.buildSystemPrompt(dbContext + pasalContext);

    // Build messages array
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    this.logger.log(`[Chat] User ${userId} → ${modelDef.provider}/${modelDef.id}`);

    try {
      const aiResponse = await provider.chat(chatMessages, { model: modelDef.id });

      const reply = aiResponse.content || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';

      // Save assistant reply with model info
      await this.prisma.message.create({
        data: {
          conversationId: convoId!,
          role: 'assistant',
          content: reply,
          model: aiResponse.model,
          provider: aiResponse.provider,
          tokensUsed: aiResponse.tokensUsed,
        },
      });

      return {
        conversationId: convoId,
        reply,
        model: aiResponse.model,
        provider: aiResponse.provider,
      };
    } catch (error) {
      this.logger.error(`[Chat] Failed (${modelDef.provider}/${modelDef.id}): ${(error as Error).message}`);

      // Save error message
      const errorMsg = 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.';
      await this.prisma.message.create({
        data: { conversationId: convoId!, role: 'assistant', content: errorMsg },
      });

      throw new InternalServerErrorException('Gagal menghubungi AI. Coba lagi atau pilih model lain.');
    }
  }

  /** Get available models for a user's plan */
  getAvailableModels(plan: string) {
    return this.aiFactory.getAvailableModels(plan);
  }

  /** Generates direct message without ComplianceBot prompt (used by OCR/BullMQ) */
  async generateDirectMessage(prompt: string): Promise<string> {
    // Always use Ollama for internal/background tasks
    const ollama = this.aiFactory.getProvider('ollama');

    try {
      const response = await ollama.chat(
        [{ role: 'user', content: prompt }],
        { temperature: 0.1, maxTokens: 2048 },
      );
      return response.content || '{}';
    } catch (error) {
      this.logger.error(`Direct chat failed: ${(error as Error).message}`);
      throw new InternalServerErrorException('Gagal menghubungi AI.');
    }
  }

  // ── RAG Context ──────────────────────────

  private async retrieveContext(question: string): Promise<string> {
    const keywords = this.extractKeywords(question);
    if (keywords.length === 0) return '';

    const searchConditions = keywords.map((k) => ({
      OR: [
        { title: { contains: k, mode: 'insensitive' as const } },
        { contentRaw: { contains: k, mode: 'insensitive' as const } },
      ],
    }));

    const regulations = await this.prisma.regulation.findMany({
      where: { OR: searchConditions.flatMap((c) => c.OR) },
      select: { title: true, regulationNumber: true, type: true, issuedBy: true, status: true, sourceUrl: true },
      take: 5,
      orderBy: { issuedDate: 'desc' },
    });

    const rules = await this.prisma.complianceRule.findMany({
      where: {
        isPublished: true,
        OR: keywords
          .map((k) => ({
            OR: [
              { title: { contains: k, mode: 'insensitive' as const } },
              { description: { contains: k, mode: 'insensitive' as const } },
            ],
          }))
          .flatMap((c) => c.OR),
      },
      select: { title: true, description: true, priority: true, legalReferences: true },
      take: 5,
    });

    if (regulations.length === 0 && rules.length === 0) return '';

    let context = '\n\n--- DATA REFERENSI DARI DATABASE ---\n';

    if (regulations.length > 0) {
      context += '\nREGULASI TERKAIT:\n';
      for (const r of regulations) {
        context += `- ${r.type} ${r.regulationNumber}: "${r.title}" (${r.issuedBy}, ${r.status})`;
        if (r.sourceUrl) context += ` [${r.sourceUrl}]`;
        context += '\n';
      }
    }

    if (rules.length > 0) {
      context += '\nKEWAJIBAN KEPATUHAN:\n';
      for (const r of rules) {
        const refs = Array.isArray(r.legalReferences) ? (r.legalReferences as string[]).join(', ') : '';
        context += `- ${r.title}: ${r.description.substring(0, 150)}`;
        if (refs) context += ` (${refs})`;
        context += ` [${r.priority}]\n`;
      }
    }

    context += '--- AKHIR DATA REFERENSI ---\n';
    return context;
  }

  private extractKeywords(question: string): string[] {
    const stopWords = new Set([
      'apa', 'adalah', 'yang', 'dan', 'atau', 'di', 'ke', 'dari',
      'untuk', 'dengan', 'ini', 'itu', 'saya', 'kita', 'kami',
      'bagaimana', 'cara', 'apakah', 'bisa', 'harus', 'perlu',
      'mau', 'ingin', 'tolong', 'mohon', 'jelaskan', 'tentang',
      'the', 'is', 'a', 'an', 'how', 'what', 'where', 'when',
    ]);

    return question
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))
      .slice(0, 5);
  }

  private buildSystemPrompt(context: string = ''): string {
    const base = [
      'Kamu adalah ComplianceBot — asisten AI untuk kepatuhan hukum bisnis di Indonesia.',
      'Tugasmu membantu UMKM dan startup memahami kewajiban legal mereka.',
      'Jawab dalam Bahasa Indonesia yang jelas dan mudah dipahami.',
      'Berikan informasi tentang: perizinan usaha, NIB, NPWP, pajak, ketenagakerjaan, BPJS, dan regulasi terkait.',
      '',
      'ATURAN PENTING:',
      '1. Jika ada DATA REFERENSI di bawah, SELALU gunakan data tersebut sebagai dasar jawaban.',
      '2. SELALU cantumkan sumber/dasar hukum di akhir jawaban.',
      '3. SELALU tulis URL lengkap dengan https://.',
      '4. Jika data referensi tidak tersedia, jawab berdasarkan pengetahuan umum dan tambahkan disclaimer.',
      '5. Jangan memberikan nasihat hukum resmi — hanya informasi umum berbasis data.',
      '6. Di AKHIR setiap jawaban, tambahkan portal resmi yang relevan (2-4 link).',
    ].join('\n');

    return context ? `${base}\n${context}` : base;
  }
}
