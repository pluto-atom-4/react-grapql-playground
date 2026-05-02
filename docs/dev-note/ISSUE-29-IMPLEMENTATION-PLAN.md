# Issue #29 Implementation Plan: CORS & SSE Error Handling

**Status**: Planning Phase  
**Target Issue**: #29 - Fix CORS & SSE Error Handling  
**Effort**: 2 hours  
**Phase**: Phase 2 (Error Handling - Independent of #31)  
**Blocked By**: #23 (Apollo singleton), #24 (Real-time event bus)  
**Blocks**: None  

---

## Problem Statement

Currently, the application has critical gaps in SSE (Server-Sent Events) reliability:

### Current Issues

1. **CORS Conflict**
   - Frontend sends `withCredentials: true` (requires cookies for auth)
   - Backend sends `Access-Control-Allow-Origin: *` (conflicts with credentials)
   - Browser rejects response with CORS error
   - User experiences silent failure—no reconnection, no error message

2. **Silent Failures**
   - SSE connection closes on error
   - No automatic reconnection mechanism
   - No user feedback (errors swallowed)
   - App appears "frozen" from user perspective

3. **No Graceful Degradation**
   - Connection errors crash the hook or worse—fail silently
   - Malformed JSON in event payloads can break listeners
   - No fallback behavior if SSE unavailable

4. **Browser Console Noise**
   - Raw network errors logged without context
   - No structured error tracking
   - Difficult to debug in production

### Real-World Impact

- Technician creates build in manufacturing app
- Network hiccup causes SSE to disconnect
- App shows stale data (no real-time updates)
- Technician doesn't know why—no visual indication
- Technician refreshes page (poor UX)

---

## Proposed Solution Architecture

### Layer 1: Backend CORS Configuration
- **Fix**: Use specific origin instead of `*` when credentials are enabled
- **Location**: `backend-express/src/routes/events.ts`
- **Headers**: 
  - `Access-Control-Allow-Origin: http://localhost:3000`
  - `Access-Control-Allow-Credentials: true`
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`

### Layer 2: Frontend SSE Error Handling
- **Create**: Centralized error handler module
- **Location**: `frontend/lib/sse-error-handler.ts`
- **Features**:
  - Classify error types (CORS, timeout, network, protocol)
  - Generate user-friendly error messages
  - Emit error events to central notifier
  - Log structured errors for debugging

### Layer 3: Automatic Reconnection with Exponential Backoff
- **Update**: `frontend/lib/use-sse-events.ts`
- **Features**:
  - Exponential backoff retry logic (1s, 2s, 4s, 8s, 16s, max 30s)
  - Max 5 retry attempts
  - Reset counter on successful connection
  - Clean up timeouts on component unmount

### Layer 4: Event Bus Error Emission
- **Update**: `backend-express/src/services/event-bus.ts`
- **Features**:
  - Log connection errors with timestamp and client ID
  - Emit `sse-error` events for frontend consumption
  - Track error metrics (connection failures, latency)

### Layer 5: Error Notification Integration
- **Integration**: With Issue #31 (Enhanced Error UI)
- **Pattern**: Toast notifications for CORS/SSE errors
- **Not blocking**: #29 works independently; #31 enhances UI

---

## Implementation Todos

### Phase A: Backend CORS Fix (1 file, ~15 min)

**Todo 1: Fix CORS Headers in Events Route**
- **File**: `backend-express/src/routes/events.ts`
- **Change**: Update line 32 to use specific origin instead of `*`
- **Acceptance**: SSE connection succeeds with `withCredentials: true`
- **Depends On**: None
- **Blocks**: Todo 2, 3

### Phase B: Frontend Error Handler (1 new file, ~30 min)

**Todo 2: Create SSE Error Handler Module**
- **File**: `frontend/lib/sse-error-handler.ts` (NEW)
- **Exports**: 
  - `classifySSEError()` - Detect error type (CORS, timeout, connection, protocol)
  - `getErrorMessage()` - Generate user-friendly message
  - `SSEErrorType` enum - Error classification
  - `SSEErrorHandler` class - Centralized error handling
- **Features**:
  - Detect CORS errors from `event.type === 'error'` + network context
  - Classify timeouts vs network failures
  - Suppress redundant console errors
  - Emit app-level error events
- **Depends On**: None
- **Blocks**: Todo 4, 5

**Todo 3: Add Error Types**
- **File**: `frontend/lib/sse-types.d.ts` (UPDATE)
- **Add**: 
  - `SSEErrorType` enum (CORS, TIMEOUT, NETWORK, PROTOCOL, UNKNOWN)
  - `SSEErrorEvent` interface
- **Depends On**: Todo 2
- **Blocks**: Testing

### Phase C: Frontend Reconnection Logic (1 file, ~45 min)

**Todo 4: Implement Exponential Backoff Reconnection**
- **File**: `frontend/lib/use-sse-events.ts` (UPDATE)
- **Changes**:
  - Add retry state: `retryCountRef`, `retryTimeoutRef`
  - Refactor into `connectSSE()` function (allows recursive retry)
  - Add `open` event listener to reset retry counter
  - Update `error` event listener with backoff logic
  - Calculate backoff delay: `min(baseDelay * 2^attempt, maxDelay)`
  - Clean up timeouts on unmount
- **Config**: Use env vars for max attempts, base delay, max delay
- **Depends On**: Todo 1, 2
- **Blocks**: Todo 5, Testing

**Todo 5: Add Graceful Degradation**
- **File**: `frontend/lib/use-sse-events.ts` (UPDATE)
- **Changes**:
  - Wrap event parsing in try-catch (malformed JSON doesn't crash)
  - Log parse errors without throwing
  - Emit fallback cache invalidation on parser failure
  - Add recovery state for browser offline detection
- **Depends On**: Todo 4
- **Blocks**: Testing

### Phase D: Backend Error Tracking (1 file, ~20 min)

**Todo 6: Add Error Emission to Event Bus**
- **File**: `backend-express/src/services/event-bus.ts` (UPDATE)
- **Changes**:
  - Add `onError()` callback when SSE connection fails
  - Log error with context: clientId, timestamp, errorType
  - Emit error event back to frontend if possible
  - Track metrics: total errors, error types, recovery count
- **Depends On**: Todo 1
- **Blocks**: Todo 7, Testing

**Todo 7: Update Events Route Error Handling**
- **File**: `backend-express/src/routes/events.ts` (UPDATE)
- **Changes**:
  - Add try-catch around event broadcasting
  - Log connection drops with structured context
  - Emit `sse-error` event on client disconnect
  - Clean up disconnected clients properly
- **Depends On**: Todo 6
- **Blocks**: Testing

### Phase E: Testing (2-3 files, ~30 min)

**Todo 8: Create SSE Error Handler Tests**
- **File**: `frontend/lib/__tests__/sse-error-handler.test.ts` (NEW)
- **Tests**:
  - `classifySSEError()` detects all error types
  - `getErrorMessage()` returns sensible messages
  - Error handler doesn't throw on edge cases
  - Error events are emitted correctly
- **Depends On**: Todo 2
- **Blocks**: None

**Todo 9: Create SSE Integration Tests**
- **File**: `frontend/components/__tests__/use-sse-events.test.ts` (NEW)
- **Tests**:
  - Hook establishes connection without errors
  - Exponential backoff delay calculation is correct
  - Retry counter resets on successful connection
  - Timeouts are cleaned up on unmount
  - Malformed JSON doesn't crash listener
  - `withCredentials: true` is passed to EventSource
- **Setup**: Mock EventSource, simulate error/open events
- **Depends On**: Todo 4, 5
- **Blocks**: None

**Todo 10: Create Backend Error Tests**
- **File**: `backend-express/src/__tests__/sse-errors.test.ts` (NEW)
- **Tests**:
  - CORS headers are set correctly for credentials
  - Origin is specific, not `*`
  - Connection errors are logged
  - Metrics are tracked on errors
  - Disconnected clients are cleaned up
- **Setup**: Mock request/response, test route handlers
- **Depends On**: Todo 6, 7
- **Blocks**: None

### Phase F: Validation & Integration (Final checks, ~15 min)

**Todo 11: Validation**
- **Run**: `pnpm build` (TypeScript type check passes)
- **Run**: `pnpm lint` (ESLint checks pass)
- **Run**: `pnpm test` (all tests passing)
- **Depends On**: Todo 8, 9, 10
- **Blocks**: PR

**Todo 12: Manual Testing**
- **Scenario 1**: Network offline → DevTools Throttle Offline → Wait 5s → See retry logs → Throttle back online → Reconnects
- **Scenario 2**: Start app → Open DevTools → See "SSE connection established" → No CORS errors
- **Scenario 3**: Kill Express server → Frontend logs reconnection attempts → Waits with exponential backoff → Server restart → Reconnects
- **Scenario 4**: Malformed event payload → See parse error logged → Cache still updates for valid events
- **Depends On**: Todo 11
- **Blocks**: PR

---

## Error Handling Strategy

### Frontend Error Classification

```typescript
enum SSEErrorType {
  CORS = 'cors',                    // 403, headers mismatch
  TIMEOUT = 'timeout',              // Connection timeout (>30s)
  NETWORK = 'network',              // Network unreachable, DNS fail
  PROTOCOL = 'protocol',            // Invalid event format
  UNKNOWN = 'unknown',              // Unclassified error
}
```

### Error Detection Logic

| Error Signal | Classification | User Message |
|---|---|---|
| `error` event immediately after open attempt | CORS | "Connection issue. Retrying..." |
| No `open` event for 30s | TIMEOUT | "Connection taking longer. Retrying..." |
| Browser offline (navigator.onLine = false) | NETWORK | "You're offline. Waiting for connection..." |
| JSON.parse throws | PROTOCOL | "Data format error. Continuing..." |
| 5+ retries exhausted | NETWORK | "Connection failed. Please refresh." |

### User-Facing Messages (Structured for Toast Notifications)

```typescript
interface SSEErrorNotification {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: 'retry' | 'refresh' | 'dismiss';
  duration?: number;  // ms, auto-close
}

// Examples:
{
  type: 'warning',
  title: 'Connection Issue',
  message: 'Real-time updates paused. Attempting reconnection...',
  action: 'dismiss',
  duration: 5000
}

{
  type: 'error',
  title: 'Connection Failed',
  message: 'Unable to establish real-time connection. Please refresh the page.',
  action: 'refresh',
  duration: null  // Persist until dismissed
}
```

### Browser Console Logging Strategy

```typescript
// Development: Verbose logging
if (process.env.NODE_ENV === 'development') {
  console.debug('SSE: Connecting to', eventsUrl);
  console.debug('SSE: Attempt', retryCount, 'of', maxAttempts);
  console.debug('SSE: Next retry in', delayMs, 'ms');
}

// Errors: Always logged (structured for debugging)
console.warn('SSE: Connection error', {
  errorType: 'CORS',
  timestamp: new Date().toISOString(),
  retryCount: 2,
  nextRetryDelayMs: 4000,
});

// Success: Minimal logging
console.log('SSE: Connection established');
```

### Integration with Issue #31 (Toast Notifications)

```typescript
// In use-sse-events.ts
import { useErrorNotifier } from './use-error-notifier';  // From Issue #31

export function useSSEEvents() {
  const { notifyError, notifyWarning } = useErrorNotifier();

  // On CORS error:
  notifyError({
    title: 'Connection Issue',
    message: 'Real-time updates are paused. Reconnecting...',
    autoDismiss: true,
  });

  // On too many retries:
  notifyError({
    title: 'Connection Failed',
    message: 'Unable to connect to real-time service. Please refresh.',
    action: 'refresh',
  });
}
```

---

## CORS Configuration Changes

### Backend Express (backend-express/src/routes/events.ts)

**Current**:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*')  // ❌ Conflicts with credentials
```

**Fixed**:
```typescript
res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000')
res.setHeader('Access-Control-Allow-Credentials', 'true')
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')
```

### CORS Validation Rules

✅ **Valid Combinations**:
```
origin: http://localhost:3000
credentials: true
→ Response: Access-Control-Allow-Origin: http://localhost:3000
  Response: Access-Control-Allow-Credentials: true
  Result: ✅ Accepted by browser
```

❌ **Invalid Combinations**:
```
origin: http://localhost:3000
credentials: true
→ Response: Access-Control-Allow-Origin: *
  Result: ❌ Rejected (credentials require specific origin)
```

---

## SSE Error Recovery Logic

### Exponential Backoff Calculation

```typescript
const calculateBackoffDelay = (attempt: number, config: ReconnectConfig): number => {
  return Math.min(
    config.baseDelayMs * Math.pow(2, attempt),
    config.maxDelayMs
  );
};

// Example with default config (1s base, 30s max):
// Attempt 0: min(1000 × 2^0, 30000) = 1000ms = 1s
// Attempt 1: min(1000 × 2^1, 30000) = 2000ms = 2s
// Attempt 2: min(1000 × 2^2, 30000) = 4000ms = 4s
// Attempt 3: min(1000 × 2^3, 30000) = 8000ms = 8s
// Attempt 4: min(1000 × 2^4, 30000) = 16000ms = 16s
// Max Attempts: 5 (after 5th failure, stop retrying)
```

### Retry State Machine

```
[Connecting] → (success) → [Connected]
     ↓                           ↓
[Open Event] ← ← ← ← ← ← ← ← ← ← 
     ↓
[Reset Retry Counter to 0]

[Connected] → (network error) → [Error Event]
                                    ↓
                          [Retry Count < Max?]
                          ↙              ↘
                        YES              NO
                         ↓                ↓
                    [Backoff]      [Stop Retrying]
                         ↓                ↓
                    [setTimeout]   [Notify User]
                         ↓
                   [reconnect()]
```

### Connection Cleanup

```typescript
useEffect(() => {
  connectSSE();

  return () => {
    // Clean up retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    // Close EventSource gracefully
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };
}, []);
```

---

## Testing Strategy

### Unit Tests (sse-error-handler.test.ts)

```typescript
describe('SSE Error Handler', () => {
  describe('classifySSEError()', () => {
    it('detects CORS errors from event immediately after open attempt');
    it('detects TIMEOUT errors when no open event arrives');
    it('detects NETWORK errors from navigator.onLine');
    it('detects PROTOCOL errors from JSON.parse failures');
    it('returns UNKNOWN for unclassified errors');
  });

  describe('getErrorMessage()', () => {
    it('returns user-friendly message for CORS error');
    it('returns user-friendly message for TIMEOUT error');
    it('returns user-friendly message for NETWORK error');
    it('returns user-friendly message for PROTOCOL error');
  });

  describe('error edge cases', () => {
    it('does not throw on undefined error object');
    it('does not throw on null payload');
    it('handles malformed error metadata gracefully');
  });
});
```

### Integration Tests (use-sse-events.test.ts)

```typescript
describe('useSSEEvents Hook', () => {
  describe('connection lifecycle', () => {
    it('establishes connection on mount');
    it('sets withCredentials: true');
    it('resets retry counter on open event');
    it('closes connection on unmount');
  });

  describe('exponential backoff reconnection', () => {
    it('retries after 1s on first error');
    it('retries after 2s on second error');
    it('retries after 4s on third error');
    it('caps retry delay at 30s');
    it('stops after 5 failed attempts');
  });

  describe('event parsing', () => {
    it('updates cache on valid event');
    it('logs error on malformed JSON');
    it('continues processing after parse error');
    it('deduplicates events by eventId');
  });

  describe('cleanup', () => {
    it('clears pending retry timeouts on unmount');
    it('closes EventSource on unmount');
    it('prevents memory leaks from dangling timeouts');
  });
});
```

### Backend Tests (sse-errors.test.ts)

```typescript
describe('SSE CORS & Error Handling', () => {
  describe('CORS headers', () => {
    it('sets Access-Control-Allow-Credentials: true');
    it('sets specific origin, not *');
    it('sets Content-Type: text/event-stream');
    it('sets Cache-Control: no-cache');
    it('sets Connection: keep-alive');
  });

  describe('error handling', () => {
    it('logs connection errors with metadata');
    it('emits error event to connected clients');
    it('cleans up disconnected clients');
    it('tracks error metrics');
  });

  describe('edge cases', () => {
    it('handles client abrupt disconnect');
    it('handles write errors to response');
    it('cleans up resources on error');
  });
});
```

### Manual Testing Checklist

- [ ] Start all services: `pnpm dev`
- [ ] Open frontend: http://localhost:3000
- [ ] DevTools → Console: Should see "SSE connection established" (no CORS errors)
- [ ] DevTools → Network → Filter "events": Should see EventSource connection
- [ ] Network → Throttle → Offline: Wait 5 seconds
- [ ] Console: Should see retry attempts with increasing delays (1s, 2s, 4s, 8s, 16s)
- [ ] Network → Throttle → Back Online: Should reconnect within 1-2 seconds
- [ ] Create build mutation: Should see real-time update in other tab without refresh
- [ ] Stop Express server: Frontend should log reconnection attempts
- [ ] Restart Express: Frontend should reconnect automatically
- [ ] Trigger malformed event: Should log error, not crash
- [ ] Run `pnpm build`: No TypeScript errors
- [ ] Run `pnpm lint`: No ESLint errors
- [ ] Run `pnpm test`: All tests passing

---

## File List

### Files to Create

1. **frontend/lib/sse-error-handler.ts** (NEW)
   - Centralized error classification and handling
   - Error type detection, message generation
   - Error event emission
   - ~150 lines

2. **frontend/lib/__tests__/sse-error-handler.test.ts** (NEW)
   - Unit tests for error handler
   - ~200 lines

3. **frontend/components/__tests__/use-sse-events.test.ts** (NEW, if not exists)
   - Integration tests for SSE hook
   - ~300 lines

4. **backend-express/src/__tests__/sse-errors.test.ts** (NEW)
   - Backend CORS and error handling tests
   - ~250 lines

### Files to Modify

1. **backend-express/src/routes/events.ts**
   - Update CORS headers (lines ~32)
   - Add error event emission
   - Add structured error logging
   - ~30 lines of changes

2. **frontend/lib/use-sse-events.ts**
   - Refactor into `connectSSE()` function for recursion
   - Add retry state (ref variables)
   - Add error event listener with backoff
   - Add open event listener to reset retry counter
   - Add try-catch around event parsing
   - ~150 lines of changes

3. **backend-express/src/services/event-bus.ts**
   - Add error tracking
   - Add error metrics
   - ~50 lines of changes

4. **frontend/lib/sse-types.d.ts** (if exists)
   - Add SSEErrorType enum
   - Add SSEErrorEvent interface
   - ~30 lines

### Files Unchanged

- `frontend/lib/apollo-client.ts` (no changes needed)
- `backend-express/src/index.ts` (CORS already configured correctly)
- `backend-express/src/services/event-deduplicator.ts` (no changes)
- Any Apollo resolvers (no changes needed)

---

## Risk Assessment

### Low Risk

✅ **CORS header fix**: Isolated change, matches expected standard CORS behavior  
✅ **Error classification**: Purely frontend logic, no side effects  
✅ **Retry loop**: Wrapped in timeout, properly cleaned up  

### Medium Risk

⚠️ **Type safety**: Ensure all error types are properly typed  
⚠️ **Integration with Issue #31**: Coordinate error event naming  
⚠️ **Browser compatibility**: Test EventSource in target browsers  

### Mitigation Strategies

1. **Test CORS fix thoroughly** with explicit header validation
2. **Type all error payloads** with interfaces, not `any`
3. **Clean up all timeouts** in `useEffect` cleanup to prevent memory leaks
4. **Test edge cases**: null payloads, malformed JSON, rapid reconnects
5. **Coordinate with Issue #31** on error notification API before implementation

### Rollback Plan

If issues arise during implementation:

1. **CORS headers fail**: Revert to `Access-Control-Allow-Origin: *` (lose credentials)
2. **Reconnection causes infinite loop**: Disable retry (lose resilience, but app works)
3. **Memory leaks from timeouts**: Reduce retry attempts or increase base delay

All changes are isolated and can be independently reverted.

---

## Success Criteria Checklist

### Code Quality

- [ ] TypeScript build passes: `pnpm build`
- [ ] Linting passes: `pnpm lint`
- [ ] All tests passing: `pnpm test`
- [ ] No console warnings from SSE
- [ ] Error handling has no `any` types

### Functionality

- [ ] CORS headers set correctly (specific origin, not `*`)
- [ ] SSE connects without browser CORS errors
- [ ] Connection failures trigger automatic reconnect
- [ ] Exponential backoff: 1s, 2s, 4s, 8s, 16s (verified by test)
- [ ] Retry counter resets on successful connection
- [ ] Max 5 attempts before giving up
- [ ] Malformed JSON doesn't crash listener
- [ ] Timeouts cleaned up on unmount (no memory leaks)

### User Experience

- [ ] Real-time updates work after network recovery
- [ ] No visible errors for normal reconnections
- [ ] Errors are user-friendly (not raw "NetworkError")
- [ ] App responsive during reconnection attempts
- [ ] Graceful degradation if SSE unavailable

### Testing

- [ ] Error handler unit tests: ~200 lines
- [ ] SSE hook integration tests: ~300 lines
- [ ] Backend error tests: ~250 lines
- [ ] Manual test scenarios: 8+ scenarios verified
- [ ] Coverage: Error handler >90%, Hook >85%

### Documentation

- [ ] Implementation plan: This file (✅ 400+ lines)
- [ ] Quick reference: ISSUE-29-QUICK-REFERENCE.md (✅ ~100 lines)
- [ ] Code comments: Error handling logic documented inline
- [ ] CORS explanation: Documented in code and PR description

---

## Implementation Timeline

| Phase | Todos | Estimated Time | Status |
|-------|-------|-----------------|--------|
| A: Backend CORS | 1 | 15 min | ⏳ Ready |
| B: Error Handler | 2, 3 | 30 min | ⏳ Waiting for A |
| C: Reconnection | 4, 5 | 45 min | ⏳ Waiting for A, B |
| D: Error Tracking | 6, 7 | 20 min | ⏳ Waiting for A |
| E: Testing | 8, 9, 10 | 30 min | ⏳ Waiting for C |
| F: Validation | 11, 12 | 15 min | ⏳ Waiting for E |
| **TOTAL** | **12** | **~2 hours** | ⏳ Ready to start |

---

## Next Steps

1. **Approval**: Review this plan for completeness
2. **Branch**: `git checkout -b feat/issue-29-cors-sse-errors`
3. **Implement**: Follow todos in order (respecting dependencies)
4. **Test**: Run manual test checklist after implementation
5. **Commit**: Create meaningful commits for each phase
6. **Review**: PR for team review with acceptance criteria verification
7. **Merge**: Into main after approval and CI passing

---

**Document Version**: 1.0  
**Created**: 2026-04-18  
**Last Updated**: 2026-04-18  
**Author**: Claude Code (Copilot)
