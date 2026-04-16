# Design & Architecture Guide

This document outlines the dual-backend architecture for building a production-ready React/GraphQL application and interview preparation patterns.

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
- DataLoader for efficient N+1 prevention
- Error handling and validation
- Authorization checks

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
  builds: async (_, { limit, offset }, { db, dataloaders }) => {
    return db.builds.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  },
  
  build: async (_, { id }, { db }) => {
    return db.builds.findUnique({ where: { id } });
  },
};

// backend-graphql/src/resolvers/Mutation.ts
export const mutationResolvers = {
  updateBuildStatus: async (_, { id, status }, { db, eventBus }) => {
    const build = await db.builds.update({
      where: { id },
      data: { status },
    });
    
    // Emit event to Express backend for real-time subscribers
    eventBus.emit("build:status-changed", { buildId: id, status });
    
    return build;
  },
};

// backend-graphql/src/resolvers/Build.ts
export const buildResolvers = {
  Build: {
    parts: (parent, _, { loaders }) => 
      loaders.partLoader.load(parent.id),
    
    testRuns: (parent, _, { loaders }) =>
      loaders.testRunLoader.load(parent.id),
  },
};
```

### DataLoader for N+1 Prevention

```typescript
// backend-graphql/src/dataloaders/partLoader.ts
import DataLoader from "dataloader";

