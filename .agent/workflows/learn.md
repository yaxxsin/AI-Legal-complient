---
description: Pattern learning — AI simpan pattern project untuk hemat token sesi berikutnya
---

## /learn — Pattern Learning

Saat AI menemukan pattern unik di project, simpan ke `docs/patterns.md` 
supaya AI di sesi berikutnya langsung tahu tanpa harus discovery ulang.

### Usage

```
/learn                    → AI scan dan auto-detect patterns
/learn [pattern desc]     → Manual log pattern spesifik
/learn show               → Tampilkan semua learned patterns
```

---

### Kapan AI Harus /learn (Auto-Detect)

AI WAJIB menyarankan `/learn` saat menemukan salah satu ini:

```
🔍 AUTO-DETECT TRIGGERS:
1. Custom naming convention yang BEDA dari standard
   Contoh: "Project ini pakai snake_case untuk files, bukan kebab-case"

2. Custom project structure yang BEDA dari preset
   Contoh: "API routes di src/server/ bukan app/api/"

3. State management pattern yang spesifik
   Contoh: "Pakai Zustand dengan persist middleware pattern"

4. Custom component pattern
   Contoh: "Semua form pakai react-hook-form + zod resolver"

5. API response format yang custom
   Contoh: "Response selalu { status, payload, errors[] }"

6. Database query pattern
   Contoh: "Selalu pakai soft delete (deletedAt field)"

7. Auth/permission pattern
   Contoh: "Middleware check di setiap route group, bukan per-route"

8. Deployment-specific pattern
   Contoh: "Build output harus di /public untuk Nginx static serve"
```

---

### Steps — Auto-Detect (/learn)

1. Scan files yang sudah dibaca sesi ini
2. Identifikasi patterns yang DEVIATE dari Engine standards/presets
3. Untuk setiap pattern ditemukan:
   - Describe pattern
   - Cite file + line sebagai evidence
   - Explain kenapa ini penting untuk consistency
4. Tanya user: "Saya temukan [X] patterns. Save ke docs/patterns.md?"
5. Jika approved → simpan

### Steps — Manual (/learn [desc])

1. User describe pattern
2. AI verify pattern di codebase (baca 1-2 file untuk confirm)
3. Simpan ke `docs/patterns.md`
4. Confirm

### Steps — Show (/learn show)

1. Baca `docs/patterns.md`
2. Tampilkan semua patterns dengan format ringkas

---

### Storage: docs/patterns.md

```markdown
# 🧬 PROJECT PATTERNS

> Auto-discovered dan manually logged.
> AI WAJIB baca file ini saat /go untuk consistency.
> JANGAN override patterns — ikuti yang ada.

## Naming
- **Files**: snake_case (bukan kebab-case)
  └ Evidence: src/components/user_card.tsx
- **API routes**: plural nouns (users, orders, NOT user, order)
  └ Evidence: app/api/v1/users/route.ts

## Component Patterns
- **Forms**: react-hook-form + zod resolver + FormField wrapper
  └ Evidence: features/auth/components/LoginForm.tsx:15-45
  └ Template:
    ```tsx
    const form = useForm<T>({ resolver: zodResolver(schema) });
    ```

## API Patterns
- **Response format**: { success, data, error, meta }
  └ Evidence: app/api/v1/users/route.ts:20
- **Error format**: { code: string, message: string, details?: any }
- **Pagination**: ?page=1&limit=20 (default limit: 20)

## Database Patterns
- **Soft delete**: semua tabel punya deletedAt column
- **Timestamps**: createdAt + updatedAt (auto-managed by Prisma)
- **IDs**: UUID v4 (bukan auto-increment)

## State Management
- **Client state**: Zustand (bukan Context) untuk complex state
- **Server state**: SWR dengan dedupInterval: 5000ms
  └ Evidence: lib/api-client.ts:8

## Auth Patterns
- **Middleware**: route group level (app/(dashboard)/layout.tsx)
- **Token**: httpOnly cookie, NOT localStorage
- **Refresh**: /api/v1/auth/refresh, silent refresh di SWR

## CSS Patterns
- **Approach**: CSS Modules (bukan Tailwind utility)
- **Variables**: di globals.css, consumed via var()
- **Dark mode**: [data-theme="dark"] selector
```

---

### Integration dengan /go

Update /go workflow — tambah step baca patterns:

```
/go Steps (updated):
1. Read docs/state/active.md → load context
2. Read .agent/rules.md → load rules
3. Read docs/patterns.md → load project patterns (JIKA ADA)
4. Read docs/tracker.md → count bugs & backlog
5. Report
```

**Kenapa ini powerful:**
- Session pertama: AI spend 500 token discovering patterns
- AI jalankan /learn → patterns tersimpan
- Session ke-2 sampai ke-100: AI baca patterns.md (200 token)
- **HEMAT 300 token PER SESSION** (net positive setelah session ke-2)
- Bonus: AI berbeda (Claude → GPT) juga bisa baca patterns yang sama

---

### Rules

- Patterns file HANYA di-edit via /learn (JANGAN manual edit)
- Evidence WAJIB ada (file:line reference)
- Jika pattern berubah → UPDATE, jangan duplicate
- Jika pattern salah → user report → AI update/remove
- /learn JANGAN dijalankan saat task urgent (ini maintenance task)
- docs/patterns.md HARUS < 100 baris (rangkum, jangan verbose)
- /go: baca patterns.md HANYA jika file ada (no error jika tidak ada)
