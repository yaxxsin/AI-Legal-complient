---
description: Smart verification — pilih strategi paling hemat token untuk verifikasi
---

## /verify — Smart Verification

Verifikasi perubahan dengan strategi yang TOKEN-AWARE.
AI WAJIB pilih strategi paling murah yang masih efektif.

### Usage

```
/verify              → AI pilih strategi terbaik otomatis
/verify build        → Hanya cek build (paling murah)
/verify browser      → Buka browser, cek UI (paling mahal)
/verify manual       → Kasih checklist ke user untuk cek sendiri (gratis)
```

---

### Strategi Verification (Urut dari TERMURAH)

```
╔══════════════════════════════════════════════════════════╗
║           💰 VERIFICATION COST MATRIX                    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  TIER 1: COMMAND-BASED (50-200 token)        💚 MURAH   ║
║  ─────────────────────────────────────────────           ║
║  • npm run build / tsc --noEmit   → build OK?           ║
║  • npm run lint                   → lint clean?         ║
║  • npm test                       → tests pass?        ║
║  • git diff --stat                → files changed?     ║
║                                                          ║
║  TIER 2: FILE-BASED (200-500 token)          💛 SEDANG  ║
║  ─────────────────────────────────────────────           ║
║  • Baca file output (build log, test results)           ║
║  • Verify file exists (list_dir)                        ║
║  • Verify file content (view_file, 20-30 lines)        ║
║  • Check import paths valid                             ║
║                                                          ║
║  TIER 3: USER-ASSISTED (0 token AI)          💙 GRATIS  ║
║  ─────────────────────────────────────────────           ║
║  • Kasih checklist ke user untuk cek manual             ║
║  • User buka browser sendiri, report hasil              ║
║  • User jalanin app, konfirmasi bisa/tidak              ║
║                                                          ║
║  TIER 4: BROWSER (3000-8000 token)           🔴 MAHAL   ║
║  ─────────────────────────────────────────────           ║
║  • AI buka browser, navigate ke page                    ║
║  • Screenshot + analisis visual                         ║
║  • Click interaction, form testing                      ║
║  • Multi-page verification                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

### Decision Tree: Kapan Pakai Strategi Mana

```
Perubahan apa yang dibuat?
│
├── Backend/API only (no UI)
│   → TIER 1: npm run build + npm test
│   → DONE ✅ (tidak perlu browser)
│
├── Bug fix (logic, not visual)
│   → TIER 1: npm run build
│   → TIER 2: verify file content benar
│   → DONE ✅
│
├── UI Component baru
│   → TIER 1: npm run build (pastikan compile)
│   → TIER 3: kasih user checklist visual
│   → DONE ✅ (browser HANYA jika user minta)
│
├── UI Styling/Layout change
│   → TIER 1: npm run build
│   → TIER 3: kasih user checklist + instruksi buka browser
│   → TIER 4: HANYA jika user EXPLICITLY minta "/verify browser"
│
├── Full feature (multi-file, multi-component)
│   → TIER 1: npm run build + npm test
│   → TIER 2: verify key files exist + content
│   → TIER 3: kasih user full verification checklist
│   → DONE ✅
│
└── Critical/Production fix
    → TIER 1: npm run build + npm test (WAJIB)
    → TIER 4: browser verification (JUSTIFIED karena production)
```

---

### /verify build (Tier 1)

```
1. Run: npm run build (atau tsc --noEmit)
2. Run: npm run lint (jika ada)
3. Run: npm test (jika ada)
4. Report:
   ✅ Build: PASS
   ✅ Lint: PASS (2 warnings)
   ✅ Tests: 14/14 passed
   Token used: ~150
```

### /verify manual (Tier 3 — GRATIS)

AI generate checklist yang user bisa verifikasi sendiri:

```
📋 Verification Checklist
━━━━━━━━━━━━━━━━━━━━━━━━
Perubahan: [deskripsi apa yang berubah]

Langkah-langkah cek:
1. Buka browser → http://localhost:3000
2. Navigate ke [halaman yang berubah]
3. Cek:
   [ ] [item 1 yang harus terlihat]
   [ ] [item 2 yang harus berfungsi]
   [ ] [item 3 — responsive di mobile]
   [ ] [item 4 — dark mode tested]
4. Test interaksi:
   [ ] [klik tombol X → harus terjadi Y]
   [ ] [isi form → harus validasi Z]

Kalau semua OK → bilang "verified" 
Kalau ada masalah → describe apa yang salah
```

### /verify browser (Tier 4 — MAHAL)

```
⚠️ Browser verification menghabiskan ~3000-8000 token.
   Setara 2-5x biaya start session.

Proceed? (y/n)

Jika yes:
1. Buka browser → navigate ke target URL
2. Screenshot halaman → analisis visual
3. Cek layout, warna, spacing, text
4. Test 1-2 interaksi kunci
5. Report dengan screenshot evidence

BATASAN:
- MAX 3 screenshots per verification
- MAX 5 browser actions (navigate, click, type)
- JANGAN scroll semua halaman — fokus area yang berubah
- JANGAN test edge cases di browser (itu tugas unit test)
```

---

### Rules

- DEFAULT adalah TIER 1 + TIER 3 (murah + gratis)
- TIER 4 (browser) HANYA jika user EXPLICITLY request `/verify browser`
- JANGAN auto-open browser tanpa izin user
- SELALU tanya user sebelum browser verification: "Ini akan habis ~5000 token. Proceed?"
- SELALU tawarkan /verify manual sebagai alternatif hemat
- Jika budget token ketat → SUGGEST: "Mau saya kasih checklist manual saja? Lebih hemat."
- Build verification (Tier 1) adalah MINIMUM yang harus SELALU dijalankan
