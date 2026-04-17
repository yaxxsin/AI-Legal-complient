# Phase 02: Auth — Google SSO & RBAC

## STATUS: ✅ Complete
## DEPENDENCY: Phase 1
## ESTIMASI: S (~1 jam)

## SCOPE
- [x] F-01-03: Google OAuth 2.0 via Supabase Auth provider
- [x] F-01-06: RBAC middleware (role + plan guards)
- [x] F-01-05: User profile management (edit nama, foto, password)
- [x] Plan-based feature gating middleware

## CONTEXT
Lanjutan MOD-01. Google SSO one-click login, merge akun by email.
Role-Based Access Control: user | admin | super_admin.
Plan-based gating: free | starter | growth | business.

Blueprint ref: BAB 6 MOD-01 (F-01-03, F-01-05, F-01-06)

## NOW: ✅ Phase 02 COMPLETE
## NEXT: Phase 03 (Onboarding Wizard)
## CRUMBS:
- apps/api/src/common/enums/user-role.enum.ts (NEW — UserRole, UserPlan enums)
- apps/api/src/common/decorators/plan.decorator.ts (NEW — @RequirePlan)
- apps/api/src/common/guards/plan.guard.ts (NEW — PlanGuard)
- apps/api/src/common/guards/roles.guard.ts (MODIFIED — attach dbUser to req)
- apps/api/src/modules/auth/auth.service.ts (MODIFIED — loginWithGoogle)
- apps/api/src/modules/auth/auth.controller.ts (MODIFIED — POST /auth/google)
- apps/api/src/modules/users/users.service.ts (MODIFIED — changePassword, softDelete)
- apps/api/src/modules/users/users.controller.ts (MODIFIED — change-password, delete endpoints)
- apps/api/src/modules/users/dto/change-password.dto.ts (NEW)
- apps/web/app/(auth)/login/page.tsx (MODIFIED — Google SSO button enabled)
- apps/web/app/(auth)/register/page.tsx (MODIFIED — Google SSO button added)
- apps/web/hooks/use-auth.ts (MODIFIED — signInWithGoogle, changePassword)
- apps/web/hooks/use-user.ts (MODIFIED — added createdAt, lastLoginAt to UserProfile)
- apps/web/app/auth/callback/route.ts (MODIFIED — sync Google users to DB)
- apps/web/app/(dashboard)/settings/page.tsx (NEW — Profile, Security, Account tabs)
- apps/web/styles/globals.css (MODIFIED — settings-input utility)

## CONTEXT:
- Google SSO: frontend → Supabase OAuth → Google → callback → sync to NestJS DB via POST /auth/google
- RolesGuard always fetches dbUser (role+plan), caches on request → PlanGuard reuses, avoids N+1
- Password change: verify old pwd via signInWithPassword, then admin.updateUserById
- Soft delete: MVP uses Supabase ban_duration (no schema migration)
- Settings page: 3 tabs (Profile, Security, Account), uses useCurrentUser + useAuth hooks
- All type checks pass (API + Web: 0 errors)

## DON'T:
- JANGAN modify schema.prisma (no migration needed for Phase 2)
- JANGAN import `useUser` → export name is `useCurrentUser`
- JANGAN lupa `!` definite assignment on DTO properties (strict mode)

## CHECKPOINT: 2026-04-17T11:29 — manual snap (Phase 02 complete)

