# MASTER BLUEPRINT — LocalCompliance

> Platform AI compliance hukum bisnis Indonesia.
> Ini adalah sumber kebenaran untuk seluruh project.

---

## BAB 1: Executive Summary

### 1.1 Project Name
**LocalCompliance** — AI-Powered Business Legal Compliance Platform

### 1.2 Description
LocalCompliance adalah platform SaaS yang membantu UMKM dan startup di Indonesia memahami dan memenuhi kewajiban hukum bisnis mereka menggunakan AI. Platform ini menyederhanakan compliance menjadi checklist yang actionable, chatbot AI yang menjawab pertanyaan hukum dalam bahasa awam, dan generator dokumen legal otomatis.

### 1.3 Target Users
- **Primer**: Pemilik UMKM (usaha mikro, kecil, menengah) yang baru memulai atau sedang berkembang
- **Sekunder**: Founder startup early-stage (pre-seed hingga Series A)
- **Tersier**: Konsultan bisnis/hukum yang mengelola compliance beberapa klien

### 1.4 Business Goals
- Menjadi platform compliance #1 untuk UMKM Indonesia dalam 2 tahun
- Akuisisi 10.000 pengguna aktif dalam 12 bulan pertama
- Mencapai MRR Rp 500 juta di bulan ke-18
- Mengurangi waktu compliance UMKM dari berminggu-minggu menjadi hitungan jam

### 1.5 Problem Statement
- 65 juta+ UMKM di Indonesia, mayoritas tidak paham kewajiban hukum
- Konsultasi hukum mahal (Rp 2-10 juta per sesi) dan intimidatif
- Regulasi tersebar di banyak sumber, sering berubah, dan ditulis dalam bahasa yang sulit dipahami
- Tidak ada tools terintegrasi — pengusaha harus riset sendiri, manual, tanpa guidance

### 1.6 Solution
Platform all-in-one yang memberikan:
1. **Personalized compliance checklist** berdasarkan profil bisnis
2. **AI ChatBot (ComplianceBot)** yang menjawab pertanyaan hukum berbasis RAG
3. **Document generator** untuk dokumen legal standar
4. **Regulatory alerts** untuk perubahan regulasi yang relevan
5. **Compliance scoring** untuk tracking progress

### 1.7 Pricing Plans

| Fitur | Free | Starter (Rp 99K/bln) | Growth (Rp 299K/bln) | Business (Rp 799K/bln) |
|-------|------|-----------------------|-----------------------|-------------------------|
| Profil Bisnis | 1 | 1 | 3 | 10 |
| ComplianceBot | 10 query/hari | Unlimited | Unlimited + priority | Unlimited + priority |
| Checklist | View only | Full access | Full access | Full access |
| Document Generator | 2 docs/bulan | 10 docs/bulan | Unlimited | Unlimited |
| Document Review AI | ❌ | ❌ | 3 review/bulan | 20 review/bulan |
| Regulatory Alerts | ❌ | Email digest | Real-time | Real-time + custom |
| HR Calculator | Basic | Full | Full | Full |
| Support | Community | Email | Priority email | Dedicated CS |

---

## BAB 2: Tech Stack

### 2.1 Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (client state) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Rich Text Editor**: Tiptap (untuk CMS admin)

### 2.2 Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS (modular architecture)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Queue**: BullMQ + Redis (background jobs)
- **Logger**: Pino
- **API Docs**: Swagger/OpenAPI

### 2.3 AI & Data
- **LLM**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Embedding**: OpenAI text-embedding-3-small
- **Vector DB**: Pinecone (1 index, namespace per document_type)
- **RAG**: LangChain TextSplitter (chunk_size=700, overlap=100)

### 2.4 Infrastructure
- **Auth**: Supabase Auth (email + Google SSO + Magic Link)
- **Storage**: Supabase Storage (documents, images)
- **Hosting Frontend**: Vercel
- **Hosting Backend**: Railway
- **Email**: Resend (transactional email)
- **Payment**: Midtrans (VA, e-wallet, kartu kredit, retail)
- **Monitoring**: Sentry (error tracking) + Datadog (APM)
- **CI/CD**: GitHub Actions → Vercel + Railway

---

## BAB 3: Database Schema

### 3.1 ERD Overview

| Tabel | Deskripsi | Relasi Utama |
|-------|-----------|--------------|
| `users` | Data pengguna (profile, plan, role) | 1 user → N business_profiles |
| `business_profiles` | Profil bisnis pengguna | 1 profile → N compliance_items, N alerts |
| `sectors` | Master data sektor industri (hierarchical) | 1 sector → N sub_sectors, N compliance_rules |
| `compliance_rules` | Master rules untuk generate checklist | N rules → N compliance_items |
| `compliance_categories` | Kategori item checklist | 1 category → N compliance_items |
| `compliance_items` | Instance checklist per profil bisnis | N items → 1 business_profile, 1 rule |
| `compliance_score_history` | Snapshot skor harian per profil | N → 1 business_profile |
| `conversations` | Thread percakapan ComplianceBot | 1 conversation → N messages |
| `messages` | Pesan individual dalam conversation | N messages → 1 conversation |
| `regulations` | Database regulasi Indonesia | 1 regulation → N regulation_chunks |
| `regulation_chunks` | Potongan teks regulasi untuk RAG | N chunks → 1 regulation |
| `document_templates` | Template dokumen hukum | 1 template → N generated_documents |
| `generated_documents` | Dokumen yang sudah digenerate user | N → 1 template, 1 user |
| `notifications` | Notifikasi in-app per user | N → 1 user |
| `subscriptions` | Subscription aktif per user | 1 → 1 user |
| `invoices` | Riwayat tagihan | N → 1 user, 1 subscription |
| `article_categories` | Kategori artikel knowledge base | 1 → N articles |
| `articles` | Artikel FAQ & panduan | N → 1 category |
| `compliance_item_audit` | Audit log perubahan status checklist | N → 1 compliance_item |
| `hr_bpjs_rates` | Tabel tarif BPJS (updateable) | Standalone config table |
| `feature_flags` | Toggle fitur on/off | Standalone config table |

