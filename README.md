# AutoGrader Platform

> Transform GitHub Actions-based grading into a full-featured web platform with real-time grading, APIs, and user interface.

## 🏗️ Monorepo Structure

This project uses **Turborepo** for efficient monorepo management.

```
autograder-platform/
├── apps/
│   ├── web/              # Next.js 16 frontend (App Router, React 19)
│   ├── api/              # NestJS 10 backend API (port 3001)
│   └── workers/          # Bull MQ background workers
├── packages/
│   ├── config/           # Shared ESLint & Prettier configs
│   ├── database/         # Prisma schema & database client (TBD)
│   └── types/            # Shared TypeScript types (TBD)
├── docker/               # Docker configurations (TBD)
└── tests/                # Test templates & test suites
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (v20.12.2 recommended)
- **npm 10+**
- **PostgreSQL 15+** (for production)
- **Redis 7+** (for Bull MQ workers)
- **Docker** (optional, for local Redis/Postgres)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd node-projects-github-actions

# Install all workspace dependencies
npm install

# Copy environment files
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
cp apps/workers/.env.example apps/workers/.env

# Start all apps in development mode
npm run dev
```

### Development URLs

- **Frontend (Next.js):** http://localhost:3000
- **Backend API (NestJS):** http://localhost:3001/api
- **API Health Check:** http://localhost:3001/api/health

## 📦 Available Commands

### Root Level Commands (Turborepo)

```bash
npm run dev          # Start all apps in development mode
npm run build        # Build all apps for production
npm run lint         # Run ESLint across all workspaces
npm run format       # Format code with Prettier
npm run test         # Run tests across all apps
npm run type-check   # TypeScript type checking
npm run clean        # Clean all build artifacts and node_modules
```

### Workspace-Specific Commands

```bash
# Frontend (Next.js)
npm run dev --workspace=apps/web
npm run build --workspace=apps/web
npm run lint --workspace=apps/web

# Backend API (NestJS)
npm run dev --workspace=apps/api
npm run build --workspace=apps/api
npm run start:prod --workspace=apps/api

# Workers (Bull MQ)
npm run dev --workspace=apps/workers
npm run build --workspace=apps/workers
npm run start --workspace=apps/workers
```

### Using Turbo Filter

```bash
npx turbo run dev --filter=web
npx turbo run build --filter=api
npx turbo run lint --filter=workers
```

## 🛠️ Tech Stack

### Frontend (apps/web)

- **Framework:** Next.js 16.1.1 with App Router
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4 + shadcn/ui (Zinc theme)
- **Language:** TypeScript 5
- **Real-time:** Socket.io-client (planned)

### Backend (apps/api)

- **Framework:** NestJS 10.0.0
- **Language:** TypeScript 5.1.3
- **ORM:** Prisma (planned)
- **Database:** PostgreSQL (planned)
- **WebSocket:** Socket.io (planned)
- **Config:** @nestjs/config for environment variables

### Workers (apps/workers)

- **Queue:** Bull 4.12.0 with Redis
- **Redis Client:** ioredis 5.3.2
- **Language:** TypeScript 5.1.3
- **AI Integration:** OpenAI API (planned)
- **Monitoring:** LangSmith SDK (planned)

### Code Quality

- **Linting:** ESLint 9 (flat config)
- **Formatting:** Prettier 3.2.4
- **Pre-commit:** Husky + lint-staged
- **Monorepo:** Turborepo 2.7.2

### Infrastructure (Planned)

- **Containers:** Docker + Docker Compose
- **Cloud:** AWS ECS Fargate
- **Database:** AWS RDS PostgreSQL
- **Cache:** AWS ElastiCache Redis
- **Storage:** AWS S3

## 🏃 Sprint 0 - Progress

### Day 1: ✅ Project Initialization (Complete)

✅ Repository & Git Setup  
✅ Turborepo Monorepo Initialization  
✅ Next.js Frontend Setup  
✅ NestJS Backend Setup  
✅ Bull MQ Workers Setup  
✅ Code Quality Tools (ESLint, Prettier, Husky)  
✅ Testing & Documentation

[→ Day 1 Report](./sprint-0-day-1-work.txt)

### Day 2-4: ✅ Database & Core Features (Complete)

✅ Prisma ORM setup with PostgreSQL  
✅ Complete database schema (7 models)  
✅ Seed data (7 users, 3 courses, 6 assignments)  
✅ 22 API endpoints implemented  
✅ Authentication system (JWT + Passport)  
✅ Frontend UI components (shadcn/ui)

