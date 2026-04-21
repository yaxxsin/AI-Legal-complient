import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ollamaUrl: string;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.ollamaUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://localhost:11434';
    this.model = this.config.get<string>('OLLAMA_MODEL') ?? 'llama3.2:1b';
    this.logger.log(`Ollama config: ${this.ollamaUrl} / model: ${this.model}`);
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { messages: true } }
      }
    });
  }

  async getConversation(id: string, userId: string) {
    const convo = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    if (!convo || convo.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    return convo;
  }

  /** Send a message to Ollama with regulation context and conversation history */
  async chat(message: string, userId: string, conversationId?: string) {
    let convoId = conversationId;

    if (!convoId) {
      const newConvo = await this.prisma.conversation.create({
        data: {
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        }
      });
      convoId = newConvo.id;
    } else {
      const exists = await this.prisma.conversation.findUnique({ where: { id: convoId } });
      if (!exists || exists.userId !== userId) {
        throw new NotFoundException('Conversation not found');
      }
      await this.prisma.conversation.update({
        where: { id: convoId },
        data: { updatedAt: new Date() }
      });
    }

    // Save user message
    await this.prisma.message.create({
      data: { conversationId: convoId, role: 'user', content: message }
    });

    // Retrieve conversation history
    const history = await this.prisma.message.findMany({
      where: { conversationId: convoId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // RAG-lite: retrieve relevant context from DB
    const context = await this.retrieveContext(message);
    const systemPrompt = this.buildSystemPrompt(context);

    const url = `${this.ollamaUrl}/api/chat`;
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role, content: msg.content }))
    ];

    const payload = {
      model: this.model,
      messages: chatMessages,
      stream: false,
      options: { temperature: 0.7, num_predict: 1024 },
    };

    this.logger.debug(`Chat request to ${url} with model ${this.model}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Ollama HTTP ${response.status}: ${errorText}`);

        if (response.status === 404 && errorText.includes('not found')) {
          const errorMsg = `Maaf, model AI '${this.model}' tidak ditemukan di Ollama lokal Anda. Silakan buka terminal dan jalankan perintah: \`ollama pull ${this.model}\``;
          await this.prisma.message.create({
            data: { conversationId: convoId, role: 'assistant', content: errorMsg }
          });
          return { conversationId: convoId, reply: errorMsg };
        }

        throw new InternalServerErrorException(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.message?.content;

      if (!reply) {
        this.logger.warn('Ollama returned empty reply');
        const emptyMsg = 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';
        await this.prisma.message.create({
          data: { conversationId: convoId!, role: 'assistant', content: emptyMsg }
        });
        return { conversationId: convoId, reply: emptyMsg };
      }

      // Save assistant reply
      await this.prisma.message.create({
        data: { conversationId: convoId!, role: 'assistant', content: reply }
      });

      return { conversationId: convoId, reply };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(`Chat failed: ${(error as Error).message}`);
      throw new InternalServerErrorException('Gagal menghubungi AI. Pastikan Ollama berjalan.');
    }
  }

  /** Generates direct message without ComplianceBot prompt (used by OCR/BullMQ) */
  async generateDirectMessage(prompt: string): Promise<string> {
    const url = `${this.ollamaUrl}/api/chat`;
    const payload = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.1, num_predict: 2048 },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new InternalServerErrorException(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      return data.message?.content || '{}';
    } catch (error) {
      this.logger.error(`Direct chat failed: ${(error as Error).message}`);
      throw new InternalServerErrorException('Gagal menghubungi AI.');
    }
  }

  /**
   * RAG-lite: Retrieve relevant regulations & compliance rules
   * based on keyword matching from the user's question.
   */
  private async retrieveContext(question: string): Promise<string> {
    const keywords = this.extractKeywords(question);
    if (keywords.length === 0) return '';

    const searchConditions = keywords.map(k => ({
      OR: [
        { title: { contains: k, mode: 'insensitive' as const } },
        { contentRaw: { contains: k, mode: 'insensitive' as const } },
      ],
    }));

    // Query regulations
    const regulations = await this.prisma.regulation.findMany({
      where: { OR: searchConditions.flatMap(c => c.OR) },
      select: {
        title: true,
        regulationNumber: true,
        type: true,
        issuedBy: true,
        status: true,
        sourceUrl: true,
      },
      take: 5,
      orderBy: { issuedDate: 'desc' },
    });

    // Query compliance rules
    const rules = await this.prisma.complianceRule.findMany({
      where: {
        isPublished: true,
        OR: keywords.map(k => ({
          OR: [
            { title: { contains: k, mode: 'insensitive' as const } },
            { description: { contains: k, mode: 'insensitive' as const } },
          ],
        })).flatMap(c => c.OR),
      },
      select: {
        title: true,
        description: true,
        priority: true,
        legalReferences: true,
      },
      take: 5,
    });

    if (regulations.length === 0 && rules.length === 0) return '';

    let context = '\n\n--- DATA REFERENSI DARI DATABASE ---\n';

    if (regulations.length > 0) {
      context += '\n📜 REGULASI TERKAIT:\n';
      for (const r of regulations) {
        context += `- ${r.type} ${r.regulationNumber}: "${r.title}" (Diterbitkan oleh: ${r.issuedBy}, Status: ${r.status})`;
        if (r.sourceUrl) context += ` [Sumber: ${r.sourceUrl}]`;
        context += '\n';
      }
    }

    if (rules.length > 0) {
      context += '\n✅ KEWAJIBAN KEPATUHAN:\n';
      for (const r of rules) {
        const refs = Array.isArray(r.legalReferences) ? (r.legalReferences as string[]).join(', ') : '';
        context += `- ${r.title}: ${r.description.substring(0, 150)}`;
        if (refs) context += ` (Dasar hukum: ${refs})`;
        context += ` [Prioritas: ${r.priority}]\n`;
      }
    }

    context += '--- AKHIR DATA REFERENSI ---\n';
    return context;
  }

  /** Extract meaningful keywords from user question */
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
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 5); // Max 5 keywords
  }

  /** System prompt with injected regulation context */
  private buildSystemPrompt(context: string = ''): string {
    const base = [
      'Kamu adalah ComplianceBot — asisten AI untuk kepatuhan hukum bisnis di Indonesia.',
      'Tugasmu membantu UMKM dan startup memahami kewajiban legal mereka.',
      'Jawab dalam Bahasa Indonesia yang jelas dan mudah dipahami.',
      'Berikan informasi tentang: perizinan usaha, NIB, NPWP, pajak, ketenagakerjaan, BPJS, dan regulasi terkait.',
      '',
      'ATURAN PENTING:',
      '1. Jika ada DATA REFERENSI di bawah, SELALU gunakan data tersebut sebagai dasar jawaban.',
      '2. SELALU cantumkan sumber/dasar hukum di akhir jawaban dalam format: "📎 Sumber: [nama regulasi, nomor, URL jika ada]".',
      '3. Jika data referensi tidak tersedia, jawab berdasarkan pengetahuan umum dan tambahkan catatan: "⚠️ Informasi ini bersifat umum. Silakan verifikasi di jdih.go.id atau konsultasi ahli hukum."',
      '4. Jangan memberikan nasihat hukum resmi — hanya informasi umum berbasis data.',
    ].join('\n');

    return context ? `${base}\n${context}` : base;
  }
}
