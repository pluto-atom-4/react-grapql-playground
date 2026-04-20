# Design & Architecture Guide

This document outlines the dual-backend architecture for building a production-ready React/GraphQL application and
interview preparation patterns.

## Project Structure

```
react-grapql-playground/
├── frontend/                           # Next.js 16 + React 19 + Apollo Client
│   ├── app/
│   │   ├── page.tsx                   # Root Server Component (dashboard)
│   │   ├── builds/
│   │   │   ├── page.tsx               # Builds list (paginated, queries Apollo)
│   │   │   └── [id]/page.tsx          # Build detail (real-time, mutations Apollo)
│   │   ├── uploads/
│   │   │   └── page.tsx               # File upload (posts to Express backend)
│   │   ├── layout.tsx                 # Root layout with Apollo provider
│   │   └── api/
│   │       └── webhooks/              # Incoming webhook handlers
│   ├── components/
│   │   ├── BuildDashboard.tsx         # Main dashboard (Apollo queries)
│   │   ├── BuildCard.tsx              # Single build card
│   │   ├── TestRunLog.tsx             # Test run results viewer
│   │   ├── StatusMutation.tsx         # Optimistic update (Apollo)
│   │   ├── FileUploader.tsx           # Upload to Express (FormData)
│   │   └── RealtimeEvents.tsx         # Listen to Express SSE/WebSocket
│   ├── lib/
│   │   ├── apollo.ts                  # Apollo Client setup
│   │   ├── graphql/
│   │   │   ├── queries.ts             # GraphQL query documents
│   │   │   └── mutations.ts           # GraphQL mutation documents
│   │   ├── hooks/
│   │   │   ├── useBuild.ts            # Custom Apollo query hook
│   │   │   └── useUpdateBuildStatus.ts # Custom Apollo mutation hook
│   │   └── api.ts                     # Fetch utilities for Express backend
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── backend-graphql/                   # Apollo Server 4 + PostgreSQL
│   ├── src/
│   │   ├── index.ts                   # Apollo Server setup
│   │   ├── schema.graphql             # GraphQL schema (SDL)
│   │   ├── resolvers/
│   │   │   ├── Query.ts               # Query field resolvers
│   │   │   ├── Mutation.ts            # Mutation field resolvers
│   │   │   ├── Build.ts               # Build type resolvers
│   │   │   └── TestRun.ts             # TestRun type resolvers
│   │   ├── dataloaders/
│   │   │   ├── buildLoader.ts         # Batch load builds (N+1 fix)
│   │   │   └── partLoader.ts          # Batch load parts
│   │   ├── db/
│   │   │   ├── schema.sql             # PostgreSQL schema
│   │   │   └── client.ts              # Database connection (Prisma/Drizzle)
│   │   └── middleware/
│   │       ├── auth.ts                # JWT validation
│   │       └── logging.ts             # Request logging
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── backend-express/                   # Express.js (file uploads, webhooks, real-time)
│   ├── src/
│   │   ├── index.ts                   # Express app setup
│   │   ├── routes/
│   │   │   ├── upload.ts              # POST /upload (file storage)
│   │   │   ├── webhooks.ts            # POST /webhooks/* (external events)
│   │   │   └── events.ts              # GET /events (SSE stream for real-time)
│   │   ├── middleware/
│   │   │   ├── auth.ts                # JWT validation
│   │   │   ├── multer.ts              # File upload config
│   │   │   └── errorHandler.ts        # Error handling
│   │   ├── services/
│   │   │   ├── storage.ts             # File storage logic (S3, local, etc)
│   │   │   ├── eventBus.ts            # In-memory event bus for SSE/WebSocket
│   │   │   └── webhooks.ts            # Webhook processing (e.g., CI results)
│   │   └── db/
│   │       └── client.ts              # Optional: shared DB connection
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── docker-compose.yml                 # PostgreSQL container
├── package.json                       # Root workspace config (pnpm)
├── pnpm-workspace.yaml                # Monorepo setup
├── CLAUDE.md                          # Development guidance
├── DESIGN.md                          # Architecture (this file)
├── about-me.md                        # Interview context
└── docs/
    ├── start-from-here.md             # 7-day practice plan
    ├── version-conflict-free-stack.md # Tech stack versions
    └── boilerplate-evaluation.md      # Boilerplate choices
```

## Core Architecture: Dual-Backend Approach

### Why Two Backends?

In production systems (like Boltline), **separation of concerns** improves scalability and flexibility:

- **Apollo GraphQL**: Handles structured data (Build, Part, TestRun CRUD operations)
    - Normalized queries and mutations
    - Real-time subscriptions (if needed)
    - Type-safe API contract
    - Cached responses reduce database load

- **Express.js**: Handles auxiliary functionality
    - File uploads (test reports, CAD files)
    - Incoming webhooks (CI/CD results, sensor data)
    - Real-time event streams (Server-Sent Events or WebSocket)
    - Legacy or custom endpoints

Both backends can share the same PostgreSQL database and authentication, but operate independently.

---

## Backend 1: Apollo GraphQL Server + PostgreSQL

**Purpose**: Provide a GraphQL API for Build, Part, TestRun CRUD operations.

**Responsibilities**:

- Query/mutation operations on manufacturing domain
- DataLoader for efficient N+1 prevention (planned, not yet implemented)
- Error handling and validation
- Authorization checks (planned)
- Emit events to Express event bus for real-time updates (TODO: currently stub only)

**Current Status**: ✅ **FUNCTIONAL** (Resolvers implemented and tested)

