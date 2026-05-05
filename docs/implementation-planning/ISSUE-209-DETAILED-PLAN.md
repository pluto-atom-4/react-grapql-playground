# Issue #209 Implementation Plan: useTestRuns Polling Hook

**Status:** Production-Ready Implementation Plan  
**Depends On:** Issue #207 (SubmitTestRunForm) - MERGED to main  
**Target:** React 19 + TypeScript Custom Hook with Smart Polling  
**Effort Estimate:** 4–5 hours total  
**Test Coverage Target:** 85%+

---

## Executive Summary

Issue #209 delivers **useTestRuns**, a custom React hook that fetches test runs for a build and provides **smart polling** capability. This hook enables real-time status updates during test execution without polling unnecessarily.

**Core Features:**
- Fetch test runs from GraphQL (buildId parameter)
- Manual polling control (startPolling/stopPolling functions)
- Smart polling: Auto-stop when all tests reach terminal state
- 2-second poll interval (configurable)
- Automatic cleanup on unmount (no memory leaks)
- Error handling and loading states
- Full Apollo Client cache integration

**Business Impact:** Technicians can watch test execution in real-time. Tests stop polling automatically when complete (no wasted network). Hook reusable across BuildDetailModal, TestRunDetailsPanel, and future components.

---

## Table of Contents

