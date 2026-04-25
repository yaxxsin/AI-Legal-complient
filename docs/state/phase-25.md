# Phase 25: Multi-AI Model Integration (Claude, GPT, Gemini)

## STATUS: 📋 Planned
## DEPENDENCY: Phase 6 (ComplianceBot / Chat)
## ESTIMASI: L (~4 jam)

## SCOPE
- [ ] 1. AI Provider abstraction layer (interface: generateMessage, streamMessage)
- [ ] 2. Ollama adapter (existing — refactor ke interface baru)
- [ ] 3. Claude adapter (Anthropic API — claude-sonnet-4-20250514 / claude-3.5-haiku)
- [ ] 4. OpenAI adapter (GPT-4o / GPT-4o-mini)
- [ ] 5. Google Gemini adapter (gemini-2.5-pro / gemini-2.5-flash)
- [ ] 6. Model selector di Chat UI (user bisa pilih model per conversation)
- [ ] 7. Admin config — set default model & enable/disable model per plan
- [ ] 8. Fallback chain — jika model utama down, otomatis fallback ke model lain
- [ ] 9. Token usage tracking per model (untuk billing & analytics)
- [ ] 10. Streaming support untuk semua provider

## CONTEXT
Saat ini ComplianceBot hanya menggunakan Ollama (local inference).
Phase ini membangun abstraction layer agar sistem bisa plug-in 
ke berbagai AI provider tanpa mengubah business logic.

Arsitektur:
  ChatService → AiProviderFactory → [OllamaProvider, ClaudeProvider, OpenAIProvider, GeminiProvider]

Plan-based access:
  - Free: Ollama only
  - Starter: + Gemini Flash
  - Growth: + Claude Haiku, GPT-4o-mini
  - Business: All models termasuk Claude Sonnet, GPT-4o

## NOW: Step 1/10 — Install Gemini SDK
## NEXT: -
## CRUMBS: -