[→ Day 2 Report](./sprint-documents/sprint-0-day-2-completion-report.md)  
[→ Day 3 Report](./sprint-documents/sprint-0-day-3-completion-report.md)  
[→ Day 4 Report](./sprint-documents/sprint-0-day-4-completion-report.txt)

### Day 5: ✅ Docker & Local Development (85% Complete)

✅ Docker Compose configuration  
✅ Multi-stage Dockerfiles (API, Workers)  
✅ Local development environment  
✅ Database services containerized  
⚠️ Web containerization blocked (Turbopack issue)

[→ Day 5 Report](./sprint-documents/sprint-0-day-5-completion-report.md)

**Current Status**: Ready for Sprint 1 development work!

## 📋 Next Steps

- [ ] Set up Prisma ORM and database schema
- [ ] Implement authentication (JWT + Passport)
- [ ] Create API endpoints for courses, assignments, submissions
- [ ] Build dashboard UI components
- [ ] Implement WebSocket real-time updates
- [ ] Set up Docker Compose for local development
- [ ] Write unit and integration tests
- [ ] Configure CI/CD pipeline

## � Docker Setup (Recommended for Development)

### Quick Start with Docker

```bash
# Start database services (Postgres + Redis)
docker-compose up -d postgres redis

# Start all dev servers (API, Web, Workers)
npm run dev
```

This hybrid approach provides:

- ✅ Consistent database state across team
- ✅ Fast hot-reload during development
- ✅ Native debugging capabilities
- ✅ Lower resource usage than full containerization

### Available Docker Commands

```bash
# Start all services (Postgres, Redis, API, Workers)
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis

# Stop all services
docker-compose down

# View logs
docker-compose logs -f api
docker-compose logs -f workers

# Check service status
docker-compose ps

# Rebuild images
docker-compose build api workers
```

### Docker Services

| Service  | Port | Status        | Notes                                       |
| -------- | ---- | ------------- | ------------------------------------------- |
| postgres | 5432 | ✅ Ready      | PostgreSQL 15-alpine                        |
| redis    | 6379 | ✅ Ready      | Redis 7-alpine                              |
| api      | 3001 | ✅ Ready      | NestJS backend                              |
| workers  | -    | ✅ Ready      | Background jobs                             |
| web      | 3000 | ⚠️ Local only | Containerization blocked (see known issues) |

### Environment Files for Docker

Docker-specific environment files are located at:

- `apps/api/.env.docker`
- `apps/workers/.env.docker`
- `apps/web/.env.docker`

These use container hostnames (e.g., `postgres:5432` instead of `localhost:5432`).

### Known Issues

**⚠️ Web Container**: Next.js Turbopack workspace detection fails in Docker. Use local development for web frontend.

See [sprint-0-day-5-completion-report.md](./sprint-documents/sprint-0-day-5-completion-report.md) for detailed issue documentation and future sprint plans.

## �🔧 Development Notes

### Running Individual Apps

Each app can run independently for focused development:

```bash
# Frontend only (requires API to be running for data)
cd apps/web && npm run dev

# Backend only
cd apps/api && npm run dev

# Workers only (requires Redis to be running)
cd apps/workers && npm run dev
```

### Environment Variables

Each app has its own `.env` file. Key variables:

**apps/web/.env:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**apps/api/.env:**

```env
PORT=3001
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

**apps/workers/.env:**

```env
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
LANGSMITH_API_KEY=...
CONCURRENT_JOBS=2
```

### Pre-commit Hooks

Husky runs automatically on `git commit`:

- Lints staged files with ESLint
- Formats code with Prettier
- Blocks commit if errors are found

To bypass (not recommended):

```bash
git commit --no-verify
```

## 📚 Documentation

- [Project Architecture](./project-architecture.txt) - Complete technical specification
- [Implementation Roadmap](./indepth-roadmap.txt) - 12-week sprint plan
- [High-Level Overview](./high-overview.txt) - Quick reference guide

## 🏃 Development Roadmap

**Current Status**: Sprint 0 - Day 1 (Project Initialization)

- [x] Phase 1: Repository setup
- [x] Phase 2: Monorepo structure (Turborepo)
- [ ] Phase 3: Next.js frontend setup
- [ ] Phase 4: NestJS backend setup
- [ ] Phase 5: Workers setup
- [ ] Phase 6: Code quality tools
- [ ] Phase 7: Testing & documentation

## 📄 License

Private - Educational Project

## 👥 Team

Team Lead: [Kimani Vincent](https://github.com/xfince)
Timeline: 12 weeks (Jan 6 - March 30, 2026)
Target Launch: End of March 2026
