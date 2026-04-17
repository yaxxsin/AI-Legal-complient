---
description: End session — save all state ke files, bersihkan breadcrumbs
---

## /park — End Session

WAJIB sebelum tutup conversation.

### Steps

1. **Save state** ke phase state file (`docs/state/phase-XX.md`):
   - Update NOW: task saat ini, step terakhir, file terakhir
   - Update NEXT: 3 langkah selanjutnya yang jelas
   - Update DON'T: hal yang JANGAN diulang (prevent duplicate work)
   - Update CHECKPOINT: timestamp, session ID
   - Add CONTEXT section: approach, decisions, patterns yang dipakai
   - **BERSIHKAN CRUMBS**: rangkum jadi 3 baris di CHECKPOINT, clear section

2. **Update active.md**:
   - Refresh phase pointer
   - Release LOCK jika ada

3. **Update tracker.md**:
   - Append ke LOG section (1-2 baris summary sesi ini)
   - Move fixed bugs ke BUGS Fixed section
   - Update backlog status jika ada yang selesai

4. **Update decisions.md** (HANYA jika ada keputusan arsitektur sesi ini)

5. **Report**:
```
💾 Session Parked
━━━━━━━━━━━━━━━
✅ Completed: [X] tasks
🐛 Bugs: [fixed]/[new]
📝 Files changed: [X]

📌 Next session:
   [deskripsi singkat langkah selanjutnya]

State saved. Conversation aman ditutup.
```

### Rules

- JANGAN skip state file update — ini yang PALING PENTING
- SELALU bersihkan CRUMBS (rangkum, jangan biarkan menumpuk)
- CONTEXT section WAJIB diisi — ini yang membantu AI baru understand reasoning
- Jika user tutup TANPA /park → breadcrumbs jadi backup (degraded tapi masih bisa recover)
- Total: < 30 detik eksekusi
