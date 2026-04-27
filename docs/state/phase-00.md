# Phase 00: Foundation & Setup

## STATUS: ✅ Complete
## DEPENDENCY: None
## ESTIMASI: M (~2 jam)

## SCOPE
- [x] Monorepo scaffold (apps/web + apps/api + packages/)
- [x] Next.js 14 App Router setup (apps/web)
- [x] NestJS setup (apps/api)
- [x] Prisma schema + PostgreSQL (Docker) connection
- [x] Shared types (packages/types/)
- [x] Design system: Tailwind + shadcn/ui + color tokens
- [x] .env.example + config files
- [x] CI/CD: GitHub Actions skeleton
- [x] README + branch strategy
- [x] Docker Compose: PostgreSQL + Redis + MinIO + API + Web

## CONTEXT
Sprint 0 dari blueprint. Setup seluruh infrastruktur project: monorepo structure,
framework scaffolding (Next.js + NestJS), database schema via Prisma, Docker infra,
Tailwind + shadcn/ui design system, dan CI/CD pipeline dasar.

Blueprint ref: BAB 2 (Tech Stack), BAB 5 (File Structure), Sprint 0 (BAB 7)

## NOW: ✅ Phase 00 COMPLETE
## NEXT: Phase 1 (Auth) or Phase 4/5/14 (parallel)
## CRUMBS:
- package.json, pnpm-workspace.yaml, turbo.json (root)
- apps/web: package.json, layouts, middleware, sidebar, topbar
- apps/api: package.json, main.ts, app.module, prisma module, guards, filters
- packages/types: user, business-profile, compliance, api-response
- packages/utils: format-date, format-currency
- prisma/schema.prisma (19 models), prisma/seed.ts
- tailwind.config.ts, globals.css, design-tokens.ts, components.json
- .env, docker-compose.yml, apps/api/Dockerfile, apps/web/Dockerfile
- .github/workflows/ci.yml, README.md
