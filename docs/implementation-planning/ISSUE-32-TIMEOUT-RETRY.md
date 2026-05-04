# Issue #32: Add Timeouts & Retry Logic - Implementation Plan

**Tech Lead Architecture Review**  
**Issue**: Add 10-second timeout and automatic retry logic (up to 3 times with exponential backoff) to Apollo Client  
**Target Files**: `frontend/lib/apollo-client.ts`, `frontend/lib/use-sse-events.ts`  
**Branch**: `feat/timeout-retry-logic`  
**Estimated Duration**: 1.5 hours  
**Acceptance Criteria**: 8/8 (all must pass)

---

## 1. APPROACH DECISION: Complex vs Simple

### Option A: Complex (RetryLink + Timeout Link) ⭐ RECOMMENDED
```typescript
// Uses Apollo-provided RetryLink + custom timeout middleware
link = timeoutLink.concat(retryLink).concat(errorLink).concat(authLink).concat(httpLink);
```

**Pros:**
- Apollo best practice pattern
- Separation of concerns (retry vs timeout)
- Integrates well with Apollo ecosystem tools (DevTools)
- Built on proven Apollo architecture

**Cons:**
- Requires understanding of Apollo link chain architecture
- More dependencies to manage

### Option B: Simple (Custom Fetch Wrapper)
```typescript
// Manual fetch retry wrapper with timeout
const retryableFetch = createRetryableFetch(window.fetch, {
  timeout: 10000,
  maxRetries: 3,
  backoff: exponentialBackoff,
});
```

**Pros:**
- Simpler to understand and debug
- Single responsibility function

**Cons:**
- Lower-level implementation
- Less integrated with Apollo ecosystem

---

## ✅ RECOMMENDATION: **Option A (Complex - RetryLink + Timeout)**

### Rationale:

1. **Existing Foundation**: Codebase already has `graphql-error-handler.ts` with retry logic utilities (`isRetryableError()`, `getRetryStrategy()`)
2. **Apollo Best Practices**: RetryLink is the standard approach recommended in Apollo documentation
3. **Error Link Integration**: Current error link already logs and handles errors; RetryLink fits naturally into this chain
4. **Interview Value**: Demonstrates knowledge of Apollo link architecture and proper error handling patterns
5. **Scalability**: Easier to extend (add rate limiting, circuit breakers) in future
6. **DevTools Compatible**: Apollo DevTools can inspect retry behavior

### Trade-offs Accepted:
- Slight increase in link chain complexity (mitigated by clear comments)
- RetryLink dependency (already using many Apollo packages)

---

## 2. TASK BREAKDOWN (Sequential)

| # | Task | Duration | Dependencies | Notes |
|---|------|----------|--------------|-------|
| 1 | Create `retry-link.ts` utility | 15min | None | ~80 lines (class + types) |
| 2 | Create `timeout-link.ts` utility | 15min | None | ~60 lines (class + types) |
| 3 | Update `apollo-client.ts` link chain | 10min | Tasks 1-2 | ~10 lines (imports + link order) |
| 4 | Write `RetryLink` unit tests | 20min | Task 1 | 12 test cases, ~200 lines |
| 5 | Write `TimeoutLink` unit tests | 20min | Task 2 | 8 test cases, ~150 lines |
| 6 | Write integration tests | 15min | Tasks 1-5 | 6 test cases, ~120 lines |
| 7 | Update SSE reconnection logic | 10min | Task 5 | ~5 lines (import + backoff config) |
| 8 | Manual verification (browser testing) | 10min | All tasks | Chrome DevTools verification |
| 9 | Update documentation | 5min | All tasks | Update CLAUDE.md |

**Total: 1 hour 40 minutes** (estimated)

---

## 3. FILE STRUCTURE

