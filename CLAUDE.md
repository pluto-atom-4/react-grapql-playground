# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **practice playground** for a Senior Full Stack Software Developer interview at Stoke Space. The project builds a complete full-stack application combining React/Next.js (frontend) with GraphQL/Apollo (backend) to demonstrate mastery of modern full-stack patterns.

The application models a **manufacturing domain** for Boltline (Stoke's hardware SaaS platform) with entities: **Build**, **Part**, and **TestRun**. This mirrors the 7-day intensive practice plan defined in `docs/start-from-here.md`.

## Project Structure

This is a **monorepo** with three main layers:

- **Frontend**: Next.js 16 with TypeScript, React 19, Apollo Client, Tailwind CSS  
  - Server Components for initial data fetch  
  - Client Components for interactive features (forms, mutations, optimistic updates)  
  - Vitest + React Testing Library for unit tests

- **Backend (Apollo GraphQL)**: Apollo Server 4 with TypeScript  
  - GraphQL schema (SDL) for Build, Part, TestRun entities  
  - Resolvers with DataLoader for N+1 prevention  
  - PostgreSQL integration for data persistence

- **Backend (Express)**: Express.js with TypeScript  
  - File upload endpoints for test reports and artifacts
  - Webhook handlers for CI/CD results and external events
  - Server-Sent Events (SSE) for real-time notifications
  - Bridges external systems to GraphQL backend

Each layer can be developed independently. Apollo handles structured data operations, Express handles auxiliary concerns (files, webhooks, real-time events).

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js | 16.x (LTS) | Framework with App Router, Server/Client Components |
| | React | 19.x | UI library |
| | Apollo Client | 4.x | GraphQL client with caching and optimistic updates |
| | TypeScript | 5.x | Type safety |
| | Tailwind CSS | Latest | Utility-first styling |
| | Vitest | Latest | Unit/integration testing |
| **Backend (GraphQL)** | Apollo Server | 4.x | GraphQL server for data operations |
| | PostgreSQL | Latest | Relational database |
| | Prisma/Drizzle | Latest | Type-safe ORM (choose one) |
| | DataLoader | Latest | Batch loading for N+1 prevention |
| **Backend (Express)** | Express | 4.21.1+ | HTTP server for auxiliary endpoints |
| | Multer | Latest | File upload middleware |
| | TypeScript | 5.x | Type safety |
| **Dev Tools** | pnpm | Latest | Package manager (faster than npm) |
| | Vitest | Latest | Unit/integration testing |

See `docs/version-conflict-free-stack.md` for detailed version compatibility guidance.

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- pnpm

### Initial Setup

```bash
# Install dependencies for both frontend and backend
pnpm install

# Set up Docker for PostgreSQL
docker-compose up -d

# Run database migrations (if applicable)
pnpm run migrate

# Start both frontend and backend in development mode
pnpm dev
```

This will start:
- **Frontend**: http://localhost:3000 (Next.js dev server)
- **Apollo GraphQL**: http://localhost:4000 (GraphQL server)
- **GraphiQL IDE**: http://localhost:4000/graphql (for testing queries/mutations)
- **Express Server**: http://localhost:5000 (file uploads, webhooks, real-time events)

## Common Development Tasks

### Running the Application

```bash
pnpm dev                   # Start all services: frontend (3000), Apollo (4000), Express (5000)
pnpm dev:frontend          # Start only Next.js frontend
pnpm dev:graphql           # Start only Apollo GraphQL server
pnpm dev:express           # Start only Express.js server
```

### Testing

```bash
pnpm test                  # Run all tests
pnpm test --watch          # Watch mode
pnpm test path/to/test     # Single test file
pnpm test:frontend         # Test only frontend
pnpm test:graphql          # Test only Apollo resolvers
pnpm test:express          # Test only Express routes/handlers
```

## Test Isolation & Cleanup

The frontend uses centralized, global test setup to ensure test isolation and prevent state leakage when tests run in parallel.

### Problem Solved

- **Duplicated Mocks**: localStorage mock was copied in 5+ test files
- **No Global Cleanup**: Tests relied on local beforeEach/afterEach hooks
- **Parallel Execution Risk**: When running tests concurrently, tests could interfere with each other

### Solution

**Global Setup Files** (in `frontend/__tests__/setup/`):
- `localStorage-mock.ts` - Centralized localStorage mock implementation
- `vitest-setup.ts` - Global beforeEach/afterEach hooks for cleanup
- Registered in `frontend/vitest.config.ts` via `setupFiles`

**How It Works**:
1. Before any tests run, vitest loads the setup file
2. Global `beforeEach`: Clears localStorage and mocks before each test
3. Each test runs with clean, isolated state
4. Global `afterEach`: Cleanup after each test to prevent leakage

**Test Modes** (all passing):
```bash
pnpm test:frontend --run              # Sequential: 172 ✓
pnpm test:frontend --run -- --sequence.shuffle   # Shuffle: 172 ✓
pnpm test:frontend --run -- --sequence.parallel  # Parallel: 172 ✓
```

**For New Tests**: Just use localStorage directly - it's automatically isolated:
```typescript
describe('My Test', () => {
  it('should work', () => {
    localStorage.setItem('key', 'value');
    expect(localStorage.getItem('key')).toBe('value');
    // Cleanup happens automatically
  });
});
```

For details, see `frontend/__tests__/setup/README.md`.

### Code Quality

```bash
pnpm lint             # Check linting and formatting
pnpm lint:fix         # Fix linting and formatting issues
pnpm format:check     # Check formatting without changes
```

### Building for Production

```bash
pnpm build            # Build both frontend and backend
pnpm start            # Start production server
```

### Database

```bash
pnpm migrate          # Run pending migrations
pnpm migrate:reset    # Reset database (dev only)
pnpm seed             # Seed sample data
```

## Architecture & Integration Points

### Three-Layer Architecture

```
Frontend (Next.js)
    ↓
    ├→ Apollo GraphQL (4000) — Data operations (Build, Part, TestRun)
    └→ Express (5000) — Files, webhooks, real-time events
```

### Frontend ↔ Apollo GraphQL

1. **Next.js Server Component** fetches initial data via Apollo query
2. **Apollo Client** caches results in memory
3. **Client Component** renders data and handles user interactions
4. **Mutations** update database via GraphQL, with optimistic UI updates
5. **Subscriptions** (optional) keep real-time data in sync

**Example**: Dashboard queries Apollo for Builds, mutates status, Apollo emits event to Express for real-time subscribers.

### Frontend ↔ Express

- **File Upload**: `POST /upload` with FormData (test reports, CAD files)
- **Webhooks**: Receive CI/CD results, sensor data from external systems
- **Real-time Events**: Server-Sent Events (SSE) stream for notifications
- **Example**: Upload test results → Express stores file → emits event → frontend receives via SSE

### GraphQL Schema Contract

The schema lives at `backend-graphql/src/schema.graphql`.

**Key Types** (from Boltline domain):
- `Build`: Top-level manufacturing item with status, metadata
- `Part`: Components used in a Build (relationships via foreign keys)
- `TestRun`: Individual test executions with results, fileUrl pointing to Express uploads

**Key Patterns**:
- Relationships: Build → many Parts, Build → many TestRuns
- Enums: Status fields use GraphQL enums (PENDING, RUNNING, COMPLETE, FAILED)
- Batch Loading: DataLoader resolves Builds→Parts→TestRuns without N+1 queries
- File References: TestRun.fileUrl points to Express-hosted uploads

### Apollo Server Setup

```
POST /graphql      → GraphQL queries/mutations/subscriptions
GET  /graphql      → GraphiQL IDE (dev mode for testing)
Middleware         → Auth (JWT), CORS, request logging
```

**Key Responsibilities**:
- Validate GraphQL schema and queries
- Resolve fields to database queries via Prisma/Drizzle
- Apply DataLoader for batch loading
- Emit events to Express via event bus (for real-time updates)

### Express Server Setup

```
POST /upload                → Store file, return fileId
POST /webhooks/ci-results   → Receive CI test results
POST /webhooks/sensor-data  → Receive manufacturing data
GET  /events                → Server-Sent Events stream (real-time)
```

**Key Responsibilities**:
- Handle file uploads and storage
- Process incoming webhooks from CI/CD and external systems
- Stream events to connected clients (SSE or WebSocket)
- Optionally call Apollo mutations or emit events

### Apollo Client Patterns on Frontend

**Optimistic Updates**:
```typescript
useMutation(UPDATE_BUILD_STATUS, {
  optimisticResponse: { updateBuild: { id, status: "COMPLETE" } },
  update(cache, { data }) {
    cache.modify({ fields: { builds: (existing) => existing.map(b => 
      b.id === data.updateBuild.id ? data.updateBuild : b
    ) } });
  },
});
```

**Real-time Events**:
```typescript
useEffect(() => {
  const eventSource = new EventSource("http://localhost:5000/events");
  eventSource.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    // Handle real-time event (build status change, test result)
  });
  return () => eventSource.close();
}, []);
```

**Event Bus Architecture** (GraphQL → Express → Frontend):

The real-time event flow connects all three layers:

1. **GraphQL Mutation** (backend-graphql) → Emits event via HTTP POST
   ```typescript
   // backend-graphql/src/resolvers/Mutation.ts
   const build = await context.prisma.build.create({ ... })
   emitEvent('buildCreated', { buildId: build.id, build })  // HTTP POST to Express
   return build
   ```

2. **Express Event Bus** (backend-express) → Receives and broadcasts
   ```bash
   POST http://localhost:5000/events/emit
   {
     "event": "buildCreated",
     "payload": { "buildId": "123", "build": {...} },
     "timestamp": "2026-04-17T21:40:00Z"
   }
   ```

3. **Frontend SSE Listener** (frontend) → Receives and updates cache
   ```typescript
   // frontend/lib/use-sse-events.ts
   eventSource.addEventListener('buildCreated', (e) => {
     const data = JSON.parse(e.data)
     // Apollo cache updates automatically
     client.cache.evict({ fieldName: 'builds' })
     client.cache.gc()
   })
   ```

**Event Names** (Standardized across system):
- `buildCreated` - Emitted by `createBuild()` mutation
- `buildStatusChanged` - Emitted by `updateBuildStatus()` mutation
- `partAdded` - Emitted by `addPart()` mutation
- `testRunSubmitted` - Emitted by `submitTestRun()` mutation
- `fileUploaded` - Emitted by file upload endpoint
- `ciResults` - Emitted by CI/CD webhook
- `sensorData` - Emitted by sensor data webhook

**Configuration**:
Set `EXPRESS_EVENT_URL` in `.env` to configure the event bus endpoint (default: `http://localhost:5000/events/emit`).
For Docker environments, use: `EXPRESS_EVENT_URL=http://backend-express:5000/events/emit`

## Interview Talking Points

When discussing your implementation:

1. **Dual-backend architecture**: "Apollo GraphQL handles structured data operations (CRUD, queries), while Express handles auxiliary concerns (file uploads, webhooks, real-time events). This separation lets each scale independently and keeps concerns focused."

2. **Real-time UX with optimistic updates**: "Optimistic mutations show ✓ instantly before server confirms—critical for technicians on spotty shop floor WiFi. Apollo cache invalidation is automatic when mutations complete."

3. **N+1 prevention with DataLoader**: "Batch loading Builds→Parts→TestRuns in a single database query prevents cascading round-trips. If a dashboard loads 50 builds with nested parts, DataLoader combines 50 queries into 1."

4. **Event-driven real-time updates**: "When a build status changes in Apollo, we emit an event to Express which streams via Server-Sent Events to all connected clients. Real-time without polling."

5. **Type safety across stack**: "End-to-end TypeScript from PostgreSQL schema to React components. GraphQL Code Generator auto-syncs types when the schema changes."

## Key Files

| File | Purpose |
|------|---------|
| `docs/start-from-here.md` | 7-day practice plan and interview prep roadmap |
| `docs/version-conflict-free-stack.md` | Tech stack versions and conflict resolution |
| `docs/ESLINT-V9-SETUP-GUIDE.md` | ESLint v9 configuration, troubleshooting, and rules management |
| `DESIGN.md` | Dual-backend architecture and patterns |
| `.claude/about-me.md` | Interview context and Boltline domain |
| `backend-graphql/src/schema.graphql` | GraphQL type definitions (Build, Part, TestRun) |
| `backend-graphql/src/resolvers/` | GraphQL resolvers and DataLoader implementations |
| `backend-graphql/src/dataloaders/` | DataLoader instances for batch loading |
| `backend-express/src/routes/upload.ts` | File upload endpoint |
| `backend-express/src/routes/webhooks.ts` | Webhook handlers for CI/CD, sensors |
| `backend-express/src/routes/events.ts` | Server-Sent Events stream for real-time |
| `frontend/app/page.tsx` | Next.js root Server Component |
| `frontend/components/FileUploader.tsx` | File upload component (posts to Express) |
| `frontend/components/RealtimeEvents.tsx` | Real-time event listener (SSE) |
| `frontend/lib/apollo.ts` | Apollo Client configuration |

## Debugging Tips

**GraphiQL IDE (Apollo)**:  
Visit `http://localhost:4000/graphql` to test queries/mutations in real-time.

```graphql
query GetBuild($id: ID!) {
  build(id: $id) {
    id
    status
    parts { id name }
    testRuns { id result completedAt }
  }
}

mutation UpdateStatus($id: ID!, $status: BuildStatus!) {
  updateBuildStatus(id: $id, status: $status) {
    id
    status
  }
}
```

**Apollo DevTools Browser Extension**:  
Install [Apollo DevTools](https://www.apollographql.com/docs/react/development-testing/developer-tools/) to inspect Apollo cache, network activity, and query/mutation results.

**Express Server Logging**:  
Enable request logging to see file uploads, webhooks, and SSE connections:
```bash
DEBUG=express:* pnpm dev:express
```

**Real-time Event Testing**:
```bash
# In one terminal, listen to SSE stream
curl -N http://localhost:5000/events

# In another, trigger a mutation or webhook
curl -X POST http://localhost:5000/webhooks/ci-results \
  -H "Content-Type: application/json" \
  -d '{"buildId": "123", "status": "PASSED"}'
```

**Database Inspection**:  
```bash
psql postgres://user:pass@localhost:5432/boltline
\dt          # List all tables
\d builds    # Inspect builds schema
SELECT * FROM builds LIMIT 10;  # Query data
```

**Next.js Dev Mode**:  
`pnpm dev:frontend` enables fast reload on file changes and better error overlays.

## Code Style

- **Language**: TypeScript (strict mode enabled)
- **Formatting**: Prettier (auto-format on save recommended)
- **Linting**: ESLint v9 with flat config format and TypeScript rules
- **Testing**: Vitest for unit/integration, Playwright for E2E
- **Package Manager**: pnpm

### Linting & Code Quality

The project uses **ESLint v9** with the new flat config format (`eslint.config.js`). This is different from the legacy `.eslintrc.js` format.

```bash
pnpm lint             # Check linting across all packages
pnpm lint:fix         # Auto-fix linting issues
pnpm -F frontend lint # Lint only frontend
pnpm -F backend-graphql lint
pnpm -F backend-express lint
```

**ESLint Configuration**: See `docs/ESLINT-V9-SETUP-GUIDE.md` for detailed setup, troubleshooting, and how to add new rules.

**IDE Integration** (recommended):
- **VS Code**: Install ESLint extension, configure in `.vscode/settings.json` to auto-fix on save
- **JetBrains IDEs**: Enable ESLint in Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint

For quick reference on running ESLint across the monorepo, see the first section of `docs/ESLINT-V9-SETUP-GUIDE.md`.

## Project-Specific Skills

This project includes custom Claude Code skills to streamline common development workflows.

### push-feature-branch

Automates the complete feature branch workflow: checking git status, creating feature branches, staging files, committing with proper messages, and pushing to remote.

**Invoke with:**
```
@claude Create a feature branch for [your task description]
@claude Create a feature branch, commit, and push to remote
```

**Examples:**
```
"Create a feature branch for adding Apollo Client best practices documentation"
"Set up a branch for fixing the N+1 query issue"
"Create a feature branch for dashboard component tests"
```

**Features:**
- ✅ Auto-generates descriptive branch names (e.g., `feat/apollo-client-best-practices`)
- ✅ Reviews files before staging — shows what will be committed
- ✅ Warns about unstaged changes and uncommitted changes
- ✅ Supports selective staging of individual files
- ✅ Template-based commits with Copilot co-author trailer
- ✅ Pre-push verification (`git log` check)
- ✅ Handles existing branch edge cases (use existing or create variant)
- ✅ Error recovery guidance for common git failures

**Workflow:** 8-step guided process from git status check → final git state summary

**See also:** `.claude/skills/push-feature-branch/SKILL.md` for complete documentation and workflow details.

## Interview Prep Checklist

From the 7-day plan, this repository targets:

**Apollo GraphQL Backend**:
- ✅ Design GraphQL schema for manufacturing domain (Build, Part, TestRun)
- ✅ Implement resolvers with DataLoader for N+1 prevention
- ✅ Build mutations with error handling and validation
- ✅ Emit events to Express for real-time updates

**Express Backend**:
- ✅ File upload endpoint with validation and storage
- ✅ Webhook handlers for CI/CD and external events
- ✅ Server-Sent Events (SSE) for real-time notifications

**React Frontend**:
- ✅ React + TypeScript + Apollo Client fluency (responsive dashboard)
- ✅ Server Components for data fetching, Client Components for mutations
- ✅ Optimistic updates for instant UX feedback
- ✅ Real-time event listeners (SSE)

**Testing & Quality**:
- ✅ Unit tests with Vitest for resolvers and components
- ✅ Integration tests with Apollo `MockedProvider` and test databases
- ✅ Error handling, loading states, retry logic
- ✅ Production-like structure with Docker, clear separation of concerns

Focus on building a **working, tested, end-to-end feature** (e.g., create build → upload test report → receive real-time status updates). Quality > quantity.

---

**Last Updated**: April 16, 2026  
**Practice Plan**: See `docs/start-from-here.md` for 7-day roadmap (target interview: April 22-23)
