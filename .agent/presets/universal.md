# PRESET: Universal (Fallback)

> Loaded saat tidak ada stack-specific preset yang cocok.
> Berlaku untuk semua bahasa dan framework.

---

## Architecture Principles

```
1. FEATURE-BASED STRUCTURE
   - Setiap fitur/module di folder sendiri
   - Minimize cross-feature dependencies
   - Shared code di folder terpisah (lib/, shared/, common/)

2. SEPARATION OF CONCERNS
   - UI / Business Logic / Data Access terpisah
   - JANGAN campur HTTP handling dengan business logic
   - JANGAN campur database query dengan presentation

3. DEPENDENCY DIRECTION
   - Features → Shared (OK)
   - Shared → Features (DILARANG)
   - Feature A → Feature B (DILARANG — gunakan shared)
```

## Phase Isolation (Universal)

```
project/
├── src/
│   ├── features/              ← 1 folder per phase
│   │   ├── [phase-1-name]/    ← Phase 1 scope (isolated)
│   │   ├── [phase-2-name]/    ← Phase 2 scope (isolated)
│   │   └── [phase-n-name]/    ← Phase N scope (isolated)
│   │
│   ├── shared/                ← Phase 0 (foundation)
│   │   ├── types/             ← Shared type definitions
│   │   ├── utils/             ← Pure utility functions
│   │   └── config/            ← Configuration
│   │
│   └── core/                  ← Phase 0 (infrastructure)
│       ├── database/          ← DB connection, migrations
│       ├── auth/              ← Authentication
│       └── logging/           ← Logger setup
```

## Auto-Discovery Pattern (Language-Agnostic)

```
Concept:
- Setiap feature exports a manifest file
- Core/infrastructure auto-detects all manifest files
- Registration happens at startup (not at code time)
- Adding new feature = adding new folder + manifest
- ZERO edits to existing files

Implementation varies by language:
- TypeScript: import.meta.glob()
- Python: importlib, pkgutil
- Go: plugin package, init()
- PHP: composer autoload + service providers
- Java: ServiceLoader, Spring component scan
```

## Naming Conventions (Universal)

```
Files:          kebab-case (user-service.ts, auth-handler.py)
Functions:      camelCase (getUserById) or snake_case (get_user_by_id)
                → Pick ONE per project, be CONSISTENT
Classes:        PascalCase (UserService, AuthHandler)
Constants:      UPPER_SNAKE_CASE (MAX_RETRIES, API_BASE_URL)
Directories:    kebab-case (user-management/)
Environment:    UPPER_SNAKE_CASE (DATABASE_URL, JWT_SECRET)
```

## Testing Standard (Universal)

```
- Test files: [filename].test.[ext] atau [filename].spec.[ext]
- Test files tinggal di SAMPING source file (co-located)
- Atau di __tests__/ folder per feature
- JANGAN test implementation details — test behavior
- JANGAN skip error case tests
```

## DB Migration Rules (Universal)

```
- Migrations SEQUENTIAL (never parallel)
- Migration files IMMUTABLE setelah pushed (JANGAN edit migration lama)
- Every schema change = new migration file
- Phase yang depends on tabel phase lain → declare di manifest
- Test rollback SEBELUM push migration
```
