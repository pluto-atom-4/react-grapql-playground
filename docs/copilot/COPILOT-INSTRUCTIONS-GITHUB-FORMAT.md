# Copilot Instructions

## Project Overview

This is a **full-stack monorepo** for interview preparation: a React/GraphQL application modeling a manufacturing domain (Boltline) with three layers:
- **Frontend**: Next.js 16 + React 19 + Apollo Client + Tailwind
- **Backend (GraphQL)**: Apollo Server 4 + PostgreSQL
- **Backend (Express)**: Express.js for auxiliary concerns (file uploads, webhooks, real-time SSE)

Each backend can be developed independently. This architecture demonstrates separation of concerns and scalability patterns.

## Build, Test, and Lint Commands

### Development

```bash
pnpm install              # Install all dependencies (monorepo)
pnpm dev                  # Start all services: frontend (3000), Apollo (4000), Express (5000)
pnpm dev:frontend         # Start only Next.js frontend
pnpm dev:graphql          # Start only Apollo GraphQL server
pnpm dev:express          # Start only Express.js server
```

### Testing

```bash
pnpm test                 # Run all tests
pnpm test --watch         # Watch mode
pnpm test path/to/test    # Single test file (e.g., pnpm test frontend/components/__tests__)
pnpm test:frontend        # Test only frontend (Vitest + React Testing Library)
pnpm test:graphql         # Test only Apollo resolvers
pnpm test:express         # Test only Express routes
```

### Code Quality

```bash
pnpm lint                 # ESLint + Prettier check (all packages)
pnpm lint:fix             # Auto-fix linting and formatting issues
pnpm format:check         # Check formatting without changes
```

### Building & Database

```bash
docker-compose up -d      # Start PostgreSQL container (dev)
pnpm migrate              # Run database migrations
pnpm migrate:reset        # Reset database (dev only)
pnpm seed                 # Seed sample data (Builds, Parts, TestRuns)
pnpm build                # Build both frontend and backend
pnpm start                # Start production server
```

## High-Level Architecture

### Three-Layer Communication Flow

```
Frontend (Next.js App Router, React 19)
    ↓
    ├→ Apollo GraphQL Server (Port 4000)
    │   • Resolves Build, Part, TestRun queries/mutations
    │   • Uses DataLoader for batch loading (N+1 prevention)
    │   • PostgreSQL via Prisma/Drizzle ORM
    │
    └→ Express Server (Port 5000)
        • POST /upload → File storage (test reports, CAD files)
        • POST /webhooks/* → CI/CD results, sensor data
        • GET /events → Server-Sent Events (SSE) real-time stream

GraphQL Schema Contract
    └── backend-graphql/src/schema.graphql
        • Build (id, status, metadata)
        • Part (id, buildId, relationships)
        • TestRun (id, buildId, result, fileUrl)
        • Enums: PENDING, RUNNING, COMPLETE, FAILED
```

### Frontend Pattern: Server + Client Components

- **Server Components** (`app/page.tsx`, `app/builds/page.tsx`) fetch initial data via Apollo and pass to Client Components
- **Client Components** render data, handle user interactions, mutations with optimistic updates
- **Apollo Client Cache** manages normalized state; mutations automatically refetch affected queries
- **Real-time Listeners** subscribe to SSE stream for live status updates

### Backend GraphQL Pattern: Resolvers + DataLoader

- Resolvers are thin wrappers around Prisma/Drizzle queries
- **DataLoader** instances batch database queries per GraphQL request (e.g., N builds + N×M parts becomes 2 queries instead of 1+NM)
- Mutations emit events to Express event bus for real-time subscriber notifications

### Backend Express Pattern: Routes + Event Bus

- **Upload route** validates file, stores to disk or S3, returns fileId
- **Webhook routes** receive CI/CD results or external events, optionally trigger Apollo mutations
- **Events route** streams SSE to frontend; in-memory event bus broadcasts to all connected clients

## Key Conventions

### TypeScript

- **Strict mode enabled** across all packages (tsconfig.json)
- All files in `src/` folders require `.ts` or `.tsx` extensions
- Database types auto-generated from schema (Prisma `@prisma/client` or Drizzle types)
- GraphQL types auto-generated from schema via `graphql-codegen` (optional, but recommended)

### File Organization

