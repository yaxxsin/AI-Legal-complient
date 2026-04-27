/** Unified message format across all AI providers */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Options for AI generation */
export interface AiOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** Response from AI provider */
export interface AiResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}

/** Model definition with plan access control */
export interface AiModelDef {
  id: string;
  name: string;
  provider: string;
  plans: string[]; // which plans can access this model
}

/** AI Provider adapter interface */
export interface AiProvider {
  readonly provider: string;

  /** Send messages and get a complete response */
  chat(messages: ChatMessage[], options?: AiOptions): Promise<AiResponse>;

  /** Check if the provider is available (keys configured, service reachable) */
  isAvailable(): boolean;
}

/** Available models registry */
export const AI_MODELS: AiModelDef[] = [
  // Ollama (local) — available to all plans
  { id: 'llama3.2:1b', name: 'Llama 3.2 (1B)', provider: 'ollama', plans: ['free', 'starter', 'growth', 'business'] },
  { id: 'qwen2.5:latest', name: 'Qwen 2.5', provider: 'ollama', plans: ['free', 'starter', 'growth', 'business'] },

  // Gemini — paid plans
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', plans: ['starter', 'growth', 'business'] },
  { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro', provider: 'gemini', plans: ['growth', 'business'] },
];

/** Get models available for a given plan */
export function getModelsForPlan(plan: string): AiModelDef[] {
  return AI_MODELS.filter((m) => m.plans.includes(plan));
}

/** Find a model definition by ID */
export function findModel(modelId: string): AiModelDef | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}
