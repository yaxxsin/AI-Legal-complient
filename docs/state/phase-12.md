# Phase 12: Document Generator — Templates Complete + Admin CMS

## STATUS: ✅ Complete
## DEPENDENCY: Phase 11
## ESTIMASI: S (~1 jam)
## BRANCH: feature/phase-12-doc-cms

## SCOPE
- [x] 2 template sisa: PKS (Perjanjian Kerjasama) + Kontrak Freelance
- [x] F-06-02: Admin template CRUD + preview + publish
- [x] Handlebars editor + JSON Schema form builder
- [x] Version control per template edit

## CONTEXT
MOD-06 lanjutan. Menyelesaikan 5 template MVP & admin CMS.
Admin buat/edit/preview/publish template. Legal reviewer approval.
Blueprint ref: BAB 6 MOD-06 (F-06-02), Sprint 4

## NOW: Complete
## NEXT: Phase 13 — Regulatory Alerts & Notifications
## CRUMBS:
- apps/api/src/modules/documents/dto/* — 3 DTOs (create, update, generate)
- apps/api/src/modules/documents/documents.service.ts — Template CRUD + version auto-increment + doc generation
- apps/api/src/modules/documents/documents.controller.ts — User + Admin endpoints
- apps/api/src/modules/documents/documents.module.ts — Module wiring
- apps/api/src/app.module.ts — Registered DocumentsModule
- apps/api/prisma/seed-documents.ts — 5 templates seed (PKWT, PKWTT, NDA, PKS, Freelance)
- apps/web/hooks/use-doc-generator.ts — API fetch + fallback to 5 local templates
- apps/web/app/(dashboard)/documents/page.tsx — Updated with loading state
- apps/web/app/(admin)/admin/templates/page.tsx — Admin template list (search, publish, delete)
- apps/web/app/(admin)/admin/templates/[id]/page.tsx — Editor (HTML + form builder + preview)