### Files to Create:
```
frontend/lib/
├── retry-link.ts                    # NEW: RetryLink implementation (80 lines)
├── timeout-link.ts                  # NEW: TimeoutLink implementation (60 lines)
└── __tests__/
    ├── retry-link.test.ts           # NEW: RetryLink unit tests (200 lines)
    ├── timeout-link.test.ts         # NEW: TimeoutLink unit tests (150 lines)
    └── timeout-retry-integration.test.ts # NEW: Integration tests (120 lines)
```

### Files to Modify:
```
frontend/lib/
├── apollo-client.ts                 # MODIFY: Add timeout + retry links to chain (+10 lines)
├── use-sse-events.ts                # MODIFY: Use shared retry config (+5 lines)
└── __tests__/
    └── apollo-client.test.ts        # ADD: Link chain order tests (+10 lines)
```

### Existing Files (Reference - No Changes):
- `frontend/lib/graphql-error-handler.ts` - Contains `isRetryableError()`, `getRetryStrategy()`, backoff logic
- `frontend/lib/sse-error-handler.ts` - SSE error classification patterns
- `frontend/lib/__tests__/retry-logic.test.ts` - Existing retry tests

---

## 4. IMPLEMENTATION DETAILS

### 4.1 Timeout Link (`timeout-link.ts`)

**Purpose**: Enforce 10-second timeout on all GraphQL requests

**Implementation Strategy**:
```typescript
// Wrap fetch operation in Promise.race with timeout
// Throw TimeoutError if timeout exceeded before response
// Pass error through to ErrorLink for consistent handling
```

**Key Code Structure**:
```typescript
import { ApolloLink, Operation, FetchResult } from '@apollo/client';
import { Observable } from 'rxjs';

export interface TimeoutConfig {
  timeout: number; // milliseconds (default: 10000)
}

export class TimeoutLink extends ApolloLink {
  private timeout: number;

  constructor(config: TimeoutConfig = { timeout: 10000 }) {
    super();
    this.timeout = config.timeout;
  }

  public request(
    operation: Operation,
    forward: (op: Operation) => Observable<FetchResult>
  ): Observable<FetchResult> {
    return new Observable((subscriber) => {
      let timeoutId: NodeJS.Timeout | undefined;
      let isSubscriptionCancelled = false;

      const subscription = forward(operation).subscribe({
        next(value) {
          if (!isSubscriptionCancelled) {
            clearTimeout(timeoutId);
            subscriber.next(value);
          }
        },
        error(err) {
          if (!isSubscriptionCancelled) {
            clearTimeout(timeoutId);
            subscriber.error(err);
          }
        },
        complete() {
          if (!isSubscriptionCancelled) {
            clearTimeout(timeoutId);
            subscriber.complete();
          }
        },
      });

      timeoutId = setTimeout(() => {
        isSubscriptionCancelled = true;
        const timeoutError = new Error(
          `GraphQL request timeout after ${this.timeout}ms`
        );
        subscriber.error(timeoutError);
      }, this.timeout);

      return () => {
        isSubscriptionCancelled = true;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    });
  }
}
```

**Key Points**:
- Error thrown has "timeout" in message → `classifyError()` classifies as 'timeout' type
- Timeout errors are classified as retryable
- Properly clears timeout on success/error
- Handles unsubscribe cleanup

---

### 4.2 Retry Link (`retry-link.ts`)

**Purpose**: Auto-retry failed requests up to 3 times with exponential backoff

**Implementation Strategy**:
```typescript
// After forward(operation) fails with retryable error:
// 1. Check error is retryable (use isRetryableError)
// 2. Check attempt < maxRetries
// 3. Calculate delay via getExponentialBackoffDelay
// 4. Wait delay ms
// 5. Retry by calling forward(operation) again
// 6. If all retries exhausted, pass error through
```