- **backend-graphql/src/schema.graphql** is the source of truth for entity types, relationships, and enums
- **backend-graphql/src/resolvers/** each file corresponds to a GraphQL type (Query.ts, Mutation.ts, Build.ts, etc.)
- **backend-graphql/src/dataloaders/** DataLoader instances are initialized per request context
- **frontend/lib/graphql/** contains query and mutation documents (`.ts` files with `gql` strings)
- **frontend/lib/hooks/** custom React hooks wrapping Apollo `useQuery` and `useMutation`

### Database & Schema

- PostgreSQL schema lives in **backend-graphql/src/db/schema.sql** or as Prisma schema
- Migrations use the ORM's native migration tool (Prisma migrate or Drizzle migrations)
- Sample data seeding script at **pnpm seed** populates Builds, Parts, TestRuns for development

### Error Handling

- GraphQL errors use standard Apollo error format (`errors` array with message + extensions)
- Express errors use HTTP status codes + JSON body with `error`, `message`, and optional `details`
- Frontend catches errors in `useMutation` callbacks and displays user-friendly messages (avoid exposing internal details)

### Testing Approach

- **Unit tests** for resolvers use `MockedProvider` with sample data (no real database)
- **Integration tests** for full queries/mutations use a test PostgreSQL database (via Docker)
- **Component tests** use React Testing Library; mock Apollo queries with `MockedProvider`
- **Express route tests** use `supertest` library for HTTP assertions

### Code Style

- Run `pnpm lint:fix` before committing (auto-formats and fixes ESLint issues)
- Imports are organized: external packages, relative paths, types
- Naming: camelCase for variables/functions, PascalCase for components/types/enums
- No magic strings; use enum constants from schema or type definitions

### Monorepo Structure

- **Root package.json** defines workspace packages and shared scripts (`pnpm` workspace)
- **Root pnpm-workspace.yaml** lists all packages: `frontend`, `backend-graphql`, `backend-express`
- Each package has its own `package.json`, `tsconfig.json`, and `vitest.config.ts`
- Shared dependencies (e.g., TypeScript, ESLint) pinned in root; package-specific deps in each package

### Docker & Local Development

- **docker-compose.yml** at root starts PostgreSQL container with default credentials
- Environment variables typically in `.env.local` (not committed); see `.env.example` if present
- Each service (frontend, GraphQL, Express) runs in separate process for independent debugging and reloading

## Important Context

- This is an **interview preparation playground**, not production code. Focus on demonstrating patterns, not production hardening.
- The domain model (Build, Part, TestRun) mirrors a real manufacturing use case (Boltline hardware SaaS).
- **Dual-backend separation** is intentional: GraphQL for structured data, Express for auxiliary concerns. When adding features, decide: does this belong in Apollo resolvers or Express routes?
- **Real-time updates** use SSE (Server-Sent Events), not WebSocket. SSE is simpler and sufficient for this scope; upgrade to WebSocket if needed for bidirectional communication.
- See **CLAUDE.md** for debugging tips (GraphiQL IDE, Apollo DevTools, curl examples for SSE/webhooks).

## Interview Talking Points

When discussing implementation decisions:

1. **Dual-backend architecture**: "Apollo handles CRUD and queries; Express handles files, webhooks, and real-time. This scales each independently."
2. **DataLoader for N+1 prevention**: "Batch loads avoid cascading database queries. Loading 50 builds with nested parts becomes 2 queries instead of 1+50+50M."
3. **Optimistic updates**: "Mutations show instant feedback before server confirms, critical for spotty WiFi environments."
4. **Type safety end-to-end**: "TypeScript + GraphQL schema + auto-generated types ensure consistency from database to UI."
5. **Event-driven real-time**: "When Apollo mutations complete, we emit events to Express which streams to clients via SSE—real-time without polling."

## Recommended MCP Servers

This repository is pre-configured with four MCP (Model Context Protocol) servers to enhance Copilot capabilities:

- **Playwright MCP** - Browser automation for E2E testing the Next.js frontend and API integration flows
- **PostgreSQL MCP** - Direct database inspection, query execution, schema analysis during development
- **Git MCP** - Repository analysis, commit history, branch tracking for understanding code evolution
- **API Testing MCP** - GraphQL query/mutation testing, Express route validation, webhook simulation

**See `.github/MCP_SETUP.md`** for detailed configuration instructions, use cases, and examples for each MCP server.

**Quick Start:**
```bash
docker-compose up -d              # Start PostgreSQL
pnpm dev                          # Start all services
# Enable MCP servers in your Copilot settings and start asking Copilot to help with tests, queries, git analysis, and API testing
```

## Environment Setup

### Prerequisites

- Node.js 18+
- pnpm (package manager)
- Docker & Docker Compose (for PostgreSQL)

### Environment Variables

Create `.env.local` in repository root (or per-package):

```env
# Backend GraphQL
DATABASE_URL=postgresql://user:password@localhost:5432/boltline
APOLLO_PORT=4000
GRAPHQL_ENV=development

# Backend Express
EXPRESS_PORT=5000
FILE_UPLOAD_DIR=./uploads
NODE_ENV=development

# Frontend
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_EXPRESS_URL=http://localhost:5000
```

See `.env.example` if present for complete list. Environment variables are **not committed** to git.

### Initial Setup

```bash
# Clone/navigate to repo
git clone <repo> && cd react-grapql-playground

# Install all dependencies
pnpm install

# Start PostgreSQL container
docker-compose up -d

# Run migrations
pnpm migrate

# Seed sample data (optional, for development)
pnpm seed

# Start all services
pnpm dev
```

Services will be available at:
- Frontend: http://localhost:3000
- Apollo GraphQL: http://localhost:4000/graphql
- Express: http://localhost:5000

## Common Development Workflows

### Adding a New GraphQL Resolver

1. **Update schema** (`backend-graphql/src/schema.graphql`)
   ```graphql
   type Query {
     builds: [Build!]!
     build(id: ID!): Build
     # Add new query
   }
   ```

2. **Implement resolver** (`backend-graphql/src/resolvers/Query.ts`)
   ```typescript
   export const queryResolvers = {
     builds: async (_, __, { dataloaders }) => {
       return dataloaders.buildLoader.loadMany(buildIds);
     },
   };
   ```

3. **Add DataLoader if fetching nested data** (`backend-graphql/src/dataloaders/buildLoader.ts`)
   ```typescript
   export const buildLoader = new DataLoader(async (ids) => {
     const builds = await prisma.build.findMany({ where: { id: { in: ids } } });
     return ids.map(id => builds.find(b => b.id === id));
   });
   ```

4. **Generate types** (if using GraphQL Code Generator)
   ```bash
   pnpm generate  # Auto-generates TypeScript types from schema
   ```

5. **Test resolver** (`backend-graphql/src/resolvers/__tests__/Query.test.ts`)
   ```typescript
   import { MockedProvider } from '@apollo/client/testing';
   // Write test with sample data
   ```

### Adding a File Upload Endpoint

1. **Create route** (`backend-express/src/routes/upload.ts`)
   ```typescript
   router.post('/upload', upload.single('file'), async (req, res) => {
     const fileId = generateId();
     await storage.save(fileId, req.file);
     res.json({ fileId, url: `/files/${fileId}` });
   });
   ```

2. **Configure Multer** (`backend-express/src/middleware/multer.ts`)
   - Set file size limits, MIME types
   - Handle validation errors

3. **Emit event to Express event bus** (if notifying real-time subscribers)
   ```typescript
   eventBus.emit('fileUploaded', { fileId, buildId, timestamp });
   ```

4. **Test endpoint** (`backend-express/src/routes/__tests__/upload.test.ts`)
   ```typescript
   test('POST /upload saves file and returns fileId', async () => {
     const res = await supertest(app).post('/upload').attach('file', ...);
     expect(res.body.fileId).toBeDefined();
   });
   ```

### Adding a Real-Time Feature (SSE)

1. **Add mutation in Apollo** to trigger event
   ```typescript
   updateBuildStatus(id: ID!, status: BuildStatus!): Build
   ```

2. **Emit event from resolver**
   ```typescript
   eventBus.emit('buildStatusChanged', { id, status });
   ```

3. **Frontend subscribes to SSE** (`frontend/hooks/useRealtimeEvents.ts`)
   ```typescript
   useEffect(() => {
     const eventSource = new EventSource('http://localhost:5000/events');
     eventSource.addEventListener('buildStatusChanged', (e) => {
       const data = JSON.parse(e.data);
       // Update Apollo cache or state
     });
     return () => eventSource.close();
   }, []);
   ```

4. **Test end-to-end**
   - Start all services
   - Trigger mutation
   - Verify SSE event arrives
   - Verify UI updates

### Creating a Frontend Component with Apollo

1. **Write GraphQL query** (`frontend/lib/graphql/queries.ts`)
   ```typescript
   export const GET_BUILDS = gql`
     query GetBuilds {
       builds { id status parts { id } }
     }
   `;
   ```

2. **Create custom hook** (`frontend/lib/hooks/useBuilds.ts`)
   ```typescript
   export function useBuilds() {
     return useQuery(GET_BUILDS);
   }
   ```

3. **Use in Server Component** (`frontend/app/page.tsx`)
   ```typescript
   export default async function Dashboard() {
     const { data } = await client.query({ query: GET_BUILDS });
     return <BuildsList builds={data.builds} />;
   }
   ```

4. **Handle mutations in Client Component** (`frontend/components/BuildCard.tsx`)
   ```typescript
   'use client';
   const [updateStatus] = useMutation(UPDATE_BUILD_STATUS, {
     optimisticResponse: { updateBuild: { id, status: 'COMPLETE' } }
   });
   ```

5. **Test component** (`frontend/components/__tests__/BuildCard.test.tsx`)
   ```typescript
   import { MockedProvider } from '@apollo/client/testing';
   // Wrap component with MockedProvider and provide mocked queries
   ```

## Debugging Strategies

### Debugging the Frontend

**NextJS Dev Server Issues:**
```bash
# Check if frontend is running
curl http://localhost:3000

# Enable verbose logging
DEBUG=next:* pnpm dev:frontend

# Clear build cache if pages aren't updating
rm -rf .next && pnpm dev:frontend
```

**Apollo Client Debugging:**
- Install [Apollo DevTools browser extension](https://www.apollographql.com/docs/react/development-testing/developer-tools/)
- Inspect Apollo cache: right-click → Apollo DevTools → Queries tab
- Monitor network requests in DevTools → Network tab (filter by graphql)

**Component Issues:**
```bash
# Run component tests in watch mode
pnpm test:frontend --watch

# Test single component
pnpm test:frontend components/BuildCard.test.tsx --watch
```

### Debugging GraphQL Resolvers

**Test Resolver Locally:**
```bash
# Start Apollo GraphQL in development
pnpm dev:graphql

# Open GraphiQL IDE: http://localhost:4000/graphql
# Execute queries/mutations directly
query {
  builds { id status }
}
```

**Enable Query Logging:**
```bash
# Add logging middleware in backend-graphql/src/index.ts
app.use((req, res, next) => {
  console.log('GraphQL Query:', req.body.query);
  next();
});
```

**Debug N+1 Queries:**
```bash
# Enable SQL query logging (Prisma)
DATABASE_DEBUG=* pnpm dev:graphql

# Monitor resolver execution time
console.time('Query: builds');
const builds = await prisma.build.findMany();
console.timeEnd('Query: builds');
```

**Run Resolver Tests:**
```bash
# Test all resolvers
pnpm test:graphql

# Test single resolver with logging
pnpm test:graphql resolvers/Query.test.ts --reporter=verbose

# Watch mode
pnpm test:graphql --watch
```

### Debugging Express Routes

**Test Route Locally:**
```bash
# Start Express server
pnpm dev:express

# Test file upload
curl -F "file=@test.pdf" http://localhost:5000/upload

# Test webhook
curl -X POST http://localhost:5000/webhooks/ci-results \
  -H "Content-Type: application/json" \
  -d '{"buildId": "123", "status": "PASSED"}'

# Listen to SSE stream
curl -N http://localhost:5000/events
```

**Enable Request Logging:**
```bash
# Morgan or similar middleware logs all requests
DEBUG=express:* pnpm dev:express
```

**Run Route Tests:**
```bash
# Test all Express routes
pnpm test:express

# Test single route
pnpm test:express routes/upload.test.ts --watch

# Show network details
pnpm test:express --reporter=verbose
```

### Debugging Database Issues

**Inspect Database:**
```bash
# Connect to PostgreSQL directly
psql postgresql://user:password@localhost:5432/boltline

# List tables
\dt

# Describe table schema
\d builds

# Query data
SELECT * FROM builds LIMIT 10;

# Check migrations status
\d schema_migrations
```

**Reset Database (Development Only):**
```bash
# Reset and reseed
pnpm migrate:reset

# Or manually
docker-compose down -v  # Remove volume
docker-compose up -d    # Restart
pnpm migrate
pnpm seed
```

**Analyze Slow Queries:**
```bash
# Add EXPLAIN to queries
EXPLAIN ANALYZE SELECT * FROM builds WHERE status = 'PENDING';

# Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'builds';
```

### Multi-Service Debugging

**Start Individual Services in Watch Mode:**
```bash
# Terminal 1: Frontend
pnpm dev:frontend

# Terminal 2: GraphQL
pnpm dev:graphql

# Terminal 3: Express
pnpm dev:express

# Terminal 4: Run tests
pnpm test --watch
```

**Monitor Service Health:**
```bash
# Check all services are running
curl http://localhost:3000     # Frontend
curl http://localhost:4000/graphql  # Apollo
curl http://localhost:5000     # Express

# List processes
ps aux | grep node
```

**Network Debugging:**
```bash
# Monitor network traffic between services
tcpdump -i lo -A 'tcp port 4000 or tcp port 5000'

# Check port availability
lsof -i :3000
lsof -i :4000
lsof -i :5000
```

## Troubleshooting Common Issues

### "Port already in use" Error

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
NEXT_PUBLIC_PORT=3001 pnpm dev:frontend
```

### PostgreSQL Connection Failed

**Symptom:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Ensure Docker container is running
docker-compose ps

# If not running, start it
docker-compose up -d

# Check container logs
docker-compose logs postgres

# Verify credentials in .env.local
grep DATABASE_URL .env.local

# Reset database if stuck
docker-compose down -v
docker-compose up -d
pnpm migrate
```

### Tests Failing

**Symptom:** `Cannot find module` or type errors in tests

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules **/node_modules pnpm-lock.yaml
pnpm install

