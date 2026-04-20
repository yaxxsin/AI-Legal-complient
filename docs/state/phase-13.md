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

API endpoints:
- GET /notifications (paginated, filter by type/isRead)
- GET /notifications/unread-count
- PATCH /notifications/:id/read
- POST /notifications/read-all
- DELETE /notifications/:id

Blueprint ref: BAB 6 MOD-07 (F-07-01, F-07-02)

## NOW: Cron jobs for deadline reminders
## NEXT:
1. Add deadline reminder cron (30d, 7d, 1d before expiry)
2. Add Resend email integration for notifications
3. Add user notification preferences

## DON'T:
- Regulation model has `type` NOT `category`
- NotificationCenter already integrated in Topbar

## CRUMBS:
- apps/api/src/modules/notifications/ (module, controller, service)
- apps/web/hooks/use-notifications.ts
- apps/web/components/notifications/notification-center.tsx
- apps/web/app/(dashboard)/notifications/page.tsx
- apps/web/components/layout/topbar.tsx (updated — uses NotificationCenter)
- apps/api/src/app.module.ts (NotificationsModule added)

## CHECKPOINT: 2026-04-20T16:54 — notifications CRUD + UI done, cron pending