- Queries: `builds(limit, offset)`, `build(id)`, `testRuns(buildId)` ✅
- Mutations: `createBuild`, `updateBuildStatus`, `addPart`, `submitTestRun` ✅
- DataLoader: **Planned** - not yet implemented (marked as TODO in resolvers)
- Real-time Events: **Stub** - calls console.log, no actual emission to Express (Issue #7)

### GraphQL Schema (Domain Model)

```graphql
type Query {
  builds(limit: Int!, offset: Int!): [Build!]!
  build(id: ID!): Build
  testRuns(buildId: ID!): [TestRun!]!
}

type Mutation {
  createBuild(name: String!, description: String): Build!
  updateBuildStatus(id: ID!, status: BuildStatus!): Build!
  addPart(buildId: ID!, name: String!, sku: String!, quantity: Int!): Part!
  submitTestRun(buildId: ID!, result: TestResult!): TestRun!
}

type Subscription {
  buildStatusChanged(buildId: ID!): Build!
}

type Build {
  id: ID!
  name: String!
  status: BuildStatus!
  parts: [Part!]!
  testRuns: [TestRun!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Part {
  id: ID!
  buildId: ID!
  name: String!
  sku: String!
  quantity: Int!
}

type TestRun {
  id: ID!
  buildId: ID!
  status: TestStatus!
  result: String
  fileUrl: String  # Points to Express backend file upload
  completedAt: DateTime
}

enum BuildStatus {
  PENDING
  RUNNING
  COMPLETE
  FAILED
}

enum TestStatus {
  PENDING
  RUNNING
  PASSED
  FAILED
}
```

### Resolver Implementation

```typescript
// backend-graphql/src/resolvers/Query.ts
export const queryResolvers = {
  builds: async (_, {limit, offset}, {db, dataloaders}) => {
    return db.builds.findMany({
      skip: offset,
      take: limit,
      orderBy: {createdAt: "desc"},
    });
  },

  build: async (_, {id}, {db}) => {
    return db.builds.findUnique({where: {id}});
  },
};

// backend-graphql/src/resolvers/Mutation.ts
export const mutationResolver = {
  Mutation: {
    async updateBuildStatus(_parent, args: { id: string; status: string }, context) {
      const updated = await context.prisma.build.update({
        where: {id: args.id},
        data: {status: args.status as BuildStatus},
      })

      // CURRENTLY: Emits to console.log (TODO: Wire to Express event bus)
      emitEvent('buildStatusChanged', {buildId: updated.id, build: updated})

      return updated
    },
  },
}

/**
 * emitEvent: Stub function (currently logs to console)
 * TODO: Implement with Redis pub/sub or HTTP POST to Express
 *
 * Production options:
 * 1. Redis Pub/Sub: await redis.publish('buildStatusChanged', JSON.stringify(event))
 * 2. HTTP Webhook: await fetch('http://localhost:5000/webhook/events', { method: 'POST', body })
 * 3. Shared EventEmitter: import { eventBus } from '../services/event-bus'
 */
function emitEvent(eventName: string, payload: any) {
  console.log(`[EVENT] ${eventName}:`, JSON.stringify(payload))
  // TODO: Send to Express event bus
}

// backend-graphql/src/resolvers/Build.ts
export const buildResolvers = {
  Build: {
    parts: (parent, _, {loaders}) =>
      loaders.partLoader.load(parent.id),

    testRuns: (parent, _, {loaders}) =>
      loaders.testRunLoader.load(parent.id),
  },
};
```

### DataLoader for N+1 Prevention

**Status**: ✅ **DESIGNED** | 🔴 **NOT YET IMPLEMENTED**

```typescript
// backend-graphql/src/dataloaders/partLoader.ts (PLANNED)
import DataLoader from "dataloader";

export const createPartLoader = (db) => {
  return new DataLoader(async (buildIds) => {
    const parts = await db.parts.findMany({
      where: {buildId: {in: buildIds}},
    });

    // Return array in same order as buildIds
    return buildIds.map(id =>
      parts.filter(p => p.buildId === id)
    );
  });
};
```

**Current Approach**: Resolvers fetch data directly without batch loading.

- `Query.builds()` returns paginated results (no DataLoader needed)
- `Build.parts` and `Build.testRuns` are NOT yet implemented (would benefit from DataLoader)

**Interview Talking Point** (when implemented):
> "DataLoader prevents N+1 queries by batching related queries together. If a dashboard loads 50 builds with nested
> parts, DataLoader combines 50 individual part queries into a single database query using `IN` clauses—reducing database
> round trips from 1+50M to 1+1."

---

## Backend 2: Express.js Server (Files, Webhooks, Real-time)

**Purpose**: Handle file uploads, incoming webhooks, and real-time event streaming.

**Responsibilities**:

- ✅ File upload endpoint with storage (S3, local, etc.)
- ✅ Webhook handlers for external events (CI/CD, sensors)
- ✅ Server-Sent Events (SSE) for real-time notifications
- 🔴 Connect to GraphQL mutations (BLOCKED - Issue #7: emitEvent() is stub only)

**Current Status**: ✅ **PRODUCTION READY** (54/54 tests passing)

- File uploads with MIME type whitelist ✅
- Webhook handlers for CI results and sensor data ✅
- SSE streaming to frontend with heartbeat and cleanup ✅
- Event bus with typed methods (emitFileUploaded, emitCIResults, emitSensorData) ✅
- Error handling with AppError wrapper ✅
- Auth middleware prepared for JWT validation ✅

### Endpoints

```
POST   /upload               # Upload test report, design file, etc.
POST   /webhooks/ci-results  # Receive test results from CI system
POST   /webhooks/sensor-data # Receive manufacturing sensor data
GET    /events               # Server-Sent Events stream (real-time)
GET    /health               # Health check
```

### File Upload Handler

**Status**: ✅ **COMPLETE & TESTED**

```typescript
// backend-express/src/routes/upload.ts (ACTUAL IMPLEMENTATION)
import multer from "multer";
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_MIME_TYPES = [
  "text/plain", "text/csv", "application/json", "application/xml",
  "application/pdf", "image/png", "image/jpeg",
  "application/zip", "application/gzip"
];

// Multer configuration with disk storage
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
      const fileId = uuidv4();
      const ext = path.extname(file.originalname);
      cb(null, `${fileId}${ext}`);
    },
  }),
  limits: {fileSize: 50 * 1024 * 1024}, // 50MB
  fileFilter: (_req, file, cb) => {
    // ✅ MIME type validation (Issue #19 resolved)
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

router.post("/", upload.single("file"), async (req, res) => {
  const fileId = path.parse(req.file.filename).name;

  // ✅ Emit event to event bus for SSE broadcast
  eventBus.emitFileUploaded({
    fileId,
    buildId: req.body.buildId,
    fileName: req.file.originalname,
  });

  res.json({
    fileId,
    fileName: req.file.originalname,
    url: `/files/${req.file.filename}`,
  });
});
```

**Key Features**:

- ✅ UUID filenames prevent collisions
- ✅ MIME type whitelist (PDF, XLSX, images, archives)
- ✅ File size limit (50MB)
- ✅ Extension validation
- ✅ Events emitted to SSE subscribers
- ✅ Error handling with proper HTTP status codes

### Webhook Handler

**Status**: ✅ **COMPLETE & TESTED**

```typescript
// backend-express/src/routes/webhooks.ts (ACTUAL IMPLEMENTATION)
import { Router } from "express";
import { eventBus } from "../services/event-bus";

router.post("/ci-results", async (req, res) => {
  const {buildId, status, testsPassed, testsFailed} = req.body;

  try {
    // Validate input
    if (!buildId || !status) {
      return res.status(400).json({error: "buildId and status required"});
    }

    // Emit to event bus for real-time subscribers
    eventBus.emitCIResults({
      buildId,
      status,
      testsPassed,
      testsFailed,
    });

    res.json({success: true});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

router.post("/sensor-data", async (req, res) => {
  const {buildId, sensorType, value} = req.body;

  try {
    eventBus.emitSensorData({
      buildId,
      sensorType,
      value,
    });

    res.json({success: true});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});
```

**Current Limitations**:

- ✅ Emits to local SSE subscribers only
- 🔴 Does NOT call Apollo mutations (blocked by Issue #7)
- 🔴 No verification of webhook signatures (security enhancement)

### Real-time Events (Server-Sent Events)

**Status**: ✅ **COMPLETE & PRODUCTION READY**

```typescript
// backend-express/src/routes/events.ts (ACTUAL IMPLEMENTATION)
import { Router, Request, Response } from "express";
import { eventBus } from "../services/event-bus";

const connectedClients: Set<Response> = new Set();

router.get("/", (_req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Track client and send connection message
  connectedClients.add(res);
  res.write(`data: ${JSON.stringify({
    type: "connected",
    clientId: uuidv4(),
    timestamp: new Date().toISOString(),
  })}\n\n`);

  // ✅ Send keep-alive heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (res.writable) {
      res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
    } else {
      clearInterval(heartbeat);
      connectedClients.delete(res);
    }
  }, 30000);

  // Clean up on disconnect
  res.on("close", () => {
    clearInterval(heartbeat);
    connectedClients.delete(res);
  });
});

// ✅ Broadcast events to all connected clients
eventBus.on("fileUploaded", (data) => {
  broadcastEvent("fileUploaded", data);
});

eventBus.on("ciResults", (data) => {
  broadcastEvent("ciResults", data);
});

eventBus.on("sensorData", (data) => {
  broadcastEvent("sensorData", data);
});

function broadcastEvent(eventType: string, data: unknown) {
  const message = {type: eventType, data, timestamp: new Date().toISOString()};

  connectedClients.forEach((client) => {
    if (client.writable) {
      client.write(`event: ${eventType}\ndata: ${JSON.stringify(message)}\n\n`);
    } else {
      connectedClients.delete(client);
    }
  });
}
```

**Key Features**:

- ✅ SSE connection established with unique clientId
- ✅ Heartbeat every 30s to prevent connection timeout
- ✅ Proper cleanup on client disconnect
- ✅ Broadcasts to all connected clients
- ✅ CORS headers set for cross-origin clients
- ✅ Three event types supported: fileUploaded, ciResults, sensorData

---

## Frontend Integration

**Current Status**: 🔴 **INCOMPLETE - 18 ISSUES IDENTIFIED** (See Implementation Roadmap below)

**Blockers**:

- Apollo Client singleton pattern broken (recreated on each render) - Issue #23
- TypeScript compilation broken (missing GraphQL code generation) - Issue #24
- Server Components not implemented - Issue #26
- Real-time event listener connected but GraphQL mutations can't emit events - Issue #7
- JWT authentication not wired across layers - Issue #27

### Frontend Data Fetching Patterns & Apollo Client Strategy

Next.js 13+ with React 19 combines **Server Components** and **Client Components** to optimize initial load time and user interactivity. Apollo Client configuration differs significantly between these contexts:

#### Architecture Overview: Three Data Fetching Layers

```
┌──────────────────────────────────────────────────────────┐
│ Server Request (Node.js Runtime)                         │
├──────────────────────────────────────────────────────────┤
│ 1. Server Component (async)                              │
│    ├─ getClient() [apollo-client-server-registered]      │
│    ├─ Fresh cache per request                            │
│    └─ Fetches initial data → passes to Client Component  │
│                                                           │
│ 2. Streaming HTML Response to Browser                    │
│    └─ Includes initial props (hydration data)            │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ Client Runtime (Browser)                                 │
├──────────────────────────────────────────────────────────┤
│ 3. Client Component (interactive)                        │
│    ├─ makeClient() [apollo-client] with useMemo          │
│    ├─ Singleton cache persists across renders            │
│    ├─ Mutations update cache immediately                 │
│    └─ Real-time events refresh via SSE listener          │
└──────────────────────────────────────────────────────────┘
```

#### Why Two Apollo Configurations?

**Server-Side: `apollo-client-server-registered.ts`**

Uses `registerApolloClient()` from `@apollo/client-integration-nextjs`:
- **Fresh cache per request**: Prevents data leaking between different users
- **Automatic per-request isolation**: Built-in by Apollo's official integration
- **Security**: No singleton cache means no accidental cross-request contamination
- **Example use case**: Server Component needs to fetch initial Builds list for dashboard

**Client-Side: `apollo-client.ts` (with `useMemo` wrapper)**

Simple singleton factory wrapped in `useMemo`:
- **Persistent cache across renders**: Critical for state management and UX
- **Optimistic updates**: Mutations show instant feedback before server confirms
- **Real-time subscriptions**: SSE listeners and WebSocket connections stay active
- **Example use case**: Client Component mutates build status, cache updates immediately, UI shows "✓ Complete" instantly

#### Decision Tree: Which Configuration to Use?

```
┌─ Is this a Server Component (async, top-level)?
│  YES → Use registerApolloClient (apollo-client-server-registered.ts)
│        const client = getClient()
│        const { data } = await client.query({ query: GET_BUILDS })
│        return <BuildsList builds={data.builds} />  // Pass data as props
│
└─ Is this a Client Component ('use client')?
   YES → Use makeClient with useMemo (apollo-client.ts)
         const client = useMemo(() => makeClient(), [])
         // Use hooks: useQuery, useMutation, useSubscription
```

#### Best Practices by Context

**Server Components (per-request Apollo client)**
```typescript
// ✅ DO: Fetch in async Server Component
import { getClient } from '@/lib/apollo-client-server-registered'
import { BUILDS_QUERY } from '@/lib/graphql-queries'

export default async function BuildsPage() {
  const client = getClient()
  const { data } = await client.query({ query: BUILDS_QUERY })
  
  // Pass to Client Component (no double-fetch on hydration)
  return <BuildList initialBuilds={data.builds} />
}

// ❌ DON'T: Use client-side hooks in Server Component
// ❌ DON'T: Create multiple getClient() instances (reuse single client per render)
```

**Client Components (singleton Apollo client)**
```typescript
'use client'
import { useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { makeClient } from '@/lib/apollo-client'

export function BuildList({ initialBuilds }: { initialBuilds: Build[] }) {
  // ✅ DO: Create singleton client once with useMemo
  const client = useMemo(() => makeClient(), [])
  
  // ✅ DO: Use hooks inside Client Component
  const { data, refetch } = useQuery(BUILDS_QUERY)
  
  // ✅ DO: Use mutations with optimistic updates
  const [updateStatus] = useMutation(UPDATE_STATUS, {
    optimisticResponse: { updateBuild: { id, status: 'COMPLETE' } }
  })
  
  return (
    // Component JSX
  )
}

// ❌ DON'T: Call makeClient() on every render (do it in useMemo)
// ❌ DON'T: Try to use server-side getClient() in Client Component
```

#### Data Flow & Hydration Strategy

**Goal**: Avoid double-fetching (server + client) on page load

```typescript
// 1. SERVER COMPONENT - Fetch initial data
export default async function Page() {
  const client = getClient()
  const { data } = await client.query({ query: GET_BUILDS })
  
  // 2. PASS AS PROPS to Client Component
  return <BuildsClient initialBuilds={data.builds} />
}

// 3. CLIENT COMPONENT - Use passed data, handle mutations
'use client'
export function BuildsClient({ initialBuilds }: { initialBuilds: Build[] }) {
  const client = useMemo(() => makeClient(), [])
  const [builds, setBuilds] = useState(initialBuilds)
  
  // 4. Mutations update local state immediately (optimistic)
  const [updateStatus] = useMutation(UPDATE_STATUS, {
    onCompleted: (data) => {
      setBuilds(builds.map(b => b.id === data.updateBuild.id ? data.updateBuild : b))
    }
  })
  
  return <BuildList builds={builds} onStatusChange={updateStatus} />
}
```

**Why not query in Client Component on mount?**
- ❌ Double-fetch: Server renders with data, then client fetches again
- ❌ Slower perceived performance (loading spinner after SSR)
- ❌ Wastes bandwidth (fetches same data twice)

**Why pass data as props?**
- ✅ Single fetch (server only)
- ✅ Instant rendering (no loading state on first paint)
- ✅ Bandwidth efficient
- ✅ Better SEO (server renders full HTML content)

#### Apollo Client Configuration Details

**Client-Side Configuration (`apollo-client.ts`)**:
```typescript
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

export function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  return new ApolloClient({
    // Detects if server or client automatically
    ssrMode: typeof window === 'undefined',
    
    // Fresh cache, but wrapped in useMemo so it's shared across renders
    cache: new InMemoryCache(),
    
    // HTTP link to GraphQL endpoint
    link: new HttpLink({
      uri: graphqlUrl,
      // Include cookies/auth headers
      credentials: 'include',
    }),
  })
}
```

**Server-Side Configuration (`apollo-client-server-registered.ts`)**:
```typescript
import { registerApolloClient } from '@apollo/client-integration-nextjs'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

// registerApolloClient ensures fresh client per request
export const { getClient } = registerApolloClient(() => {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  return new ApolloClient({
    // Always true for server rendering
    ssrMode: true,

    // Fresh cache per request (prevents cross-request pollution)
    // Apollo's registerApolloClient handles this automatically
    cache: new InMemoryCache(),

    link: new HttpLink({
      uri: graphqlUrl,
      // Server context includes cookies/auth headers
      credentials: 'include',
    }),
  })
})
```

#### Cache Management Strategy

| Aspect | Server Cache | Client Cache |
|--------|--------------|--------------|
| **Lifecycle** | Per HTTP request | Per browser session |
| **Shared?** | Isolated (fresh each request) | Singleton (shared across renders) |
| **Data persistence** | Garbage collected after response | Lives until page reload |
| **Mutations** | Fetch fresh data, send response | Update cache, mutations update immediately |
| **Risk** | None (fresh cache) | Cache pollution if not careful |
| **Usage** | Initial page load | User interactions, mutations, subscriptions |

#### Real-Time Event Handling with Apollo Cache

When Express emits real-time events (SSE), update Apollo cache:

```typescript
'use client'
import { useEffect } from 'react'
import { useApolloClient } from '@apollo/client'

export function RealtimeListener() {
  const client = useApolloClient()  // Get singleton client

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/events')

    eventSource.addEventListener('buildStatusChanged', (event) => {
      const { buildId, status } = JSON.parse(event.data)

      // Update Apollo cache (invalidates related queries)
      client.cache.evict({ fieldName: 'builds' })
      client.cache.evict({ fieldName: `build:${buildId}` })
      client.cache.gc()

      // Or: Update specific query cache
      client.cache.writeQuery({
        query: BUILD_DETAIL_QUERY,
        variables: { id: buildId },
        data: { build: { id: buildId, status, __typename: 'Build' } }
      })
    })

    return () => eventSource.close()
  }, [client])

  return null
}
```

#### Performance Implications

| Metric | Server Components | Client Components |
|--------|-------------------|-------------------|
| **First Paint** | ✅ Faster (HTML from server) | ⚠️ Slower (JS downloads first) |
| **Interactive** | ⚠️ Slower (wait for JS) | ✅ Faster (already rendering) |
| **Bundle Size** | ✅ Smaller (no Apollo Client) | ⚠️ Larger (full Apollo Client) |
| **API Calls** | ⚠️ Server calls (user sees load time) | ✅ Background fetch (don't block render) |
| **Caching** | ✅ Browser cache works | ✅ Apollo cache works |
| **SEO** | ✅ Content in HTML | ❌ Content is JavaScript |
| **Ideal For** | Initial page load, SEO | Mutations, interactive features, real-time |

**Recommendation**: Use **Server Components for data fetching, Client Components for interactivity**.

#### Common Pitfalls to Avoid

1. **Using client-side hooks in Server Components**
   ```typescript
   // ❌ WON'T WORK - Server Components can't use hooks
   export default function Page() {
     const { data } = useQuery(BUILDS_QUERY)  // Error!
   }
   
   // ✅ DO THIS - Use async/await
   export default async function Page() {
     const client = getClient()
     const { data } = await client.query({ query: BUILDS_QUERY })
   }
   ```

2. **Calling makeClient() outside useMemo in Client Components**
   ```typescript
   // ❌ WRONG - Creates new client on every render
   export function MyComponent() {
     const client = makeClient()  // New instance every render!
   }
   
   // ✅ CORRECT - Singleton via useMemo
   export function MyComponent() {
     const client = useMemo(() => makeClient(), [])
   }
   ```

3. **Double-fetching data**
   ```typescript
   // ❌ WRONG - Server fetches, then Client fetches again
   export default async function Page() {
     const client = getClient()
     const { data } = await client.query({ query: GET_BUILDS })
     
     return <BuildsClient />  // This will fetch again on mount!
   }
   
   // ✅ CORRECT - Server fetches, pass to Client
   export default async function Page() {
     const client = getClient()
     const { data } = await client.query({ query: GET_BUILDS })
     
     return <BuildsClient initialBuilds={data.builds} />  // No re-fetch
   }
   ```

4. **Forgetting SSR hydration**
   ```typescript
   // ❌ WRONG - Client cache starts empty
   const client = useMemo(() => makeClient(), [])
   
   // ✅ CORRECT - Hydrate cache with server data
   const client = useMemo(() => makeClient(), [])
   useEffect(() => {
     client.cache.writeQuery({
       query: BUILDS_QUERY,
       data: { builds: initialBuilds }
     })
   }, [])
   ```

### Apollo Client Setup

**Status**: ✅ **WORKING** (Implements singleton pattern with useMemo)

The project uses two separate Apollo Client configurations:

#### 1. Server-Side: `apollo-client-server-registered.ts`

For Server Components requiring per-request isolation:

```typescript
// frontend/lib/apollo-client-server-registered.ts
import { registerApolloClient } from '@apollo/client-integration-nextjs'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

export const { getClient } = registerApolloClient(() => {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  return new ApolloClient({
    ssrMode: true,
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: graphqlUrl,
      credentials: 'include',
    }),
  })
})
```

**Usage in Server Component**:
```typescript
import { getClient } from '@/lib/apollo-client-server-registered'
import { BUILDS_QUERY } from '@/lib/graphql-queries'

export default async function BuildsPage() {
  const client = getClient()
  const { data } = await client.query({ query: BUILDS_QUERY })
  
  return <BuildsList initialBuilds={data.builds} />
}
```

#### 2. Client-Side: `apollo-client.ts` (with useMemo wrapper)

For Client Components with persistent singleton cache:

```typescript
// frontend/lib/apollo-client.ts
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

export function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: graphqlUrl,
      credentials: 'include',
    }),
  })
}
```

**Usage in Client Component via ApolloWrapper**:
```typescript
// frontend/app/apollo-wrapper.tsx
'use client'

import { useMemo } from 'react'
import type { ReactNode, ReactElement } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import { makeClient } from '@/lib/apollo-client'
import { useSSEEvents } from '@/lib/use-sse-events'

function SSEInitializer(): ReactElement | null {
  useSSEEvents()
  return null
}

export function ApolloWrapper({ children }: { children: ReactNode }): ReactElement {
  // ✅ Singleton client via useMemo (not recreated on render)
  const client = useMemo(() => makeClient(), [])

  return (
    <ApolloProvider client={client}>
      <SSEInitializer />
      {children}
    </ApolloProvider>
  )
}
```

**Key Fix (Issue #23 - RESOLVED)**:
- ✅ `useMemo` ensures `makeClient()` is only called once
- ✅ Apollo cache persists across renders
- ✅ SSE listeners remain connected
- ✅ Performance optimized

### Uploading Files to Express

```typescript
// frontend/components/FileUploader.tsx
import { useState } from "react";

export function FileUploader({buildId}) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("buildId", buildId);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      const {fileId, url} = await res.json();
      console.log("File uploaded:", url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <input
      type = "file"
  onChange = {handleUpload}
  disabled = {loading}
  />
)
  ;
}
```

### Listening to Real-time Events

**Status**: ✅ **WORKING** (But event names incomplete)

```typescript
// frontend/lib/use-sse-events.ts (CURRENT - WORKING)
'use client'

import { useApolloClient } from "@apollo/client/react";
import { useEffect, useRef } from "react";

export function useSSEEvents() {
  const client = useApolloClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || "http://localhost:5000";
    const eventSource = new EventSource(`${expressUrl}/events`);

    // ✅ Listen to Express event bus events
    eventSource.addEventListener("fileUploaded", () => {
      client.cache.evict({fieldName: "uploads"});
      client.cache.gc();
    });

    eventSource.addEventListener("ciResults", () => {
      client.cache.evict({fieldName: "builds"});
      client.cache.gc();
    });

    eventSource.addEventListener("sensorData", () => {
      client.cache.evict({fieldName: "telemetry"});
      client.cache.gc();
    });

    eventSourceRef.current = eventSource;

    return () => {
      eventSourceRef.current?.close();
    };
  }, [client]);
}
```

**Current Behavior**:

- ✅ Connects to Express SSE endpoint
- ✅ Listens for events: fileUploaded, ciResults, sensorData
- ✅ Evicts Apollo cache on events (forces refetch)
- 🔴 Issue: No buildStatusChanged event (blocked by Issue #7)

**Missing Event Flow**:

```
GraphQL Mutation (updateBuildStatus)
  ↓
  ✅ Resolver executes
  ↓
  🔴 emitEvent() is stub (console.log only)
  ↓
  ❌ Event never reaches Express event bus
  ↓
  ❌ SSE subscribers never receive buildStatusChanged event
```

---

## Implementation Roadmap & Current Status

### Project Status Summary

| Component                       | Status     | Tests   | Issues              | Notes                                          |
|---------------------------------|------------|---------|---------------------|------------------------------------------------|
| **Express Backend**             | ✅ READY    | 54/54 ✅ | #5, #16, #18, #19   | File uploads, webhooks, SSE (PROD)             |
| **GraphQL Backend**             | ✅ READY    | TBD     | #7                  | Resolvers work, event emission TODO            |
| **Frontend**                    | 🔴 BLOCKED | TBD     | #23-#40 (18 issues) | Apollo singleton broken, TS compilation broken |
| **GraphQL ↔ Express Event Bus** | 🔴 TODO    | N/A     | #7                  | Stub implementation only                       |
| **GraphQL DataLoader**          | 🔴 TODO    | N/A     | TBD                 | N+1 prevention not yet implemented             |

### Critical Path to Interview-Ready (5-7 hours)

**Blocking Issues** (must fix first):

1. **Issue #23** ⚠️ HIGH: Apollo Client singleton pattern - 30 mins
2. **Issue #24** ⚠️ HIGH: TypeScript compilation - 45 mins
3. **Issue #26** ⚠️ HIGH: Server Components pattern - 1 hour
4. **Issue #27** ⚠️ MEDIUM: JWT auth wiring - 30 mins
5. **Issue #7** 🔴 CRITICAL: GraphQL → Express event bus - 1 hour

**Secondary Issues** (polish):

6. **Issue #25**: Optimistic updates for mutations - 1 hour
7. **Issue #28**: Error handling across layers - 45 mins
8. **Issue #29**: Loading states - 30 mins

**Estimated Total**: 5-7 hours to production-ready frontend

---

## Architecture Decision Log

### Design Decisions & Rationale

#### 1. Why GraphQL for Data, Express for Auxiliary?

**Decision**: Separate Apollo GraphQL and Express.js into two independent backends.

**Rationale**:

- **Scalability**: File uploads don't block GraphQL queries. Both can scale independently.
- **Clarity**: GraphQL handles structured data (CRUD), Express handles events/webhooks.
- **Pattern Match**: Production systems (Shopify, GitHub, Boltline) use this separation.
- **Interview Value**: Demonstrates understanding of separation of concerns.

**Trade-off**: Additional complexity (two processes, event wiring) vs. focused responsibility.

#### 2. Why Server-Sent Events (SSE) Instead of WebSocket?

**Decision**: Use SSE for one-directional real-time updates.

**Rationale**:

- **Simplicity**: SSE is simpler protocol than WebSocket (HTTP-based, no handshake).
- **One-directional**: Frontend only receives updates; Express doesn't need client messages.
- **Upgrade Path**: Easy to upgrade to WebSocket later if bidirectional needed.
- **Fit**: Perfect for manufacturing domain (test results, sensor data are one-way).

**Trade-off**: SSE is HTTP (browser reconnect on network change) vs. WebSocket (persistent).

#### 3. Why DataLoader for N+1 Prevention?

**Decision**: Use DataLoader to batch related queries.

**Rationale**:

- **Performance**: Reduces N+1 queries (1 + N queries becomes 1 + 1 query).
- **Example**: 50 builds with nested parts → 2 queries instead of 1 + 50 + 50×M.
- **Standard**: Apollo/GraphQL best practice, used by GitHub, Twitter, Shopify.

**Current State**: Not yet implemented (resolvers fetch directly).

#### 4. Why JWT for Authentication?

**Decision**: Stateless JWT tokens shared across Apollo and Express.

**Rationale**:

- **Stateless**: No session storage; each service validates independently.
- **Scalability**: Works with distributed microservices (each service has JWT_SECRET).
- **Standard**: Industry standard (Auth0, Firebase, GitHub use JWT).

**Current State**: Not yet wired in frontend (Issue #27).

#### 5. Why Next.js Server Components?

**Decision**: Use Server Components for data fetching, Client Components for interactivity.

**Rationale**:

- **Performance**: Server Components reduce JavaScript bundle size.
- **Security**: Secrets hidden from client (API keys, tokens).
- **Caching**: Built-in server-side caching of queries.
- **DX**: Simpler than traditional SPA patterns.

**Current State**: Not yet implemented (Issue #26).

---

## Event Flow Architecture

### Current State: Partial Event Flow

```
┌─────────────────┐
│   Frontend      │
│  (Next.js)      │
└────────┬────────┘
         │
         │ useSSEEvents()
         │ listens to
         ↓
┌─────────────────────────────────────┐
│  Express Backend                    │
│  (Port 5000)                        │
├─────────────────────────────────────┤
│  POST /upload                       │ ✅ WORKING
│  POST /webhooks/ci-results          │ ✅ WORKING
│  POST /webhooks/sensor-data         │ ✅ WORKING
│  GET  /events (SSE)                 │ ✅ WORKING
│                                     │
│  Event Bus (in-memory EventEmitter) │ ✅ WORKING
│  - emitFileUploaded()               │ ✅
│  - emitCIResults()                  │ ✅
│  - emitSensorData()                 │ ✅
└─────────────────────────────────────┘
         ↑
         │ broadcasts to
         │
    connectedClients (Set<Response>)

┌──────────────────────────────────┐
│  GraphQL Backend                 │
│  (Port 4000)                     │
├──────────────────────────────────┤
│  Query.builds()      ✅ WORKING  │
│  Mutation.createBuild()  ✅      │
│  Mutation.updateBuildStatus()    │
│         │                        │
│         └→ emitEvent()           │
│            (STUB - console.log)  │
│            🔴 BLOCKED: Issue #7  │
│                                  │
│   Should emit to Express event   │
│   bus, but doesn't (TODO)        │
└──────────────────────────────────┘
```

### Desired State: Complete Event Flow (After Issue #7)

```
GraphQL Mutation (updateBuildStatus)
    ↓
    ✅ Update database
    ↓
    📤 Emit to Express event bus
        (Option 1: Redis pub/sub)
        (Option 2: HTTP POST to Express)
        (Option 3: Shared EventEmitter via monorepo)
    ↓
    Broadcast to SSE clients via event bus
    ↓
    Frontend receives SSE event
    ↓
    Apollo cache evicted → refetch
    ↓
    UI updates with latest status
```

### Event Names (Express Event Bus)

| Event                | Emitter                    | Payload                                       | Subscribers                 |
|----------------------|----------------------------|-----------------------------------------------|-----------------------------|
| `fileUploaded`       | POST /upload               | { fileId, buildId, fileName }                 | SSE clients                 |
| `ciResults`          | POST /webhooks/ci-results  | { buildId, status, testsPassed, testsFailed } | SSE clients                 |
| `sensorData`         | POST /webhooks/sensor-data | { buildId, sensorType, value }                | SSE clients                 |
| `buildStatusChanged` | GraphQL mutation           | { buildId, status }                           | **TODO: Wire from GraphQL** |
| `buildCreated`       | GraphQL mutation           | { buildId, build }                            | **TODO: Wire from GraphQL** |
| `testRunSubmitted`   | GraphQL mutation           | { buildId, testRun }                          | **TODO: Wire from GraphQL** |

---

## Interview Talking Points (Updated)

### Point 1: Dual-Backend Architecture

> "I separate concerns into two backends: Apollo GraphQL handles structured data operations (CRUD, queries), while
> Express handles auxiliary concerns (file uploads, webhooks, real-time events). This isn't just for organization—it
> directly impacts scalability. If file uploads are slow, GraphQL queries still respond instantly. In production, each
> backend can scale independently: we might run 5 Apollo instances and 2 Express instances depending on load. This mirrors
> real systems at Shopify, GitHub, and Boltline."

### Point 2: Real-time with Server-Sent Events

> "We use Server-Sent Events for one-directional streaming because it's simpler than WebSocket—it's just HTTP with a
> persistent connection. When a CI webhook arrives with test results, we emit an event through the event bus that Express
> broadcasts to all connected frontend clients via SSE. Result: technicians see test results in <100ms without polling.
> The pattern is: webhook → event bus → SSE → Apollo cache eviction → UI refresh."

### Point 3: DataLoader for N+1 Prevention (When Implemented)

> "DataLoader batches related queries to prevent N+1 problems. If a dashboard loads 50 builds with nested parts and test
> runs, DataLoader combines 50 individual queries into a single database query using `IN` clauses. From the resolver's
> perspective: `loaders.partLoader.load(buildId)` returns a promise, but underneath, DataLoader batches all calls in that
> GraphQL request into one efficient query. Result: reducing queries from 1 + 50 + 50×M to 1 + 1."

### Point 4: TypeScript End-to-End

> "TypeScript runs end-to-end from database schema to React components. Our GraphQL schema defines the types. We
> generate TypeScript types from that schema. Frontend components use those types. This prevents entire classes of bugs—if
> the backend returns a new field, TypeScript catches it immediately in the component. No runtime surprises in
> production."

### Point 5: Event-Driven Architecture

> "GraphQL mutations don't directly call Express; instead, they emit events to a shared event bus. Express listens to
> those events and broadcasts to clients. This loose coupling means mutations don't fail if Express is slow or down—they
> still succeed in the database. The UI eventually updates when the event arrives. It's more resilient than tight
> coupling."

---

## Interview Preparation Checkpoints

### Checkpoint 1: Apollo GraphQL Mastery

- [x] Design a GraphQL schema for the Boltline domain ✅
- [x] Implement resolvers with Query and Mutation ✅
- [ ] Implement resolvers with DataLoader to prevent N+1 queries (TODO)
- [x] Write mutations that update the database ✅
- [ ] Wire mutations to emit events to Express (TODO - Issue #7)
- [ ] Test resolvers with Vitest ✅

**Current Achievement**: Schema, resolvers, and mutations are working. Event emission is stubbed.

**Interview Talking Point**:
> "I separate concerns into two backends: Apollo handles data operations with type-safe GraphQL, while Express handles
> auxiliary functions like file uploads and webhooks. This lets both scale independently and keeps each layer focused."

---

### Checkpoint 2: Express + Real-time Events

- [x] Create a file upload endpoint with MIME validation ✅
- [x] Implement webhook handlers for CI results and sensor data ✅
- [x] Build a Server-Sent Events stream for real-time notifications ✅
- [ ] Wire Express events to Apollo backend (Issue #7)

**Current Achievement**: Express backend is PRODUCTION READY with 54/54 tests passing.

**Interview Talking Point**:
> "Using Server-Sent Events for real-time updates is simpler than WebSocket for one-directional streaming. When a CI
> webhook arrives, I emit an event that subscribers receive instantly—technicians see test results without polling."

---

### Checkpoint 3: Full-Stack Integration

- [ ] Build a complete flow: create build → upload test report → listen for real-time updates (Blocked)
- [ ] Fix Apollo Client singleton pattern (Issue #23)
- [ ] Fix TypeScript compilation (Issue #24)
- [ ] Implement Server Components pattern (Issue #26)
- [ ] Wire JWT authentication across layers (Issue #27)
- [ ] Wire GraphQL mutations to Express event bus (Issue #7)
- [ ] Write integration tests connecting frontend, Apollo, and Express

**Current Achievement**: Backend layers work independently. Frontend blocked waiting for above fixes.

**Interview Talking Point**:
> "Both backends share authentication (JWT) and a common database, but operate independently. If the file upload is
> slow, GraphQL queries still respond quickly. This architecture mirrors production systems where different concerns scale
> at different rates."

---

## Communication Between Backends

### Option A: Event Bus (In-Memory, Single Process)

```typescript
// shared/eventBus.ts
import EventEmitter from "events";

const eventBus = new EventEmitter();

// Apollo emits when data changes
eventBus.emit("build:status-changed", {buildId, status});

// Express listens and streams to clients
eventBus.on("build:status-changed", (event) => {
  broadcast
  to
  SSE
  clients
});
```

**Pros**: Simple, no network overhead
**Cons**: Only works in single process; not suitable for distributed systems

### Option B: Redis Pub/Sub (For Distributed Systems)

```typescript
// backend-graphql resolver
import redis from "redis";

const pubsub = redis.createClient();

await pubsub.publish("build:status-changed", JSON.stringify({
  buildId,
  status,
}));

// backend-express listens
const subscriber = redis.createClient();
await subscriber.subscribe("build:status-changed", (message) => {
  broadcast
  to
  SSE
  clients
});
```

**Pros**: Works across distributed services
**Cons**: Additional infrastructure (Redis)

### Option C: Direct HTTP Calls (Webhook-style)

```typescript
// Apollo resolver calls Express
await fetch("http://localhost:5000/api/build-status-changed", {
  method: "POST",
  body: JSON.stringify({buildId, status}),
});
```

**Pros**: No shared infrastructure
**Cons**: Tight coupling, requires retry logic

---

## Security Architecture: Inter-Service Communication

### Principle: All Inter-Service Communication Must Be Authenticated

**Rationale**: In a dual-backend architecture, even "internal" service-to-service communication must be authenticated to
prevent:

1. **Event Injection Attacks**: Malicious actors on the network sending fake events (e.g., false build status)
2. **Data Corruption**: Unauthorized clients modifying manufacturing state
3. **Manufacturing Incidents**: In Boltline domain, fake build status can trigger real operational decisions (rework,
   safety issues)

**Example Threat**:

```
Attacker on factory WiFi:
  POST http://localhost:5000/events/emit
  { event: "buildStatusChanged", payload: { buildId: "B123", status: "FAILED" } }

Result:
  - All technician UIs show "Build B123: FAILED"
  - Technician stops production line, initiates rework
  - Reality: Build is actually RUNNING
  - Cost: Production delay, wasted materials, safety investigation
```

### GraphQL → Express Event Bus: Shared Secret Authentication

**Pattern**: Use shared secret in Authorization header for HTTP POST from GraphQL to Express.

#### GraphQL Event Bus Service (Emitter)

```typescript
// backend-graphql/src/services/event-bus.ts
const EXPRESS_EVENT_URL =
  process.env.EXPRESS_EVENT_URL || 'http://localhost:5000/events/emit';
const EXPRESS_EVENT_SECRET =
  process.env.EXPRESS_EVENT_SECRET || 'dev-event-secret-change-in-production';

/**
 * Emit event to Express event bus with authentication
 *
 * Implementation: HTTP POST with Authorization header
 * Authentication: Bearer token (shared secret)
 * Error handling: Graceful degradation (log but don't throw)
 */
export async function emitEvent(eventName: string, payload: any): Promise<void> {
  try {
    await fetch(EXPRESS_EVENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXPRESS_EVENT_SECRET}`  // ✅ AUTH HEADER
      },
      body: JSON.stringify({
        event: eventName,
        payload,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error(`Failed to emit event '${eventName}':`, error);
    // Don't throw — event bus failures shouldn't break mutations
    // Log metrics for monitoring in production
  }
}
```

#### Express Event Endpoint (Receiver)

```typescript
// backend-express/src/routes/events.ts
import { validateEventSecret } from '../middleware/validateEventSecret';

// ✅ Protected endpoint validates shared secret
router.post(
  '/emit',
  express.json(),
  validateEventSecret,  // Middleware validates Authorization header
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {event, payload} = req.body;

    // At this point, we know the request is authenticated
    eventBus.emit(event, payload);
    res.json({ok: true, event});
  })
);
```

#### Middleware: Validate Event Secret

```typescript
// backend-express/src/middleware/validateEventSecret.ts
import { Request, Response, NextFunction } from 'express';

export function validateEventSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.EXPRESS_EVENT_SECRET}`;

  if (!authHeader || authHeader !== expectedSecret) {
    res.status(403).json({
      error: 'Forbidden: Invalid event secret',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // ✅ Request is authenticated, proceed
  next();
}
```

#### Environment Configuration

```bash
# .env (shared across services)
EXPRESS_EVENT_SECRET=prod-secret-change-in-production

# docker-compose.yml (development)
backend-express:
  environment:
    EXPRESS_EVENT_SECRET: dev-event-secret-12345

# Production deployment (e.g., Kubernetes)
backend-graphql:
  env:
    - name: EXPRESS_EVENT_SECRET
      valueFrom:
        secretKeyRef:
          name: event-bus-secret
          key: token

backend-express:
  env:
    - name: EXPRESS_EVENT_SECRET
      valueFrom:
        secretKeyRef:
          name: event-bus-secret
          key: token
```

### Standardized Event Names (Secure Contract)

To prevent injection of unrecognized events, maintain a whitelist of valid event types:

```typescript
// backend-express/src/services/eventBus.ts
export enum EventType {
  // From GraphQL mutations
  BUILD_CREATED = 'buildCreated',
  BUILD_STATUS_CHANGED = 'buildStatusChanged',
  PART_ADDED = 'partAdded',
  TEST_RUN_SUBMITTED = 'testRunSubmitted',

  // From Express webhooks
  FILE_UPLOADED = 'fileUploaded',
  CI_RESULTS = 'ciResults',
  SENSOR_DATA = 'sensorData',
}

// Validate event types in receiver
if (!Object.values(EventType).includes(req.body.event)) {
  return res.status(400).json({error: 'Invalid event type'});
}
```

### Event Payload Validation

Validate event payloads to prevent injection of arbitrary data:

```typescript
// backend-express/src/validation/eventPayloads.ts
import { z } from 'zod';

const EventSchemas = {
  buildCreated: z.object({
    buildId: z.string().uuid(),
    build: z.object({
      id: z.string().uuid(),
      status: z.enum(['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'])
    })
  }),

  buildStatusChanged: z.object({
    buildId: z.string().uuid(),
    status: z.enum(['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'])
  }),

  // ... more schemas
};

// In event receiver
function validateEventPayload(eventType: string, payload: any) {
  const schema = EventSchemas[eventType];
  if (!schema) {
    throw new Error(`Unknown event type: ${eventType}`);
  }

  return schema.parse(payload);
}
```

### Production Upgrades

**Development**: Shared secret authentication (as shown above)

**Production**: Upgrade to mutual TLS (mTLS) or API Gateway

```typescript
// Future: Kubernetes with Istio service mesh
// Both services authenticate with client certificates
// Istio enforces communication policies and encryption

// Or: API Gateway (Kong, AWS API Gateway)
// All inter-service traffic routed through gateway
// Gateway enforces authentication and rate limits
```

### Monitoring & Logging

Log all authentication events for security monitoring:

```typescript
// backend-express/src/middleware/validateEventSecret.ts
export function validateEventSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.EXPRESS_EVENT_SECRET}`;

  if (!authHeader || authHeader !== expectedSecret) {
    // ✅ Log failed authentication attempt
    console.warn('[SECURITY] Event auth failed', {
      timestamp: new Date().toISOString(),
      event: req.body?.event,
      ip: req.ip,
      authHeader: authHeader ? 'present' : 'missing'
    });

    res.status(403).json({error: 'Forbidden: Invalid event secret'});
    return;
  }

  // ✅ Log successful authentication
  console.info('[SECURITY] Event authenticated', {
    timestamp: new Date().toISOString(),
    event: req.body?.event,
    ip: req.ip
  });

  next();
}
```

### Interview Talking Point

> "In a dual-backend architecture, inter-service communication must be authenticated. When GraphQL mutations emit events
> to Express, I use a shared-secret Authorization header. This prevents event injection attacks where malicious actors
> could send fake build status updates.
>
> In development, we use a simple shared secret. In production, we'd upgrade to mutual TLS (mTLS) with a service mesh
> like Istio, or enforce authentication through an API Gateway. The pattern is the same: **verify the sender before
processing the message**.
>
> This is critical in manufacturing—fake status updates could trigger real operational decisions (rework, safety
> issues). Security shouldn't be an afterthought; it should be part of the architecture from day one."

---

## Code Quality & Linting

### ESLint v9 Setup

The project uses **ESLint v9** with a flat config format (`eslint.config.js` at repository root). This replaces the legacy `.eslintrc.js` configuration.

**Key Features**:
- **Flat Config Format**: Direct imports of plugins, explicit file patterns
- **TypeScript Support**: Full TypeScript project analysis via `projectService: true`
- **Monorepo Support**: Single config with file-based rules for each package
- **Plugin Ecosystem**: TypeScript ESLint, React, React Hooks rules

**Running ESLint**:

```bash
pnpm lint                           # Lint all packages
pnpm -F frontend lint               # Lint specific package
eslint . --ext .ts,.tsx --format json > report.json  # JSON report
```

**Adding New Rules**:

1. Identify the rule from [ESLint Docs](https://eslint.org/docs/latest/rules/), [TypeScript ESLint](https://typescript-eslint.io/rules/), or plugin docs
2. Test in `eslint.config.js` at `warn` level first
3. Review violations: `pnpm lint`
4. Fix code or adjust severity
5. Document in `CONTRIBUTING.md` and commit

**Common Issues & Solutions**:

| Issue | Cause | Solution |
|-------|-------|----------|
| "Could not find configuration files" | Missing `eslint.config.js` | Verify file exists at repo root |
| "Could not load parser" | Dependencies not installed | Run `pnpm install` |
| TypeScript compilation errors | `projectService: true` strict mode | Add explicit return types or disable projectService |
| ESLint too slow (>30s) | Full TypeScript analysis | Lint single files, or disable projectService (trades accuracy for speed) |

**IDE Integration**:

- **VS Code**: Install ESLint extension, set `editor.codeActionsOnSave.source.fixAll.eslint: true` in `.vscode/settings.json`
- **JetBrains**: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint, enable auto-fix on save

**Full Guide**: See `docs/ESLINT-V9-SETUP-GUIDE.md` for migration details, configuration anatomy, performance tips, and troubleshooting.

---

## Testing Strategy

### Apollo Resolver Tests

```typescript
// backend-graphql/src/resolvers/__tests__/Query.test.ts
describe("Query.builds", () => {
  it("should return paginated builds", async () => {
    const resolvers = createResolvers({db: mockDb});
    const result = await resolvers.Query.builds(null, {limit: 10, offset: 0}, {
      db: mockDb,
      dataloaders: mockDataloaders,
    });
    expect(result).toHaveLength(10);
  });
});
```

### Express Route Tests

```typescript
// backend-express/src/routes/__tests__/upload.test.ts
describe("POST /upload", () => {
  it("should save file and return fileId", async () => {
    const response = await request(app)
      .post("/upload")
      .field("buildId", "123")
      .attach("file", "test.txt");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("fileId");
  });
});
```

### Frontend Integration Tests

```typescript
// frontend/__tests__/end-to-end.test.tsx
describe("Full Build Workflow", () => {
  it("should create build, upload file, and see real-time update", async () => {
    // Create build via Apollo
    // Upload file via Express
    // Listen to SSE and verify event
    const {getByText} = render(<BuildWorkflow / >);
    // assertions...
  });
});
```

---

## Frontend Authentication & Apollo Integration

JWT authentication is a critical security layer that protects the GraphQL API and ensures each user's data remains isolated. This section documents the fresh-per-request pattern applied to authentication.

### Overview: Fresh Per-Request Authentication Pattern

Authentication follows the same **Fresh Per-Request Pattern** used for Apollo cache isolation (see Part 1 above):

```
Frontend (React)                       Backend (Apollo GraphQL)
    ↓                                         ↓
User logs in → AuthContext stores      GraphQL context factory
JWT token → Apollo link attaches        extracts JWT from header
Authorization header → per-request      → validates signature
(fresh token injection)                 → adds user to context
                                        → fresh context per request
```

**Key Principle**: Token extraction and user context creation happen **per GraphQL request**, never globally. This prevents token mixing between concurrent users.

### Frontend Authentication Architecture

#### 1. AuthContext: Token Management

**File**: `frontend/lib/auth-context.tsx` (to be created for Issue #27)

```typescript
import { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  userId?: string
  token?: string
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  error?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Manage token state (localStorage dev, httpOnly prod)
  // Provide login/logout functions
  // Expose useAuth() hook for components
  return (
    <AuthContext.Provider value={...}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
```

**Key Responsibilities**:
- Store JWT token (localStorage in dev, httpOnly cookies in production)
- Provide `login(email, password)` function
- Provide `logout()` function that clears token
- Expose `useAuth()` hook for components
- Persist token across page reloads (dev only)

#### 2. Apollo Auth Link: Token Injection

**File**: `frontend/lib/apollo-client.ts` (modification)

```typescript
import { setContext } from '@apollo/client/link/context'
import { HttpLink, ApolloClient, InMemoryCache } from '@apollo/client'

// ← Fresh token retrieved per GraphQL request (not globally)
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token')
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  credentials: 'include',
})

export const client = new ApolloClient({
  link: authLink.concat(httpLink),  // ← authLink runs FIRST
  cache: new InMemoryCache(),
})
```

**How It Works**:
1. Before each GraphQL request, `setContext` is called
2. Retrieves token from localStorage (fresh per request)
3. Adds `Authorization: Bearer {token}` header
4. Header is sent with GraphQL query/mutation
5. If no token, header is omitted (unauthenticated request)

**Why Fresh Per-Request**:
- Token might have changed between requests (user logged in/out)
- Multiple GraphQL operations in same render should use same token
- `setContext` is called per operation, not globally

#### 3. Login Component

**File**: `frontend/components/login.tsx` (to be created for Issue #27)

```typescript
'use client'

import { FormEvent } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const { login, error, loading } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = new FormData(form).get('email')
    const password = new FormData(form).get('password')
    
    try {
      await login(email as string, password as string)
      router.push('/dashboard')
    } catch (err) {
      // Error handled by AuthContext
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
```

#### 4. App Layout: AuthProvider Wrapping

**File**: `frontend/app/layout.tsx` (modification)

```typescript
import { AuthProvider } from '@/lib/auth-context'
import { ApolloWrapper } from '@/lib/apollo-wrapper'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* ← AuthProvider must wrap ApolloWrapper */}
          {/* so Apollo auth link can access useAuth token */}
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Provider Order Matters**:
```
AuthProvider (top-level context for token)
  └─ ApolloWrapper (client with auth link)
     └─ Components (can use useAuth + useQuery)
```

If order reversed, Apollo auth link can't access token from AuthContext.

### Backend Authentication: GraphQL

#### 1. JWT Middleware: Token Extraction & Validation

**File**: `backend-graphql/src/middleware/auth.ts` (verify/update for Issue #27)

```typescript
import jwt from 'jsonwebtoken'
import { Request } from 'express'

export interface AuthContext {
  userId?: string
  token?: string
  isAuthenticated: boolean
}

export function extractAuthContext(req: Request): AuthContext {
  // ← Called per GraphQL request (fresh context)
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAuthenticated: false }
  }

  const token = authHeader.slice(7)
  
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as { sub: string; iat: number; exp: number }
    
    return {
      isAuthenticated: true,
      userId: decoded.sub,
      token,
    }
  } catch (error) {
    // Invalid or expired token
    return { isAuthenticated: false }
  }
}
```

**Key Points**:
- Extracts JWT from `Authorization: Bearer {token}` header
- Validates JWT signature using JWT_SECRET
- Returns fresh context with `userId` if valid
- Returns unauthenticated context if invalid/missing

#### 2. Apollo Server Context: User Binding

**File**: `backend-graphql/src/index.ts` (modification)

```typescript
import { ApolloServer } from '@apollo/server'
import { extractAuthContext } from './middleware/auth'
import { initializeDataLoaders } from './dataloaders'

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: async ({ req }) => {
    // ← Fresh context factory, called per GraphQL request
    const auth = extractAuthContext(req)
    
    return {
      prisma: new PrismaClient(),
      auth,  // ← Fresh auth context
      user: auth.isAuthenticated ? { id: auth.userId } : null,
      dataloaders: initializeDataLoaders(),
    }
  },
})
```

**What This Provides to Resolvers**:
```typescript
// Inside resolver
async function buildResolver(
  parent,
  args,
  context: GraphQLContext  // ← Has auth data
) {
  // Check if user authenticated
  if (!context.user) {
    throw new AuthenticationError('Not authenticated')
  }
  
  // Fetch builds for this user only
  const builds = await context.prisma.build.findMany({
    where: { userId: context.user.id },  // ← Data isolation per user
  })
  
  return builds
}
```

#### 3. Protected Resolvers: User Data Isolation

**File**: `backend-graphql/src/resolvers/Query.ts` (modify for Issue #27)

```typescript
export const queryResolvers = {
  async builds(_, __, { user, prisma }) {
    // Require authentication
    if (!user) {
      throw new AuthenticationError('Must be logged in to view builds')
    }
    
    // Return only this user's builds
    return prisma.build.findMany({
      where: { userId: user.id },
    })
  },

  async build(_, { id }, { user, prisma }) {
    if (!user) {
      throw new AuthenticationError('Must be logged in')
    }
    
    const build = await prisma.build.findUnique({
      where: { id },
    })
    
    // Verify user owns this build
    if (build?.userId !== user.id) {
      throw new ForbiddenError('Not authorized to view this build')
    }
    
    return build
  },
}
```

### Security Considerations

#### Token Storage (Dev vs. Production)

**Development** (Current):
- Token stored in `localStorage`
- ⚠️ Vulnerable to XSS (JavaScript can steal it)
- Acceptable for development only

**Production** (Recommended):
- Token stored in `httpOnly` cookie
- ✅ Immune to XSS (JavaScript cannot access)
- Cookie sent automatically with requests
- Requires HTTPS (cannot send over HTTP)

**Migration Path**:
```typescript
// Dev: localStorage
localStorage.setItem('auth_token', token)

// Prod: httpOnly cookie
Set-Cookie: auth_token=JWT_VALUE; HttpOnly; Secure; SameSite=Strict
```

#### Token Expiration & Refresh

**Current** (Simple):
- Token expires after 1 hour (JWT `exp` claim)
- User must login again
- Acceptable for short sessions

**Future** (Recommended - Issue #27 follow-up):
- Access token: 15 minutes
- Refresh token: 7 days (rotation)
- User stays logged in without re-authenticating
- More secure: compromised access token has limited window

#### CORS & Credentials

**Apollo Client Setup** (required):
```typescript
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include',  // ← Send cookies with requests
})
```

**Apollo Server Setup** (required):
```typescript
new ApolloServer({
  plugins: {
    didResolveOperation: async (context) => {
      // CORS headers are set by apollo-server-express
    },
  },
})
```

### Interview Talking Points: Authentication

**Question: "How do you prevent token leaks between users?"**

"I apply the same Fresh Per-Request pattern used for Apollo cache isolation. Every GraphQL request has its own context that extracts and validates the JWT token from the Authorization header. This prevents token mixing between concurrent requests. The pattern is:

1. Frontend: Apollo auth link retrieves token per GraphQL operation
2. Backend: Context factory extracts token per HTTP request
3. Each request gets isolated, fresh auth context
4. Tokens never leak between users"

**Question: "How is authentication integrated with Apollo?"**

"Apollo auth link (`@apollo/client/link/context`) intercepts every GraphQL operation and injects the Authorization header. This happens at the transport layer before the request reaches Apollo Server. The key is that it's fresh per operation—if token changes between queries, the new token is used immediately."

**Question: "How do you ensure users only see their own data?"**

"At the resolver level, I verify `context.user` exists and matches the resource owner. For queries, I filter by `where: { userId: context.user.id }`. For mutations, I verify the user has permission. Even if someone guesses a build ID, they can't access it without ownership verification in the resolver."

---

## Environment & Startup

### .env (shared across backends)

```env
POSTGRES_URL=postgresql://user:pass@localhost:5432/boltline
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Startup Commands

```bash
# All at once
pnpm dev

# Separately
pnpm dev:graphql   # Apollo on :4000
pnpm dev:express   # Express on :5000
pnpm dev:frontend  # Next.js on :3000
```

---

## Technology Rationale

| Component              | Why                                                                |
|------------------------|--------------------------------------------------------------------|
| **Apollo GraphQL**     | Type-safe data API, prevents N+1 with DataLoader, scales easily    |
| **Express**            | Lightweight for auxiliary endpoints, familiar to most developers   |
| **PostgreSQL**         | ACID guarantees for manufacturing data, proven at enterprise scale |
| **Server-Sent Events** | Real-time notifications with simpler infrastructure than WebSocket |
| **JWT Auth**           | Stateless, works across multiple backends                          |
| **TypeScript**         | End-to-end type safety from database to UI                         |
| **Vitest**             | Lightning-fast tests, better DX than Jest                          |

---

## Resources

- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Express.js Guide](https://expressjs.com/)
- [DataLoader](https://github.com/graphql/dataloader)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
