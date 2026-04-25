import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, ChatMessage, AiOptions, AiResponse } from './ai-provider.interface';

@Injectable()
export class OllamaProvider implements AiProvider {
  readonly provider = 'ollama';
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://localhost:11434';
    this.defaultModel = this.config.get<string>('OLLAMA_MODEL') ?? 'llama3.2:1b';
  }

  isAvailable(): boolean {
    return true; // Ollama is always "available" as local service
  }

  async chat(
    messages: ChatMessage[],
    options?: AiOptions & { model?: string },
  ): Promise<AiResponse> {
    const model = options?.model ?? this.defaultModel;
    const url = `${this.baseUrl}/api/chat`;

    const payload = {
      model,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 1024,
      },
    };

    this.logger.debug(`Ollama request → ${model}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Ollama HTTP ${response.status}: ${errorText}`);

      if (response.status === 404 && errorText.includes('not found')) {
        return {
          content: `Model '${model}' tidak ditemukan di Ollama. Jalankan: \`ollama pull ${model}\``,
          model,
          provider: this.provider,
        };
      }

      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.message?.content ?? '';

    return {
      content,
      model,
      provider: this.provider,
      tokensUsed: data.eval_count,
    };
  }
}
