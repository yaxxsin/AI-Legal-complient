---
description: Status check + progress report — unified view
---

## /look — Status & Report

// turbo-all

### Usage

```
/look        → quick status (< 10 baris output)
/look full   → detailed report
```

---

### /look (Quick Mode)

1. Baca `docs/state/active.md` → phase + task
2. Baca `docs/tracker.md` → count bugs + backlog
3. Output:
```
📊 Status
━━━━━━━━
🎯 Phase [X]: [nama]
📝 Task: [aktif]
📈 Step: [X/Y]
🌿 Branch: [branch]
🐛 Bugs: [X] (C:[Y] H:[Z])
📥 Backlog: [X]
📋 Next: [next step]
```

Rules:
- MAX 3 file reads
- MAX 10 baris output
- JANGAN suggest apapun
- JANGAN baca detail — hanya counts

---

### /look full (Report Mode)

1. Baca `docs/state/active.md` → all phases
2. Baca `docs/tracker.md` → full bug/backlog/log data
3. Baca phase state files → completion per phase
4. Output:
```
📊 PROGRESS REPORT — [Tanggal]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Phase Matrix
| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | ... | ✅/🔶/📋 | [X tasks done] |

## Current Sprint
🎯 Phase [X] — [nama]
📈 Tasks: [done]/[total]
🐛 Bugs: [open] | [fixed this week]

## Recent Activity (Last 5)
- [date]: [summary]

## Backlog
- Total: [X] | Done: [X] | Planned: [X]
```

Rules:
- Read-only — JANGAN modify
- CHANGELOG: last 10 entries only
- MAX 30 baris output
