---
description: Big task — research → plan → approve → execute dengan checkpoint
---

## /plan [task] — Planning Workflow

Untuk task besar yang butuh research, analisis, dan approval.

### Phase 1: RESEARCH (read-only, JANGAN edit code)

1. Baca files yang relevan (dependencies, patterns, constraints)
2. Identifikasi tech stack, patterns, dan architectural context
3. **Write-ahead**: Update state.md NOW = "Researching [task]"

### Phase 2: ANALYSIS

```
🔍 PRE-CODE ANALYSIS:
━━━━━━━━━━━━━━━━━━━
1. IMPACT:     [files/modules terpengaruh]
2. DEPS:       [packages/modules dibutuhkan]
3. BREAKING:   [breaking changes — siapa terdampak]
4. SECURITY:   [OWASP assessment]
5. EDGE CASES: [null, empty, overflow, boundary]
6. PERF:       [N+1, bottlenecks, memory]
7. ROLLBACK:   [revert strategy]
```

### Phase 3: PLAN (buat implementation plan)

Buat plan dengan:
- Files: create / modify / delete + urutan (dependencies first)
- **Phase scope declaration**: folder scope, apa yang di-READ vs WRITE
- Estimated effort
- Risk assessment

### Phase 4: REVIEW (WAJIB tunggu approval)

Tampilkan plan → **STOP** → tunggu user bilang OK.
JANGAN mulai Phase 5 sebelum approved.

### Phase 5: EXECUTE (setelah approved)

1. **Write-ahead**: Update state.md → plan steps numbered
2. Implement sesuai plan (dalam urutan yang ditentukan)
3. **Breadcrumb** setiap file edit
4. Update state.md setiap 5 sub-task selesai
5. Jika discover issue → update plan, inform user

### Phase 6: VERIFY

1. Run build/type check
2. Verify perubahan sesuai plan
3. Update state.md → mark complete
4. Report hasil

### Phase Scope Declaration (untuk Phase Isolation)

```markdown
## SCOPE DECLARATION
- **Folder**: features/[phase-name]/*
- **Creates**: [list file baru]
- **Modifies**: [list file yang diubah — HARUS di scope]
- **Reads**: [file yang dibaca tapi TIDAK diedit]
- **Shared Write**: [HANYA _manifest files, append-only]
- **Depends On**: [phase lain yang HARUS selesai dulu]
```

### Rules

- JANGAN edit code di Phase 1-4
- SELALU tunggu approval sebelum Phase 5
- Update state.md di SETIAP phase transition
- Scope declaration WAJIB untuk multi-conversation safety
- Cross-phase file edits DILARANG (kecuali shared manifest, append-only)
