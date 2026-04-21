# Phase 13: Regulatory Alerts & Notifications

## STATUS: 🟡 In Progress
## DEPENDENCY: Phase 5
## ESTIMASI: S (~1.5 jam)

## SCOPE
- [x] Notifications API: CRUD + read/read-all + unread count
- [x] In-app notification center (bell icon + badge + dropdown)
- [x] Notifications full page with pagination
- [x] Regulatory change alert service (sector matching)
- [x] Batch notification creation for cron jobs
- [ ] F-07-02: Compliance deadline reminder cron (30d, 7d, 1d)
- [ ] Email: Resend integration for email notifications
- [ ] User preference: daily digest vs immediate

## CONTEXT
MOD-07 dari blueprint. Regulatory alert system.
Matching: regulation.sector_tags ∩ business_profile.sector_tags.

Backend: NotificationsModule (module, controller, service)
Frontend: NotificationCenter component (bell + dropdown), /notifications page,
          useNotifications hook (polling 60s)

Sesi ini juga fix beberapa infrastructure issues:
- Dashboard page missing → created (dashboard)/dashboard/page.tsx
- Chat + Checklist pages missing → created (dashboard)/chat/ dan (dashboard)/checklist/
- ChatModule backend missing → created full module with Ollama integration
- OLLAMA_MODEL env mismatch → switched qwen2.5 → llama3.2:1b (model yang ter-install)
- /learn executed → docs/patterns.md created (25 patterns, 10 categories)

Key insight: Next.js route group (dashboard) TIDAK membuat URL segment.
Pages harus di (dashboard)/dashboard/page.tsx untuk URL /dashboard.

API endpoints:
- GET /notifications (paginated, filter by type/isRead)
- GET /notifications/unread-count
- PATCH /notifications/:id/read
- POST /notifications/read-all
- DELETE /notifications/:id
- POST /chat (NEW — Ollama integration)

Blueprint ref: BAB 6 MOD-07 (F-07-01, F-07-02)

## NOW: Cron jobs for deadline reminders
## NEXT:
1. Add deadline reminder cron (30d, 7d, 1d before expiry)
2. Add Resend email integration for notifications
3. Add user notification preferences

## DON'T:
- Regulation model has `type` NOT `category`
- NotificationCenter already integrated in Topbar
- Route group (dashboard) DOESN'T create URL segment — pages need subfolder
- OLLAMA_MODEL harus match model yang ter-install (cek `ollama list`)
- NestJS TIDAK hot-reload env vars — harus restart server
- Chat frontend reads token from document.cookie `access_token`

## CRUMBS:
- saved: f73a72c → ChatModule + dashboard/chat/checklist routes

## CHECKPOINT: 2026-04-20T17:34 — notifications done, dashboard/chat/checklist pages fixed, ChatModule + Ollama connected, /learn patterns saved
