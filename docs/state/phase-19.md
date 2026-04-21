# Phase 19: HR Compliance Module (Phase 2a)

## STATUS: ✅ Completed
## DEPENDENCY: Phase 0
## ESTIMASI: S (~1 jam)

## SCOPE
- [ ] F-11-01: Kalkulator BPJS (TK + Kesehatan)
- [ ] F-11-02: Kalkulator Pesangon (UU Cipta Kerja)
- [ ] HR API endpoints (apps/api/src/modules/hr/)
- [ ] Calculator UI (form input + breakdown output)

## CONTEXT
MOD-11 dari blueprint. Phase 2 feature (Bulan 4-6).
BPJS: JHT, JKK, JKM, JP, Kesehatan. Tarif base on regulasi atau dinamis dari `hr_bpjs_rates` table.
Pesangon: masa kerja × gaji × multiplier per jenis PHK (PP 35/2021).

Blueprint ref: BAB 6 MOD-11 (F-11-01, F-11-02)

## PLAN STEPS
1. [x] **Step 1: Module Setup** (Buat HrModule, HrController, HrService)
2. [x] **Step 2: BPJS Calculator Logic** (Pajak BPJS rules & caps)
3. [x] **Step 3: Severance Logic** (Kalkulator Pesangon PP 35/2021)
4. [x] **Step 4: Frontend UI** (UI Kalkulator Tab BPJS & Pesangon)
5. [x] **Step 5: Wiring & Testing** (Sambungkan API ke UI dashboard)

## NOW: Phase 19 Completed! 🎉
## NEXT: -
## CRUMBS: -