export const createPartLoader = (db) => {
  return new DataLoader(async (buildIds) => {
    const parts = await db.parts.findMany({
      where: { buildId: { in: buildIds } },
    });
    
    // Return array in same order as buildIds
    return buildIds.map(id =>
      parts.filter(p => p.buildId === id)
    );
  });
};
```

---

## Backend 2: Express.js Server (Files, Webhooks, Real-time)

**Purpose**: Handle file uploads, incoming webhooks, and real-time event streaming.

**Responsibilities**:
- File upload endpoint with storage (S3, local, etc.)
- Webhook handlers for external events (CI/CD, sensors)
- Server-Sent Events (SSE) for real-time notifications
- Optional: WebSocket for bidirectional real-time communication

### Endpoints

```
POST   /upload               # Upload test report, design file, etc.
POST   /webhooks/ci-results  # Receive test results from CI system
POST   /webhooks/sensor-data # Receive manufacturing sensor data
GET    /events               # Server-Sent Events stream (real-time)
GET    /health               # Health check
```

### File Upload Handler

```typescript
// backend-express/src/routes/upload.ts
import multer from "multer";
import { Router } from "express";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  const { file, body } = req;
  const { buildId } = body;
  
  try {
    // Store file metadata in shared database
    const fileRecord = await db.files.create({
      data: {
        buildId,
        originalName: file.originalname,
        storagePath: file.path,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
    
    // Optionally: notify Apollo backend or real-time subscribers
    eventBus.emit("file:uploaded", {
      buildId,
      fileId: fileRecord.id,
      fileName: file.originalname,
    });
    
    res.json({ fileId: fileRecord.id, url: `/files/${fileRecord.id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Webhook Handler

```typescript
// backend-express/src/routes/webhooks.ts
import { Router } from "express";

const router = Router();

router.post("/webhooks/ci-results", async (req, res) => {
  const { buildId, status, testResults } = req.body;
  
  try {
    // Validate webhook signature
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Update build status via Apollo backend (or direct DB)
    // Option 1: Call Apollo GraphQL mutation
    const response = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: updateBuildStatusMutation,
        variables: { id: buildId, status },
      }),
    });
    
    // Option 2: Emit to event bus for real-time subscribers
    eventBus.emit("build:test-completed", {
      buildId,
      status,
      testResults,
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Real-time Events (Server-Sent Events)

```typescript
// backend-express/src/routes/events.ts
import { Router } from "express";

const router = Router();

router.get("/events", (req, res) => {
  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
  
  // Listen to event bus
  const handlers = {
    "build:status-changed": (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    },
    "file:uploaded": (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    },
  };
  
  Object.entries(handlers).forEach(([event, handler]) => {
    eventBus.on(event, handler);
  });
  
  // Clean up on disconnect
  req.on("close", () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      eventBus.removeListener(event, handler);
    });
    res.end();
  });
});

export default router;
```

---

## Frontend Integration

### Querying Apollo GraphQL

```typescript
// frontend/components/BuildsList.tsx
import { useQuery } from "@apollo/client";
import { GET_BUILDS } from "@/lib/graphql/queries";

export function BuildsList() {
  const { data, loading, error } = useQuery(GET_BUILDS, {
    variables: { limit: 10, offset: 0 },
  });

  if (loading) return <div>Loading builds...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.builds.map(build => (
        <li key={build.id}>{build.name} - {build.status}</li>
      ))}
    </ul>
  );
}
```

### Uploading Files to Express

```typescript
// frontend/components/FileUploader.tsx
import { useState } from "react";

export function FileUploader({ buildId }) {
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
      const { fileId, url } = await res.json();
      console.log("File uploaded:", url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <input 
      type="file" 
      onChange={handleUpload} 
      disabled={loading}
    />
  );
}
```

### Listening to Real-time Events

```typescript
// frontend/components/RealtimeEvents.tsx
import { useEffect, useState } from "react";

export function RealtimeEvents({ buildId }) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:5000/events");
    
    eventSource.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.buildId === buildId) {
        setEvents(prev => [...prev, data]);
      }
    });

    return () => eventSource.close();
  }, [buildId]);

  return (
    <div>
      <h3>Real-time Events</h3>
      {events.map((event, i) => (
        <p key={i}>{event.type}: {event.status}</p>
      ))}
    </div>
  );
}
```

---

## Interview Preparation Checkpoints

### Checkpoint 1: Apollo GraphQL Mastery

- [ ] Design a GraphQL schema for the Boltline domain
- [ ] Implement resolvers with DataLoader to prevent N+1 queries
- [ ] Write a mutation that updates the database and emits an event
- [ ] Test resolvers with Vitest and mocked database

**Interview Talking Point**:
> "I separate concerns into two backends: Apollo handles data operations with type-safe GraphQL, while Express handles auxiliary functions like file uploads and webhooks. This lets both scale independently and keeps each layer focused."

---

### Checkpoint 2: Express + Real-time Events

- [ ] Create a file upload endpoint with validation
- [ ] Implement a webhook handler that processes external events
- [ ] Build a Server-Sent Events stream for real-time notifications
- [ ] Wire Express events to Apollo backend (via event bus or HTTP calls)

**Interview Talking Point**:
> "Using Server-Sent Events for real-time updates is simpler than WebSocket for one-directional streaming. When a CI webhook arrives, I emit an event that subscribers receive instantly—technicians see test results without polling."

---

### Checkpoint 3: Full-Stack Integration

- [ ] Build a complete flow: create build → upload test report → listen for real-time updates
- [ ] Write integration tests connecting frontend, Apollo, and Express
- [ ] Add error handling and retry logic across all layers
- [ ] Document the API contract (GraphQL schema + REST endpoints)

**Interview Talking Point**:
> "Both backends share authentication (JWT) and a common database, but operate independently. If the file upload is slow, GraphQL queries still respond quickly. This architecture mirrors production systems where different concerns scale at different rates."

---

## Communication Between Backends

### Option A: Event Bus (In-Memory, Single Process)

```typescript
// shared/eventBus.ts
import EventEmitter from "events";

const eventBus = new EventEmitter();

// Apollo emits when data changes
eventBus.emit("build:status-changed", { buildId, status });

// Express listens and streams to clients
eventBus.on("build:status-changed", (event) => {
  broadcast to SSE clients
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
  broadcast to SSE clients
});
```

**Pros**: Works across distributed services
**Cons**: Additional infrastructure (Redis)

### Option C: Direct HTTP Calls (Webhook-style)

```typescript
// Apollo resolver calls Express
await fetch("http://localhost:5000/api/build-status-changed", {
  method: "POST",
  body: JSON.stringify({ buildId, status }),
});
```

**Pros**: No shared infrastructure
**Cons**: Tight coupling, requires retry logic

---

## Testing Strategy

### Apollo Resolver Tests

```typescript
// backend-graphql/src/resolvers/__tests__/Query.test.ts
describe("Query.builds", () => {
  it("should return paginated builds", async () => {
    const resolvers = createResolvers({ db: mockDb });
    const result = await resolvers.Query.builds(null, { limit: 10, offset: 0 }, {
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
    const { getByText } = render(<BuildWorkflow />);
    // assertions...
  });
});
```

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

| Component              | Why                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| **Apollo GraphQL**     | Type-safe data API, prevents N+1 with DataLoader, scales easily        |
| **Express**            | Lightweight for auxiliary endpoints, familiar to most developers        |
| **PostgreSQL**         | ACID guarantees for manufacturing data, proven at enterprise scale     |
| **Server-Sent Events** | Real-time notifications with simpler infrastructure than WebSocket      |
| **JWT Auth**           | Stateless, works across multiple backends                              |
| **TypeScript**         | End-to-end type safety from database to UI                             |
| **Vitest**             | Lightning-fast tests, better DX than Jest                              |

---

## Resources

- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Express.js Guide](https://expressjs.com/)
- [DataLoader](https://github.com/graphql/dataloader)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
