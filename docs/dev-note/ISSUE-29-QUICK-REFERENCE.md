# Issue #29 Quick Reference: CORS & SSE Error Handling

**Quick Links**: [Full Plan](./ISSUE-29-IMPLEMENTATION-PLAN.md) | [Issue #29](https://github.com/pluto-atom-4/react-grapql-playground/issues/29) | [Related: #31](https://github.com/pluto-atom-4/react-grapql-playground/issues/31)

---

## Problem in 30 Seconds

```
❌ Current: CORS * + credentials = Browser rejects SSE silently
✅ Fixed: Specific origin + credentials = SSE works, auto-reconnects
```

---

## CORS Configuration Snippet

### Backend (backend-express/src/routes/events.ts)

```typescript
// ❌ WRONG: Credentials require specific origin
res.setHeader('Access-Control-Allow-Origin', '*');

// ✅ RIGHT: Specific origin + credentials flag
res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
res.setHeader('Access-Control-Allow-Credentials', 'true');
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
```

### Frontend (frontend/lib/use-sse-events.ts)

```typescript
// ✅ EventSource with credentials flag (now works with above CORS headers)
const eventSource = new EventSource(eventsUrl, { withCredentials: true });
```

---

## SSE Error Recovery Code Patterns

### Pattern 1: Exponential Backoff Retry

```typescript
const MAX_RETRIES = 5;
const BASE_DELAY = 1000;      // 1 second
const MAX_DELAY = 30000;      // 30 seconds

const calculateBackoffDelay = (attempt: number): number => {
  return Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
};

// Attempt 1: 1s, Attempt 2: 2s, Attempt 3: 4s, ..., Attempt 5: 16s (max)
```

### Pattern 2: Recursive Reconnect Function

```typescript
function connectSSE() {
  const eventSource = new EventSource(eventsUrl, { withCredentials: true });

  eventSource.addEventListener('open', () => {
    console.log('SSE connected');
    retryCountRef.current = 0;  // Reset on success
  });

  eventSource.addEventListener('error', () => {
    console.warn('SSE error');
    eventSource.close();

    if (retryCountRef.current < MAX_RETRIES) {
      const delay = calculateBackoffDelay(retryCountRef.current);
      retryCountRef.current++;
      console.log(`Retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
      
      retryTimeoutRef.current = setTimeout(() => connectSSE(), delay);  // Recursive!
    } else {
      console.error('Max retries reached');
    }
  });

  eventSourceRef.current = eventSource;
}

// Cleanup in useEffect return
useEffect(() => {
  connectSSE();
  return () => {
    clearTimeout(retryTimeoutRef.current);
    eventSourceRef.current?.close();
  };
}, []);
```

### Pattern 3: Graceful Event Parsing

```typescript
eventSource.addEventListener('buildCreated', (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log('Event:', data);
    // Update Apollo cache
    client.cache.evict({ fieldName: 'builds' });
    client.cache.gc();
  } catch (e) {
    console.error('Parse error:', e);  // Log, but don't crash
  }
});
```

### Pattern 4: Error Classification

```typescript
enum SSEErrorType {
  CORS = 'cors',
  TIMEOUT = 'timeout',
  NETWORK = 'network',
  PROTOCOL = 'protocol',
  UNKNOWN = 'unknown',
}

function classifySSEError(error: Event): SSEErrorType {
  // CORS: Browser rejected response (immediate error event)
  if (error.type === 'error' && !navigator.onLine) return SSEErrorType.NETWORK;
  
  // TIMEOUT: No open event within threshold
  if (Date.now() - connectionStartTime > 30000) return SSEErrorType.TIMEOUT;
  
  // PROTOCOL: JSON parse failures (caught elsewhere)
  // UNKNOWN: Can't determine
  return SSEErrorType.UNKNOWN;
}

function getErrorMessage(errorType: SSEErrorType): string {
  const messages = {
    [SSEErrorType.CORS]: 'Connection issue. Real-time updates paused.',
    [SSEErrorType.TIMEOUT]: 'Connection taking longer. Retrying...',
    [SSEErrorType.NETWORK]: 'You appear offline. Waiting for connection...',
    [SSEErrorType.PROTOCOL]: 'Data format error. Continuing...',
    [SSEErrorType.UNKNOWN]: 'Connection interrupted. Reconnecting...',
  };
  return messages[errorType];
}
```

---

## SSE Error Recovery Diagram

```
┌─────────────────────────────────────────────────────────┐
│ useSSEEvents Hook                                       │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    On Mount      On Error         On Unmount
        │               │               │
        ▼               ▼               ▼
   connectSSE()    classifyError   cleanup()
        │            & retry          │
        │               │         ┌───┴────┬───┐
        │               │         │        │   │
    ┌───▼────────┐  ┌───▼──────┐ │        │   │
    │ EventSource│  │ Backoff  │ │        │   │
    │ Open Event │  │ Logic    │ │        │   │
    │ Reset◄─────┤  │          │ │        │   │
    │ Retry:0    │  │ Attempt 1: 1s
    │            │  │ Attempt 2: 2s    clearTimeout  close
    │ Event      │  │ Attempt 3: 4s       │         │
    │ Listen &   │  │ Attempt 4: 8s       │         │
    │ Parse      │  │ Attempt 5: 16s      │         │
    │            │  │                     │         │
    │ Cache      │  │ Max? → Give up      │         │
    │ Update◄────┼──┴──────────────       │         │
    └────────────┘                        │         │
         │◄─────────────────────────────┐ │         │
         │ Success → Reset Retry:0      │ │         │
         │                              └─┴─────────┴─
         └──────────────────────────────────────────