### 3.2 Core Tables

```sql
-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- user | admin | super_admin
  plan VARCHAR(20) NOT NULL DEFAULT 'free', -- free | starter | growth | business
  email_verified BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- BUSINESS PROFILES
-- ==========================================
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(200) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- pt | cv | firma | ud | perorangan | koperasi | yayasan
  establishment_date DATE,
  sector_id UUID REFERENCES sectors(id),
  sub_sector_ids JSONB, -- Array UUID sub_sectors
  employee_count INTEGER NOT NULL DEFAULT 0,
  annual_revenue VARCHAR(50), -- <500jt | 500jt-2.5M | 2.5M-50M | >50M
  city VARCHAR(100),
  province VARCHAR(100),
  has_nib BOOLEAN DEFAULT false,
  nib_number VARCHAR(50),
  npwp VARCHAR(50),
  is_online_business BOOLEAN DEFAULT false,
  onboarding_step INTEGER NOT NULL DEFAULT 1, -- 1-5
  is_draft BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- SECTORS (Hierarchical - KBLI 2020)
-- ==========================================
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(10), -- Kode KBLI
  parent_id UUID REFERENCES sectors(id),
  icon VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- COMPLIANCE RULES (Master Data)
-- ==========================================
CREATE TABLE compliance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- Perizinan, Ketenagakerjaan, Perpajakan, Kontrak, K3, Lingkungan
  icon VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES compliance_categories(id),
  priority VARCHAR(20) NOT NULL, -- critical | high | medium | low
  conditions JSONB NOT NULL, -- { entity_types: [], sectors: [], min_employees: N, max_employees: N, is_online: bool }
  legal_references JSONB NOT NULL, -- [{name, article, url}]
  due_date_logic JSONB, -- { type: 'days_from_start' | 'fixed_date', value: N }
  guidance_text TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- COMPLIANCE ITEMS (Per Business Profile)
-- ==========================================
CREATE TABLE compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES compliance_rules(id),
  category_id UUID NOT NULL REFERENCES compliance_categories(id),
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  legal_basis JSONB NOT NULL, -- [{name, article, url}]
  priority VARCHAR(20) NOT NULL, -- critical | high | medium | low
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | in_progress | done | not_applicable | overdue
  due_date DATE,
  completed_at TIMESTAMP,
  evidence_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE compliance_item_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  notes TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- COMPLIANCE SCORE HISTORY
-- ==========================================
CREATE TABLE compliance_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,1) NOT NULL, -- 0.0 - 100.0
  category_scores JSONB NOT NULL,
  total_items INTEGER NOT NULL,
  completed_items INTEGER NOT NULL,
  critical_pending INTEGER NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- CONVERSATIONS & MESSAGES (ComplianceBot)
-- ==========================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_profile_id UUID REFERENCES business_profiles(id),
  title VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- user | assistant
  content TEXT NOT NULL,
  sources JSONB, -- [{regulation_name, article, url, relevance_score}]
  feedback VARCHAR(10), -- thumbs_up | thumbs_down | NULL
  feedback_comment TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- REGULATIONS (Knowledge Base)
-- ==========================================
CREATE TABLE regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  regulation_number VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- UU | PP | Perpres | Permen | Perda | SE | PKPU
  issued_by VARCHAR(200) NOT NULL,
  issued_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- berlaku | dicabut | diubah
  sector_tags JSONB NOT NULL,
  source_url VARCHAR(500) NOT NULL,
  content_raw TEXT NOT NULL,
  pinecone_indexed BOOLEAN NOT NULL DEFAULT false,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE regulation_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id UUID NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- {pasal, bab, section}
  pinecone_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- DOCUMENT TEMPLATES & GENERATED DOCUMENTS
-- ==========================================
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- ketenagakerjaan | kerjasama | kerahasiaan | jasa | lainnya
  template_html TEXT NOT NULL, -- Handlebars template
  form_schema JSONB NOT NULL, -- JSON Schema Draft 7
  is_published BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES document_templates(id),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id),
  form_data JSONB NOT NULL,
  output_format JSONB NOT NULL, -- ['docx', 'pdf']
  file_url_docx VARCHAR(500),
  file_url_pdf VARCHAR(500),
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL -- +30 hari
);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- regulatory_change | compliance_deadline | system | welcome
  title VARCHAR(300) NOT NULL,
  body TEXT NOT NULL,
  regulation_id UUID REFERENCES regulations(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- SUBSCRIPTIONS & INVOICES
-- ==========================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL, -- free | starter | growth | business
  billing_cycle VARCHAR(10) NOT NULL, -- monthly | annual
  status VARCHAR(20) NOT NULL, -- active | cancelled | past_due | paused
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  midtrans_subscription_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- paid | pending | failed
  midtrans_transaction_id VARCHAR(100),
  paid_at TIMESTAMP,
  pdf_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ARTICLES (Knowledge Base FAQ)
-- ==========================================
CREATE TABLE article_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) UNIQUE NOT NULL,
  body TEXT NOT NULL, -- Markdown content
  category_id UUID NOT NULL REFERENCES article_categories(id),
  tags JSONB,
  meta_description VARCHAR(160) NOT NULL,
  read_time_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP,
  author VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- HR RATES & FEATURE FLAGS
-- ==========================================
CREATE TABLE hr_bpjs_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component VARCHAR(50) NOT NULL, -- JHT | JKK | JKM | JP | Kesehatan
  employer_rate DECIMAL(5,2) NOT NULL,
  employee_rate DECIMAL(5,2) NOT NULL,
  effective_from DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  target_plans JSONB, -- ['starter', 'growth', 'business']
  target_users JSONB, -- specific user IDs
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## BAB 4: API Endpoints

### 4.1 Base URL & Conventions
```
Base URL: /api/v1
Auth Header: Authorization: Bearer <access_token>
```

**Standard Response Format:**
```json
// SUCCESS
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 150 } }

// ERROR
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

**Pagination:** `?page=1&limit=20` (default limit: 20, max: 100)