1. [Acceptance Criteria](#acceptance-criteria)
2. [Task Breakdown](#task-breakdown)
3. [Technical Architecture](#technical-architecture)
4. [Hook Specifications](#hook-specifications)
5. [TypeScript Interfaces](#typescript-interfaces)
6. [Polling Strategy](#polling-strategy)
7. [Test Plan](#test-plan)
8. [Integration Points](#integration-points)
9. [Effort Estimates](#effort-estimates)
10. [Interview Talking Points](#interview-talking-points)

---

## Acceptance Criteria

| Criterion | Description | Testable | Priority |
|-----------|-------------|----------|----------|
| **AC1** | Hook accepts buildId and returns testRuns array | Unit test | Must |
| **AC2** | Hook returns loading state during fetch | Unit test | Must |
| **AC3** | Hook returns error state on query failure | Unit test | Must |
| **AC4** | startPolling() begins polling test run status every 2 seconds | Unit test | Must |
| **AC5** | stopPolling() stops polling immediately | Unit test | Must |
| **AC6** | Polling auto-stops when all tests reach terminal state (PASSED/FAILED) | Unit test | Must |
| **AC7** | Hook cleans up intervals on component unmount | Unit test | Must |
| **AC8** | No memory leaks (intervals cleared, subscriptions cancelled) | Memory test | Must |
| **AC9** | refetchQueries updates Apollo cache with fresh data | Integration test | Must |
| **AC10** | Multiple components can share same hook without interference | Integration test | Should |
| **AC11** | Polling survives network errors and retries gracefully | Error scenario test | Should |
| **AC12** | startPolling/stopPolling can be called rapidly without race conditions | Edge case test | Should |

---

## Task Breakdown

### Phase 1: Hook Foundation & Setup (1 hour)

**T1.1: Project structure, GraphQL query, and types (25 min)**
- Create `frontend/lib/hooks/useTestRuns.ts` file
- Define GraphQL query: GET_TEST_RUNS with buildId variable
- Define TypeScript interfaces for hook return type
- Create utility functions: isTerminalState(), getPollingStatus()
- Estimate: 25 min

**T1.2: Hook skeleton with buildId parameter (15 min)**
- Export useTestRuns(buildId: string) function
- Initialize local state: testRuns, loading, error
- Call useQuery hook for initial data fetch
- Add TODO comments for polling logic
- Estimate: 15 min

**T1.3: Initial data fetching and error handling (20 min)**
- Set up useQuery with GET_TEST_RUNS mutation
- Handle loading state from Apollo
- Handle error state from Apollo
- Add error logging for debugging
- Estimate: 20 min

### Phase 2: Polling Logic & State Management (1.5 hours)

**T2.1: Polling state management (20 min)**
- Add local state: isPolling, pollInterval, pollTimer
- Create useState for polling flags
- Initialize polling state to false
- Create setters for polling state
- Estimate: 20 min

**T2.2: Implement startPolling() function (30 min)**
- Create startPolling(interval = 2000) function
- Set isPolling flag to true
- Create setInterval that calls refetch() every interval ms
- Store interval ID in pollTimer state
- Handle rapid startPolling calls (prevent duplicate intervals)
- Estimate: 30 min

**T2.3: Implement stopPolling() function (15 min)**
- Create stopPolling() function
- Clear interval via clearInterval(pollTimer)
- Set isPolling flag to false
- Set pollTimer to null
- Handle stopPolling when polling not active
- Estimate: 15 min

**T2.4: Smart polling: Auto-stop on terminal state (25 min)**
- After each fetch, check if all testRuns are terminal
- Terminal states: PASSED, FAILED (not PENDING/RUNNING)
- If all terminal, auto-call stopPolling()
- Log when auto-stop triggered (for debugging)
- Prevent unnecessary polling during manual control
- Estimate: 25 min

### Phase 3: Advanced Features (1 hour)

**T3.1: Cleanup on unmount (prevent memory leaks) (20 min)**
- Add useEffect cleanup function
- Clear pollTimer on unmount
- Clear any active intervals
- Unsubscribe from Apollo subscription (if used)
- Test for memory leaks in unit tests
- Estimate: 20 min

**T3.2: Error recovery and retry logic (20 min)**
- Handle network errors gracefully
- Continue polling even if one request fails
- Add exponential backoff on repeated errors (optional)
- Log errors for debugging
- Don't throw errors, return in error state
- Estimate: 20 min

**T3.3: Polling status indicator (20 min)**
- Return isPolling flag from hook
- Return pollInterval (for display if desired)
- Optional: Return time until next poll
- Useful for debugging UI components
- Estimate: 20 min

### Phase 4: Testing & Documentation (1.5 hours)

**T4.1: Unit tests for hook logic (45 min)**
- Test useQuery integration
- Test startPolling/stopPolling functions
- Test terminal state detection
- Test refetch timing (2s intervals)
- Test cleanup on unmount
- Test error handling
- Test rapid startPolling calls
- Estimate: 45 min

**T4.2: Integration tests with Apollo (30 min)**
- Mock Apollo useQuery hook
- Test multiple components using same hook
- Test cache updates from other mutations
- Test polling with real GraphQL query structure
- Estimate: 30 min

**T4.3: Documentation and JSDoc (15 min)**
- Add JSDoc comments to hook
- Document parameters and return types
- Add examples in comments
- Document polling behavior
- Document cleanup expectations
- Estimate: 15 min

---

## Technical Architecture

### Hook Structure

```
useTestRuns(buildId: string)
  ├── Initialize Apollo useQuery(GET_TEST_RUNS, { buildId })
  ├── Local state:
  │   ├── isPolling: boolean
  │   ├── pollInterval: number (default 2000ms)
  │   └── pollTimer: NodeJS.Timeout | null
  ├── Returned functions:
  │   ├── startPolling(interval?: number) → void
  │   ├── stopPolling() → void
  │   ├── refetch() → Promise
  │   └── refetchQueries() → Promise (for cache refresh)
  └── useEffect cleanup
      └── clearInterval on unmount
```

### Polling Lifecycle

```
Component Mount
  ↓
useQuery fetches initial data
  ↓
User triggers startPolling()
  ↓
setInterval begins polling every 2s
  ↓
Each poll: check if all tests terminal
  ↓
If all terminal: auto stopPolling()
  ↓
If component unmounts: cleanup interval
  ↓
Component Unmount
```

### Terminal State Detection

```typescript
function isTerminalState(status: TestStatus): boolean {
  return status === 'PASSED' || status === 'FAILED';
}

function allTestsTerminal(testRuns: TestRun[]): boolean {
  return testRuns.length > 0 && testRuns.every(tr => isTerminalState(tr.status));
}
```

### Data Flow

```
BuildDetailModal opens
  ↓
Calls useTestRuns(buildId)
  ↓
Apollo queries GET_TEST_RUNS → returns testRuns array
  ↓
Modal renders TestRuns table
  ↓
User clicks "start polling" or modal auto-starts
  ↓
startPolling() → setInterval calls refetch() every 2s
  ↓
Each refetch → Apollo cache updates, component re-renders
  ↓
Auto-stop when all tests terminal
  ↓
Modal closes → cleanup fires, interval cleared
```

---

## Hook Specifications

### useTestRuns Hook

**Location:** `frontend/lib/hooks/useTestRuns.ts`

**Purpose:** Fetch test runs for a build with optional polling.

**Parameters:**
```typescript
useTestRuns(buildId: string, options?: {
  autoStart?: boolean;  // Auto-start polling if tests running
  pollInterval?: number; // ms between polls (default 2000)
})
```

**Returns:**
```typescript
{
  testRuns: TestRun[];           // Array of test runs
  loading: boolean;               // True while initial fetch in progress
  error: Error | null;            // Query error if any
  startPolling: (interval?: number) => void;  // Begin polling
  stopPolling: () => void;        // Stop polling
  refetch: () => Promise<any>;    // Manual refetch
  isPolling: boolean;             // Current polling status
  pollInterval: number;           // Current interval in ms
}
```

### GraphQL Query

```graphql
query GetTestRuns($buildId: ID!) {
  testRuns(buildId: $buildId) {
    id
    buildId
    status        # PASSED | FAILED | PENDING | RUNNING
    result
    fileUrl
    createdAt
    completedAt
  }
}
```

---

## TypeScript Interfaces

### Hook Return Type

```typescript
// frontend/lib/hooks/useTestRuns.ts

import { useQuery } from '@apollo/client';
import { useState, useEffect, useCallback } from 'react';
import type { TestRun, TestStatus } from '../types/graphql';

export interface UseTestRunsOptions {
  autoStart?: boolean;
  pollInterval?: number;
}

export interface UseTestRunsResult {
  testRuns: TestRun[];
  loading: boolean;
  error: Error | null;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  refetch: () => Promise<any>;
  isPolling: boolean;
  pollInterval: number;
}

export function useTestRuns(
  buildId: string,
  options?: UseTestRunsOptions
): UseTestRunsResult {
  // Implementation (see tasks below)
}
```

### Utility Types

```typescript
type PollingState = {
  isPolling: boolean;
  pollInterval: number;
  pollTimer: NodeJS.Timeout | null;
};

type TerminalTestStatus = 'PASSED' | 'FAILED';
```

---

## Polling Strategy

### Timing & Intervals

- **Poll Interval:** 2000ms (2 seconds, configurable)
- **Initial Fetch:** Immediate on mount
- **Auto-Stop Trigger:** All testRuns.status in ['PASSED', 'FAILED']
- **Max Polls per Session:** Unlimited (but auto-stops when tests complete)

### Terminal State Detection

```typescript
// Only stop polling when ALL tests are done
const isTerminal = testRuns.length > 0 && 
  testRuns.every(tr => tr.status === 'PASSED' || tr.status === 'FAILED');
```

### Memory Safety

- Clear intervals on component unmount (useEffect cleanup)
- No zombie intervals lingering after stopPolling()
- No duplicate intervals from rapid startPolling calls
- Apollo subscription cleanup handled by useQuery

### Network Efficiency

- 2-second interval: ~30 requests/minute (reasonable for real-time UX)
- Auto-stop: No polling after tests complete
- Apollo cache: Shared across components (no duplicate queries)
- refetchQueries: Updates cache, doesn't create new subscriptions

---

## Test Plan

### Unit Tests (45 min, 30+ test cases)

**Test Suite 1: Hook Initialization (10 min)**
- ✅ Hook accepts buildId parameter
- ✅ Hook calls useQuery with correct query
- ✅ Hook returns testRuns array
- ✅ Hook returns loading state during fetch
- ✅ Hook returns error state on query failure

**Test Suite 2: Polling Control (15 min)**
- ✅ startPolling() sets isPolling to true
- ✅ startPolling() creates interval with correct timing
- ✅ stopPolling() sets isPolling to false
- ✅ stopPolling() clears interval
- ✅ startPolling() with custom interval uses provided duration
- ✅ stopPolling() called when not polling doesn't error

**Test Suite 3: Terminal State Detection (10 min)**
- ✅ Auto-stops when all tests PASSED
- ✅ Auto-stops when all tests FAILED
- ✅ Auto-stops when mix of PASSED and FAILED
- ✅ Does NOT stop when tests PENDING or RUNNING
- ✅ Continues polling when some tests still RUNNING

**Test Suite 4: Cleanup & Memory (10 min)**
- ✅ useEffect cleanup clears interval on unmount
- ✅ No memory leaks with rapid mount/unmount
- ✅ Multiple rapid startPolling/stopPolling calls handled
- ✅ Timer cleared before creating new interval

### Integration Tests (30 min, 15+ test cases)

**Test Suite 5: Apollo Integration (15 min)**
- ✅ refetch() updates Apollo cache
- ✅ Multiple components share same hook
- ✅ Cache hits from SubmitTestRun mutation
- ✅ Polling respects Apollo cache TTL
- ✅ Error recovery continues polling

**Test Suite 6: Error Scenarios (15 min)**
- ✅ Network error during poll doesn't crash
- ✅ Query error shows in error state
- ✅ Polling continues even after failed request
- ✅ Error cleared after successful refetch
- ✅ Rapid error/success cycles handled

### Mock Setup

```typescript
// Mock Apollo useQuery
vi.mock('@apollo/client', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: {
      testRuns: [
        { id: '1', status: 'RUNNING' },
        { id: '2', status: 'PENDING' },
      ],
    },
    loading: false,
    error: null,
    refetch: vi.fn().mockResolvedValue({
      data: { testRuns: [...] },
    }),
  }),
}));

// Mock setInterval/clearInterval
vi.useFakeTimers();
```

---

## Integration Points

### BuildDetailModal Usage

```typescript
// BuildDetailModal component
export function BuildDetailModal({ buildId }) {
  const { testRuns, loading, error, startPolling, stopPolling } = 
    useTestRuns(buildId);

  useEffect(() => {
    startPolling(2000);  // Start polling on mount
    return () => stopPolling();  // Stop on unmount
  }, [startPolling, stopPolling]);

  return (
    <div>
      <table>
        {testRuns.map(tr => (
          <row 
            key={tr.id}
            onClick={() => setSelectedTestRunId(tr.id)}
          >
            {tr.status}
          </row>
        ))}
      </table>
    </div>
  );
}
```

### TestRunDetailsPanel Usage

```typescript
// TestRunDetailsPanel component
export function TestRunDetailsPanel({ buildId, testRunId, onClose }) {
  const { testRuns, loading } = useTestRuns(buildId);
  const testRun = testRuns.find(t => t.id === testRunId);

  // This component doesn't call startPolling
  // It reuses polling from BuildDetailModal
  // Hook shared via React context or provider if needed
}
```

### SubmitTestRunForm Integration

```typescript
// After form submission, Apollo updates cache
const response = await mutate({ buildId, status, result, fileUrl });

// useTestRuns hook automatically sees new testRun in cache
// Next poll refetch will include it
```

---

## Effort Estimates

### Phase Breakdown

| Phase | Task | Estimated Time | Cumulative |
|-------|------|-----------------|-----------|
| **Phase 1: Foundation** | T1.1 Query & types | 25 min | 25 min |
| | T1.2 Hook skeleton | 15 min | 40 min |
| | T1.3 Data fetching | 20 min | 1h |
| **Phase 2: Polling** | T2.1 State management | 20 min | 1h 20m |
| | T2.2 startPolling() | 30 min | 1h 50m |
| | T2.3 stopPolling() | 15 min | 2h 5m |
| | T2.4 Smart stop | 25 min | 2h 30m |
| **Phase 3: Advanced** | T3.1 Cleanup | 20 min | 2h 50m |
| | T3.2 Error recovery | 20 min | 3h 10m |
| | T3.3 Status indicator | 20 min | 3h 30m |
| **Phase 4: Testing** | T4.1 Unit tests | 45 min | 4h 15m |
| | T4.2 Integration tests | 30 min | 4h 45m |
| | T4.3 Documentation | 15 min | 5h |

### Total Effort: 5 hours (can be optimized to 4 hours)

### Time Breakdown by Category

- **Hook Development:** 2.5 hours
- **Polling Logic:** 1.5 hours
- **Testing:** 1 hour
- **Documentation:** 0.5 hours

### Parallelizable

Can run **in parallel with Issue #208** (TestRunDetailsPanel):
- Both depend on #207 (merged)
- No dependencies between #208 and #209
- Both can start immediately

---

## Interview Talking Points

**When discussing useTestRuns hook:**

1. **"This demonstrates React hook patterns for real-time data."**
   - Shows how to manage polling lifecycle
   - Cleanup on unmount prevents memory leaks
   - Reusable across multiple components

2. **"Smart polling is a design choice that saves bandwidth."**
   - Auto-stop when tests complete
   - No polling after terminal state
   - Configurable interval for different use cases
   - Balances UX responsiveness with network efficiency

3. **"It's a good example of Apollo Client integration."**
   - useQuery hook for data fetching
   - Apollo cache automatically updated by refetch
   - Multiple components share same query (cache hit)
   - Mutations (from #207) automatically update cache

4. **"Error handling is critical for real-time features."**
   - Network errors don't crash polling
   - Graceful degradation: continue polling even if request fails
   - Error state returned but doesn't stop hook
   - User sees error but can retry

5. **"Testing async hooks requires thoughtful mocking."**
   - Mock setInterval/clearInterval for timing
   - Mock Apollo useQuery for data
   - Edge cases: rapid start/stop, component unmount during poll
   - Memory leak testing (intervals cleared)

6. **"This completes the manufacturing workflow."**
   - Technicians submit tests (Issue #207)
   - See real-time updates (Issue #209)
   - View details when needed (Issue #208)
   - Automatic polling stops when tests complete

---

## Code Review Checklist

Before submitting PR, verify:

- [ ] All 12 acceptance criteria met and testable
- [ ] 45+ test cases with 85%+ coverage
- [ ] No ESLint errors (run `pnpm lint:fix`)
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] Memory leak tests pass (intervals cleared on unmount)
- [ ] Polling timing verified (2s intervals)
- [ ] Terminal state detection correct (all statuses considered)
- [ ] Error recovery doesn't crash polling
- [ ] Multiple rapid startPolling/stopPolling calls handled
- [ ] JSDoc comments on all exported functions
- [ ] Hook properly integrates with BuildDetailModal
- [ ] Shares Apollo cache with other components

---

## Next Steps (After #208 & #209)

Once both Issue #208 and #209 are merged to main:

1. **Full Integration Testing**
   - All three components wired in BuildDetailModal
   - End-to-end workflow: submit → see in table → view details → auto-poll
   - Test switching between test runs while polling
   - Verify cleanup when modal closes

2. **Performance Testing**
   - Load test with 50+ test runs
   - Verify polling doesn't cause memory leaks over time
   - Monitor network requests (should be ~30/min when polling)
   - Verify auto-stop reduces requests to 0 when complete

3. **Manufacturing Workflow Testing**
   - Test end-to-end: technician submits → sees updates → downloads file
   - Test edge cases: internet disconnect, rapid re-connect, multiple modals
   - Test on mobile (small screens, spotty WiFi)

---

## Related Documentation

- **Issue #207:** SubmitTestRunForm Component (dependency, merged)
- **Issue #208:** TestRunDetailsPanel (parallelizable)
- **Master Plan:** `/docs/implementation-planning/ISSUE-33-207-208-209-MASTER-PLAN.md` (business context)
- **GraphQL Hooks:** `frontend/lib/apollo-hooks.ts` (reference)
- **Manufacturing Domain:** `docs/product-analysis/USETESTRUN-ANALYSIS.md` (why real-time matters)

---

**Document Version:** 1.0  
**Last Updated:** May 4, 2026  
**Status:** Ready for Implementation
