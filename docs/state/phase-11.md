# Phase 11: Document Generator — Templates MVP

## STATUS: ✅ Complete
## DEPENDENCY: Phase 3
## ESTIMASI: S (~1.5 jam)

## SCOPE
- [x] F-06-01: Template gallery UI (grid 3 kolom)
- [x] Form input per template (dynamic from schema)
- [x] Split view: form (kiri) + live preview (kanan)
- [x] Generate: Handlebars-like rendering → HTML preview
- [x] 3 template MVP: PKWT, PKWTT, NDA
- [ ] DOCX/PDF export (DEFERRED — needs backend Puppeteer/docx lib)
- [ ] File storage: Supabase Storage (DEFERRED — needs credentials)

## CONTEXT
MOD-06 frontend. Document generator at /documents with:
- Template gallery: 3 templates (PKWT, PKWTT, NDA) with categories
- Dynamic form: auto-generated from formSchema per template
- Live preview: split-view with Handlebars-like {{variable}} rendering
- useDocGenerator hook: template state, form data, preview rendering
Backend DOCX/PDF gen deferred — HTML preview works fully.

Blueprint ref: BAB 6 MOD-06 (F-06-01), Sprint 3

## NOW: Complete
## NEXT: Phase 12 (Document Generator Complete + CMS) or Phase 13
## CRUMBS:
- [2026-04-20] hooks/use-doc-generator.ts: NEW — 3 templates + form + renderer
- [2026-04-20] app/(dashboard)/documents/page.tsx: NEW — gallery + form + preview