**Pagination Response Meta:**
```json
{ "page": 1, "limit": 20, "total": 150, "total_pages": 8, "has_next": true, "has_prev": false }
```

### 4.1b Auth Architecture

| Komponen | Teknologi | Detail |
|----------|-----------|--------|
| Auth Provider | Supabase Auth | Built-in user management, JWT, RLS (Row Level Security) |
| Session Storage | httpOnly Cookie | Lebih aman dari localStorage, XSS-resistant |
| Social Login | Google OAuth 2.0 | Via Supabase provider, one-click login |
| Password Hashing | bcrypt (via Supabase) | Automatic, salt rounds = 12 |
| Token Expiry | Access: 1 jam, Refresh: 7 hari | Auto-refresh pada setiap request |
| Email Provider | Resend | Transaksional: verifikasi, reset password, welcome email |

### 4.2 MOD-01: Authentication & User Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Registrasi email + password | Public |
| POST | `/api/v1/auth/login` | Login email + password | Public |
| POST | `/api/v1/auth/logout` | Logout + revoke session | User |
| POST | `/api/v1/auth/forgot-password` | Request reset password | Public |
| POST | `/api/v1/auth/reset-password` | Set password baru | Public |
| GET | `/api/v1/auth/verify-email?token=` | Verifikasi email | Public |
| POST | `/api/v1/auth/google` | Login/register via Google SSO | Public |
| GET | `/api/v1/users/me` | Get profil user yang login | User |
| PATCH | `/api/v1/users/me` | Update profil user | User |

### 4.3 MOD-02: Business Profile & Onboarding

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/business-profiles` | Buat profil bisnis baru | User |
| GET | `/api/v1/business-profiles` | Get semua profil bisnis user | User |
| GET | `/api/v1/business-profiles/:id` | Get detail profil bisnis | User |
| PUT | `/api/v1/business-profiles/:id` | Update profil bisnis (full) | User |
| PATCH | `/api/v1/business-profiles/:id/step` | Update per step onboarding (auto-save) | User |
| DELETE | `/api/v1/business-profiles/:id` | Hapus profil bisnis | User |
| GET | `/api/v1/sectors` | Get daftar sektor industri | Public |
| GET | `/api/v1/sectors/:id/sub-sectors` | Get sub-sektor | Public |

### 4.4 MOD-03: ComplianceBot AI Chat

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/chat/send` | Kirim pesan + terima respons AI (SSE streaming) | User |
| POST | `/api/v1/chat/conversations` | Buat conversation baru | User |
| GET | `/api/v1/chat/conversations?page=&limit=` | Get list conversation + pagination | User |
| GET | `/api/v1/chat/conversations/:id/messages` | Get semua pesan dalam conversation | User |
| PATCH | `/api/v1/chat/conversations/:id` | Update title conversation | User |
| DELETE | `/api/v1/chat/conversations/:id` | Hapus conversation | User |
| GET | `/api/v1/chat/conversations/search?q=` | Cari conversation by keyword | User |
| POST | `/api/v1/chat/messages/:id/feedback` | Kirim feedback (thumbs up/down) | User |
| GET | `/api/v1/chat/suggested-questions?profile_id=` | Get suggested questions by profil | User |

### 4.5 MOD-04: Compliance Checklist Engine

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/compliance/generate` | Generate/regenerate checklist dari profil | User |
| GET | `/api/v1/compliance/items?category=&status=` | Get compliance items + filter | User |
| GET | `/api/v1/compliance/categories` | Get kategori + jumlah item + progress | User |
| PATCH | `/api/v1/compliance/items/:id/status` | Update status item + evidence/notes | User |
| GET | `/api/v1/compliance/items/:id/activity` | Get riwayat perubahan status | User |
| GET | `/api/v1/admin/compliance-rules` | List semua rules | Admin |
| POST | `/api/v1/admin/compliance-rules` | Buat rule baru | Admin |
| PUT | `/api/v1/admin/compliance-rules/:id` | Update rule | Admin |
| DELETE | `/api/v1/admin/compliance-rules/:id` | Hapus rule | Admin |

### 4.6 MOD-05: Compliance Score Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/compliance/score` | Get current score + breakdown | User |
| GET | `/api/v1/compliance/score/history?days=30` | Get riwayat score | User |
| GET | `/api/v1/compliance/priority-actions?limit=5` | Get top priority action items | User |

### 4.7 MOD-06: Document Template Generator

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/documents/templates` | Get semua template tersedia | User |
| GET | `/api/v1/documents/templates/:id` | Get detail template + form schema | User |
| POST | `/api/v1/documents/generate` | Generate dokumen dari template + input | User |
| GET | `/api/v1/documents/history` | Get riwayat dokumen yang digenerate | User |
| GET | `/api/v1/documents/:id/download?format=docx\|pdf` | Download dokumen | User |
| GET | `/api/v1/admin/document-templates` | List semua template (admin) | Admin |
| POST | `/api/v1/admin/document-templates` | Buat template baru | Admin |
| PUT | `/api/v1/admin/document-templates/:id` | Update template | Admin |
| POST | `/api/v1/admin/document-templates/:id/publish` | Publish template | Admin |

### 4.8 MOD-07: Regulatory Alert System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/notifications` | Get semua notifikasi user | User |
| PATCH | `/api/v1/notifications/:id/read` | Mark notifikasi dibaca | User |
| PATCH | `/api/v1/notifications/read-all` | Mark semua dibaca | User |
| GET | `/api/v1/notifications/preferences` | Get preferensi notifikasi | User |
| PUT | `/api/v1/notifications/preferences` | Update preferensi | User |
| POST | `/api/v1/internal/send-deadline-reminders` | Trigger reminder (cron) | Internal |

