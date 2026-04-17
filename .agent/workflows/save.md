---
description: Git commit + push ke feature branch dengan format standar
---

## /save — Commit & Push

### Steps

1. Run `git status` → lihat changed files
2. Run `git diff --stat` → summary perubahan
3. Run `git branch --show-current` → **VERIFY bukan `main`**
   - Jika di `main` → TOLAK, suggest: `git checkout -b feature/[phase]-[desc]`
4. Generate commit message:
   ```
   [phase-XX] type: short description
   ```
   Types: feat | fix | refactor | docs | style | test | chore | security

5. Preview:
   ```
   📝 Commit Preview:
   ━━━━━━━━━━━━━━━━
   🌿 Branch: [current]
   💬 Message: [generated]
   📁 Files: [count] ([+insertions], [-deletions])
   
   Proceed? (y/n)
   ```

6. Jika approved:
   - `git add .`
   - `git commit -m "[message]"`
   - `git push origin [branch]`

7. **Update tracker.md** → append ke LOG section
8. **Update state breadcrumb** → "saved: [commit hash short]"

9. Confirm:
   ```
   ✅ Saved: [hash] → origin/[branch]
   ```

### Rules

- JANGAN commit ke `main` — HANYA feature branches
- JANGAN force push
- SELALU preview sebelum commit
- 1 commit = 1 logical change
- Commit message HARUS deskriptif