# Clear build cache
pnpm build --clean

# Run tests with verbose output
pnpm test --reporter=verbose

# Check if database is seeded
pnpm seed
```

### GraphQL Schema Type Mismatch

**Symptom:** `TypeError: Cannot read property 'id' of undefined`

**Solution:**
1. Verify schema matches resolver return types
2. Check DataLoader is returning correct shape
3. Run type generation:
   ```bash
   pnpm generate  # Generate types from schema
   ```
4. Compare schema.graphql with resolvers

### Apollo Client Cache Issues

**Symptom:** UI doesn't update after mutation, or shows stale data

**Solution:**
```typescript
// Ensure mutation has update function
useMutation(UPDATE_BUILD_STATUS, {
  update(cache, { data }) {
    cache.modify({
      fields: {
        builds: (existing) => existing.map(b => 
          b.id === data.updateBuild.id ? data.updateBuild : b
        )
      }
    });
  }
});

// Or use refetchQueries
useMutation(UPDATE_BUILD_STATUS, {
  refetchQueries: [{ query: GET_BUILDS }]
});
```

### File Upload Failing

**Symptom:** `413 Payload Too Large` or files not appearing

**Solution:**
```typescript
// Check Multer config in backend-express/src/middleware/multer.ts
// Ensure limits are appropriate
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  dest: './uploads'
});

