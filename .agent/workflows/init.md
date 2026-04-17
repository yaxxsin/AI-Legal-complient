---
description: Smart project scanner — setup Engine di project baru atau existing
---

## /init — Project Initialization

Gunakan saat pertama kali memasang Engine di project.
AI auto-detect apakah ini project baru atau existing.

---

### Auto-Detection Logic

```
IF master_blueprint.md EXISTS dan src/ TIDAK ADA:
  → Mode A: New Project (ada blueprint, belum ada code)

IF src/ EXISTS atau package.json EXISTS:
  → Mode B: Existing Project (ada code, mungkin tanpa blueprint)

IF KEDUANYA TIDAK ADA:
  → Mode C: Empty Project (tanya user mau apa)
```

---

### Mode A: New Project + Blueprint

// turbo-all

1. **Baca blueprint** (BAB 1-4, hemat token):
   - BAB 1: Project overview
   - BAB 2: Tech stack & architecture
   - BAB 3: Core features list
   - BAB 4: Implementation roadmap (jika ada)
   - JANGAN baca detail BAB 5-11 — on-demand nanti

2. **Auto-detect stack** dari blueprint → load preset:
   - Cek `.agent/presets/` → load yang sesuai
   - Jika tidak ada preset → load `universal.md`

3. **🔥 AUTO-DECOMPOSE: Blueprint → Phases**

   AI WAJIB breakdown blueprint menjadi phases yang RINGAN.

   **Aturan Sizing:**
   ```
   ✅ 1 phase = 1 fitur terisolasi
   ✅ 1 phase = MAX 3 file baru/edit
   ✅ 1 phase = estimasi < 2 jam kerja AI
   ✅ 1 phase = bisa dikerjakan dalam 1 conversation
   ❌ JANGAN gabung 2 fitur dalam 1 phase
   ❌ JANGAN bikin 1 phase > 5 file
   ```

   **Urutan Decompose:**
   ```
   Phase 0  → Setup & Shared (types, config, database schema)
              Ini SATU-SATUNYA phase yang boleh edit shared files.
              
   Phase 1  → Fitur paling dasar / foundation
              (misal: auth, layout, navigation)
              
   Phase 2+ → Fitur-fitur lain, urut berdasarkan dependency
              (fitur yang DEPENDEN ke phase sebelumnya = nomor lebih besar)
   
   Phase N  → Polish & Deploy (testing, optimization, deployment)
   ```

   **Cara Decompose dari Blueprint:**
   ```
   1. List SEMUA fitur dari blueprint
   2. Untuk setiap fitur, tanya:
      - Apakah bisa dipecah lagi? Jika ya → pecah
      - Apakah punya dependency ke fitur lain? Catat
      - Berapa file yang perlu dibuat/edit? Jika > 3 → pecah
   3. Urutkan berdasarkan dependency graph
   4. Assign nomor phase
   5. Setiap phase HARUS punya:
      - Nama yang jelas (1-3 kata)
      - Scope: files apa saja
      - Dependency: phase berapa yang harus selesai dulu
      - Estimasi: XS/S/M (jangan pernah L/XL — pecah lagi)
   ```

   **Contoh Output Decompose:**
   ```
   📋 PHASE BREAKDOWN (dari Blueprint)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Phase 0: Setup & Foundation          [XS] ~30 min
     → types/, config, database schema, shared components
     → Dependency: none
   
   Phase 1: Auth - Login                [S]  ~1 jam
     → features/auth/ (LoginForm, useAuth hook, auth API)
     → Dependency: Phase 0
   
   Phase 2: Auth - Register             [S]  ~1 jam
     → features/auth/ (RegisterForm, validation)
     → Dependency: Phase 1
   
   Phase 3: Layout & Navigation         [S]  ~1 jam
     → features/layout/ (Sidebar, Header, MainLayout)
     → Dependency: Phase 1
   
   Phase 4: Dashboard - Overview        [S]  ~1.5 jam
     → features/dashboard/ (StatsCard, ChartWidget)
     → Dependency: Phase 3
   
   Phase 5: Dashboard - Detail View     [S]  ~1 jam
     → features/dashboard/ (DetailPanel, DataTable)
     → Dependency: Phase 4
   
   Phase 6: User Management             [M]  ~2 jam
     → features/users/ (UserList, UserForm, UserAPI)
     → Dependency: Phase 3
   
   ... dst
   
   Phase N: Deploy & Polish             [S]  ~1 jam
     → CI/CD, env config, final testing
     → Dependency: all previous
   
   Total: N phases | Est: XX jam
   Parallel possible: Phase 4+5 ↔ Phase 6 (beda folder)
   ```

