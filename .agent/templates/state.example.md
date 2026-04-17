# 🧠 PHASE STATE — [Phase Name]

> Auto-updated oleh Engine. Edit manual hanya di CONTEXT section.

## IDENTITY
- **Project**: [nama project]
- **Stack**: [tech stack]
- **Repo**: [git remote URL]
- **Branch**: [current branch]

## NOW
- **Phase**: [number] — [nama phase]
- **Task**: [deskripsi task aktif]
- **Status**: 🟡 in-progress
- **File**: [file:line terakhir diedit]
- **Step**: [X/Y — deskripsi step]

## NEXT
1. [langkah selanjutnya — JELAS dan SPESIFIK]
2. [langkah setelahnya]
3. [langkah berikutnya]

## DON'T
- [hal yang JANGAN dilakukan — prevent duplicate work]
- [misal: "JANGAN install tailwind lagi, sudah ada"]
- [misal: "JANGAN edit Sidebar.tsx, sudah final"]

## SCOPE
- **Folder**: features/[phase-name]/*
- **Creates**: [list file baru yang akan/sudah dibuat]
- **Reads**: [file yang dibaca tapi TIDAK diedit]
- **Shared**: [manifest file — append-only]
- **Depends On**: [phase dependencies]

## QUEUE
| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | [task 1] | 🔴 HIGH | ✅ Done |
| 2 | [task 2] | 🔴 HIGH | 🔶 In Progress |
| 3 | [task 3] | 🟡 MED | ⏳ Pending |

## CRUMBS
<!-- Append-only. 1 baris per action. Max 30 entries. -->
<!-- Format: - [HH:MM] | [action] → [result/file] -->

## CONTEXT
<!-- Diisi saat /snap atau /park. Membantu AI baru understand reasoning. -->
- **Approach**: [pendekatan teknis yang dipilih]
- **Decision**: [keputusan penting sesi ini]
- **Pattern**: [pattern/file reference yang harus diikuti]

## CHECKPOINT
- **Timestamp**: [ISO timestamp]
- **Session**: [session counter, misal: S001]
- **Saved By**: [/park | /snap | write-ahead | crash-recovery]
