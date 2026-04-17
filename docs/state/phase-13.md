# Phase 13: Regulatory Alerts & Notifications

## STATUS: ⬜ Not Started
## DEPENDENCY: Phase 5
## ESTIMASI: S (~1.5 jam)

## SCOPE
- [ ] F-07-01: Regulatory change alert (email < 24 jam, sector matching)
- [ ] In-app notification center (bell icon + badge + dropdown)
- [ ] F-07-02: Compliance deadline reminder cron (30d, 7d, 1d)
- [ ] Email: Resend + HTML template, batch processing
- [ ] User preference: daily digest vs immediate
- [ ] Notifications API: CRUD + read/read-all + preferences

## CONTEXT
MOD-07 dari blueprint. Regulatory alert system.
Matching: regulation.sector_tags ∩ business_profile.sector_tags.
Cron jobs: daily digest 08:00 WIB, deadline reminders 07:00 WIB.

Blueprint ref: BAB 6 MOD-07 (F-07-01, F-07-02)

## NOW: -
## NEXT: -
## CRUMBS: -
