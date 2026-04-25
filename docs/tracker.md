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
- [2026-04-21] ad449ec → feature/phase-21-checklist | [phase-26] feat: implement automated regulation sync and pricing upgrade UI (14 files, +953 -7)
- [2026-04-21] Admin-facing: Created Automation Module for Regulation Sync (Phase 26). Automated Daily Cron (2 AM) to pull latest laws from peraturan.go.id & JDIH, added Diff Engine, and auto-broadcasted Regulatory Alerts to relevant users.
- [2026-04-21] User-facing: Integrated Pricing Upgrade "Paywall" logic. If a user hits a plan limit, the UI now displays a premium prompt to upgrade, with a smart backend that recycles existing draf-profiles to prevent unnecessary blocks.
- [2026-04-22] 3d22185 → feature/phase-21-checklist | [phase-21] feat: implement post-nib compliance roadmap and scoring (13 files, +1722 -23)
- [2026-04-22] Phase 21 redesigned: OSS Wizard transformed into "Post-NIB Compliance Roadmap". Added 13-step compliance framework (Documents, Monthly/Annual Tax), automated scoring engine, tax deadline calendar, and NIB activation flow.
- [2026-04-22] 47ae50a → feature/phase-21-checklist | [phase-21] feat: merge compliance checklist into roadmap and implement tax notifications (8 files, +326 -440)
- [2026-04-22] System Consolidation: Merged "Checklist KBLI" into "Roadmap Kepatuhan" UI as a tab. /checklist route now redirects to roadmap. Implemented @Cron tax-deadline-reminders in OssWizardService to send H-7/H-1 alerts.
- [2026-04-22] Phase 23 complete: Midtrans Sandbox Integration & Payment Testing. Added webhook idempotency, retry logic, enhanced logging, env-based Snap URL switching, comprehensive E2E test suite, and sandbox testing guide.
- [2026-04-22] 6102521 → feature/phase-23-midtrans | [phase-23] feat: midtrans sandbox integration with E2E tests and webhook improvements (9 files, +789 -87)
- [2026-04-22] 8c387ef → feature/phase-23-midtrans | [cms] feat: full CRUD CMS builder — create/edit/delete pages + structured section editors (20 files, +1316 -320)
- [2026-04-22] bc95c33 → feature/phase-23-midtrans | [cms] fix: resolve client-side error on create page + add home page detection with auto-create (17 files, +136 -194)
- [2026-04-22] 912b295 → feature/phase-23-midtrans | [admin] feat: user management CRUD + real-time overview dashboard + fix CMS editor React error 438 (12 files, +882 -76)
- [2026-04-22] 8e4c322 → feature/phase-24-security | [phase-24] feat: session management, security hardening, httpOnly cookies + hotfixes (billing, CMS, nibIssuedDate, cookie migration)
- [2026-04-22] Phase 24 complete: Session Management & Security Hardening. httpOnly cookies, refresh token rotation, Session DB model, rate limiting (ThrottlerModule), cookie-parser, session management UI, 14 frontend files migrated from document.cookie to credentials:include.
- [2026-04-22] [HOTFIX] Fixed billing controller req.user.userId → req.user.id (6 occurrences), teams controller same fix (6 occurrences).
- [2026-04-22] [HOTFIX] Fixed CMS controller double prefix v1/cms → cms, @Roles('ADMIN') → @Roles('admin'), SupabaseAuthGuard → JwtAuthGuard.
- [2026-04-22] [HOTFIX] Fixed nibIssuedDate validation error — added field to UpdateBusinessProfileDto.
- [2026-04-22] [HOTFIX] Fixed Midtrans checkout 500 — added mock mode for placeholder keys, wrapped error in BadRequestException.
- [2026-04-22] 56b766c → feature/phase-25-multiprofile | [phase-25] feat: multi-profile separation with sidebar switcher + hotfixes (10 files, +314 -29)
- [2026-04-22] Multi-profile separation: ProfileSwitcher in sidebar, useProfileStore (Zustand), oss-wizard uses activeProfileId, dashboard shows compliance score per profile, starter plan limit fixed (2→1). Chat: @SkipThrottle + better error messages.
- [2026-04-22] 7afb5ad → feature/phase-25-multiprofile | [billing] feat: plan usage limits enforcement — UsageLimitService, chat/doc/review limits, expiry cron, admin plan sync (13 files, +281 -24)
- [2026-04-22] Plan enforcement: UsageLimitService (chat 10/day free, docs 2/mo free 10/mo starter, review growth/business only), subscription expiry cron @3AM, admin updatePlan syncs User+Subscription, billing page uses user.plan as source of truth, pricing page highlights active plan.
- [2026-04-22] 2be3c75 → feature/phase-25-multiprofile | [security] feat: admin/user session separation — middleware JWT role check, AdminGuard, login redirect, sidebar switcher (5 files, +97 -7)
- [2026-04-22] Admin session separation: middleware decodes JWT role at edge, AdminGuard client component, admin layout wrapped, login redirects admin→/admin, sidebar shows admin/user switcher link.
- [2026-04-25] ea149fd → feature/phase-25-multiprofile | [phase-25] feat: multi-AI model integration — Ollama + Gemini provider abstraction, model selector UI (32 files, +829 -169)
- [2026-04-25] Phase 25 complete (Ollama + Gemini): AiProvider interface, OllamaProvider, GeminiProvider, AiProviderFactory with plan-based access + fallback, ChatService refactored, model/provider fields on Conversation+Message, model selector dropdown in chat UI, GET /chat/models endpoint.
