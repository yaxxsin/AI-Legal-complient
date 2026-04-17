---
description: Manual full checkpoint — untuk planned pause (istirahat, ganti akun)
---

## /snap — Manual Checkpoint

Gunakan saat mau istirahat, ganti akun, atau sebelum operasi besar.
Ini BUKAN primary safety mechanism — itu tugas Write-Ahead (L5).
/snap adalah FULL SAVE untuk planned pause.

### Steps

1. **Full state save** ke phase state file:
   - NOW: task, step, file terakhir
   - NEXT: 3 langkah selanjutnya (detail & jelas)
   - DON'T: hal yang jangan diulang
   - CONTEXT: approach, decisions, patterns
   - CHECKPOINT: timestamp, session ID, "manual snap"
   - CRUMBS: keep as-is (jangan bersihkan — itu tugas /park)

2. **Update active.md**:
   - Refresh lock status

3. **Confirm**:
```
📸 Snapshot Saved
━━━━━━━━━━━━━━━
🎯 Phase: [X] — [nama]
📝 Task: [aktif]
📈 Step: [X/Y]
⏱️ Time: [timestamp]

State saved. Aman untuk:
- Istirahat
- Ganti akun/AI
- Close conversation

Recovery: /go di conversation baru → otomatis lanjut.
```

### Kapan Pakai

```
✅ Mau istirahat / break
✅ Mau ganti akun (token/credit habis)
✅ Sebelum operasi besar (migration, major refactor)
✅ Sebelum install banyak packages
✅ Merasa "harusnya save dulu nih"

❌ BUKAN pengganti Write-Ahead (L5) — itu otomatis
❌ BUKAN pengganti /park — /park lebih lengkap + cleanup
```

### Rules

- Execution time: < 15 detik
- JANGAN cleanup crumbs (itu tugas /park)
- CONTEXT section WAJIB diisi — ini yang bantu AI baru understand
- Setelah /snap, AI BOLEH langsung lanjut kerja (beda dengan /park)
