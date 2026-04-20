# Phase 07: ComplianceBot Chat UI

## STATUS: 🏃 In Progress
## DEPENDENCY: Phase 6
## ESTIMASI: S (~1.5 jam)

## SCOPE
- [x] Dev mode graceful degradation (all services)
- [x] Dashboard page (/dashboard) — stats + quick actions
- [ ] F-03-01: Chat UI — sidebar conversation list + chat area
- [ ] Chat bubbles (user: kanan/accent, bot: kiri/neutral)
- [ ] Streaming display (SSE consumer)
- [ ] F-03-03: Suggested questions grid (2 kolom, card + ikon)
- [ ] F-03-04: Riwayat percakapan sidebar (grouped by date)
- [ ] Feedback per message (thumbs up/down)

## CONTEXT
MOD-03 bagian frontend. Full chat interface dengan sidebar conversation list
dan area chat. Streaming response consumption. Suggested questions engine.
Dev mode: semua services graceful degrade tanpa Supabase/DB/Pinecone.
Auth bypass via mock user di guard (API) dan AuthInitializer (web).

Blueprint ref: BAB 6 MOD-03 (F-03-01 UI, F-03-03, F-03-04)

## NOW: Verify chat UI renders correctly with mock auth
## NEXT: Test SSE streaming, wire up Ollama, verify edge cases
## DON'T: Jangan pakai getOrThrow() untuk external services — selalu graceful degrade
## CHECKPOINT: 2026-04-20T11:32 — manual snap, dev mode fixes complete
## CRUMBS:
- [2026-04-20] chat/page.tsx: chat UI layout + SSE consumer
- [2026-04-20] hooks/use-chat.ts: chat hook with SSE streaming
- [2026-04-20] components/chat: ChatSidebar, ChatBubble, ChatInput, SuggestedQuestions
- [2026-04-20] dashboard/page.tsx: NEW — stats grid + quick actions
- [2026-04-20] providers.tsx: AuthInitializer + dev mode mock user
- [2026-04-20] auth.service.ts, users.service.ts, prisma.service.ts: graceful degradation
- [2026-04-20] supabase-auth.guard.ts: dev mode bypass
- [2026-04-20] app.module.ts: env path fix (../../.env)
- [2026-04-20] main.ts: compression import fix
- [2026-04-20] docs/patterns.md: NEW — 8 patterns saved

