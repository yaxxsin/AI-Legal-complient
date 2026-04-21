import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ollamaUrl: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.ollamaUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://localhost:11434';
    this.model = this.config.get<string>('OLLAMA_MODEL') ?? 'llama3.2:1b';
    this.logger.log(`Ollama config: ${this.ollamaUrl} / model: ${this.model}`);
  }

  /** Send a message to Ollama and return the AI reply */
  async chat(message: string, userId: string): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const url = `${this.ollamaUrl}/api/chat`;

    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
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
        throw new InternalServerErrorException(
          `AI service error: ${response.status}`,
        );
      }

      const data = await response.json();
      const reply = data.message?.content;

      if (!reply) {
        this.logger.warn('Ollama returned empty reply');
        return 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';
      }

      return reply;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;

      this.logger.error(`Chat failed: ${(error as Error).message}`);
      throw new InternalServerErrorException(
        'Gagal menghubungi AI. Pastikan Ollama berjalan.',
      );
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