### 4.9 MOD-08: Knowledge Base & FAQ

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/articles?category=&page=` | Get daftar artikel + filter | Public |
| GET | `/api/v1/articles/:slug` | Get detail artikel by slug | Public |
| GET | `/api/v1/articles/search?q=` | Search artikel | Public |
| GET | `/api/v1/articles/categories` | Get kategori artikel | Public |

### 4.10 MOD-09: Subscription & Billing

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/billing/plans` | Get semua plan + harga | Public |
| GET | `/api/v1/billing/subscription` | Get subscription aktif user | User |
| POST | `/api/v1/billing/checkout` | Buat transaksi checkout Midtrans | User |
| POST | `/api/v1/billing/webhook` | Webhook konfirmasi dari Midtrans | Public |
| POST | `/api/v1/billing/cancel` | Request cancel subscription | User |
| GET | `/api/v1/billing/invoices` | Get riwayat invoice | User |
| GET | `/api/v1/billing/invoices/:id/download` | Download invoice PDF | User |

### 4.11 MOD-10: Document Review AI (Phase 2)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/documents/review` | Upload dokumen untuk review AI | User |
| GET | `/api/v1/documents/reviews` | Get riwayat review | User |
| GET | `/api/v1/documents/reviews/:id` | Get hasil review tertentu | User |

### 4.12 MOD-11: HR Compliance Module (Phase 2)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/hr/calculate-bpjs` | Hitung BPJS dari input gaji | User |
| GET | `/api/v1/hr/bpjs-rates` | Get tarif BPJS terkini | User |
| POST | `/api/v1/hr/calculate-severance` | Hitung pesangon | User |

### 4.13 Admin & Knowledge Base Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/admin/regulations` | Upload regulasi baru | Admin |
| GET | `/api/v1/regulations` | Get list regulasi | User |
| GET | `/api/v1/regulations/search?q=` | Search regulasi | User |
| POST | `/api/v1/internal/regulations/:id/index` | Trigger re-index ke Pinecone | Admin |

### 4.14 HTTP Status Codes

| Code | Arti | Kapan Digunakan |
|------|------|-----------------|
| `200 OK` | Sukses | GET, PATCH, PUT berhasil |
| `201 Created` | Resource dibuat | POST yang menciptakan resource baru |
| `204 No Content` | Sukses tanpa body | DELETE berhasil |
| `400 Bad Request` | Request tidak valid | Validasi gagal, format salah |
| `401 Unauthorized` | Belum auth | Token tidak ada atau expired |
| `403 Forbidden` | Tidak punya izin | Role tidak cukup, plan tidak support |
| `404 Not Found` | Resource tidak ditemukan | ID tidak valid atau tidak dimiliki user |
| `409 Conflict` | Konflik data | Email sudah dipakai, duplicate resource |
| `422 Unprocessable` | Validasi semantik gagal | Input valid format tapi logika tidak valid |
| `429 Too Many Requests` | Rate limit | Terlalu banyak request |
| `500 Internal Error` | Server error | Bug, return generic message ke user |

### 4.15 Error Codes

| Error Code | Arti |
|------------|------|
| `VALIDATION_ERROR` | Input tidak memenuhi validasi |
| `AUTH_REQUIRED` | Perlu login |
| `FORBIDDEN` | Tidak punya izin untuk resource ini |
| `RESOURCE_NOT_FOUND` | Data tidak ditemukan |
| `DUPLICATE_ENTRY` | Data sudah ada (email, NIB, dll) |
| `PLAN_LIMIT_REACHED` | Sudah mencapai batas plan |
| `FEATURE_NOT_AVAILABLE` | Fitur tidak tersedia di plan saat ini |
| `RATE_LIMIT_EXCEEDED` | Terlalu banyak request |
| `AI_SERVICE_UNAVAILABLE` | Claude API sedang tidak tersedia |
| `PAYMENT_FAILED` | Proses pembayaran gagal |

---

## BAB 5: File Structure

```
localcompliance/
├── apps/
│   ├── web/                          ← Next.js 14 Frontend
│   │   ├── app/
│   │   │   ├── (auth)/              ← Auth pages (login, register, reset)
│   │   │   ├── (dashboard)/         ← Protected dashboard routes
│   │   │   │   ├── dashboard/       ← Compliance score dashboard
│   │   │   │   ├── onboarding/      ← Business profile wizard
│   │   │   │   ├── chat/            ← ComplianceBot AI chat
│   │   │   │   ├── checklist/       ← Compliance checklist
│   │   │   │   ├── documents/       ← Document templates & generation
│   │   │   │   ├── notifications/   ← Notification center
│   │   │   │   ├── billing/         ← Subscription & billing
│   │   │   │   ├── panduan/         ← Knowledge base articles
│   │   │   │   └── settings/        ← User settings
│   │   │   ├── (admin)/             ← Admin panel routes
│   │   │   │   └── admin/
│   │   │   │       ├── users/
│   │   │   │       ├── rules/
│   │   │   │       ├── regulations/
│   │   │   │       ├── templates/
│   │   │   │       └── articles/
│   │   │   ├── (public)/            ← Public pages
│   │   │   │   ├── pricing/
│   │   │   │   └── panduan/[slug]/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx             ← Landing page
│   │   ├── components/
│   │   │   ├── ui/                  ← shadcn/ui components
│   │   │   ├── layout/             ← Navbar, Sidebar, Footer
│   │   │   ├── chat/               ← Chat bubbles, input, sidebar
│   │   │   ├── checklist/          ← Checklist cards, filters
│   │   │   ├── dashboard/          ← Score gauge, charts, widgets
│   │   │   ├── documents/          ← Template cards, form, preview
│   │   │   └── onboarding/         ← Wizard steps, progress bar
│   │   ├── hooks/                   ← Custom React hooks
│   │   ├── lib/                     ← Utilities, API client, auth
│   │   ├── stores/                  ← Zustand stores
│   │   ├── types/                   ← TypeScript types
│   │   └── styles/                  ← Global CSS, Tailwind config
│   │
│   └── api/                         ← NestJS Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/            ← Authentication & authorization
│       │   │   ├── users/           ← User management
│       │   │   ├── business-profiles/ ← Business profile CRUD
│       │   │   ├── chat/            ← ComplianceBot + RAG
│       │   │   ├── compliance/      ← Checklist engine + score
│       │   │   ├── documents/       ← Template generator
│       │   │   ├── notifications/   ← Alert system
│       │   │   ├── billing/         ← Subscription + Midtrans
│       │   │   ├── articles/        ← Knowledge base
│       │   │   ├── regulations/     ← Regulation DB + RAG index
│       │   │   ├── hr/              ← BPJS & severance calc
│       │   │   └── admin/           ← Admin panel APIs
│       │   ├── common/
│       │   │   ├── guards/          ← Auth, Role, Plan guards
│       │   │   ├── interceptors/    ← Response transform, logging
│       │   │   ├── filters/         ← Exception filters
│       │   │   ├── decorators/      ← Custom decorators
│       │   │   └── pipes/           ← Validation pipes
│       │   ├── config/              ← App configuration
│       │   ├── database/            ← Prisma client, migrations
│       │   ├── queue/               ← BullMQ jobs & processors
│       │   └── main.ts
│       └── prisma/
│           ├── schema.prisma
│           ├── seed.ts              ← Initial data seeding
│           └── migrations/
│
├── packages/                        ← Shared packages (monorepo)
│   ├── types/                       ← Shared TypeScript types
│   └── utils/                       ← Shared utilities
│
├── docs/                            ← Engine state files
│   └── state/
│       ├── active.md
│       └── phase-XX.md
├── .agent/                          ← Engine config
├── master_blueprint.md              ← This file
└── README.md
```

