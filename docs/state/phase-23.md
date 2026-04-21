# Phase 23: Midtrans Sandbox Integration & Payment Testing

## STATUS: 📋 Planned
## DEPENDENCY: Phase 15 (Subscription & Billing)
## ESTIMASI: M (~2 jam)

## SCOPE
- [ ] 1. Konfigurasi environment Midtrans Sandbox (Server Key + Client Key)
- [ ] 2. Validasi flow Snap.js checkout (Free → Starter → Growth → Business)
- [ ] 3. Webhook handler testing — settlement, cancel, expire, deny
- [ ] 4. Auto-upgrade user plan setelah payment settlement
- [ ] 5. Auto-downgrade saat subscription expire / cancel
- [ ] 6. Invoice PDF generation verification
- [ ] 7. Retry logic untuk webhook yang gagal
- [ ] 8. E2E test: checkout → bayar di sandbox → webhook → plan terupdate
- [ ] 9. Switch env prod (production key swap tanpa code change via .env)

## CONTEXT
Phase 15 sudah membuat skeleton billing + Midtrans integration.
Phase ini fokus pada validasi end-to-end flow pembayaran di sandbox,
memastikan webhook benar-benar mengupdate subscription & user plan,
serta mempersiapkan switch ke production Midtrans.

Sandbox URL: https://app.sandbox.midtrans.com
Snap JS: https://app.sandbox.midtrans.com/snap/snap.js

## NOW: -
## NEXT: -
## CRUMBS: -
