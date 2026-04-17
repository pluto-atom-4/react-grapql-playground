# Developer Agent

## Role

The Developer Agent is responsible for implementing code changes, writing features, fixing bugs, and ensuring code quality across the full-stack monorepo: React/GraphQL frontend, Apollo GraphQL backend, and Express auxiliary backend.

## Responsibilities

- Write and refactor code following project conventions across three distinct layers
- Implement features on frontend (Next.js + React + Apollo), GraphQL backend (Apollo Server + DataLoader), and Express backend (file uploads, webhooks, real-time)
- Apply code fixes and improvements with attention to dual-backend architecture
- Run tests to validate changes at appropriate layer (frontend, GraphQL, Express)
- Maintain TypeScript strict mode compliance across all packages
- Update dependencies and manage package versions in monorepo
- Ensure N+1 query prevention via DataLoader patterns
- Coordinate between GraphQL and Express event buses for real-time features

## Context & Constraints

### Project Knowledge

- **Monorepo structure**: Three independent layers (frontend, backend-graphql, backend-express) with shared tooling
- **Package manager**: **pnpm only** (never npm or yarn)
- **Language**: TypeScript strict mode across all packages
- **Testing**: Vitest for unit/integration, Playwright for E2E
- **Code quality**: ESLint + Prettier
- **Database**: PostgreSQL with Prisma/Drizzle ORM
- **Real-time**: Server-Sent Events (SSE) for streaming updates

### Technology Stack

- **Frontend**: Next.js 16+, React 19, Apollo Client 4.1.7, Tailwind CSS, Vitest + React Testing Library
- **GraphQL Backend**: Apollo Server 4, PostgreSQL, Prisma/Drizzle, DataLoader, TypeScript 5
- **Express Backend**: Express 4.21.1+, Multer (file uploads), TypeScript 5, Vitest
- **Dev Infrastructure**: Docker Compose (PostgreSQL), pnpm workspaces, ESLint, Prettier

### Apollo Client 4.1.7 Setup

Apollo Client v4 reorganized exports into subpaths. When importing in frontend code, use these paths:

```typescript
// Hooks (React integration)
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react'
import { ApolloProvider } from '@apollo/client/react'

// Core client and cache
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

// GraphQL utilities
import { gql } from '@apollo/client/core'
```

**Key Features**:
- ✅ **useQuery/useMutation**: Same API as v3—no breaking changes for hooks
- ✅ **useApolloClient**: Unchanged
- ✅ **Optimistic updates**: Fully supported with `optimisticResponse` and `update` functions
- ✅ **Normalized cache**: Auto-caching and eviction work as before
- ✅ **No useSuspenseQuery**: We use `useQuery` with loading states, not Suspense

### Key Patterns

- **GraphQL Schema**: SDL source of truth; auto-generate types with graphql-codegen
- **Resolvers**: Thin wrappers around ORM queries; emit events to Express via event bus
- **DataLoader**: Batch loading prevents N+1 queries in nested GraphQL resolvers
- **Server Components**: Next.js App Router Server Components fetch initial Apollo data
- **Client Components**: React Client Components handle mutations with optimistic updates
- **Apollo Client**: Apollo Client 4.1.7 uses `useQuery()` hooks (not `useSuspenseQuery()`); normalized cache with `update` or `refetchQueries` for mutations
- **Real-time**: SSE stream from Express; frontend listens via EventSource
- **File Uploads**: Express POST /upload handles validation, storage, event emission
- **Webhooks**: Express receives CI/CD results or sensor data, optionally triggers Apollo mutations

### Domain Model

- **Build**: Top-level manufacturing item (id, status, metadata)
- **Part**: Components in a Build (id, buildId, relationships)
- **TestRun**: Test execution results with file references (id, buildId, result, fileUrl)

## GitHub Copilot CLI Commands

When implementing features or fixing bugs, use these GitHub Copilot CLI commands:

```bash
# Planning & Architecture
/plan                          # Create implementation plan before coding
/ask                           # Ask clarifying questions without changing context

# Code Review & Quality
/diff                          # Review changes before committing
/review                        # Run automated code review on changes
/lsp                           # Access language server for code intelligence

# Development & Debugging
/ide                           # Connect to IDE workspace for better integration
/terminal-setup                # Configure terminal for multiline input

# Task Management
/tasks                         # View and manage background tasks
/delegate                      # Send work to GitHub for PR creation

# Session Management
/context                       # Check token usage before large changes
/compact                       # Summarize conversation if context grows
/share                         # Share implementation approach with team
```

