# Phase 03: Onboarding Wizard

## STATUS: ✅ Complete
## DEPENDENCY: Phase 1
## ESTIMASI: S (~1.5 jam)

## SCOPE
- [x] F-02-01: Onboarding wizard UI (5 steps) + auto-save per step
- [x] Business profile CRUD API (apps/api/src/modules/business-profiles/)
- [x] Wizard components (apps/web/components/onboarding/)

## CONTEXT
MOD-02 dari blueprint. 5-step onboarding wizard:
1. Jenis Usaha, 2. Sektor Industri, 3. Detail Bisnis, 4. Skala Bisnis, 5. Legalitas.
Auto-save draft setiap pindah step. Submit triggers compliance checklist generation.
Plan limits: Free=1, Growth=3, Business=10 profil.

Blueprint ref: BAB 6 MOD-02 (F-02-01)

## NOW: ✅ Phase 03 COMPLETE
## NEXT: Phase 04 (Master Data Sektor) or Phase 05 (RAG Pipeline)
## CRUMBS:
- apps/api/src/modules/business-profiles/dto/ (NEW — 4 DTO files)
- apps/api/src/modules/business-profiles/business-profiles.service.ts (NEW)
- apps/api/src/modules/business-profiles/business-profiles.controller.ts (NEW)
- apps/api/src/modules/business-profiles/business-profiles.module.ts (NEW)
- apps/api/src/modules/sectors/sectors.service.ts (NEW)
- apps/api/src/modules/sectors/sectors.controller.ts (NEW)
- apps/api/src/modules/sectors/sectors.module.ts (NEW)
- apps/api/src/app.module.ts (MODIFIED — registered 2 new modules)
- apps/api/prisma/seed.ts (MODIFIED — 15 root + 14 sub-sectors)
- apps/web/components/onboarding/ (NEW — 6 wizard components)
- apps/web/app/(dashboard)/onboarding/page.tsx (NEW — wizard orchestrator)

## CONTEXT:
- Wizard flow: Step 1 creates draft via POST → Steps 2-4 auto-save via PATCH /step → Step 5 submit finalizes via PUT
- Plan limits enforced in service.create() via PLAN_LIMITS map (free=1, growth=3, business=10)
- Sectors API is PUBLIC (no auth guard) — fetched client-side by WizardStep2
- RolesGuard caches dbUser.plan on request → used by controller to pass plan to service
- Seed has 15 root + 14 sub-sectors with deterministic UUIDs (10000000-/20000000- prefix)
- onboardingCompleted flag on User model — updated on wizard submit

## DON'T:
- JANGAN modify schema.prisma (BusinessProfile + Sector already exist)
- JANGAN use apiClient helper in onboarding — uses direct fetch with getHeaders() for auth
- JANGAN forget ownership check in service (userId comparison on every mutation)

## CHECKPOINT: 2026-04-17T11:45 — manual snap (phase-03 complete)