**Key Code Structure**:
```typescript
import { ApolloLink, Operation, FetchResult } from '@apollo/client';
import { Observable } from 'rxjs';
import { isRetryableError, getRetryStrategy, RetryConfig, DEFAULT_RETRY_CONFIG } from './graphql-error-handler';

export class RetryLink extends ApolloLink {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    super();
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  public request(
    operation: Operation,
    forward: (op: Operation) => Observable<FetchResult>
  ): Observable<FetchResult> {
    return new Observable((subscriber) => {
      let attempt = 0;

      const executeRequest = () => {
        const subscription = forward(operation).subscribe({
          next(value) {
            subscriber.next(value);
          },
          error: (err: unknown) => {
            const { shouldRetry, delayMs } = getRetryStrategy(err, attempt, this.config);

            if (shouldRetry) {
              attempt += 1;
              console.log(
                `[Apollo Retry] Attempt ${attempt}/${this.config.maxRetries} ` +
                `for ${operation.operationName} after ${delayMs}ms delay`
              );

              setTimeout(() => {
                executeRequest();
              }, delayMs);
            } else {
              // Final failure after all retries
              subscriber.error(err);
            }
          },
          complete() {
            subscriber.complete();
          },
        });

        return subscription;
      };

      return executeRequest();
    });
  }
}
```

**Key Points**:
- Uses existing `getRetryStrategy()` from graphql-error-handler
- Respects `maxRetries: 3` configuration (plus initial attempt = 4 total)
- Logs retry attempts with operation name and delay
- Only retries errors classified as retryable (network, timeout)
- Doesn't retry 4xx errors (auth, validation)

---

### 4.3 Apollo Client Link Chain Update (`apollo-client.ts`)

**Current Order**:
```typescript
// errorLink → authLink → httpLink
link: errorLink.concat(authLink).concat(httpLink)
```