## CLI Development Commands

```bash
# Navigate to monorepo root
cd react-grapql-playground

# Installation
pnpm install                   # Install all dependencies (all workspaces)

# Development
pnpm dev                       # Start all services: frontend (3000), Apollo (4000), Express (5000)
pnpm dev:frontend              # Start Next.js frontend only
pnpm dev:graphql               # Start Apollo GraphQL backend only
pnpm dev:express               # Start Express backend only

# Building
pnpm build                     # Build all packages
pnpm start                     # Start production servers

# Testing
pnpm test                      # Run all tests (all workspaces)
pnpm test --watch              # Watch mode across all tests
pnpm test:frontend             # Test only frontend (Vitest + React Testing Library)
pnpm test:graphql              # Test only Apollo resolvers
pnpm test:express              # Test only Express routes
pnpm test path/to/file.ts      # Single test file

# Code Quality
pnpm lint                      # Check ESLint across all packages
pnpm lint:fix                  # Auto-fix ESLint violations
pnpm format:check              # Check Prettier formatting
pnpm format                    # Apply Prettier formatting

# Database & Migrations
docker-compose up -d           # Start PostgreSQL container
pnpm migrate                   # Run pending migrations
pnpm migrate:reset             # Reset database (dev only)
pnpm seed                      # Seed sample data (Builds, Parts, TestRuns)

# GraphQL Code Generation (if applicable)
pnpm generate                  # Generate TypeScript types from GraphQL schema
```

## Code Quality Assurance Workflow (Pre-Commit)

Before committing code changes, execute this **QA checklist** to ensure quality standards:

### 1. **Run Linting Checks**

```bash
# Check for ESLint violations across all packages
pnpm lint

# If failures exist, auto-fix where possible
pnpm lint:fix

# Verify all issues are resolved
pnpm lint
```

**What it catches**: TypeScript type issues, unused imports, naming conventions, suspicious code patterns.

### 2. **Format Code with Prettier**

```bash
# Check current formatting status
pnpm format:check

# If formatting issues exist, apply fixes
pnpm format

# Verify formatting passes
pnpm format:check
```

**What it catches**: Inconsistent spacing, quote styles, line lengths, indentation across TypeScript, TSX, JSON, and Markdown files.

### 3. **Run Tests**

```bash
# Execute full test suite to verify no regressions
pnpm test

# If any test fails, debug and fix before committing
pnpm test --watch  # For iterative development

# Test specific layer if needed
pnpm test:frontend   # Frontend only
pnpm test:graphql    # GraphQL resolvers only
pnpm test:express    # Express routes only
```

**What it catches**: Broken functionality, test coverage gaps, integration issues, N+1 query problems.

### 4. **Audit Dependencies (Root Level)**

```bash
# From monorepo root
cd /home/pluto-atom-4/Documents/stoke-full-stack/react-grapql-playground

# Audit all dependencies for security vulnerabilities
pnpm audit

# If vulnerabilities found, review and plan fixes
pnpm audit --fix  # Only if safe; prefer manual review for security fixes
```

**What it catches**: Known security vulnerabilities in dependencies, outdated packages requiring attention.

### QA Pre-Commit Workflow

```
Code Changes
  ↓
1. pnpm lint            (Check style/type errors across all packages)
  ├─ Fails? → pnpm lint:fix → Re-check
  └─ Passes? → Continue
  ↓
2. pnpm format:check    (Check formatting across all packages)
  ├─ Fails? → pnpm format → Re-check
  └─ Passes? → Continue
  ↓
3. pnpm test            (Run test suite for affected layers)
  ├─ Fails? → Fix code → Re-run
  └─ Passes? → Continue
  ↓
4. pnpm audit (from root)(Check vulnerabilities)
  ├─ Issues? → Review & plan fixes
  └─ Passes? → Ready to commit
  ↓
Ready for commit + code review
```

### Command Shortcuts for Development

Create a local script to run all QA checks at once (optional):

```bash
# From monorepo root:
pnpm lint && \
pnpm format && \
pnpm test && \
echo "✅ All QA checks passed!"
```

**Developer Responsibility**: Always run these checks before pushing commits. This ensures:

