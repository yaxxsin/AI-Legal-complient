---
description: Start session — load context + rules dalam < 1700 token
---

## /go — Start Session

WAJIB di awal setiap conversation baru.

// turbo-all

### Steps

1. **Load state** (WAJIB, PERTAMA):
   - Baca `docs/state/active.md` → identifikasi phase aktif
   - Baca state file yang ditunjuk (misal `docs/state/phase-01.md`)
   - Jika state file TIDAK ADA → suggest `/init`

2. **Verify state** (anti-drift):
   - Cek CRUMBS terakhir → file yang disebut EXIST?
   - Run `git branch --show-current` → match dengan state?
   - Run `git diff --stat` → ada untracked changes di luar Engine?
   - Jika mismatch → WARN user, jangan auto-proceed

3. **Load rules**:
   - Baca `.agent/rules.md`
   - Jika ada preset (`.agent/presets/[stack].md`) → load juga

4. **Load patterns** (jika ada):
   - Baca `docs/patterns.md` → project-specific conventions
   - Jika file TIDAK ADA → skip (no error)

5. **Scan issues** (summary only):
   - Baca `docs/tracker.md` → count open bugs + backlog items
   - JANGAN baca detail — hanya COUNT

5. **Report**:
```
📋 Session Ready
━━━━━━━━━━━━━━━
🎯 Phase: [X] — [nama]
📝 Task: [task aktif]
📈 Step: [current/total]
🌿 Branch: [branch]

🐛 Bugs: [X] open (CRIT:[Y] HIGH:[Z])
📥 Backlog: [X] items

🔄 Last checkpoint:
   [timestamp] — [deskripsi terakhir]

Next: [langkah selanjutnya dari state]
```

### Auto-Detection

Jika AI detect conversation baru TANPA user ketik /go:
- JANGAN langsung coding
- Suggest: "⚠️ `/go` belum dijalankan. Jalankan dulu untuk load context."
- KECUALI user kasih instruksi urgent → silent load state (parallel)

### Rules

- TOTAL output /go: MAX 15 baris
- JANGAN baca master_blueprint (boros token) — on-demand saja
- JANGAN baca seluruh tracker — hanya count summaries
- Jika ada CRITICAL bugs → tanya user: "Fix dulu atau lanjut?"
- Jika state corrupt/partial → recover dari breadcrumbs + git diff
