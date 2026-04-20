# Phase 01: Auth — Registration & Login

## STATUS: ✅ Complete
## DEPENDENCY: Phase 0
## ESTIMASI: S (~1.5 jam)

## SCOPE
- [x] F-01-01: Registrasi email + password + verifikasi (Custom JWT + bcryptjs)
- [x] F-01-02: Login + logout + session management (JWT httpOnly cookie)
- [x] F-01-04: Reset password flow
- [x] Auth API routes (apps/api/src/modules/auth/)
- [x] Auth UI pages (apps/web/app/(auth)/)

## CONTEXT
MOD-01 dari blueprint. Implementasi authentication menggunakan Custom JWT.
Register via email, login, logout, reset password. JWT di httpOnly cookie.
Middleware auto-refresh token.

Blueprint ref: BAB 6 MOD-01 (F-01-01, F-01-02, F-01-04)

## NOW: ✅ Phase 01 COMPLETE
## NEXT: Phase 02 (Google SSO + RBAC)
## CRUMBS:
- apps/api/src/modules/auth/ (module, controller, service, 4 DTOs)
- apps/api/src/modules/users/ (module, controller, service, 1 DTO)
- apps/api/src/app.module.ts (added AuthModule + UsersModule)
- apps/web/app/(auth)/login/page.tsx
- apps/web/app/(auth)/register/page.tsx
- apps/web/app/(auth)/forgot-password/page.tsx
- apps/web/app/(auth)/reset-password/page.tsx
- apps/web/app/auth/callback/route.ts
- apps/web/hooks/use-auth.ts, use-user.ts
- apps/web/stores/auth-store.ts
