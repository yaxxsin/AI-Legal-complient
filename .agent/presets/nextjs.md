# PRESET: Next.js (App Router)

> Loaded otomatis oleh /init saat detect Next.js project.
> Ini TAMBAHAN di atas rules.md universal.

---

## Stack

```
Framework: Next.js 14+ (App Router)
Styling: Tailwind CSS / CSS Modules
Database: PostgreSQL + Prisma ORM
Auth: NextAuth.js / Custom JWT
Deployment: Vercel / VPS + Nginx
```

## Architecture Standard

```
src/
├── app/                        ← Next.js App Router
│   ├── (auth)/                 ← Auth route group
│   ├── (dashboard)/            ← Protected route group
│   ├── api/v1/                 ← API routes
│   └── layout.tsx              ← Root layout (Phase 0 — JANGAN edit setelahnya)
│
├── features/                   ← FEATURE-BASED (Phase Isolation)
│   ├── auth/                   ← Phase 1 scope
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── manifest.ts         ← Auto-discovered
│   ├── dashboard/              ← Phase 2 scope
│   └── [feature-name]/         ← Phase N scope
│
├── components/                 ← SHARED UI (Phase 0)
│   ├── ui/                     ← Button, Input, Modal, Card
│   └── layout/                 ← Sidebar, Header, Footer
│
├── lib/                        ← SHARED UTILITIES (Phase 0)
│   ├── discovery.ts            ← Auto-discover feature manifests
│   ├── db.ts                   ← Prisma client
│   ├── auth.ts                 ← Auth utilities
│   ├── api-client.ts           ← Frontend API client
│   └── utils.ts                ← Pure utility functions
│
├── types/                      ← SHARED TYPES (Phase 0)
│   ├── engine.ts               ← FeatureManifest interface
│   ├── user.ts                 ← User types (shared cross-phase)
│   └── common.ts               ← Common shared types
│
├── context/                    ← React Context providers
└── hooks/                      ← Shared hooks
```

## Auto-Discovery Setup (Phase 0)

```typescript
// lib/discovery.ts — BUAT SEKALI, JANGAN EDIT LAGI
const manifests = import.meta.glob('../features/*/manifest.ts', { eager: true });

export function getFeatures(): FeatureManifest[] {
  return Object.values(manifests)
    .map((mod: any) => mod.default)
    .filter(m => m.status === 'active')
    .sort((a, b) => a.nav.order - b.nav.order);
}

export function getNavItems(group: string): FeatureManifest[] {
  return getFeatures()
    .filter(f => f.nav.show && f.nav.group === group);
}
```

## Phase 0 Checklist

```
[ ] Next.js project scaffolded
[ ] Tailwind CSS configured
[ ] Folder structure created (features/, types/, lib/)
[ ] lib/discovery.ts created
[ ] types/engine.ts created (FeatureManifest interface)
[ ] Root layout.tsx created (reads from discovery, auto-renders nav)
[ ] Sidebar component (reads getNavItems, auto-renders)
[ ] Prisma setup + initial schema
[ ] Auth skeleton (NextAuth or custom)
[ ] .env.example created
[ ] Git initialized
```

## Naming Conventions (Next.js Specific)

```
Pages:          app/[route]/page.tsx (lowercase route)
Layouts:        app/[route]/layout.tsx
API Routes:     app/api/v1/[resource]/route.ts
Components:     PascalCase.tsx (UserCard.tsx)
Hooks:          use[Name].ts (useAuth.ts)
Utils:          camelCase.ts (formatDate.ts)
Types:          camelCase.ts, PascalCase interfaces
CSS Modules:    [Component].module.css
```

## Styling Rules (Next.js + Tailwind)

```
✅ CSS Modules untuk custom styles (auto-scoped per component)
✅ Tailwind utilities untuk layout, spacing, responsive
✅ CSS variables untuk theme (dark mode toggle)
✅ Framer Motion untuk animations
❌ JANGAN global CSS class (class .card tanpa module scope)
❌ JANGAN inline styles kecuali dynamic values
```
