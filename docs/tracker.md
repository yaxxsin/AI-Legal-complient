# 📋 TRACKER — LocalCompliance

> Bug reports, ideas, dan notes yang ditemukan saat kerja.
> Jangan ganggu task aktif — log di sini, kerjakan nanti.

## 🐛 Bugs
<!-- /log bug [deskripsi] -->

## 💡 Ideas
<!-- /log idea [deskripsi] -->

## 📝 Notes
- [2026-04-17] Project initialized via /init (Mode A: New Project + Blueprint)
- [2026-04-17] 22 phases auto-decomposed from master_blueprint.md
- [2026-04-17] Preset loaded: nextjs.md
- [2026-04-17] Stack: Next.js 14 + NestJS + PostgreSQL (Docker) + Prisma + Ollama + Pinecone

## 🔗 Decisions
<!-- /log decision [deskripsi] -->

## 📜 Log
- [2026-04-20] Phase 12 complete: Document Generator CMS — 5 templates, Admin CRUD + editor, version control
- [2026-04-20] c6d8ce7 → feature/phase-12-doc-cms | [infra] refactor: migrate Supabase to Docker/PostgreSQL/JWT (56 files, +2686 -927)
- [2026-04-20] 8e56f50 → feature/phase-12-doc-cms | [phase-13] feat: notifications module + /learn patterns
- [2026-04-20] Fix: dashboard/chat/checklist pages missing (route group path issue), ChatModule + Ollama connected
- [2026-04-21] f73a72c → feature/phase-12-doc-cms | [phase-13] feat: add ChatModule + fix dashboard/chat/checklist routes (9 files, +806 -8)
- [2026-04-21] 048fb19 → feature/phase-12-doc-cms | [infra] fix: Docker build — OpenSSL + standalone + public dir
- [2026-04-21] 84c5251 → feature/phase-12-doc-cms | [phase-14] feat: Knowledge Base — articles API + 20 seeds + UI (13 files, +2181)
- [2026-04-21] 2a9d4da → feature/phase-12-doc-cms | [phase-07] fix: format chat responses with markdown rendering (4 files, +106 -7)
- [2026-04-21] Phase 14 complete: Knowledge Base & FAQ + Admin CMS using Tiptap
- [2026-04-21] Phase 15 complete: Subscription & Billing via Midtrans, PDF Invoice
- [2026-04-21] 84fe94f → feature/phase-12-doc-cms | [phase-14] feat: separate server/client components for SEO, finalize Admin CMS for articles
- [2026-04-21] Phase 16 complete: Admin Panel Setup, Backend Master Data Modules, Frontend Stubs
- [2026-04-21] Phase 17 complete: E2E Testing (Playwright/Jest), Sentry Monitoring, Production Deploy configs
- [2026-04-21] Phase 18 complete: Document Review AI (BullMQ, PDF Parse, Ollama Document Risk Analysis)
- [2026-04-21] [HOTFIX] Fixed API build errors (multer types, ConfigService, pdf-parse ES import)
- [2026-04-21] [HOTFIX] Fixed Next.js build error by adding missing react-dropzone dependency
- [2026-04-21] Saved [phase-17/18] changes to origin/feature/phase-12-doc-cms
- [2026-04-21] Phase 19 complete: HR Compliance Module (BPJS & Pesangon Calculator UI + API)
- [2026-04-21] [HOTFIX] Fixed API startup crash by adding ChatService to ChatModule exports
- [2026-04-21] Phase 20 complete: Multi-User & Team (DB schema, API TeamsModule, Settings UI, Invitation UI)
- [2026-04-21] [HOTFIX] Fixed Next.js build error by resolving incorrect hook variables in Team Invitation page
- [2026-04-21] [HOTFIX] Fixed Teams API returning 404 by rebuilding the API docker container to load TeamsModule
- [2026-04-21] Implemented Feature Flags Toggle: Sidebar now dynamically loads `useFeatureFlags()` hook, and Admin Panel has a functional CRUD UI for managing flags.
- [2026-04-21] Changed Admin Feature Flags UI to use a pre-defined select menu for existing features
- [2026-04-21] Integrated `FeatureFlagGuard` and `@RequireFeature()` decorator to API backend to block requests to disabled features at the controller level (403 Forbidden).
- [2026-04-21] [HOTFIX] Fixed Feature Flag syncing logic where disabling a feature in Admin Dashboard wasn't hiding it for regular users due to `/public` endpoint query filtering and hook fallback defaults.
- [2026-04-21] Enhanced Admin Feature Flags UI: Replaced comma-separated text input for "Target Plans" with interactive Checkbox UI for easier plan (Free, Starter, Growth, Business) restriction mapping.
- [2026-04-21] Expanded `ChatModule` to support Chat History (`model Conversation` & `model Message`), added Memory context window for Ollama, and exposed `GET /api/v1/chat/conversations` endpoints.
- [2026-04-21] Connected Chat History endpoints to Frontend React UI: The UI now restores the user's latest conversation on mount and prevents chat state loss when switching tabs. Added '+ Chat Baru' button.
- [2026-04-21] Phase 21 complete: OSS/NIB Wizard & Evidence Storage. Added MinIO file upload handling for checklist evidence (`ComplianceItemsModule`), KBLI-based generator API, and UI integration. Free users can upload files mapping to checking items (`evidenceUrl`).
- [2026-04-21] Fixed 500 error on `/business-profiles/:id` PUT endpoint where empty strings or parsing errors bypassed undefined check and evaluated to `Invalid Date` or invalid UUIDs.
- [2026-04-21] Implemented AI Auto-Scanner (OCR) for Onboarding wizard using `pdf-parse` & `tesseract.js` + `Ollama`. Added `POST /api/v1/business-profiles/ocr/scan` route, allowing users to automatically populate Business Profile data from physical NIB/NPWP JPGs/PDFs.
- [2026-04-21] Upgraded Checklist UX (Phase 21.1): Auto-generation of KBLI Checklist upon visiting the page if items are empty. Added inline evidence preview component (`iframe` for PDFs, `img` for standard images) natively integrated with MinIO URLs.
