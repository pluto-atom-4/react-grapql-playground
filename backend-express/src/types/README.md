# Event Type Definitions

This directory contains the TypeScript type definitions for the Cross-Layer Event Bus (Issue #7).

## Overview

The event bus enables real-time communication across three layers:

```
GraphQL Resolver (emit)
    ↓
Express Event Bus (relay/deduplicate)
    ↓
Frontend SSE Listener (receive/cache)
```

All events flow through a standardized schema defined in `events.ts`, ensuring type safety and consistency across the system.

## Files

- **events.ts** - Source of truth for all event type definitions
  - EventEnvelope: Base structure for all events
  - 10 domain event types (Build, Part, TestRun, files, webhooks, sensors)
  - Type guards for runtime narrowing
  - Helper functions for event creation

## Event Types

| Event | Source | Purpose |
|-------|--------|---------|
| `buildCreated` | GraphQL: createBuild() | New Build created |
| `buildStatusChanged` | GraphQL: updateBuildStatus() | Build status updated |
| `partAdded` | GraphQL: addPart() | Part added to Build |
| `partRemoved` | GraphQL: removePart() | Part removed from Build |
| `testRunSubmitted` | GraphQL: submitTestRun() | New TestRun created |
| `testRunUpdated` | GraphQL: updateTestRun() | TestRun results updated |
| `fileUploaded` | Express: POST /upload | File uploaded to storage |
| `webhook` | Express: /webhooks/* | Generic webhook from external system |
| `ciResults` | Express: /webhooks/ci | CI/CD test results |
| `sensorData` | Express: /webhooks/sensors | Manufacturing sensor reading |

## Architecture

### Event Structure

Every event has:

```typescript
{
  eventId: UUID,           // For deduplication across layers
  eventType: string,       // 'buildCreated', 'fileUploaded', etc.
  timestamp: number,       // Unix milliseconds
  sourceLayer: string,     // 'graphql' | 'express' | 'webhook'
  userId?: string,         // Optional user context
  metadata?: Record<>      // Optional custom data
  // ... + type-specific fields
}
```

### Data Flow

1. **GraphQL Mutation** → Calls `emitEvent()` with typed payload
2. **HTTP POST to Express** → `/events/emit` with Authorization header
3. **Express EventBus** → Deduplicates by eventId, broadcasts to SSE clients
4. **Frontend SSE Listener** → Receives event, updates Apollo cache
5. **UI Re-render** → React component reflects new data

### Deduplication Strategy (Phase B)

The `eventId` field enables three-layer deduplication:

- **Layer 1 (GraphQL→Express)**: If network fails and mutation retries, same eventId sent
- **Layer 2 (Express→Frontend)**: If SSE drops and reconnects, dedup window prevents duplicate broadcasts
- **Layer 3 (Frontend)**: Apollo cache prevents duplicate mutations

Dedup window is 5 minutes (300,000ms) by default. Configurable via `EVENT_DEDUP_TTL_MS`.

## Usage Examples

### Emit Event from GraphQL Resolver

```typescript
import { emitEvent } from '../../services/event-bus';
import { BuildCreatedPayload } from '../types/events';

// In createBuild resolver:
export async function createBuild(_, { name, description }, context) {
  const build = await context.prisma.build.create({
    data: { name, description, status: 'PENDING' }
  });

  // Emit event with full type safety
  const payload: BuildCreatedPayload = {
    buildId: build.id,
    build: {
      id: build.id,
      name: build.name,
      description: build.description,
      status: build.status,
      createdAt: build.createdAt.toISOString(),
    },
    eventId: generateId(), // UUID
    eventType: 'buildCreated',
    timestamp: Date.now(),
    sourceLayer: 'graphql',
    userId: context.user?.id,
  };

  await emitEvent('buildCreated', payload);
  return build;
}
```

### Type Guard in Frontend Listener

```typescript
import { EventPayload, isBuildCreatedEvent } from '@backend-express/types/events';

const eventSource = new EventSource('http://localhost:5000/events');

eventSource.addEventListener('message', (e) => {
  const event: EventPayload = JSON.parse(e.data);

  // Type narrowing with guard function
  if (isBuildCreatedEvent(event)) {
    console.log(`Build created: ${event.build.name}`);
    // TypeScript now knows event.build is defined
  }

  if (isBuildStatusChangedEvent(event)) {
    console.log(`Status: ${event.oldStatus} → ${event.newStatus}`);
  }
});
```

### Update Apollo Cache from Event

```typescript
import { EventPayload, isBuildStatusChangedEvent } from '@backend-express/types/events';

useEffect(() => {
  const eventSource = new EventSource('http://localhost:5000/events');

  eventSource.addEventListener('message', (e) => {
    const event: EventPayload = JSON.parse(e.data);

    if (isBuildStatusChangedEvent(event)) {
      // Update Apollo cache for this build
      client.cache.modify({
        fields: {
          builds: (existing) =>
            existing.map((build) =>
              build.id === event.buildId
                ? { ...build, status: event.newStatus }
                : build
            ),
        },
      });
    }
  });

  return () => eventSource.close();
}, [client]);
```

## Configuration

Environment variables for event bus behavior:

**backend-graphql/.env:**
```
EXPRESS_EVENT_URL=http://localhost:5000/events/emit
EXPRESS_EVENT_SECRET=dev-event-secret-change-in-production
EVENT_EMIT_TIMEOUT_MS=5000
EVENT_EMIT_MAX_RETRIES=3
```

**backend-express/.env:**
```
EXPRESS_EVENT_SECRET=dev-event-secret-change-in-production
EVENT_DEDUP_WINDOW_SIZE=1000
EVENT_DEDUP_TTL_MS=300000
HEARTBEAT_INTERVAL_MS=30000
CONNECTION_TIMEOUT_MS=120000
```

**frontend/.env.local:**
```
NEXT_PUBLIC_SSE_RECONNECT_MAX_ATTEMPTS=10
NEXT_PUBLIC_SSE_BASE_RETRY_DELAY_MS=1000
```

## Security Considerations

1. **Event Signing**: All GraphQL→Express events use shared secret in Authorization header
2. **Event Validation**: Express validates eventType against whitelist
3. **Deduplication**: Prevents replay attacks via eventId + timestamp
4. **User Context**: Optional userId field for audit trail
5. **Rate Limiting**: Express applies rate limits to /events/emit endpoint (Phase C)

## Implementation Phases

- **Phase A (Design)** ✅ Type definitions and schema
- **Phase B (Deduplication)** - Add eventId-based dedup in Express
- **Phase C (Retry Logic)** - Add retry in GraphQL emitter
- **Phase D (Frontend Sync)** - Add Apollo cache invalidation helpers
- **Phase E (Integration Tests)** - End-to-end tests
- **Phase F (Documentation)** - API docs and troubleshooting

## Next Steps

After Phase A is complete:

1. Use these types in GraphQL resolvers (all emitEvent() calls)
2. Import types in Express event handler for validation
3. Share types with frontend via package exports
4. Implement deduplication logic in Phase B

---

See `DESIGN.md` in project root for architectural overview.
See `backend-graphql/src/services/event-bus.ts` for current emit implementation.
See `backend-express/src/services/event-bus.ts` for current broadcast implementation.