---

## BAB 6: Module Details

### MOD-01: Authentication & User Management (Sprint 1)

#### F-01-01: Registrasi Email (MUST HAVE)
- Register via email + password (min 8 char, 1 huruf besar, 1 angka)
- Verifikasi email via link (Resend, expired 24 jam)
- Setelah verifikasi → redirect ke onboarding wizard
- Duplikasi email → error `DUPLICATE_ENTRY`

#### F-01-02: Login & Session (MUST HAVE)
- Login email + password → JWT access token (1 jam) + refresh token (httpOnly cookie, 30 hari)
- Middleware auto-refresh jika access token expired
- Logout → revoke refresh token
- Max 3 device/session aktif bersamaan

#### F-01-03: Google SSO (MUST HAVE)
- Login/register via Google OAuth 2.0 (Supabase Auth)
- User baru via Google → otomatis verified, langsung ke onboarding
- User existing → merge ke akun yang sama by email

#### F-01-04: Reset Password (MUST HAVE)
- Forgot password → kirim email reset link (expired 1 jam)
- Rate limit: max 3 request per email per jam

#### F-01-05: User Profile Management (SHOULD HAVE)
- Edit nama, foto, telepon, preferensi notifikasi
- Ubah password (perlu password lama)
- Delete account (soft delete dengan grace period 30 hari)

#### F-01-06: Role-Based Access Control (MUST HAVE)
- Roles: `user`, `admin`, `super_admin`
- Plan-based feature gating middleware
- Middleware check: role + plan sebelum akses resource

---

### MOD-02: Business Profile & Onboarding (Sprint 1)

#### F-02-01: Onboarding Wizard (MUST HAVE)
**5-step wizard dengan auto-save per step:**

| Step | Nama | Field |
|------|------|-------|
| 1 | Jenis Usaha | entity_type (PT/CV/UD/dll) |
| 2 | Sektor Industri | sector_id, sub_sector_ids (multi-select) |
| 3 | Detail Bisnis | business_name, establishment_date, city, province |
| 4 | Skala Bisnis | employee_count, annual_revenue, is_online_business |
| 5 | Legalitas Existing | has_nib, nib_number, npwp |

- Auto-save draft setiap pindah step (PATCH per step)
- Progress bar di atas form
- User bisa kembali ke step sebelumnya tanpa kehilangan data
- Submit → set `is_draft = false` → trigger compliance checklist generation
- Free plan: max 1 profil. Growth: 3, Business: 10

#### F-02-02: Master Data Sektor (MUST HAVE)
- Hierarchical: Sektor → Sub-sektor (2 level)
- Seed 20+ sektor utama referensi KBLI 2020
- Searchable dropdown di onboarding

---

### MOD-03: ComplianceBot AI Chat (Sprint 2)

#### F-03-01: Chat Interface & AI (MUST HAVE)
- Layout: sidebar conversation list (kiri) + area chat (kanan)
- Chat bubbles: user (kanan, accent), bot (kiri, neutral)
- Streaming response via SSE (Server-Sent Events)
- ComplianceBot persona: ramah, bahasa Indonesia, hindari jargon, selalu disclaimer
- Setiap jawaban AI include: sumber hukum (clickable), disclaimer, suggested follow-ups
- Context window: include max 10 pesan terakhir + RAG context (top-5 chunks from Pinecone)
- Rate limiting: Free = 10 query/hari, Starter+ = unlimited
- Feedback per message: thumbs up/down + optional komentar

#### F-03-02: Knowledge Base Regulasi / RAG (MUST HAVE)
- Regulasi prioritas MVP: UU Ketenagakerjaan, PP BPJS, Peraturan OSS/NIB, PPh Final UMKM, UU PT, UU UMKM
- Chunking: LangChain TextSplitter (chunk_size=700, overlap=100)
- Embedding: text-embedding-3-small (OpenAI)
- Pinecone: 1 index, namespace per document_type (`peraturan`, `faq`, `template`)
- Scraper (node-cron): daily jam 02.00 WIB, target JDIH, BPS, OSS
- Duplicate detection: hash content sebelum insert

#### F-03-03: Suggested Questions (MUST HAVE)
- 4-6 suggested questions berdasarkan profil bisnis (entity_type, sektor, employee_count)
- Grid 2 kolom dengan card kecil + ikon kategori
- Seeded 50+ questions, tagged conditions, sorted by usage frequency

#### F-03-04: Riwayat Percakapan (SHOULD HAVE)
- Sidebar: grouped (Hari ini, Kemarin, 7 hari lalu, Lebih lama)
- Auto-generated title dari pesan pertama (max 60 char)
- Rename, delete, search conversations
- Free plan: max 10 conversation. Berbayar: unlimited
- Infinite scroll (20/halaman), PostgreSQL tsvector search

