# LocalCompliance

> AI-Powered Business Legal Compliance Platform for Indonesian SMEs

Platform SaaS yang membantu UMKM dan startup Indonesia memahami dan memenuhi kewajiban hukum bisnis menggunakan AI.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| **Backend** | NestJS, Prisma ORM, PostgreSQL 16 |
| **AI** | Ollama (Qwen 2.5), OpenAI Embeddings, Pinecone |
| **Auth** | Custom JWT (jsonwebtoken + bcryptjs, httpOnly cookie) |
| **Storage** | MinIO (S3-compatible, self-hosted) |
| **Infra** | Docker Compose (PostgreSQL + Redis + MinIO + API + Web) |
| **CI/CD** | GitHub Actions → Docker build |

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
├── docker-compose.yml ← Full dev stack
└── master_blueprint.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker Desktop (for PostgreSQL, Redis, MinIO)

### Setup (Docker — recommended)

```bash
# Start all infrastructure (PostgreSQL, Redis, MinIO, API, Web)
docker-compose up -d

# Wait for services to be healthy, then access:
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001/api/v1
# MinIO:    http://localhost:9001 (admin: minioadmin/minioadmin)
```

### Setup (Hybrid — DB in Docker, apps on host)

```bash
# Start infra only
docker-compose up -d postgres redis minio

# Install dependencies
pnpm install

# Copy env template
cp .env .env.local

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed initial data
pnpm db:seed

# Start development
pnpm dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Swagger Docs**: http://localhost:3001/api/docs

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

## 🐳 Docker Commands

| Command | Description |
|---------|------------|
| `docker-compose up -d` | Start all services |
| `docker-compose down` | Stop all services |
| `docker-compose down -v` | Stop + delete volumes (reset DB) |
| `docker-compose logs -f api` | Follow API logs |
| `docker-compose ps` | Show service status |

## 🌿 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production (protected, PR-only) |
| `develop` | Integration branch |
| `feature/*` | Feature branches (from develop) |
| `hotfix/*` | Emergency fixes (from main) |

## 📄 License

Private — All rights reserved.
