---
description: Emergency hotfix — CRITICAL bugs saja (production down)
---

## /fix — Hotfix

HANYA untuk CRITICAL bugs yang affect production.

### Steps

1. Konfirmasi: "Ini benar CRITICAL production bug?"
2. Simpan state:
   - `git stash` (jika ada WIP changes)
   - Save current phase state
3. Branch:
   - `git checkout main && git pull`
   - `git checkout -b hotfix/[desc]`
4. Quick analysis (WAJIB walau urgent):
   ```
   🔍 Hotfix Analysis:
   - Root cause: [apa]
   - Fix: [solusi minimal]
   - Impact: [scope]
   - Risk: [risiko fix]
   ```
5. Fix — MINIMAL changes only. JANGAN sekalian refactor.
6. Test: `npm run build` / `tsc --noEmit`
7. Commit: `[hotfix] fix: [desc]`
8. Push + create PR ke `main`
9. Update tracker.md → move bug to Fixed
10. Restore:
    - `git checkout [prev branch]`
    - `git stash pop`

### Rules

- HANYA untuk CRITICAL — bukan HIGH/MEDIUM/LOW
- MINIMAL changes — fix HANYA yang broken
- HARUS selesai dalam 1 sesi
- SELALU update tracker setelah fix