---

### MOD-04: Compliance Checklist Engine (Sprint 3)

#### F-04-01: Auto-Generate Checklist (MUST HAVE)
- Rule engine: SQL query matching `compliance_rules.conditions` vs `business_profile`
- Auto generate < 5 detik setelah profil selesai
- Grouped by kategori: Perizinan & Legalitas, Ketenagakerjaan, Perpajakan, Kontrak & Perjanjian
- Minimal 10 items untuk UMKM basic
- Regenerasi saat profil update: tambah rules baru, hapus irrelevant, JANGAN reset status done
- Background job: BullMQ, triggered by `business_profile.updated`
- Caching: Redis (TTL 1 jam), invalidate saat profil update

#### F-04-02: Update Status Item (MUST HAVE)
- Status: Pending → Sedang Proses → Selesai → Tidak Berlaku
- Mark done → prompt opsional evidence/catatan
- Perubahan status → real-time update compliance score
- Optimistic UI + rollback jika gagal
- Undo toast (5 detik)
- Audit log: `compliance_item_audit` table

#### F-04-03: Compliance Rules Master Data (MUST HAVE)
- Admin CRUD via CMS (MOD-15)
- Rule conditions: `entity_type IN [...] AND sektor IN [...] AND employee_min <= X`
- Publish/unpublish tanpa hapus
- Version control (non-destructive)
- Seed initial 80+ rules

---

### MOD-05: Compliance Score Dashboard (Sprint 3)

#### F-05-01: Score Calculation & Display (MUST HAVE)
- **Formula**: weighted percentage (done items vs total)
- **Bobot**: critical = 4x, high = 3x, medium = 2x, low = 1x
- **Range**: 0-40 Merah, 41-70 Kuning, 71-90 Hijau, 91-100 Biru
- **UI**: circular gauge + angka besar + kategori teks + breakdown per kategori
- **Trend**: line chart 30 hari (dari `compliance_score_history`)
- **Cron**: snapshot score harian jam 23:59 WIB
- Real-time recalculation via event: `compliance_item.status_changed`

#### F-05-02: Priority Action List (MUST HAVE)
- Top 5 item paling prioritas belum selesai
- Urutan: (1) overdue, (2) critical pending, (3) high + deadline dekat
- CTA 'Kerjakan' → detail item atau ComplianceBot dengan konteks

---

### MOD-06: Document Template Generator (Sprint 3-4)

#### Template MVP (5 Dokumen):

| # | Template | Use Case |
|---|----------|----------|
| 1 | PKWT (Perjanjian Kerja Waktu Tertentu) | Kontrak karyawan kontrak |
| 2 | PKWTT (Perjanjian Kerja Waktu Tidak Tertentu) | Kontrak karyawan tetap |
| 3 | NDA (Non-Disclosure Agreement) | Perlindungan info rahasia |
| 4 | PKS (Surat Perjanjian Kerjasama) | Kerjasama antar bisnis/vendor |
| 5 | Kontrak Jasa Freelance/Konsultan | Perjanjian dengan freelancer |

#### F-06-01: Template Selection & Form Input (MUST HAVE)
- Gallery template (grid 2-3 kolom)
- Form input per template (auto-fill dari profil bisnis)
- Split view: kiri form, kanan live preview
- Output: `.docx` + `.pdf` (download)
- Rendering: Handlebars.js, DOCX via `docx`/`html-docx-js`, PDF via Puppeteer
- File storage: Supabase Storage, auto-cleanup > 30 hari
- Limit: Free = 2/bulan, Starter = 10/bulan, Growth+ = unlimited

#### F-06-02: Template Content Management (MUST HAVE)
- Admin buat/edit/preview/publish template
- Handlebars format (`{{variable_name}}`)
- JSON Schema Draft 7 → form schema → render via `react-jsonschema-form`
- Versioning setiap edit
- Legal reviewer approval sebelum publish

---

### MOD-07: Regulatory Alert System (Sprint 4)

#### F-07-01: Regulatory Change Alert (MUST HAVE)
- Alert via email < 24 jam setelah regulasi baru terdeteksi
- Matching: `regulation.sector_tags` ∩ `business_profile.sector_tags`
- In-app notification center: bell icon + badge + dropdown
- User preferensi: daily digest vs immediate
- Email: Resend + HTML template, batch processing
- Daily digest: cron jam 08.00 WIB

#### F-07-02: Compliance Deadline Reminder (SHOULD HAVE)
- Reminder: 30 hari, 7 hari, 1 hari sebelum due_date
- Hanya item belum done
- Cron: jam 07.00 WIB daily
- Deduplication via `reminder_sent_flags`

---

### MOD-08: Knowledge Base & FAQ (Sprint 4)

#### F-08-01: Artikel FAQ & Panduan Hukum (SHOULD HAVE)
- Minimal 20 artikel saat launch
- Kategori: Pendirian Usaha, Ketenagakerjaan, Perpajakan, Kontrak, Perizinan, UMKM
- SEO optimized: meta title, description, canonical URL (`generateMetadata()`)
- Markdown content, rendered via `marked.js` / `remark`
- Search: PostgreSQL tsvector pada title + body
- CTA box: 'Punya pertanyaan? Tanya ComplianceBot'

---

### MOD-09: Subscription & Billing (Sprint 4)

#### F-09-01: Subscription Management (MUST HAVE)
- Pricing page: 4 plans comparison table, monthly/annual toggle (hemat 20%)
- Checkout flow: Midtrans Snap (VA, e-wallet, kartu kredit, retail)
- Webhook: verifikasi signature Midtrans + idempotency check
- Auto-renewal + notifikasi H-7 dan H-1
- Downgrade/cancel berlaku akhir periode billing
- Invoice PDF generation (jsPDF/Puppeteer)
- Hardcode pricing di backend (BUKAN dari frontend)

---

### MOD-10: Document Review AI (Phase 2, Bulan 4-6)

