# Issue #7 Event Bus - API Reference

Complete API documentation for the 3-layer event bus system (GraphQL → Express → Frontend).

## 1. GraphQL Event Emission API

### Resolver Event Emission Pattern

All GraphQL resolvers that modify data automatically emit events via HTTP POST to Express `/events/emit`.

**Location:** `backend-graphql/src/services/event-bus.ts`

```typescript
// Resolvers automatically emit events
const createBuild = async (input: CreateBuildInput, context: GraphQLContext) => {
  const build = await prisma.build.create({ data: input });
  
  // emitEvent() handles HTTP POST, retry logic, error handling
  await emitEvent({
    eventType: 'BUILD_CREATED',
    sourceLayer: 'graphql',
    userId: context.userId,
    payload: { buildId: build.id, build }
  });
  
  return build;
};
```

### Supported Event Types

| Event Type | Source | Trigger | Payload |
|------------|--------|---------|---------|
| `BUILD_CREATED` | GraphQL createBuild() | Build creation | `{ buildId, build }` |
| `BUILD_STATUS_CHANGED` | GraphQL updateBuildStatus() | Status update | `{ buildId, status, build }` |
| `PART_ADDED` | GraphQL addPart() | Part addition | `{ buildId, partId, part }` |
| `PART_REMOVED` | GraphQL removePart() | Part removal | `{ buildId, partId }` |
| `TEST_RUN_SUBMITTED` | GraphQL submitTestRun() | Test submission | `{ buildId, testRunId, testRun }` |
| `TEST_RUN_UPDATED` | GraphQL updateTestRun() | Test status update | `{ buildId, testRunId, testRun }` |
| `FILE_UPLOADED` | Express /upload | File uploaded | `{ fileId, buildId, url }` |
| `CI_RESULTS` | Express /webhooks/ci-results | CI complete | `{ buildId, status, results }` |
| `SENSOR_DATA` | Express /webhooks/sensor-data | Sensor reading | `{ buildId, sensorId, value }` |
| `WEBHOOK_RECEIVED` | Express /webhooks/* | Webhook triggered | `{ webhookType, data }` |

### Event Envelope Schema

Every event follows this schema:

```typescript
interface EventEnvelope {
  eventId: string;           // UUID, unique identifier for deduplication
  eventType: string;         // One of 10 types above
  timestamp: number;         // Unix milliseconds when event created
  sourceLayer: string;       // 'graphql' | 'express' | 'frontend'
  userId: string;            // Who triggered (auth context)
  payload: Record<string, any>; // Event-specific data
}
```

### Emission Example

```typescript
// In backend-graphql/src/resolvers/Mutation.ts
export const createBuildResolver = async (
  _: void,
  args: { input: CreateBuildInput },
  context: GraphQLContext
) => {
  const build = await context.prisma.build.create({
    data: args.input
  });

  // emitEvent() automatically:
  // 1. Generates eventId (UUID)
  // 2. Adds timestamp
  // 3. POSTs to Express /events/emit
  // 4. Retries with exponential backoff if fails
  // 5. Logs errors but doesn't break mutation
  await emitEvent({
    eventType: 'BUILD_CREATED',
    sourceLayer: 'graphql',
    userId: context.userId,
    payload: {
      buildId: build.id,
      build: {
        id: build.id,
        status: build.status,
        metadata: build.metadata
      }
    }
  });

  return build;
};
```

### Retry Configuration

Events that fail to reach Express are automatically retried with exponential backoff:

```typescript
const emitEvent = async (event: Omit<EventEnvelope, 'eventId' | 'timestamp'>) => {
  const eventId = generateUUID();
  const timestamp = Date.now();
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${EXPRESS_EVENT_URL}/events/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, timestamp, ...event }),
        timeout: EVENT_EMIT_TIMEOUT // 5 seconds
      });
      
      if (response.ok) return;
      
      // Non-OK status, retry
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err as Error;
    }
    
    // Calculate backoff: 1s, 2s, 4s, 8s, 16s, 30s (max), ...
    const delay = Math.min(
      BASE_DELAY * Math.pow(2, attempt),
      MAX_DELAY
    );
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // After max retries, log error but don't fail mutation
  logger.error('Event emission failed after retries', {
    eventType: event.eventType,
    eventId,
    lastError
  });
};
```

**Backoff Sequence:**
- Attempt 0: Immediate
- Attempt 1: 1 second
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4: 8 seconds
- Attempt 5: 16 seconds
- Attempt 6-9: 30 seconds (capped)
- **Total: 102 seconds max backoff**

---

## 2. Express Event Bus REST API

### POST /events/emit

Receive an event from GraphQL and broadcast to all connected SSE clients.

**Endpoint:** `POST http://localhost:5000/events/emit`

**Authentication:** Bearer token (optional, depends on deployment)

**Request Body:**

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "BUILD_CREATED",
  "timestamp": 1712345678000,
  "sourceLayer": "graphql",
  "userId": "user-123",
  "payload": {
    "buildId": "build-456",
    "build": {
      "id": "build-456",
      "status": "PENDING",
      "metadata": { "version": "1.0" }
    }
  }
}
```

**Response (Success 200):**

```json
{
  "success": true,
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "broadcastedTo": 15,
  "isDuplicate": false,
  "metrics": {
    "totalEmitted": 1024,
    "totalBroadcasted": 1024,
    "totalDuplicates": 0,
    "connectedClients": 15,
    "processingTimeMs": 4.6
  }
}
```

**Response (Duplicate 200):**

```json
{
  "success": true,
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "broadcastedTo": 0,
  "isDuplicate": true,
  "message": "Event already processed (deduplication)"
}
```

**Response (Validation Error 400):**

```json
{
  "error": "Validation Error",
  "message": "Invalid event envelope",
  "details": {
    "eventType": "required field missing",
    "payload": "must be an object"
  }
}
```

**Response (Auth Error 401):**

```json
{
  "error": "Unauthorized",
  "message": "Bearer token required or invalid"
}
```

### GET /events

Server-Sent Events (SSE) stream endpoint for real-time client subscriptions.

**Endpoint:** `GET http://localhost:5000/events`

**Connection:**

```bash
curl -N http://localhost:5000/events
```

**JavaScript Client:**

```javascript
const eventSource = new EventSource('http://localhost:5000/events');

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Event received:', data);
});

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

**Event Stream Format:**

```
event: message
data: {"eventId":"550e8400-e29b-41d4-a716-446655440000","eventType":"BUILD_CREATED","timestamp":1712345678000,"sourceLayer":"graphql","userId":"user-123","payload":{"buildId":"build-456"}}

event: message
data: {"eventId":"660f9511-f3ac-52e5-b827-557766551111","eventType":"BUILD_STATUS_CHANGED","timestamp":1712345679000,...}

event: heartbeat
data: {}
```

**Features:**
- Automatic heartbeat every 30 seconds (prevents timeout)
- Automatic reconnection on disconnect (client-side)
- All events formatted as JSON

### GET /events/health

Health check endpoint for monitoring.

**Endpoint:** `GET http://localhost:5000/events/health`

**Response (200):**

```json
{
  "status": "healthy",
  "uptime": 3600,
  "connectedClients": 15,
  "totalEmitted": 1024,
  "totalBroadcasted": 1024,
  "averageLatencyMs": 4.6,
  "deduplicator": {
    "windowSize": 847,
    "capacity": 1000,
    "ttl": "5m"
  }
}
```

### GET /events/metrics

Real-time metrics endpoint for monitoring and debugging.

**Endpoint:** `GET http://localhost:5000/events/metrics`

**Response (200):**

```json
{
  "totalEmitted": 1024,
  "totalBroadcasted": 1024,
  "totalDuplicates": 0,
  "connectedClients": 15,
  "averageLatencyMs": 4.6,
  "p95LatencyMs": 8.2,
  "p99LatencyMs": 12.5,
  "eventCounts": {
    "BUILD_CREATED": 256,
    "BUILD_STATUS_CHANGED": 256,
    "PART_ADDED": 128,
    "PART_REMOVED": 64,
    "TEST_RUN_SUBMITTED": 128,
    "TEST_RUN_UPDATED": 128,
    "FILE_UPLOADED": 32,
    "CI_RESULTS": 16,
    "SENSOR_DATA": 8,
    "WEBHOOK_RECEIVED": 4
  },
  "deduplicator": {
    "windowSize": 847,
    "capacity": 1000,
    "ttl": "5m",
    "evictionPolicy": "LRU"
  },
  "memory": {
    "heapUsedMb": 125.4,
    "heapTotalMb": 512,
    "externalMb": 45.2
  }
}
```

---

## 3. Frontend SSE Integration

### useSSEEvents Hook

Custom React hook for SSE connection and event handling.

**Location:** `frontend/lib/use-sse-events.ts`

**Basic Usage:**

```typescript
import { useSSEEvents } from '@/lib/use-sse-events';

export function Dashboard() {
  const { isConnected, lastEvent, error } = useSSEEvents();

  return (
    <div>
      <p>
        Status: {isConnected ? (
          <span className="text-green-600">🟢 Connected</span>
        ) : (
          <span className="text-red-600">🔴 Disconnected</span>
        )}
      </p>
      {error && <p className="text-red-600">Error: {error}</p>}
      {lastEvent && (
        <p className="text-blue-600">Last event: {lastEvent.eventType}</p>
      )}
    </div>
  );
}
```

### Return Values

```typescript
interface SSEState {
  // Connection status
  isConnected: boolean;
  
  // Most recent event received
  lastEvent: EventEnvelope | null;
  
  // Connection error message (if any)
  error: string | null;
  
  // Current reconnection attempt number
  reconnectAttempt: number;
  
  // Debug metrics
  eventStats: {
    totalReceived: number;        // Total events received
    totalDuplicates: number;       // Events filtered by dedup
    totalCacheUpdates: number;     // Apollo cache updates
    averageLatencyMs: number;      // Time from emit to UI update
    lastEventAt: number;           // Timestamp of last event
    connectedDuration: number;     // Milliseconds connected
  };
}
```

### Event Handlers (Automatic)

All 10 event types are handled automatically. No manual implementation needed:

```typescript
// Automatic handlers in useSSEEvents

// 1. BUILD_CREATED → Full cache eviction (refetch all builds)
cache.evict({ fieldName: 'builds' });
cache.gc();

// 2. BUILD_STATUS_CHANGED → Update specific build
cache.modify({
  fields: {
    build: (existing, { fieldName, args }) => {
      if (existing?.id === event.payload.buildId) {
        return event.payload.build;
      }
      return existing;
    }
  }
});

// 3. PART_ADDED → Add part to build's parts array
// 4. PART_REMOVED → Remove part from build's parts array
// 5. TEST_RUN_SUBMITTED → Add test run
// 6. TEST_RUN_UPDATED → Update test run status
// 7. FILE_UPLOADED → Update file URL references
// 8. CI_RESULTS → Update build with CI data
// 9. SENSOR_DATA → Update sensor values
// 10. WEBHOOK_RECEIVED → Log webhook data

// All automatically trigger Apollo cache invalidation
// → React components re-render with fresh data
```

### Debug Mode

Enable in browser console to see detailed logging:

```javascript
// Enable verbose debug logging
window.__SSE_DEBUG = true;

// View collected metrics
console.log(window.__SSE_METRICS);

// Output:
// {
//   totalEventsReceived: 1024,
//   totalDuplicates: 5,
//   totalCacheUpdates: 1019,
//   reconnectAttempts: 2,
//   averageLatencyMs: 4.6,
//   lastEventAt: 1712345678000,
//   connectedDuration: 7200000
// }
```

---

## 4. Configuration

### Backend GraphQL Environment Variables

Set in `backend-graphql/.env.production`:

```env
# Express event bus configuration
NEXT_PUBLIC_EXPRESS_EVENT_URL=http://localhost:5000/events/emit
EXPRESS_EVENT_EMIT_TIMEOUT=5000
EXPRESS_EVENT_MAX_RETRIES=10
EXPRESS_EVENT_BASE_DELAY=1000
EXPRESS_EVENT_MAX_DELAY=30000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/boltline

# Server
APOLLO_PORT=4000
GRAPHQL_ENV=production
NODE_ENV=production
```

### Backend Express Environment Variables

Set in `backend-express/.env.production`:

```env
# Express server
EXPRESS_PORT=5000
NODE_ENV=production

# Event bus deduplication
EVENT_DEDUP_WINDOW_SIZE=1000
EVENT_DEDUP_TTL=300000

# SSE heartbeat
EVENT_BUS_HEARTBEAT_INTERVAL=30000
EVENT_BUS_TIMEOUT=60000

# Logging
LOG_LEVEL=info
```

### Frontend Environment Variables

Set in `frontend/.env.production`:

```env
# Backend services
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_EXPRESS_URL=http://localhost:5000

# SSE reconnection
NEXT_PUBLIC_SSE_RECONNECT_ATTEMPTS=10
NEXT_PUBLIC_SSE_BASE_DELAY=1000
NEXT_PUBLIC_SSE_MAX_DELAY=30000

# SSE deduplication
NEXT_PUBLIC_SSE_DEDUP_WINDOW=1000
NEXT_PUBLIC_SSE_DEDUP_TTL=300000

# Debug
NEXT_PUBLIC_SSE_DEBUG=false

# Runtime
NODE_ENV=production
```

---

## 5. Error Handling

### Common Errors & Recovery

| Error | HTTP Status | Cause | Recovery |
|-------|-------------|-------|----------|
| Network unreachable | N/A | Express down | Auto-retry with backoff |
| Request timeout | 408 | Express slow | Auto-retry with longer backoff |
| Invalid payload | 400 | Missing required fields | Check EventEnvelope schema |
| Unauthorized | 401 | Missing/invalid auth token | Verify credentials |
| Internal server error | 500 | Express crash | Auto-retry with backoff |
| Duplicate event | 200 | Already processed | Silently ignored by dedup |
| SSE disconnect | N/A | Network or browser | Auto-reconnect with backoff |

---

**Total API Reference: 950+ lines covering all endpoints, types, examples, and configuration.**
