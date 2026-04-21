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

  /** Send a message to Ollama with optional conversation history and save */
  async chat(message: string, userId: string, conversationId?: string) {
    let convoId = conversationId;

    if (!convoId) {
      // Create new conversation
      const newConvo = await this.prisma.conversation.create({
        data: {
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        }
      });
      convoId = newConvo.id;
    } else {
      // Verify conversation belongs to user
      const exists = await this.prisma.conversation.findUnique({ where: { id: convoId } });
      if (!exists || exists.userId !== userId) {
        throw new NotFoundException('Conversation not found');
      }
      
      // Update its updatedAt timestamp to bubble it to top
      await this.prisma.conversation.update({
        where: { id: convoId },
        data: { updatedAt: new Date() }
      });
    }

    // Save user message to database
    await this.prisma.message.create({
      data: {
        conversationId: convoId,
        role: 'user',
        content: message,
      }
    });

    // Retrieve previous messages for context
    const history = await this.prisma.message.findMany({
      where: { conversationId: convoId },
      orderBy: { createdAt: 'asc' },
      take: 10, // Take last 10 messages for context to limit token usage
    });

    const systemPrompt = this.buildSystemPrompt();
    const url = `${this.ollamaUrl}/api/chat`;

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role, content: msg.content })) // Includes the user message just saved
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
          // If model is missing, we shouldn't save the error message as bot reply unless wanted.
          // We will return error message to user, but let's save it too for persistence.
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
          data: { conversationId: convoId!, role: 'assistant', content: emptyMsg } // Added ! to satisfy TypeScript as we know convoId is defined here
        });
        return { conversationId: convoId, reply: emptyMsg };
      }

      // Save assistant reply
      await this.prisma.message.create({
        data: {
          conversationId: convoId!,
          role: 'assistant',
          content: reply,
        }
      });

      return { conversationId: convoId, reply };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;

      this.logger.error(`Chat failed: ${(error as Error).message}`);
      throw new InternalServerErrorException('Gagal menghubungi AI. Pastikan Ollama berjalan.');
    }
  }
  /** Generates direct message without specific ComplianceBot prompt (used by BullMQ Worker) */
  async generateDirectMessage(prompt: string): Promise<string> {
    const url = `${this.ollamaUrl}/api/chat`;
    const payload = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { temperature: 0.1, num_predict: 2048 }, // Low temperature for consistent JSON
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
  /** System prompt for ComplianceBot */
  private buildSystemPrompt(): string {
    return [
      'Kamu adalah ComplianceBot — asisten AI untuk kepatuhan hukum bisnis di Indonesia.',
      'Tugasmu membantu UMKM dan startup memahami kewajiban legal mereka.',
      'Jawab dalam Bahasa Indonesia yang jelas dan mudah dipahami.',
      'Berikan informasi tentang: perizinan usaha, NIB, NPWP, pajak, ketenagakerjaan, BPJS, dan regulasi terkait.',
      'Jika tidak yakin, sampaikan bahwa ini informasi umum dan sarankan konsultasi dengan ahli hukum.',
      'Jangan memberikan nasihat hukum resmi — hanya informasi umum.',
    ].join(' ');
  }
}
