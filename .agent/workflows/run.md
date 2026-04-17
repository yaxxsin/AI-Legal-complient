---
description: Quick task — eksekusi langsung tanpa planning (< 5 menit)
---

## /run [task] — Quick Task

Untuk task kecil yang jelas dan bisa selesai < 5 menit.

### Steps

1. **Write-ahead** — update state.md NOW section:
   ```
   NOW.Task: [deskripsi task]
   NOW.Step: "1/1 — quick task"
   ```

2. **Quick check** (3 baris, bukan full analysis):
   ```
   🔍 Quick Check:
   - Impact: [files yang terpengaruh]
   - Security: [OK / concern]
   - Breaking: [No / Yes]
   ```

3. **Execute** — langsung kerjakan

4. **Breadcrumb** — append ke CRUMBS:
   ```
   - [HH:MM] | [action] → [result]
   ```

5. **Update state** — mark task done, update NEXT

### Rules

- HANYA untuk task yang JELAS bisa selesai < 5 menit
- Jika ternyata complex → STOP, inform user, suggest `/plan`
- TETAP ikuti L4 (Engineer Mindset) dan Security Quick-Check
- Quick check boleh ringkas (3 baris) tapi WAJIB ada
- Write-ahead SEBELUM execute — L5 (Crash-Proof)