// Verify upload directory exists
mkdir -p ./uploads

// Check file permissions
ls -la ./uploads
```

### Real-Time SSE Not Connecting

**Symptom:** EventSource connects but no messages arrive

**Solution:**
```bash
# Test SSE endpoint directly
curl -N http://localhost:5000/events

# Check Express event bus is emitting
# Add logging in backend-express/src/services/eventBus.ts

# Verify CORS if frontend and Express are different origins
# backend-express/src/index.ts should have:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Performance/Memory Issues

**Symptom:** Application slows down or crashes after running for a while

**Solution:**
```bash
# Monitor memory usage
ps aux | grep node | grep -v grep

# Check for memory leaks in tests
pnpm test --memory=8GB

# Restart services
pnpm dev  # Restart all

# Check for unclosed database connections
# Ensure db connections are properly closed in resolvers
```

## Related Documentation

- **CLAUDE.md** - Comprehensive development guide with debugging tips and architecture details
- **DESIGN.md** - Deep dive into dual-backend architecture and patterns
- **docs/start-from-here.md** - 7-day interview prep plan (context for this repo)
- **docs/version-conflict-free-stack.md** - Pinned tech stack versions and compatibility notes
- **.claude/about-me.md** - Interview context (Stoke Space, Boltline domain, candidate background)
