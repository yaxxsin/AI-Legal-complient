---
description: Generate boilerplate code sesuai Engine standards  
---

## /gen — Code Generator

Generate boilerplate yang sudah ikut Engine rules: typed, clean, documented, scoped.

### Usage

```
/gen component [Name]     → React component + CSS module + types
/gen hook [useName]       → Custom React hook
/gen api [resource]       → API route (GET, POST, PUT, DELETE)
/gen page [name]          → Next.js page
/gen manifest             → Feature manifest.ts
/gen feature [name]       → Full feature scaffold (folder + all files)
/gen type [Name]          → Type/interface definition
/gen test [file]          → Test file for existing file
```

---

### /gen component [Name]

**Output**: 3 files di `features/[active-phase]/components/`

```typescript
// components/UserCard.tsx
'use client';

import { type FC } from 'react';
import styles from './UserCard.module.css';

interface UserCardProps {
  /** [describe prop] */
  id: string;
}

/** [describe component purpose] */
export const UserCard: FC<UserCardProps> = ({ id }) => {
  return (
    <div className={styles.root}>
      {/* Component content */}
    </div>
  );
};
```

```css
/* components/UserCard.module.css */
.root {
  /* Scoped styles — no conflict with other phases */
}
```

```typescript
// components/UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('renders correctly', () => {
    render(<UserCard id="test-1" />);
    // assertions
  });
});
```

---

### /gen hook [useName]

**Output**: 1 file di `features/[active-phase]/hooks/`

```typescript
// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';

interface UseAuthOptions {
  /** [describe option] */
}

interface UseAuthReturn {
  /** [describe return values] */
  isLoading: boolean;
  error: string | null;
}

/**
 * [describe hook purpose]
 * @param options - Hook configuration
 * @returns [describe return]
 */
export function useAuth(options?: UseAuthOptions): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Implementation

  return { isLoading, error };
}
```

---

### /gen api [resource]

**Output**: 1 file di `app/api/v1/[resource]/route.ts`

```typescript
// app/api/v1/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Input validation schema
const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

/** GET /api/v1/users — List resources */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Auth check
    // Query params: page, limit, search
    // Database query
    // Return response
    return NextResponse.json({
      success: true,
      data: [],
      meta: { page: 1, total: 0 },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Server error' } },
      { status: 500 }
    );
  }
}

/** POST /api/v1/users — Create resource */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validated = createSchema.parse(body); // Input validation
    // Auth check
    // Create in database
    // Return created resource
    return NextResponse.json({ success: true, data: validated }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: error.errors } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Server error' } },
      { status: 500 }
    );
  }
}
```

---

### /gen feature [name]

**Output**: Full feature scaffold

```
features/[name]/
├── components/
│   └── .gitkeep
├── hooks/
│   └── .gitkeep
├── actions/
│   └── .gitkeep
├── types.ts          ← Feature-specific types
├── manifest.ts       ← Auto-discovery registration
└── index.ts          ← Barrel export
```

Dengan manifest.ts auto-filled:
```typescript
import type { FeatureManifest } from '@/types/engine';

const manifest: FeatureManifest = {
  id: '[name]',
  name: '[Name]',
  icon: 'Box',
  path: '/[name]',
  phase: [active phase number],
  status: 'active',
  nav: { show: true, group: 'main', order: 10 },
  dependsOn: [],
  dbCreates: [],
  dbReads: [],
};

export default manifest;
```

---

### /gen manifest

**Output**: `manifest.ts` dari template — sama seperti `/gen feature` tapi hanya manifest file

---

### /gen type [Name]

**Output**: Type definition di lokasi yang tepat

```typescript
// Jika shared (dipakai cross-phase) → types/[name].ts
// Jika private (1 phase saja) → features/[phase]/types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'user' | 'staff';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}
```

---

### /gen test [file]

**Output**: Test file di samping source file

```typescript
// [filename].test.ts
import { describe, it, expect, vi } from 'vitest'; // atau jest

describe('[module name]', () => {
  describe('[function/component name]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error case', () => {
      // Error scenario
    });

    it('should handle edge case: empty input', () => {
      // Edge case
    });
  });
});
```

---

### Steps (Semua /gen commands)

1. **Detect active phase** dari `docs/state/active.md`
2. **Determine output path** berdasarkan phase scope
3. **Generate files** dari template
4. **Breadcrumb**: append ke CRUMBS
5. **Confirm**:
```
📐 Generated:
   [list files created]
   Phase: [X] — [nama]
   Scope: features/[phase]/

   Customize lalu /save saat siap.
```

### Rules

- SELALU generate di folder phase aktif (kecuali shared types)
- SELALU include TypeScript types (JANGAN `any`)
- SELALU include JSDoc comments
- SELALU include error handling
- SELALU CSS Modules (bukan global CSS)
- Template = STARTING POINT — user HARUS customize
- Setelah generate → jangan auto-edit, biarkan user review dulu
