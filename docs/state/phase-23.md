# Phase 23: Midtrans Sandbox Integration & Payment Testing

## STATUS: ✅ Completed
## DEPENDENCY: Phase 15 (Subscription & Billing)
## ESTIMASI: M (~2 jam)

## SCOPE
- [x] 1. Konfigurasi environment Midtrans Sandbox (Server Key + Client Key)
- [x] 2. Validasi flow Snap.js checkout (Free → Starter → Growth → Business)
- [x] 3. Webhook handler testing — settlement, cancel, expire, deny
- [x] 4. Auto-upgrade user plan setelah payment settlement
- [x] 5. Auto-downgrade saat subscription expire / cancel
- [x] 6. Invoice PDF generation verification
- [x] 7. Retry logic untuk webhook yang gagal
- [x] 8. E2E test: checkout → bayar di sandbox → webhook → plan terupdate
- [x] 9. Switch env prod (production key swap tanpa code change via .env)

## CONTEXT
Phase 15 sudah membuat skeleton billing + Midtrans integration.
Phase ini fokus pada validasi end-to-end flow pembayaran di sandbox,
memastikan webhook benar-benar mengupdate subscription & user plan,
serta mempersiapkan switch ke production Midtrans.

Sandbox URL: https://app.sandbox.midtrans.com
Snap JS: https://app.sandbox.midtrans.com/snap/snap.js

## NOW: Phase 23 Completed
## NEXT: /save or move to Phase 24
## CRUMBS: svc(+idempotency,+retry,+logging), pricing(+env-based Snap URL), env(+MIDTRANS keys), test(+E2E suite), docs(+sandbox guide), tsc ✅, build ✅