4. **Generate ALL state files:**

   Untuk SETIAP phase, buat state file:
   ```
   docs/state/phase-00.md  → Phase 0: Setup
   docs/state/phase-01.md  → Phase 1: Auth Login
   docs/state/phase-02.md  → Phase 2: Auth Register
   ... dst
   ```

   Setiap state file berisi:
   ```markdown
   # Phase [XX]: [Nama]
   
   ## STATUS: ⬜ Not Started
   ## DEPENDENCY: Phase [XX]
   ## ESTIMASI: [XS/S/M]
   
   ## SCOPE
   - [ ] [file/folder 1]
   - [ ] [file/folder 2]
   - [ ] [file/folder 3]
   
   ## CONTEXT
   [1-2 kalimat dari blueprint tentang fitur ini]
   
   ## NOW: -
   ## NEXT: -
   ## CRUMBS: -
   ```

5. **Update active.md** — populate PHASE INDEX:
   ```markdown
   ## PHASE INDEX
   | Phase | State File | Status | Estimasi | Dependency |
   |-------|-----------|--------|----------|------------|
   | 0: Setup | phase-00.md | ⬜ | XS | - |
   | 1: Auth Login | phase-01.md | ⬜ | S | Phase 0 |
   | 2: Auth Register | phase-02.md | ⬜ | S | Phase 1 |
   | ... | ... | ... | ... | ... |
   ```

6. **Setup project** (TANYA user dulu):
   - Scaffold framework (npx create-next-app, dll)
   - Setup feature-based folder structure
   - Setup shared types (types/)
   - Init git jika belum

7. **Report:**
```
🚀 Engine Initialized: [nama project]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Stack: [detected/chosen]
🏗️ Mode: New Project + Blueprint
📋 Phases: [N] phases auto-generated
⏱️ Total Estimasi: [X] jam
🔀 Parallel OK: [phase pairs yang bisa paralel]

📊 Phase Distribution:
   XS: [count] | S: [count] | M: [count]
   
🎯 Phase 0 (Setup) siap dikerjakan.
   Ketik /plan Phase 0: Setup untuk mulai.
```

---

### Mode B: Existing Project (DEEP SCAN)

// turbo-all

1. **Smart scan** (budget: max 10 tool calls):
   a. `list_dir` root → folder structure (1 call)
   b. `package.json` → stack, deps, scripts (1 call, 50 lines)
   c. `README.md` / docs → project purpose (1 call, 50 lines)
   d. `list_dir src/` → architecture pattern (1 call)
   e. Top 3-5 key files → 50 lines each (3-5 calls)
   f. `git log -10 --oneline` → recent activity (1 call)
   g. `.env.example` → environment vars (1 call jika ada)

2. **Pattern recognition**:
   - Architecture: monolith / modular / microservice / monorepo
   - Naming conventions yang dipakai
   - Component structure & state management
   - API patterns (REST / GraphQL / tRPC)
   - Database (Prisma / TypeORM / Drizzle / raw SQL)

3. **Auto-generate state**:
   - `docs/state/active.md` → set initial phase
   - `docs/state/phase-01.md` → "Understanding & Audit" phase
   - `docs/tracker.md` → empty, siap pakai

4. **Ask user**:
   - "Apakah ada master_blueprint.md / PRD? Jika ya, taruh di root."
   - "Apa prioritas pertama? (fix bugs / new feature / refactor)"

5. **Report**:
```
🔍 Engine Initialized: [project name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Stack: [detected]
🏗️ Architecture: [detected]
📁 Files: [count] files, [count] folders
🌿 Git: [branch] ([commit count] commits)
🎯 Phase 1: Understanding & Audit
📋 State: Generated from scan

📐 Patterns Detected:
   - [naming convention]
   - [component pattern]
   - [state management]

Ready. Apa yang mau dikerjakan pertama?
```

---

### Mode C: Empty Project

1. Gather requirements:
   - Apa yang dibangun?
   - Tech stack preference?
   - Target deployment?
   - Scale? (MVP / medium / enterprise)

2. Recommend architecture
3. Scaffold → proceed like Mode A

---

### Rules

- JANGAN modify existing code saat /init — PURE read-only scan
- Smart scan budget: MAX 10 tool calls, MAX 1500 token input
- JANGAN baca node_modules, .git, dist, build, test files
- JANGAN scan nested folders > depth 3
- SELALU offer to create master_blueprint.md jika tidak ada