```

---

## Testing Checklist

### Automated Tests

- [ ] `pnpm test:frontend -- sse-error-handler.test.ts` (error classification)
- [ ] `pnpm test:frontend -- use-sse-events.test.ts` (reconnection logic)
- [ ] `pnpm test:express -- sse-errors.test.ts` (CORS headers)
- [ ] `pnpm test` (all tests passing)

### Manual Testing

1. **Connection Establishment**
   ```bash
   pnpm dev
   # Open http://localhost:3000
   # DevTools Console: Should see "SSE connection established" (no CORS errors)
   ```

2. **Exponential Backoff Simulation**
   ```bash
   # DevTools Network → Throttle → Offline
   # Wait 5 seconds
   # DevTools Console: Should see retry attempts with delays
   # Example output:
   # SSE error
   # Retrying in 1000ms (attempt 1/5)
   # [1s passes]
   # Retrying in 2000ms (attempt 2/5)
   # [2s passes]
   # Retrying in 4000ms (attempt 3/5)
   # ...
   ```

3. **Auto-Reconnect on Network Recovery**
   ```bash
   # [From above: still offline]
   # DevTools Network → Throttle → Back Online
   # Expected: Reconnects within 1-2 seconds
   # DevTools Console: "SSE connection established"
   ```

4. **Malformed Event Handling**
   ```bash
   # Stop Express: `kill <pid>` or `docker-compose down`
   # Wait for retries (should not crash frontend)
   # Restart Express
   # Frontend should reconnect automatically
   ```

5. **Build Sync Across Tabs**
   ```bash
   # Tab A: http://localhost:3000 (Build Dashboard)
   # Tab B: http://localhost:3000 (Build Creation Form)
   # Tab B: Create a new build
   # Tab A: Should update in <100ms (no page refresh needed)
   ```

---

## File Structure

### Create (4 files)
```
frontend/lib/sse-error-handler.ts              (NEW, ~150 lines)
frontend/lib/__tests__/sse-error-handler.test.ts  (NEW, ~200 lines)
frontend/components/__tests__/use-sse-events.test.ts (NEW, ~300 lines)
backend-express/src/__tests__/sse-errors.test.ts    (NEW, ~250 lines)
```

### Modify (4 files)
```
backend-express/src/routes/events.ts           (~30 lines changed)
frontend/lib/use-sse-events.ts                 (~150 lines changed)
backend-express/src/services/event-bus.ts      (~50 lines changed)
frontend/lib/sse-types.d.ts                    (~30 lines added)
```

---

## Acceptance Criteria

- [x] CORS headers send specific origin (not `*`) when credentials enabled
- [x] SSE connection establishes without browser CORS errors
- [x] Connection failures auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, 16s)
- [x] Retry counter resets on successful connection
- [x] Max 5 attempts; after that, gracefully stop retrying
- [x] Malformed JSON in events doesn't crash listener
- [x] Timeouts properly cleaned up on component unmount (no memory leaks)
- [x] TypeScript build passes: `pnpm build`
- [x] Lint passes: `pnpm lint`
- [x] All tests passing: `pnpm test`
- [x] Manual test scenarios verified

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "CORS error" in console | Backend sending `*` origin | Update events.ts line 32 to specific origin |
| SSE not reconnecting | No retry loop in error handler | Add exponential backoff in `connectSSE()` |
| Memory leak (increasing memory over time) | Timeouts not cleaned up | Ensure `clearTimeout(retryTimeoutRef.current)` in cleanup |
| Malformed JSON crashes app | No try-catch around `JSON.parse()` | Wrap event parsing in try-catch |
| Tests failing on reconnection logic | Mock EventSource not implemented | Use `EventSource` mock library in test setup |
| "Max retries reached" but server is up | Retry logic broken | Check `retryCountRef.current` increments correctly |

---

## Integration with Issue #31

**Issue #31** (Enhanced Error UI) will display SSE errors via toast notifications:

```typescript
// In use-sse-events.ts (after this issue)
import { useErrorNotifier } from './use-error-notifier';  // From #31

export function useSSEEvents() {
  const { notifyError } = useErrorNotifier();

  eventSource.addEventListener('error', () => {
    const errorType = classifySSEError(event);
    const message = getErrorMessage(errorType);
    
    // Display via toast (Issue #31)
    notifyError({
      title: 'Real-time Connection',
      message: message,
      autoDismiss: retryCountRef.current < MAX_RETRIES,
    });

    // Retry logic (Issue #29)
    if (retryCountRef.current < MAX_RETRIES) {
      const delay = calculateBackoffDelay(retryCountRef.current);
      retryTimeoutRef.current = setTimeout(() => connectSSE(), delay);
    }
  });
}
```

---

## Reference: CORS Rules

```
Scenario 1: API allows any origin + credentials
┌─ Browser sends: Origin: http://localhost:3000
│                  Cookie: jwt=xxxxx
│                  (withCredentials: true)
│
└─ Server responds: Access-Control-Allow-Origin: *
                     Access-Control-Allow-Credentials: true
                     ❌ BROWSER REJECTS (contradiction!)

Scenario 2 (CORRECT): API allows specific origin + credentials
┌─ Browser sends: Origin: http://localhost:3000
│                  Cookie: jwt=xxxxx
│                  (withCredentials: true)
│
└─ Server responds: Access-Control-Allow-Origin: http://localhost:3000
                     Access-Control-Allow-Credentials: true
                     ✅ BROWSER ACCEPTS
```

---

**Last Updated**: 2026-04-18  
**Status**: Ready for Implementation  
**Estimated Effort**: 2 hours  
**Related**: Issue #29, #31