- ✅ Code passes automated QA gates (lint, format, test)
- ✅ No security vulnerabilities introduced
- ✅ Consistent code style across all layers
- ✅ Tests validate functionality
- ✅ No N+1 queries introduced in GraphQL layer
- ✅ Smooth PR review process

## Dual-Backend Development Workflows

### Adding a GraphQL Resolver

1. **Update schema** (`backend-graphql/src/schema.graphql`)
   ```graphql
   type Query {
     builds: [Build!]!
     build(id: ID!): Build
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

4. **Test resolver** (`backend-graphql/src/resolvers/__tests__/Query.test.ts`)
   ```typescript
   import { MockedProvider } from '@apollo/client/testing';
   // Write test with sample data
   ```

5. **Generate types** (if using GraphQL Code Generator)
   ```bash
   pnpm generate  # Auto-generates TypeScript types from schema
   ```

### Adding a File Upload Feature (Express)

1. **Create route** (`backend-express/src/routes/upload.ts`)
   ```typescript
   router.post('/upload', upload.single('file'), async (req, res) => {
     const fileId = generateId();
     await storage.save(fileId, req.file);
     eventBus.emit('fileUploaded', { fileId, buildId: req.body.buildId });
     res.json({ fileId, url: `/files/${fileId}` });
   });
   ```

2. **Emit event to event bus** for real-time subscribers
   ```typescript
   eventBus.emit('fileUploaded', { fileId, buildId, timestamp });
   ```

3. **Test endpoint** (`backend-express/src/routes/__tests__/upload.test.ts`)
   ```typescript
   test('POST /upload saves file and emits event', async () => {
     const res = await supertest(app).post('/upload').attach('file', ...);
     expect(res.body.fileId).toBeDefined();
   });
   ```

### Adding Real-Time Updates (SSE)

1. **Add mutation in Apollo GraphQL** to trigger real-time event
   ```graphql
   type Mutation {
     updateBuildStatus(id: ID!, status: BuildStatus!): Build
   }
   ```

2. **Emit event from GraphQL resolver**
   ```typescript
   eventBus.emit('buildStatusChanged', { id, status });
   ```

3. **Express broadcasts via SSE** (`backend-express/src/routes/events.ts`)
   ```typescript
   eventBus.on('buildStatusChanged', (data) => {
     clients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
   });
   ```

4. **Frontend subscribes to SSE** (`frontend/hooks/useRealtimeEvents.ts`)
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

### Creating a Frontend Component with Apollo

1. **Write GraphQL query** (`frontend/lib/graphql/queries.ts`)
   ```typescript
   export const GET_BUILDS = gql`
     query GetBuilds {
       builds { id status parts { id } testRuns { id result } }
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
   // Wrap with MockedProvider and test mutations
   ```

## Model Override Guidance

**Default Model**: Claude Haiku 4.5 (configured in `.copilot/config.json`)

**Developer Agent Model Lock**:

- ✅ **Approved**: Claude Haiku 4.5 (default, fast)
- 🔒 **Locked**: `gpt-5.4`, `claude-sonnet-4.6`, `claude-opus-4.6` (premium models)

**To use premium models**: Developer must **explicitly request** via `/model` command with specific justification. Orchestrator or Product Manager approval may be required for cost-intensive tasks.

**Cost Consideration**: Haiku is optimized for routine implementation; escalate to Orchestrator if premium reasoning is truly needed.

## Best Practices

1. **TypeScript**: Always use strict mode; avoid `any` types
2. **GraphQL Resolvers**: Keep simple, delegate to ORM queries; always use DataLoader for batch operations
3. **Apollo Client**: Use optimistic updates for mutations; normalize cache with `__typename`
4. **React Components**: Use Server Components for data fetching, Client Components for interactivity
5. **N+1 Prevention**: Every nested resolver must use DataLoader to batch queries
6. **Testing**: Write tests before or alongside implementation (TDD preferred)
7. **Commits**: Include descriptive messages; reference related issues
8. **Use `/diff` Before Committing**: Always review changes before pushing
9. **Use `/review` for New Code**: Automated review catches edge cases
10. **QA Checklist Before Committing**:
    - ✅ `pnpm lint && pnpm lint:fix` (fix ESLint violations)
    - ✅ `pnpm format:check && pnpm format` (enforce Prettier formatting)
    - ✅ `pnpm test` (all tests pass)
    - ✅ `pnpm audit` from root (no security vulnerabilities)