#### F-10-01: Upload & Analyze Contract (MUST HAVE)
- Upload: PDF/DOCX, max 10MB
- AI analysis < 60 detik (< 20 halaman)
- Output: Risk Score 0-100, klausul berisiko, klausul hilang, rekomendasi perbaikan
- Ekstraksi: `pdf-parse`/`pdfjs-dist` (PDF), `mammoth.js` (DOCX)
- Background: BullMQ queue → process → notify via websocket/polling
- Limit: Growth = 3/bulan, Business = 20/bulan

---

### MOD-11: HR Compliance Module (Phase 2, Bulan 4-6)

#### F-11-01: Kalkulator BPJS (MUST HAVE)
- BPJS TK: JHT (5.7%), JKK (0.24-1.74%), JKM (0.3%), JP (3%)
- BPJS Kesehatan (5%)
- Input: gaji pokok + tunjangan tetap, jumlah karyawan
- Output: breakdown iuran perusahaan vs karyawan, total/bulan
- Tarif disimpan di `hr_bpjs_rates` (updateable tanpa deploy)
- Validasi: gaji ≥ UMR provinsi

#### F-11-02: Kalkulator Pesangon (MUST HAVE)
- Sesuai UU Cipta Kerja (PP 35/2021)
- Input: masa kerja, gaji terakhir, jenis PHK
- Output: pesangon + UPMK + UPH + total
- Semua skenario PHK sebagai lookup table
- Disclaimer: 'Hasil estimasi, konsultasikan dengan konsultan'

---

### MOD-15: Admin & CMS (Cross-phase)

| Fitur | Deskripsi | Priority |
|-------|-----------|----------|
| User Management | List, filter by plan, ban/unban, view subscription | MUST HAVE |
| Compliance Rules CRUD | Buat, edit, publish/unpublish rules | MUST HAVE |
| Regulation Database | Upload, edit, index ke Pinecone | MUST HAVE |
| Document Template CRUD | Buat/edit template + preview | MUST HAVE |
| Article CMS | Rich text editor, publish artikel | MUST HAVE |
| Sectors & Sub-sectors | Manage master data sektor | MUST HAVE |
| Analytics Dashboard | MRR, user growth, churn, query volume | SHOULD HAVE |
| Feedback Review | Thumbs down dari ComplianceBot | SHOULD HAVE |
| Feature Flags | Toggle fitur per plan/user group | SHOULD HAVE |
| Audit Log | Log aksi admin + timestamp + actor | SHOULD HAVE |

**Tech**: AdminJS / Retool, atau Next.js + shadcn/ui. IP whitelist + MFA.

---

### MOD-12: Multi-User & Team Collaboration (Phase 2, Bulan 5-7)

> 🟡 **Status: Planned** — 5 Fitur

#### Scope:
- **Team Workspace**: Satu akun perusahaan bisa invite beberapa anggota tim
- **Role Hierarchy**: Owner → Admin → Member → Viewer
- **Permission Matrix**: Granular akses per modul (checklist edit, chat, document, billing)
- **Activity Feed**: Log aktivitas semua anggota tim di workspace
- **Collaboration**: Assign compliance items ke anggota tim tertentu

#### Technical Notes:
- Extend tabel `users` dengan `team_id` FK
- Buat tabel `teams`, `team_members`, `team_invitations`
- RLS policies di Supabase harus di-update untuk team-scoped access
- Invitation flow: email invite → accept → join team

---

### MOD-13: OSS/NIB Guidance Wizard (Phase 2, Bulan 6-8)

> 🟡 **Status: Planned** — 4 Fitur

#### Scope:
- **Step-by-Step Wizard**: Panduan visual tahapan pendaftaran OSS/NIB
- **Document Checklist**: Daftar dokumen yang perlu disiapkan per entity_type
- **Status Tracker**: Track progress pendaftaran di portal OSS
- **Video Tutorial**: Embedded video walkthrough proses OSS

