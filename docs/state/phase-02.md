# Phase 02: Auth — Google SSO & RBAC

## STATUS: ✅ Complete (RBAC done, Google SSO deferred)
## DEPENDENCY: Phase 1
## ESTIMASI: S (~1 jam)

## SCOPE
- [ ] F-01-03: Google OAuth 2.0 — DEFERRED to Phase 2 extensions
- [x] F-01-06: RBAC middleware (role + plan guards)
- [x] F-01-05: User profile management (edit nama, foto, password)
- [x] Plan-based feature gating middleware

## CONTEXT
Lanjutan MOD-01. Google SSO ditunda — fokus RBAC dulu.
Role-Based Access Control: user | admin | super_admin.
Plan-based gating: free | starter | growth | business.
Auth: Custom JWT (bcryptjs + jsonwebtoken).

**INFRA MIGRATION COMPLETED** (2026-04-20):
- Supabase Auth → Custom JWT (bcryptjs + jsonwebtoken + httpOnly cookies)
- Supabase DB → PostgreSQL 16 (Docker)
- Supabase Storage → MinIO (S3-compatible, Docker)
- Vercel/Railway → Docker Compose full stack
- All controllers, guards, hooks, pages migrated
- 0 type errors on both API and Web
- Committed: c6d8ce7 → origin/feature/phase-12-doc-cms

Blueprint ref: BAB 6 MOD-01 (F-01-05, F-01-06)

## NOW: ✅ Infra migration COMPLETE — ready for next phase
## NEXT:
1. Run `npx prisma db push` to apply passwordHash column to live DB
2. Test full auth flow: Register → Login → Protected route → Refresh token
3. Continue to Phase 13 (Regulatory Alerts & Notifications)

## DON'T:
- JANGAN import `useUser` → export name is `useCurrentUser`
- JANGAN lupa `!` definite assignment on DTO properties (strict mode)
- JANGAN import from 'supabase-auth.guard' → use 'jwt-auth.guard'
- JANGAN pakai `@supabase/supabase-js` atau `@supabase/ssr` — sudah dihapus
- JANGAN pakai `createClient()` dari `@/lib/supabase/client` — sudah stub error
- JWT expiresIn HARUS numeric (seconds), bukan string — jsonwebtoken v9 strict types

## CRUMBS:
- apps/api/src/modules/auth/ (module, controller, service, 4 DTOs)
- apps/api/src/modules/users/ (module, controller, service, 1 DTO)
- apps/api/src/common/guards/jwt-auth.guard.ts (NEW — primary auth guard)
- apps/api/src/common/guards/supabase-auth.guard.ts (stub → re-exports JwtAuthGuard)
- apps/web/middleware.ts (reads JWT from cookie)
- apps/web/hooks/use-auth.ts (calls NestJS API directly)
- apps/web/hooks/use-user.ts (reads JWT from cookie)
- apps/web/app/(auth)/*.tsx (all use useAuth hook, no Supabase)
- apps/web/app/(dashboard)/onboarding/page.tsx (getCookie helper)
- docker-compose.yml, Dockerfile (api + web), .dockerignore
- schema.prisma (passwordHash field added)
- README.md (updated tech stack + Docker commands)

## CHECKPOINT: 2026-04-20T16:44 — manual snap after infra migration commit (c6d8ce7)
