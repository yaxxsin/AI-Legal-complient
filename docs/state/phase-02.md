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

Blueprint ref: BAB 6 MOD-01 (F-01-05, F-01-06)

## NOW: ✅ Phase 02 COMPLETE (RBAC)
## NEXT: Phase 03 (Onboarding Wizard)
## CRUMBS:
- apps/api/src/common/enums/user-role.enum.ts (UserRole, UserPlan enums)
- apps/api/src/common/decorators/plan.decorator.ts (@RequirePlan)
- apps/api/src/common/guards/plan.guard.ts (PlanGuard)
- apps/api/src/common/guards/roles.guard.ts (attach dbUser to req)
- apps/api/src/common/guards/jwt-auth.guard.ts (JWT verification)
- apps/api/src/modules/auth/auth.service.ts (Custom JWT auth)
- apps/api/src/modules/auth/auth.controller.ts (register, login, reset)
- apps/api/src/modules/users/users.service.ts (bcrypt changePassword)
- apps/api/src/modules/users/users.controller.ts (change-password, delete)
- apps/web/app/(auth)/login/page.tsx (email + password only)
- apps/web/app/(auth)/register/page.tsx
- apps/web/hooks/use-auth.ts (API-based auth, no Supabase)
- apps/web/hooks/use-user.ts (JWT from cookie)
- apps/web/app/(dashboard)/settings/page.tsx (Profile, Security, Account)

## DON'T:
- JANGAN import `useUser` → export name is `useCurrentUser`
- JANGAN lupa `!` definite assignment on DTO properties (strict mode)
- JANGAN import from 'supabase-auth.guard' → use 'jwt-auth.guard'

## CHECKPOINT: 2026-04-20T16:32 — infra migration (Supabase → Docker)
