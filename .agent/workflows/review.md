---
description: AI Code Review — scan code terhadap Engine rules sebelum merge
---

## /review — Code Review

AI review code berdasarkan Engine rules. Gunakan sebelum `/ship` atau saat mau QA.

### Usage

```
/review              → Review semua uncommitted changes
/review [file]       → Review file spesifik
/review --staged     → Review hanya staged files (git add)
```

---

### Steps

1. **Detect scope**:
   - Tanpa argumen → `git diff --name-only` (uncommitted changes)
   - Dengan file → review file tersebut
   - `--staged` → `git diff --cached --name-only`

2. **Untuk SETIAP file yang di-review, jalankan 12-point inspection:**

```
╔══════════════════════════════════════════════════╗
║          🔍 ENGINE CODE REVIEW                   ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  📏 STRUCTURE                                    ║
║  [ ] File < 300 baris?                           ║
║  [ ] Semua function < 30 baris?                  ║
║  [ ] Naming convention benar?                    ║
║      (camelCase / PascalCase / UPPER_SNAKE)      ║
║                                                  ║
║  🔒 SECURITY                                     ║
║  [ ] Input validated?                            ║
║  [ ] Query parameterized? (no string concat)     ║
║  [ ] Auth/authz check di endpoint?               ║
║  [ ] No secrets hardcoded?                       ║
║  [ ] No sensitive data di logs?                  ║
║                                                  ║
║  🧠 QUALITY                                      ║
║  [ ] Return type di semua function?              ║
║  [ ] Tidak ada `any` type?                       ║
║  [ ] Error handling ada? (try/catch meaningful)   ║
║  [ ] Tidak ada console.log? (use logger)         ║
║                                                  ║
║  🏗️ ARCHITECTURE                                 ║
║  [ ] Dalam scope phase? (tidak edit file lain)   ║
║  [ ] Cross-phase import? (DILARANG)              ║
║  [ ] Shared type di /types/? (bukan di feature)  ║
║  [ ] CSS scoped? (module/BEM, bukan global)      ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

3. **Scan setiap file** — baca dengan `view_file`, periksa setiap point

4. **Generate review report:**

```
📝 CODE REVIEW REPORT
━━━━━━━━━━━━━━━━━━━━
📁 Files reviewed: [count]
📊 Score: [X]/100

✅ PASSED ([count]):
   - [filename]: Clean ✓

⚠️ WARNINGS ([count]):
   - [filename:line]: Function `handleSubmit` is 42 lines (max: 30)
   - [filename:line]: Missing return type on `fetchData`

❌ ISSUES ([count]):
   - [filename:line]: 🔒 User input not validated before DB query
   - [filename:line]: Cross-phase import from features/auth/

📋 RECOMMENDATIONS:
   1. [actionable suggestion]
   2. [actionable suggestion]
```

### Scoring

```
Score calculation:
  Base: 100 points
  Per ❌ ISSUE:   -10 points (security: -15)
  Per ⚠️ WARNING: -3 points
  
  90-100: 🟢 Excellent — siap merge
  70-89:  🟡 Good — fix warnings dulu
  50-69:  🟠 Needs Work — fix issues wajib
  0-49:   🔴 Critical — JANGAN merge
```

### Rules

- Read-only — JANGAN modify file saat review
- Jika diminta fix → switch ke `/run` atau `/plan` untuk fix
- JANGAN review node_modules, dist, build, .git
- JANGAN review file > 500 baris sekaligus (split per section)
- Review HARUS objektif — berdasarkan rules, bukan opini
- Setelah review → suggest: "Mau saya fix issues ini? (/run fix-review)"
