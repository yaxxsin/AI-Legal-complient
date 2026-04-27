import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AiProvider, findModel, getModelsForPlan, AiModelDef } from './ai-provider.interface';
import { OllamaProvider } from './ollama.provider';
import { GeminiProvider } from './gemini.provider';

@Injectable()
export class AiProviderFactory {
  private readonly logger = new Logger(AiProviderFactory.name);
  private readonly providers: Map<string, AiProvider>;

  constructor(
    private readonly ollama: OllamaProvider,
    private readonly gemini: GeminiProvider,
  ) {
    this.providers = new Map<string, AiProvider>([
      ['ollama', ollama],
      ['gemini', gemini],
    ]);
  }

  /** Get provider instance by name */
  getProvider(providerName: string): AiProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new BadRequestException(`Provider '${providerName}' tidak tersedia`);
    }
    return provider;
  }

  /** Get provider for a specific model, with plan validation */
  getProviderForModel(modelId: string, userPlan: string): { provider: AiProvider; model: AiModelDef } {
    const modelDef = findModel(modelId);
    if (!modelDef) {
      throw new BadRequestException(`Model '${modelId}' tidak ditemukan`);
    }

    // Check plan access
    if (!modelDef.plans.includes(userPlan)) {
      throw new ForbiddenException({
        code: 'PLAN_LIMIT',
        message: `Model '${modelDef.name}' tidak tersedia untuk paket ${userPlan}. Upgrade untuk mengakses.`,
      });
    }

    const provider = this.getProvider(modelDef.provider);

    // Check if provider is configured
    if (!provider.isAvailable()) {
      // Fallback to Ollama if provider not available
      this.logger.warn(`Provider '${modelDef.provider}' not available, falling back to Ollama`);
      return {
        provider: this.ollama,
        model: { ...modelDef, provider: 'ollama', id: 'llama3.2:1b' },
      };
    }

    return { provider, model: modelDef };
  }

  /** Get default model for a plan */
  getDefaultModel(plan: string): string {
    const models = getModelsForPlan(plan);
    // Prefer Gemini Flash for paid plans if available
    const geminiFlash = models.find((m) => m.id === 'gemini-2.0-flash');
    if (geminiFlash && this.gemini.isAvailable()) {
      return geminiFlash.id;
    }
    // Fallback to first available Ollama model
    return models[0]?.id ?? 'llama3.2:1b';
  }

  /** List available models for a plan (only providers that are configured) */
  getAvailableModels(plan: string): AiModelDef[] {
    const planModels = getModelsForPlan(plan);
    return planModels.filter((m) => {
      const provider = this.providers.get(m.provider);
      return provider?.isAvailable() ?? false;
    });
  }
}
