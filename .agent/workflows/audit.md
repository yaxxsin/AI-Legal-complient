---
description: Project Health Check — audit arsitektur dan kualitas project
---

## /audit — Project Health Check

Scan seluruh project, generate health report dengan scoring.

### Usage

```
/audit           → Full project audit
/audit quick     → Quick scan (structure only, < 1 menit)
/audit security  → Security-focused audit only
```

---

### Steps — Full Audit

1. **Structure Scan** (list_dir recursive, max depth 3):
   - Folder structure sesuai Engine standard?
   - Feature folders punya manifest.ts?
   - Shared types di /types/?
   - Auto-discovery setup ada?

2. **File Quality Scan** (sample max 15 key files):
   - File > 300 baris → FLAG
   - Function > 30 baris → FLAG
   - `any` type ditemukan → FLAG
   - `console.log` di non-test file → FLAG
   - `@ts-ignore` / `@ts-nocheck` → FLAG
   - Missing return type → FLAG
   - Missing error handling (catch tanpa action) → FLAG

3. **Security Scan**:
   - `.env` committed ke git? (`git ls-files .env`)
   - Hardcoded secrets? (grep patterns: password=, secret=, key=)
   - CORS wildcard di production config?
   - SQL string concatenation?
   - Missing auth middleware di API routes?
   - Dependencies vulnerable? (`npm audit --json` jika npm project)

4. **Architecture Scan**:
   - Cross-phase imports? (import from features/[other-phase]/)
   - Unscoped CSS? (non-module CSS files di features/)
   - Missing manifests? (feature folder tanpa manifest.ts)
   - Circular dependencies? (A→B→A)
   - God files? (> 500 baris, > 20 exports)

5. **State Scan** (Engine-specific):
   - state/active.md ada dan valid?
   - tracker.md ada?
   - Breadcrumbs < 30 entries?
   - Stale state? (checkpoint > 7 hari lalu)

---

### Report Format

```
╔══════════════════════════════════════════════════════════╗
║              🏥 PROJECT HEALTH REPORT                    ║
║              [Project Name] — [Date]                     ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  📊 HEALTH SCORE: [XX]/100  [🟢🟡🟠🔴]                  ║
║                                                          ║
║  ┌─────────────────────────────────────────────┐        ║
║  │  Structure    ████████░░  80/100            │        ║
║  │  Code Quality ██████████  95/100            │        ║
║  │  Security     ███████░░░  70/100            │        ║
║  │  Architecture █████████░  90/100            │        ║
║  │  Engine State ██████████  100/100           │        ║
║  └─────────────────────────────────────────────┘        ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ❌ CRITICAL ([count])                                   ║
║  ─────────────────────────────────────                   ║
║  • [issue description] → [file:line]                    ║
║                                                          ║
║  ⚠️ WARNINGS ([count])                                   ║
║  ─────────────────────────────────────                   ║
║  • [warning description] → [file:line]                  ║
║                                                          ║
║  💡 SUGGESTIONS ([count])                                ║
║  ─────────────────────────────────────                   ║
║  • [suggestion description]                             ║
║                                                          ║
║  ✅ PASSED ([count] checks)                              ║
║  ─────────────────────────────────────                   ║
║  • [list passed checks]                                 ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  📋 RECOMMENDED ACTIONS (prioritized):                   ║
║  1. [most critical action]                              ║
║  2. [next action]                                       ║
║  3. [next action]                                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Scoring

```
STRUCTURE (20 points):
  +5  Feature-based folder structure
  +5  All features have manifest.ts
  +5  Shared types in /types/
  +5  Auto-discovery setup exists

CODE QUALITY (25 points):
  +5  No files > 300 lines
  +5  No functions > 30 lines
  +5  No `any` types
  +5  No console.log in production
  +5  All functions have return types

SECURITY (25 points):
  +5  No .env in git
  +5  No hardcoded secrets
  +5  No SQL concatenation
  +5  Auth middleware on API routes
  +5  Dependencies audit clean

ARCHITECTURE (20 points):
  +5  No cross-phase imports
  +5  CSS properly scoped
  +5  No circular dependencies
  +5  No god files (>500 lines)

ENGINE STATE (10 points):
  +3  state/active.md valid
  +3  tracker.md exists
  +2  Breadcrumbs < 30
  +2  State not stale
```

### /audit quick — Quick Mode

Hanya Structure + Engine State scan:
- list_dir root (1 call)
- Check manifest files (1-2 calls)
- Check state files (1-2 calls)
- Output: < 15 baris
- Waktu: < 30 detik

### /audit security — Security Mode

Hanya Security scan:
- grep sensitive patterns
- Check .env in git
- npm audit
- Auth middleware check
- Output: security section only

### Rules

- Read-only — JANGAN modify apapun
- Max 15 file reads per full audit (efisiensi token)
- Prioritas scan: API routes > lib/ > features/ > components/
- JANGAN scan node_modules, .git, dist, build, test files
- Setelah audit → suggest actionable fix, jangan hanya list masalah
