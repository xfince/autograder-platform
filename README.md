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

## 🏃 Sprint 0 - Day 1 Completed

✅ **Phase 1:** Repository & Git Setup  
✅ **Phase 2:** Turborepo Monorepo Initialization  
✅ **Phase 3:** Next.js Frontend Setup  
✅ **Phase 4:** NestJS Backend Setup  
✅ **Phase 5:** Bull MQ Workers Setup  
✅ **Phase 6:** Code Quality Tools (ESLint, Prettier, Husky)  
✅ **Phase 7:** Testing & Documentation

See [sprint-0-day-1-work.txt](./sprint-0-day-1-work.txt) for detailed completion summary.

## 📋 Next Steps

- [ ] Set up Prisma ORM and database schema
- [ ] Implement authentication (JWT + Passport)
- [ ] Create API endpoints for courses, assignments, submissions
- [ ] Build dashboard UI components
- [ ] Implement WebSocket real-time updates
- [ ] Set up Docker Compose for local development
- [ ] Write unit and integration tests
- [ ] Configure CI/CD pipeline

## 🔧 Development Notes

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
