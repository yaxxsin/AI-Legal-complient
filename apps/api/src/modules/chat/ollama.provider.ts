import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export const OLLAMA_CLIENT = 'OLLAMA_CLIENT';

/** Ollama exposes an OpenAI-compatible API — reuse the OpenAI SDK */
export const OllamaProvider: Provider = {
  provide: OLLAMA_CLIENT,
  useFactory: (config: ConfigService): OpenAI => {
    const baseURL = config.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );

    return new OpenAI({
      baseURL: `${baseURL}/v1`,
      apiKey: 'ollama', // Ollama doesn't need a real key
    });
  },
  inject: [ConfigService],
};
