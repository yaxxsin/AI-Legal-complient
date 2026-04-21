# Phase 22: Admin CMS — Landing Page Builder

## STATUS: 📋 Planned
## DEPENDENCY: Phase 16 (Admin Panel)
## ESTIMASI: L (~4 jam)

## SCOPE
- [ ] 1. CMS Data Model (Page, Section, Component schema di Prisma)
- [ ] 2. Admin CMS Dashboard — CRUD halaman landing (hero, features, testimonials, CTA)
- [ ] 3. Rich-text / block editor UI (Tiptap atau custom block editor)
- [ ] 4. Image upload untuk banner/hero via MinIO storage
- [ ] 5. Preview mode — admin bisa preview halaman sebelum publish
- [ ] 6. Public API endpoint untuk render landing page dari CMS data
- [ ] 7. Frontend landing page render dari CMS API (replace hardcoded landing)
- [ ] 8. SEO metadata per halaman (title, description, OG tags)

## CONTEXT
Memungkinkan admin membuat dan mengedit landing page tanpa deploy ulang.
Arsitektur: Admin menulis konten di dashboard → disimpan ke DB → 
public landing page render dari API secara dinamis.

Block types: Hero, Feature Grid, Testimonial, Pricing CTA, FAQ, 
Custom HTML, Image Banner.

## NOW: -
## NEXT: -
## CRUMBS: -
