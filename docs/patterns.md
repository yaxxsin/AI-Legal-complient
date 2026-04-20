# 🧬 PROJECT PATTERNS

> Auto-discovered oleh Engine AI — 2026-04-20
> AI WAJIB baca file ini saat /go untuk consistency.
> JANGAN override patterns — ikuti yang ada.

## Architecture
- **Monorepo**: pnpm workspace + Turborepo. Apps di `apps/`, shared di `packages/`
  └ Evidence: pnpm-workspace.yaml, turbo.json
- **Backend**: NestJS (apps/api) — port 3001, prefix `api/v1`
  └ Evidence: apps/api/src/main.ts:28
- **Frontend**: Next.js 14 App Router (apps/web) — port 3000
  └ Evidence: apps/web/app/layout.tsx
- **Shared types**: `@localcompliance/types` di packages/types/src/
  └ Evidence: packages/types/src/index.ts

## Naming
- **Files**: kebab-case untuk semua files (documents.controller.ts, auth-store.ts)
  └ Evidence: apps/api/src/modules/documents/, apps/web/stores/
- **NestJS modules**: plural nouns (users, documents, notifications, sectors)
  └ Evidence: apps/api/src/modules/
- **Hooks**: `use-*.ts` kebab-case (use-auth.ts, use-notifications.ts)
  └ Evidence: apps/web/hooks/

## API Patterns
- **Response format**: `{ success: true, data: T, meta?: PaginationMeta }` (success) | `{ success: false, error: { code, message, details? } }` (error)
  └ Evidence: packages/types/src/api-response.ts:1-30
- **Pagination**: `?page=N&limit=N` → `PaginationMeta { page, limit, total, totalPages, hasNext, hasPrev }`
  └ Evidence: packages/types/src/api-response.ts:19-26
- **Controller pattern**: `@UseGuards(JwtAuthGuard)` di class level, `@Req() req: { user: { id: string } }` untuk user context
  └ Evidence: apps/api/src/modules/notifications/notifications.controller.ts:18,26

## Auth Patterns
- **Token storage**: document.cookie (access_token + refresh_token), bukan localStorage
  └ Evidence: apps/web/hooks/use-auth.ts:41,71-74
- **Middleware guard**: Next.js middleware.ts di root — route-based array matching
  └ Evidence: apps/web/middleware.ts:3-5
- **Backend guard**: JwtAuthGuard di `common/guards/` — class-level decorator
  └ Evidence: apps/api/src/common/guards/

## State Management
- **Client state**: Zustand (tanpa persist) untuk auth state
  └ Evidence: apps/web/stores/auth-store.ts:1,24
- **Server state**: TanStack Query (React Query) via `QueryClientProvider`, staleTime 60s, retry 1
  └ Evidence: apps/web/components/providers.tsx:14-22

## CSS & UI Patterns
- **Styling**: Tailwind CSS + shadcn/ui (components.json config)
  └ Evidence: apps/web/components.json, apps/web/tailwind.config.ts
- **Colors**: HSL CSS variables via `hsl(var(--token))` pattern
  └ Evidence: apps/web/tailwind.config.ts:17-57
- **Design tokens**: Programmatic access via `lib/design-tokens.ts` (HSL object + helpers)
  └ Evidence: apps/web/lib/design-tokens.ts:1-33
- **Typography**: Plus Jakarta Sans (heading) + Inter (body) via CSS variables
  └ Evidence: apps/web/app/layout.tsx:6-18
- **Animations**: fade-in, slide-up, scale-in, shimmer — defined in tailwind.config
  └ Evidence: apps/web/tailwind.config.ts:66-89

## NestJS Backend Patterns
- **Database**: Prisma ORM, PrismaService extends PrismaClient (global module)
  └ Evidence: apps/api/src/database/prisma.service.ts:5
- **Logging**: nestjs-pino (structured, pino-pretty in dev, redact auth headers)
  └ Evidence: apps/api/src/app.module.ts:27-37
- **Config**: ConfigModule.forRoot isGlobal, multi envFilePath fallback
  └ Evidence: apps/api/src/app.module.ts:16-24
- **Swagger**: enabled at `/api/docs`, tags per module
  └ Evidence: apps/api/src/main.ts:41-58

## Dashboard Layout
- **Structure**: Sidebar + Topbar + main content area (flex layout)
  └ Evidence: apps/web/app/(dashboard)/layout.tsx:17-25
- **Route groups**: (auth), (dashboard), (admin) — Next.js route groups
  └ Evidence: apps/web/app/
- **Locale**: `lang="id"` (Indonesian), SEO metadata in Bahasa
  └ Evidence: apps/web/app/layout.tsx:52,22-36