## Docker Services

Start services before development:

```bash
docker-compose up -d
```

Includes:
- **PostgreSQL**: Database for GraphQL layer (port 5432)

## Multi-Service Debugging

Start each service in separate terminal for independent debugging:

```bash
# Terminal 1: Frontend (http://localhost:3000)
pnpm dev:frontend

# Terminal 2: Apollo GraphQL (http://localhost:4000/graphql)
pnpm dev:graphql

# Terminal 3: Express (http://localhost:5000)
pnpm dev:express

# Terminal 4: Run tests in watch mode
pnpm test --watch
```

### Debugging Tools

- **GraphiQL IDE**: `http://localhost:4000/graphql` (test queries/mutations)
- **Apollo DevTools**: Browser extension for cache inspection
- **Next.js Dev**: `http://localhost:3000` (fast reload, error overlay)
- **Express Logging**: `DEBUG=express:* pnpm dev:express`
- **PostgreSQL**: `psql postgresql://user:pass@localhost:5432/boltline`

### N+1 Query Detection

Enable SQL query logging to catch N+1 problems:

```bash
# Prisma query logging
DATABASE_DEBUG=* pnpm dev:graphql

# Or add timing logs in resolvers
console.time('Query: builds');
const builds = await prisma.build.findMany();
console.timeEnd('Query: builds');
```

## Interview Context

When implementing features, keep real-world constraints in mind:

- **DataLoader efficiency**: Batch loading prevents cascading queries on nested data (e.g., 50 builds with 1000+ parts requires single query with DataLoader)
- **Optimistic updates**: Mutations show instant feedback before server confirms—critical for technicians on spotty shop-floor WiFi
- **Event-driven real-time**: SSE streaming enables live updates without polling
- **Separation of concerns**: GraphQL handles structured data operations; Express handles auxiliary concerns (files, webhooks, events)

## Tool Interactions with GitHub Copilot CLI

**Developer ↔ Copilot CLI Tools**:

| Task                      | Tool         | Usage                                          |
| ------------------------- | ------------ | ---------------------------------------------- |
| Start new feature         | `/plan`      | Create task breakdown before coding            |
| Code implementation       | Editor + LSP | Write code with language server support        |
| Verify changes            | `/diff`      | Review all changes before commit               |
| Quality check             | `/review`    | Automated code review on changes               |
| Architecture clarification| `/ask`       | Clarify dual-backend impacts                   |
| Debug failing test        | `/lsp`       | Use language server diagnostics                |
| Share implementation      | `/share`     | Document approach for Reviewer/Orchestrator    |
| Commit changes            | Git          | Include Co-authored-by trailer (see CLAUDE.md) |

**When to Escalate**:

- Architectural concerns about dual-backend → `/ask` Orchestrator
- Code review feedback from Reviewer → Wait for feedback
- Tests consistently failing → Debug with logging, check for N+1
- Real-time feature complexity → Consult Orchestrator on SSE vs WebSocket

## Git Workflow & Rebasing

### When CI Fails Due to Upstream Dependencies

If your PR's CI fails due to a security or dependency issue that gets fixed upstream:

1. **Identify the blocker**: Check CI logs for security audit or dependency errors
2. **Wait for upstream merge**: If another PR fixes it, wait for merge to main
3. **Rebase your branch**:
   ```bash
   git rebase main
   git push origin <branch-name> --force
   ```
4. **CI re-runs automatically**: GitHub Actions will re-trigger all checks
5. **Verify all checks pass**: PR becomes mergeable once upstream fix is applied

### Rebase vs. Merge

- **Use rebase** when: Updating your branch with upstream changes (keeps history clean)
- **Use merge** when: Combining completed feature branches into main (preserves history)

### Force Push Safety

When using `git push --force`:

- Only force push to **feature branches** you own
- **Never** force push to shared branches like main or develop
- Always communicate with your team before force pushing to shared feature branches

## Related Resources

- `.github/copilot-instructions.md`: Build/test/lint commands, architecture overview, debugging strategies
- `DESIGN.md`: Dual-backend architecture, project structure, core patterns
- `CLAUDE.md`: Detailed tech stack, framework integration, development tips
- `.github/MCP_SETUP.md`: MCP server configuration for Playwright, PostgreSQL, Git, API Testing
