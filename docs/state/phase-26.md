# Phase 26: OSS Regulation Database Pulling & Auto-Sync

## STATUS: 🟡 In Progress
## DEPENDENCY: Phase 8 (Compliance Rules), Phase 13 (Notifications)
## ESTIMASI: L (~5 jam)

## SCOPE
- [x] 1. Research OSS API endpoints (oss.go.id / NSWI public data)
- [x] 2. OSS Scraper/Fetcher service — pull regulasi terbaru secara periodik
- [x] 3. Data normalization — map format OSS ke schema ComplianceRule
- [x] 4. KBLI code mapper — auto-tag regulasi berdasarkan kode KBLI
- [x] 5. Diff engine — deteksi regulasi baru vs yang sudah ada di DB
- [x] 6. Auto-insert regulasi baru ke tabel compliance_rules
- [x] 7. Auto-update regulasi yang berubah (amandemen / pencabutan)
- [x] 8. Cron job scheduler — daily/weekly pull dari sumber OSS
- [x] 9. Notification trigger — kirim notif ke user terdampak saat ada regulasi baru
- [x] 10. Admin dashboard — log sync history, manual trigger re-sync
- [ ] 11. Fallback: manual CSV/JSON import jika API OSS tidak tersedia

## CONTEXT
Saat ini compliance rules di-seed manual via SQL/seed script.
Phase ini mengotomasi proses sinkronisasi regulasi terbaru 
dari sumber resmi pemerintah (OSS / NSWI / JDIH).

Sumber data potensial:
  - https://oss.go.id (Online Single Submission)
  - https://jdih.go.id (Jaringan Dokumentasi & Informasi Hukum)
  - https://peraturan.go.id

Arsitektur:
  CronJob (daily) → OssScraperService → DiffEngine → 
  ComplianceRuleService.upsert() → NotificationService.broadcast()

Tantangan:
  - OSS tidak memiliki public REST API resmi (mungkin perlu scraping)
  - Format data tidak konsisten antar sumber
  - Perlu human-in-the-loop validation sebelum auto-publish

## PLAN STEPS
1. [x] **Step 1: Install deps** (@nestjs/schedule, axios, cheerio)
2. [x] **Step 2: DB Schema** (RegulationSyncLog model)
3. [x] **Step 3: Migrate DB** (prisma db push + generate)
4. [x] **Step 4: RegulationSyncService** (Scraper + Diff + Cron)
5. [x] **Step 5: Controller** (Admin trigger + history API)
6. [x] **Step 6: Module wiring** (ScheduleModule + NotificationsModule)
7. [x] **Step 7: App.module** (Register RegulationSyncModule)
8. [x] **Step 8: Admin Frontend** (Sync History UI + Manual Trigger)
9. [ ] **Step 9: CSV Fallback** (Manual import endpoint)
10. [ ] **Step 10: Build Verify**

## NOW: Build verification
## NEXT: CSV fallback import (optional)
## CRUMBS: saved: ad449ec, admin-ui-created
