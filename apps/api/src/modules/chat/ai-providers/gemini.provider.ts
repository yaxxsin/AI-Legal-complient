import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProvider, ChatMessage, AiOptions, AiResponse } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly provider = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenerativeAI | null = null;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_AI_API_KEY') ?? '';

    if (this.apiKey && !this.apiKey.includes('REPLACE') && !this.apiKey.includes('YOUR')) {
      this.client = new GoogleGenerativeAI(this.apiKey);
      this.logger.log('Gemini AI initialized');
    } else {
      this.logger.warn('Gemini AI not configured — GOOGLE_AI_API_KEY missing');
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async chat(
    messages: ChatMessage[],
    options?: AiOptions & { model?: string },
  ): Promise<AiResponse> {
    if (!this.client) {
      throw new Error('Gemini AI not configured. Set GOOGLE_AI_API_KEY in .env');
    }

    const modelId = options?.model ?? 'gemini-2.0-flash';

    // Separate system prompt from conversation
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const model = this.client.getGenerativeModel({
      model: modelId,
      systemInstruction: systemMsg?.content,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    });

    // Convert to Gemini format: { role: 'user'|'model', parts: [{ text }] }
    const history = chatMessages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = chatMessages[chatMessages.length - 1];

    this.logger.debug(`Gemini request → ${modelId}`);

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      const content = response.text();
      const usage = response.usageMetadata;

      return {
        content,
        model: modelId,
        provider: this.provider,
        tokensUsed: usage?.totalTokenCount,
      };
    } catch (error: any) {
      this.logger.error(`Gemini error: ${error.message}`);
      throw new Error(`Gemini AI error: ${error.message}`);
    }
  }
}
