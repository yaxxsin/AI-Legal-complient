# Phase 14: Knowledge Base & FAQ

## STATUS: 🟡 In Progress
## DEPENDENCY: Phase 0
## ESTIMASI: S (~1 jam)

## SCOPE
- [x] F-08-01: Article listing page + category filter
- [x] Article detail page (markdown rendering via remark)
- [x] Search: PostgreSQL tsvector (title + body)
- [ ] SEO: generateMetadata(), canonical URL
- [x] Seed 20 artikel (6 kategori)
- [ ] Admin article CMS (rich text editor via Tiptap)

## CONTEXT
MOD-08 dari blueprint. Knowledge base artikel FAQ & panduan hukum.
Kategori: Pendirian Usaha, Ketenagakerjaan, Perpajakan, Kontrak, Perizinan, UMKM.
Public access, SEO optimized. CTA box ke ComplianceBot.

Blueprint ref: BAB 6 MOD-08 (F-08-01)

## NOW: SEO metadata + admin CMS
## NEXT: Add generateMetadata() SSR, admin article editor
## CRUMBS:
- articles.module.ts, articles.service.ts, articles.controller.ts created
- seed-articles.ts: 6 categories + 20 articles seeded
- use-articles.ts hook created
- knowledge-base/page.tsx + [slug]/page.tsx + knowledge-base.css created
- sidebar.tsx: /panduan → /knowledge-base