#### Technical Notes:
- Wizard state disimpan per `business_profile_id`
- Konten panduan disimpan di CMS (tabel `oss_guides`)
- Deep link ke portal OSS resmi (https://oss.go.id)

---

### MOD-14: Obligation Evidence Storage (Phase 2, Bulan 6-8)

> 🟡 **Status: Planned** — 4 Fitur

#### Scope:
- **File Upload per Compliance Item**: Attach bukti pemenuhan (PDF, JPG, PNG)
- **Evidence Gallery**: Galeri semua bukti per business profile
- **Expiry Tracking**: Alert jika dokumen bukti mendekati expired (izin, sertifikat)
- **Audit-Ready Export**: Export semua bukti compliance sebagai ZIP untuk audit

#### Technical Notes:
- Supabase Storage bucket: `evidence/{business_profile_id}/{compliance_item_id}/`
- File limit: max 10MB per file, max 5 files per compliance item
- Metadata: `file_name`, `file_type`, `uploaded_at`, `expires_at`
- Auto-cleanup: file yang sudah tidak terkait item aktif → archive setelah 90 hari

---

## BAB 7: Phase Roadmap

### Sprint 0: Foundation (Minggu 1-2) — 29 SP
- [ ] Setup GitHub repo, branch strategy, PR template (3 SP)
- [ ] Setup Supabase: auth, database, storage, RLS policies (5 SP)
- [ ] Setup Next.js: routing, middleware, env vars, ESLint, Prettier, Husky (3 SP)
- [ ] Setup NestJS API: modules, Supabase client, Pino logger, Swagger (5 SP)
- [ ] Setup Pinecone index & embedding pipeline (test 10 docs) (5 SP)
- [ ] Design system: color tokens, typography, shadcn/ui, Figma (5 SP)
- [ ] Setup CI/CD: GitHub Actions → Vercel + Railway (3 SP)

### Sprint 1: Auth & Onboarding (Minggu 3-4) — 35 SP
- [ ] F-01-01: Registrasi email + verifikasi (Supabase + Resend) (5 SP)
- [ ] F-01-02: Login + logout + session management (3 SP)
- [ ] F-01-03: Google SSO (3 SP)
- [ ] F-01-04: Reset password flow (3 SP)
- [ ] F-01-06: RBAC middleware + plan-based gating (5 SP)
- [ ] F-02-01: Onboarding wizard UI (5 steps) + auto-save (8 SP)
- [ ] F-02-02: Seed master data sektor (KBLI 2020) (3 SP)
- [ ] MOD-15: Setup admin panel basic (user list, rules CRUD) (5 SP)

### Sprint 2: ComplianceBot AI (Minggu 5-6) — 32 SP
- [ ] RAG pipeline: embedding + Pinecone upsert + semantic search (8 SP)
- [ ] ComplianceBot API: conversation CRUD + Claude + streaming (8 SP)
- [ ] Chat UI: sidebar + chat bubbles + streaming display (8 SP)
- [ ] Ingest KB regulasi MVP (6 regulasi prioritas) (5 SP)
- [ ] F-03-03: Suggested questions engine (3 SP)

### Sprint 3: Checklist & Dashboard (Minggu 7-8) — 36 SP
- [ ] compliance_rules table + seed 50+ rules (5 SP)
- [ ] F-04-01: Checklist generation engine (rule matching + BullMQ) (8 SP)
- [ ] F-04-02: Update status checklist + audit log (5 SP)
- [ ] F-05-01: Score calculation + history snapshot cron (5 SP)
- [ ] Compliance score dashboard UI + priority actions widget (5 SP)
- [ ] F-06-01: Template gallery + form + generate + download (3 template) (8 SP)

### Sprint 4: Alerts, Billing & Launch (Minggu 9-10) — 44 SP
- [ ] 2 template sisa (PKS + Freelance) + polish UI (5 SP)
- [ ] F-07-01: Regulatory alert + in-app notification center (5 SP)
- [ ] F-07-02: Deadline reminder cron job (3 SP)
- [ ] F-08-01: Artikel knowledge base + seeding 20 artikel (5 SP)
- [ ] F-09-01: Midtrans checkout + webhook + subscription (8 SP)
- [ ] Invoice PDF generation + billing page UI (5 SP)
- [ ] E2E testing: register → onboarding → chat → checklist → doc → billing (8 SP)
- [ ] Production deployment, monitoring (Sentry + Datadog), beta launch (5 SP)

**Total MVP: ~183 Story Points** | Tim: 2 fullstack + 1 AI eng + 1 frontend/design | Velocity: 40-50 SP/sprint

### Phase 2a (Bulan 4-6)
- [ ] MOD-10: Document Review AI (upload & analyze contracts)
- [ ] MOD-11: HR Compliance Module (kalkulator BPJS & pesangon)

### Phase 2b (Bulan 5-8)
- [ ] MOD-12: Multi-User & Team Collaboration (roles, invite, assign)
- [ ] MOD-13: OSS/NIB Guidance Wizard (step-by-step panduan OSS)
- [ ] MOD-14: Obligation Evidence Storage (upload bukti, expiry tracking)

---

## BAB 8: Testing Strategy

| Tipe | Tool | Coverage Target | Yang Di-test |
|------|------|-----------------|--------------|
| Unit Test | Jest + Vitest | >70% backend | Score calc, rule matching, BPJS calc, permissions |
| Integration | Jest + Supertest | Semua API endpoints | Auth flow, CRUD, Midtrans webhook, email |
| E2E | Playwright | Critical user flows | Register → Onboarding → Chat → Checklist → Doc → Upgrade |
| AI Quality | Manual audit | 100 query/minggu | Akurasi ComplianceBot, referensi hukum, disclaimer |
| Load Test | k6 / Artillery | 500 concurrent users | API < 500ms, streaming chat |
| Security | OWASP ZAP | Sebelum production | SQL injection, XSS, CSRF, auth bypass, rate limiting |

### Definition of Done (DoD)
- [ ] PR reviewed minimal 1 developer
- [ ] Unit test pass (coverage sesuai target)
- [ ] Tidak ada console.error/warning unhandled di production build
- [ ] Edge cases handled: empty state, error state, loading state
- [ ] Tested di mobile viewport (360px, 768px, 1280px)
- [ ] API endpoint didokumentasikan di Swagger/OpenAPI
- [ ] Tidak ada hardcoded secret di kode
- [ ] Feature flag tersedia jika fitur berisiko

---

## BAB 9: Non-Functional Requirements

### 9.1 Performance
| Metric | Target |
|--------|--------|
| API Response (p95) | < 500ms |
| Chat Streaming First Token | < 2 detik |
| Checklist Generation | < 5 detik |
| Document Generation | < 5 detik |
| Page Load (LCP) | < 2.5 detik |
| Concurrent Users | 500 |

### 9.2 Security
- JWT di httpOnly cookie (bukan localStorage)
- Supabase RLS (Row Level Security) di semua tabel
- Rate limiting: per IP dan per user
- Input sanitization: semua input di-sanitize sebelum DB query
- PII detection layer pada chat (jangan simpan data sensitif)
- OWASP Top 10 compliance sebelum production
- IP whitelist + MFA untuk admin panel

### 9.3 Reliability
- Uptime target: 99.5%
- Error handling: graceful degradation (AI down → fallback message)
- Retry logic: webhook Midtrans, email delivery, AI API calls
- Idempotency: semua webhook endpoint dan payment processing

### 9.4 Scalability
- Stateless backend → horizontal scaling di Railway
- Background jobs via BullMQ + Redis (decoupled dari API)
- CDN via Vercel Edge Network (frontend)
- Database connection pooling via Supabase

### 9.5 Observability
- **Error Tracking**: Sentry (frontend + backend)
- **APM**: Datadog (API latency, throughput, error rate)
- **Logging**: Pino (structured JSON logs) → Datadog/Loki
- **AI Monitoring**: token usage, latency, feedback ratio per model
- **Business Metrics**: MRR, churn, DAU, query volume (custom dashboard)

---

> 💡 Dokumen ini di-generate dari `LocalCompliance_PRD_v1.txt`.
> Untuk update, edit file ini langsung lalu jalankan `/init`.
> Last synced: 2026-04-17
