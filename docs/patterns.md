# 🧬 PROJECT PATTERNS

> Auto-discovered dan manually logged.
> AI WAJIB baca file ini saat /go untuk consistency.
> JANGAN override patterns — ikuti yang ada.

## Service Resilience
- **Graceful Degradation**: External services (Supabase, Pinecone, Prisma) pakai `get()` + null check, BUKAN `getOrThrow()`. Service tetap jalan tanpa config real.
  └ Evidence: apps/api/src/modules/auth/auth.service.ts:22-35
- **Nullable Provider**: Pattern `private readonly client: Client | null` + `requireClient()` helper. Throw di runtime, BUKAN di constructor.
  └ Evidence: apps/api/src/modules/rag/pinecone.provider.ts:9-18
- **Prisma Connect**: `$connect()` wrapped in try/catch — warn log, bukan crash.
  └ Evidence: apps/api/src/database/prisma.service.ts:10-20

## Placeholder Detection
- **Env Check**: Selalu cek `includes('your-project')` DAN `includes('placeholder')` untuk detect env belum diisi.
  └ Evidence: apps/web/middleware.ts:15, apps/api/src/modules/auth/auth.service.ts:25

## Monorepo Config
- **Env Path**: NestJS runs dari `apps/api/`, env file di monorepo root → butuh `../../.env` di ConfigModule `envFilePath`.
  └ Evidence: apps/api/src/app.module.ts:19-24
- **CJS Import**: NestJS (CommonJS) pakai `import * as X` untuk packages tanpa ESM default export (e.g. `compression`).
  └ Evidence: apps/api/src/main.ts:6

## Auth Patterns
- **Dev Mode Bypass**: Guard inject mock user `{ id: 'dev-user-001' }` saat Supabase placeholder.
  └ Evidence: apps/api/src/common/guards/supabase-auth.guard.ts:28-31
- **Frontend Auth Init**: `AuthInitializer` di providers.tsx inject mock user ke Zustand store saat dev mode.
  └ Evidence: apps/web/components/providers.tsx:11-31

## State Management
- **Auth Store**: Zustand (bukan Context). Global `useAuthStore` dengan `user | null` + `isLoading`.
  └ Evidence: apps/web/stores/auth-store.ts

## Route Groups
- **`(dashboard)`**: Protected routes + sidebar layout (Sidebar + Topbar)
- **`(auth)`**: Minimal centered layout (login, register, forgot-password)
- **`(admin)`**: Admin routes (future)
  └ Evidence: apps/web/app/(dashboard)/layout.tsx, apps/web/app/(auth)/layout.tsx

## API Patterns
- **Prefix**: Semua endpoint di bawah `/api/v1/`
- **SSE Streaming**: Chat response via `text/event-stream`, data format `{ content: chunk }`, end with `[DONE]`
  └ Evidence: apps/api/src/modules/chat/chat.controller.ts:125-141
- **Auth Guard**: `@UseGuards(SupabaseAuthGuard)` per-controller, bukan per-route
  └ Evidence: apps/api/src/modules/chat/chat.controller.ts:34