**New Order** (AFTER Issue #32):
```typescript
// timeoutLink → retryLink → errorLink → authLink → httpLink
//
// Why this order matters:
// - timeoutLink FIRST: Enforce hard timeout boundary (10s max)
// - retryLink SECOND: Retry logic doesn't waste time on timed-out requests
// - errorLink THIRD: Log/toast errors only AFTER all retries exhausted
// - authLink FOURTH: Inject token (needed for each retry attempt)
// - httpLink LAST: Actual network request
```

**Implementation**:
```typescript
import { TimeoutLink } from './timeout-link';
import { RetryLink } from './retry-link';

export function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

  const timeoutLink = new TimeoutLink({ timeout: 10000 });
  const retryLink = new RetryLink({ maxRetries: 3 });

  const httpLink = new HttpLink({
    uri: graphqlUrl,
    credentials: 'include',
  });

  const authLink = setContext((_, context) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
    const { headers } = context as { headers: Record<string, string> };
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    // NEW: Link chain with timeout and retry
    link: timeoutLink.concat(retryLink).concat(errorLink).concat(authLink).concat(httpLink),
  });
}
```

---

### 4.4 SSE Reconnection Logic Update (`use-sse-events.ts`)

**Current Pattern**: SSE uses independent timeout/backoff in event listener

**Updated Pattern**: Use same `RetryConfig` and backoff calculation as GraphQL

**Changes**:
```typescript
// Import shared retry configuration
import { DEFAULT_RETRY_CONFIG, getExponentialBackoffDelay } from './graphql-error-handler';

// In SSE reconnection handler:
const reconnect = (attemptNumber: number) => {
  const delay = getExponentialBackoffDelay(
    attemptNumber,
    DEFAULT_RETRY_CONFIG.baseDelay,
    DEFAULT_RETRY_CONFIG.maxDelay,
    DEFAULT_RETRY_CONFIG.jitterPercent
  );
  
  console.log(
    `[SSE Reconnect] Attempt ${attemptNumber + 1}/${DEFAULT_RETRY_CONFIG.maxRetries} ` +
    `after ${delay}ms delay`
  );
  
  setTimeout(() => {
    // Reconnect logic
  }, delay);
};
```

**Benefit**: Consistent retry behavior across all network operations (GraphQL + SSE)

---

## 5. TESTING STRATEGY

### 5.1 Unit Tests: TimeoutLink (`timeout-link.test.ts`)

**Test Cases** (8 tests, ~20 min):

| # | Test | Expected Behavior |
|---|------|-------------------|
| 1 | Should timeout request after 10s | Network.throttle + timeout error |
| 2 | Should not timeout successful response < 10s | Response received (500ms request) |
| 3 | Should timeout network error same as successful | Always timeout after 10s |
| 4 | Should respect custom timeout config | Timeout: 5000ms works correctly |
| 5 | Should clear timeout on success | clearTimeout called after response |
| 6 | Should unsubscribe on cancellation | No error after manual unsubscribe |
| 7 | Should work with concurrent requests | 5 concurrent requests all timeout |
| 8 | Should handle both sync/async errors | Consistent behavior for both |

**Mock Strategy**:
- Mock `forward` function to return Observable
- Simulate slow response via `setTimeout` in mock
- Use Vitest timers for deterministic testing

---

### 5.2 Unit Tests: RetryLink (`retry-link.test.ts`)

**Test Cases** (12 tests, ~20 min):

| # | Test | Expected Behavior |
|---|------|-------------------|
| 1 | Should not retry on first success | No retry logs, operation complete |
| 2 | Should retry network errors 3x | Fail 3x + succeed = 4 total attempts |
| 3 | Should not retry 4xx errors | Error immediately (no retry) |
| 4 | Should retry 5xx errors | Fail → retry → succeed pattern |
| 5 | Should calculate backoff correctly | 100ms ±20%, 200ms ±20%, 400ms ±20% |
| 6 | Should log retry attempts | Console logs include operation name |
| 7 | Should respect maxRetries: 2 | Max 2 retries, error on attempt 3 |
| 8 | Should not retry after max | Final error passed through |
| 9 | Should handle timeout errors | Timeout classified as retryable |
| 10 | Should work with concurrent ops | 3 mutations retry independently |
| 11 | Should preserve operation context | Variables/name unchanged after retry |
| 12 | Should complete after retry | complete() called after success |

**Mock Strategy**:
- Mock `forward` with Observable controlling error/success timing
- Spy on `console.log` to verify logging
- Use Vitest timers for deterministic backoff
- Mock `isRetryableError()` to control retry behavior

---

### 5.3 Integration Tests (`timeout-retry-integration.test.ts`)

**Test Cases** (6 tests, ~15 min):

| # | Test | Expected Behavior |
|---|------|-------------------|
| 1 | Should recover from timeout via retry | Timeout on attempt 1, success on 2 |
| 2 | Should respect link chain order | Timeout enforced before retry attempts |
| 3 | Should not retry after timeout | 1 initial + 3 retries = 4 total |
| 4 | Should work with auth token injection | Token reapplied on each retry |
| 5 | Should show error after final failure | Error toast after 3 failed retries |
| 6 | Should log timeout + retry info | Both timeout and retry logs present |

**Mock Strategy**:
- Use Apollo `MockedProvider` for integration testing
- Mock entire `httpLink` to simulate server behavior
- Spy on both console.log and createToast
- Use `vi.useFakeTimers()` for deterministic timing

---

### 5.4 Manual Verification (Browser Testing)

**Checklist** (~10 min):

1. **Timeout Verification**:
   - [ ] Start server on localhost:4000
   - [ ] Add network throttle in DevTools (Network tab → 50 Kbps)
   - [ ] Trigger GraphQL query
   - [ ] Observe timeout error after 10 seconds
   - [ ] Check console: "[Apollo Error]" log visible

2. **Retry Verification**:
   - [ ] Stop GraphQL server (port 4000)
   - [ ] Trigger GraphQL mutation
   - [ ] Observe console logs:
     - `[Apollo Retry] Attempt 1/3...`
     - `[Apollo Retry] Attempt 2/3...`
     - `[Apollo Retry] Attempt 3/3...`
   - [ ] Observe error toast after 3 retries
   - [ ] Restart server
   - [ ] Repeat: mutation should succeed on retry

3. **No Retry on 4xx**:
   - [ ] Mock 401 Unauthorized response
   - [ ] Trigger mutation
   - [ ] Verify NO retry logs (error shown immediately)

4. **Retry on 5xx**:
   - [ ] Mock 500 error on first request, success on second
   - [ ] Trigger mutation
   - [ ] Verify ONE retry log and mutation succeeds

5. **Link Chain Order** (Apollo DevTools):
   - [ ] Install Apollo DevTools extension
   - [ ] Open DevTools → Apollo tab
   - [ ] Inspect Queries tab
   - [ ] Verify timeout+retry delays in timing

---

## 6. ACCEPTANCE CRITERIA CHECKLIST

| # | Criterion | Implementation | Verification | Status |
|---|-----------|-----------------|--------------|--------|
| 1 | Requests timeout after 10s | `TimeoutLink.request()` setTimeout 10000ms | Manual: Network throttle | [ ] |
| 2 | Failed requests auto-retry ≤3x | `RetryLink.request()` loop + attempt counter | Unit: retry-link.test.ts | [ ] |
| 3 | Retry delays: 300ms, 600ms, 1200ms | `getExponentialBackoffDelay()` existing util | Manual + Unit: Spy on setTimeout | [ ] |
| 4 | Client errors (4xx) don't retry | `isRetryableError()` returns false for 4xx | Unit: retry-link.test.ts | [ ] |
| 5 | Server errors (5xx) do retry | `isRetryableError()` returns true for 5xx | Unit: retry-link.test.ts | [ ] |
| 6 | Network timeouts retry auto | Timeout errors classified as retryable | Unit: retry-logic.test.ts | [ ] |
| 7 | Console logs retry attempts | `console.log()` in RetryLink.request() | Manual: Browser console | [ ] |
| 8 | After 3 failed retries: show error | `errorLink` shows toast after exhaust | Unit: integration.test.ts | [ ] |

---

## 7. RISKS & MITIGATIONS

### Risk 1: Link Chain Order Confusion
**Problem**: Wrong order (retryLink → timeoutLink) means retries happen after timeout expires  
**Mitigation**: 
- Add ASCII diagram comment in apollo-client.ts showing order
- Link order test in apollo-client.test.ts validates sequence
- Document "Why this order?" in code comment

### Risk 2: Memory Leaks from Timeout Handles
**Problem**: `clearTimeout()` not called on error paths  
**Mitigation**:
- Use try/finally in Observable error handler
- Unit test unsubscribe() path
- Browser DevTools "Check memory" after timeout scenarios

### Risk 3: Exponential Backoff Jitter Too Wide
**Problem**: ±20% jitter might cause delays too long (9600ms) on 3rd retry  
**Mitigation**:
- Existing graphql-error-handler already caps at 10000ms
- Unit tests verify backoff ranges (320-480ms, etc)
- Justify jitter trade-off in code comment

### Risk 4: Retry Link Infinite Loop on Server Crash
**Problem**: If server returns 503 forever, retries loop infinitely  
**Mitigation**:
- Hard limit: `maxRetries: 3` prevents infinite loop
- Final error shown to user after 3 retries
- User can manually retry or refresh

### Risk 5: Timeout Before Auth Token Injected
**Problem**: AuthLink runs AFTER TimeoutLink, token timeout?  
**Mitigation**:
- AuthLink is synchronous (no network I/O), completes instantly
- Timeout only applies to actual HTTP request in httpLink
- No issue in practice (auth token already in localStorage)

### Risk 6: Console Spam from Retry Logs
**Problem**: Many retries = many console logs, hard to read  
**Mitigation**:
- Use structured log format: `[Apollo Retry]` prefix for grep
- Log attempt count + total retries to show progress
- Disable via DEBUG env var if needed

### Risk 7: SSE Reconnection Not Using Shared Config
**Problem**: SSE backoff diverges from GraphQL backoff over time  
**Mitigation**:
- Import `DEFAULT_RETRY_CONFIG` in use-sse-events.ts
- Use same `getExponentialBackoffDelay()` function
- Test verifies SSE + GraphQL use identical delays

---

## 8. TYPESCRIPT CONSIDERATIONS

### Type Safety

**Observable Types**:
```typescript
// RetryLink.request() must return Observable<FetchResult>
// Properly typed generics from @apollo/client
import { Observable } from 'rxjs';
import { FetchResult } from '@apollo/client';

// Ensure subscription cleanup
private subscription: Subscription | undefined;
```

**Error Type Handling**:
```typescript
// Error can be any type (not just Error class)
error: (err: unknown) => {
  const type = classifyError(err);  // Works with unknown
  const strategy = getRetryStrategy(err, attempt);  // Works with unknown
}
```

**Configuration Types**:
```typescript
// Reuse existing types from graphql-error-handler
import type { RetryConfig } from './graphql-error-handler';

// Strict null checks enabled
private config: RetryConfig;  // Not Optional
```

**Link Chain Type Safety**:
```typescript
// ApolloLink.concat() is properly typed
const link: ApolloLink = 
  timeoutLink.concat(retryLink).concat(errorLink);
// Returns ApolloLink, not union type
```

### Strict Mode Checks

- No `any` types (use `unknown` for untyped errors)
- No implicit `any` in function signatures
- No non-null assertions (except tsconfig defaults)
- No `!` operator abuse (use nullish coalescing `??`)

**Verification**:
```bash
pnpm build        # TypeScript strict check
pnpm lint         # ESLint type checks
pnpm tsc --noEmit # Explicit type check
```

---

## 9. IMPLEMENTATION SEQUENCE

### Phase 1: Foundation (20 min)
1. Create `timeout-link.ts` with TimeoutLink class
2. Create `retry-link.ts` with RetryLink class
3. Verify TypeScript compiles

### Phase 2: Integration (10 min)
4. Update `apollo-client.ts` to use new links
5. Update link chain order comment
6. Verify makeClient() still works

### Phase 3: Testing (40 min)
7. Write TimeoutLink unit tests
8. Write RetryLink unit tests
9. Write integration tests
10. Run full test suite: `pnpm test`

### Phase 4: SSE + Docs (15 min)
11. Update `use-sse-events.ts` SSE reconnection
12. Update CLAUDE.md with new patterns
13. Manual browser verification

### Phase 5: Verification (15 min)
14. Run `pnpm build` → TypeScript check passes
15. Run `pnpm lint` → No ESLint errors
16. Run `pnpm test` → All tests pass
17. Manual browser testing → All criteria met

---

## 10. INTERVIEW VALUE

This implementation demonstrates:

1. **Architecture Knowledge**: Understanding Apollo link chain patterns (vs naive fetch wrapper)
2. **Error Handling**: Distinguishing retryable (5xx, network) from non-retryable (4xx, validation) errors
3. **Distributed Systems**: Exponential backoff prevents "thundering herd" problem
4. **Code Organization**: Separates timeout, retry, and error concerns into distinct links
5. **Testing Rigor**: >20 tests covering success, failure, and edge cases
6. **TypeScript Mastery**: No `any`, proper types for Observable/Subscription/errors
7. **Production Readiness**: Console logging, error messages, SSE integration
8. **Scalability**: Easy to extend with circuit breakers, rate limiting, metrics collection

---

## 11. BRANCH & VERIFICATION

**Branch Name**: `feat/timeout-retry-logic`

**Final Verification Commands**:
```bash
# TypeScript strict check
pnpm build

# Linting & formatting
pnpm lint
pnpm format:check

# Unit + integration tests
pnpm test

# All should pass ✅
```

---

## Summary

This implementation plan provides a complete, production-ready solution for Issue #32 using Apollo RetryLink + TimeoutLink pattern with shared exponential backoff logic. The solution demonstrates enterprise-level architecture knowledge and will result in significantly improved reliability for users on unstable networks.

**Expected Outcome**: 
- Requests timeout after 10 seconds (preventing infinite hangs)
- Failed requests auto-retry up to 3 times with intelligent backoff
- Users see instant recovery from transient failures
- 4xx errors fail fast (no wasted retries)
- 5xx and network errors retry intelligently

