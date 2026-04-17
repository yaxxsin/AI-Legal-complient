---
description: Log bug atau idea ke tracker — TANPA mengganggu task aktif (FOCUS LOCK)
---

## /log — Bug & Idea Logger

### Usage

```
/log bug [deskripsi bug]
/log idea [deskripsi ide]
```

### Steps — Bug

1. Baca `docs/tracker.md` → ambil last BUG-ID
2. Assess severity:
   - 🔴 CRITICAL: crash, data loss, security breach
   - 🟠 HIGH: fitur utama broken, blocking
   - 🟡 MEDIUM: fitur minor broken, ada workaround
   - 🟢 LOW: cosmetic, typo
3. Append ke BUGS Open:
   ```
   | BUG-XXX | [severity] | [title] | [file:line] | [date] | [context] |
   ```
4. Jika CRITICAL → tanya: "Fix sekarang (/fix) atau lanjut task?"
5. Jika bukan CRITICAL → confirm & **LANGSUNG BALIK ke task aktif**

### Steps — Idea

1. Baca `docs/tracker.md` → ambil last B-ID
2. Assess priority + target phase
3. Append ke BACKLOG:
   ```
   | B-XXX | [date] | [desc] | [priority] | [phase] | 📋 Planned |
   ```
4. Confirm & **LANGSUNG BALIK ke task aktif**

### Confirm Format
```
📝 Logged: [BUG-XXX / B-XXX] — [summary singkat]
   [Lanjut task aktif]
```

### ⚠️ FOCUS LOCK PROTOCOL

```
SETELAH /log, AI WAJIB:
✅ Langsung kembali ke task yang sedang dikerjakan
✅ Melanjutkan dari EXACT step terakhir sebelum /log

AI DILARANG:
❌ Investigate bug lebih dalam
❌ Brainstorm ide lebih lanjut
❌ Change conversation direction
❌ Suggest fix atau implementasi
❌ Tanya follow-up tentang bug/idea

/log = PENCATATAN SAJA. Titik.
Execution time: < 30 detik.
```
