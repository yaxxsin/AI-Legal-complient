# Phase 26: OSS Regulation Database Pulling & Auto-Sync

## STATUS: 🟡 In Progress
## DEPENDENCY: Phase 8 (Compliance Rules), Phase 13 (Notifications)
## ESTIMASI: L (~5 jam)

## SCOPE
- [ ] 1. Research OSS API endpoints (oss.go.id / NSWI public data)
- [ ] 2. OSS Scraper/Fetcher service — pull regulasi terbaru secara periodik
- [ ] 3. Data normalization — map format OSS ke schema ComplianceRule
- [ ] 4. KBLI code mapper — auto-tag regulasi berdasarkan kode KBLI
- [ ] 5. Diff engine — deteksi regulasi baru vs yang sudah ada di DB
- [ ] 6. Auto-insert regulasi baru ke tabel compliance_rules
- [ ] 7. Auto-update regulasi yang berubah (amandemen / pencabutan)
- [ ] 8. Cron job scheduler — daily/weekly pull dari sumber OSS
- [ ] 9. Notification trigger — kirim notif ke user terdampak saat ada regulasi baru
- [ ] 10. Admin dashboard — log sync history, manual trigger re-sync
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

## NOW: -
## NEXT: -
## CRUMBS: -
