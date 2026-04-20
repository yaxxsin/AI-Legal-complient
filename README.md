# LocalCompliance

> AI-Powered Business Legal Compliance Platform for Indonesian SMEs

Platform SaaS yang membantu UMKM dan startup Indonesia memahami dan memenuhi kewajiban hukum bisnis menggunakan AI.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| **Backend** | NestJS, Prisma ORM, PostgreSQL (Supabase) |
| **AI** | Ollama (Qwen 2.5), OpenAI Embeddings, Pinecone |
| **Infra** | Vercel (web), Railway (api), Supabase (auth + DB + storage) |
| **CI/CD** | GitHub Actions |

## 📁 Project Structure

```
localcompliance/
├── apps/
│   ├── web/          ← Next.js 14 Frontend
│   └── api/          ← NestJS Backend
├── packages/
│   ├── types/        ← Shared TypeScript types
│   └── utils/        ← Shared utility functions
├── docs/             ← Engine state files
└── master_blueprint.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Ollama running locally (for AI chat)
- Supabase project (for auth & database)

### Setup

```bash
# Install dependencies
pnpm install

# Copy env template
cp .env.example .env.local

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed initial data
pnpm db:seed
```

### Run Development

```bash
# Start Ollama (in separate terminal)
ollama serve
ollama pull qwen2.5

# Start all apps
pnpm dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Swagger Docs**: http://localhost:3001/api/docs

### Test ComplianceBot Chat

1. Register/login at http://localhost:3000
2. Navigate to http://localhost:3000/chat
3. Start a conversation with the AI assistant

> **Note**: If using Supabase self-hosted or placeholder credentials, the API will return mock data.

## 📜 Available Scripts

| Script | Description |
|--------|------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm type-check` | TypeScript type checking |
| `pnpm format` | Format code with Prettier |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed database |
| `pnpm db:studio` | Open Prisma Studio |

## 🌿 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production (protected, PR-only) |
| `develop` | Integration branch |
| `feature/*` | Feature branches (from develop) |
| `hotfix/*` | Emergency fixes (from main) |

## 📄 License

Private — All rights reserved.
