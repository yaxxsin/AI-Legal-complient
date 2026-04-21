# Phase 24: Session Management & Security Hardening

## STATUS: 📋 Planned
## DEPENDENCY: Phase 2 (Auth)
## ESTIMASI: M (~3 jam)

## SCOPE
- [ ] 1. Refresh Token rotation (access token short-lived, refresh token long-lived)
- [ ] 2. Session table di DB (track active sessions per user + device info)
- [ ] 3. Multi-device session list — user bisa lihat semua sesi aktif
- [ ] 4. Revoke session — user bisa logout device tertentu dari settings
- [ ] 5. Auto-expire idle sessions (configurable TTL)
- [ ] 6. Rate limiting per endpoint (throttler guard)
- [ ] 7. CSRF protection untuk cookie-based auth
- [ ] 8. Secure cookie flags (httpOnly, sameSite, secure)
- [ ] 9. Login activity log (IP, user-agent, timestamp)
- [ ] 10. Force logout all sessions (untuk password change / security breach)

## CONTEXT
Memperkuat manajemen sesi agar aman untuk production.
Saat ini auth menggunakan JWT stateless via cookie.
Phase ini menambahkan session tracking server-side untuk 
visibility dan kontrol penuh atas sesi pengguna aktif.

Stack: NestJS Guards + Prisma Session model + Redis (optional cache)

## NOW: -
## NEXT: -
## CRUMBS: -
