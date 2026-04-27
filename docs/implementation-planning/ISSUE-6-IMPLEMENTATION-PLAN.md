# Issue #6 Implementation Plan: Frontend ↔ Apollo GraphQL with Real-Time SSE Integration

**Status**: Strategic Planning  
**Issue**: #6 (Critical Blocker)  
**Estimated Duration**: 4–5 days (32–40 hours)  
**Dependencies**: #2 (GraphQL schema), #3 (Apollo Server), #4 (Express SSE)  
**Target Completion**: Week of April 28–May 2, 2026

---

## 1. Executive Summary

**Issue #6 is the critical integration layer** connecting the frontend (Next.js + React 19) with the backend (Apollo GraphQL + Express SSE). This issue requires building a complete real-time data synchronization system where:

- **Frontend queries Apollo** for Builds, Parts, and TestRuns with proper pagination
- **Frontend mutates Apollo** with optimistic updates for instant UX feedback
- **Apollo emits events** to Express event bus when mutations complete
- **Express broadcasts events** via Server-Sent Events (SSE) to all connected clients
- **Frontend listens via SSE** and updates Apollo cache automatically
- **Multiple clients stay in sync** without polling or page refreshes

### Key Characteristics
| Aspect | Detail |
|--------|--------|
| **Scope** | 9 specific tasks across queries, mutations, hooks, real-time sync, and testing |
| **Phases** | 5 sequential phases with parallel work opportunities |
| **Team Effort** | Single developer (4–5 days intensive) |
| **Critical Path** | Queries → Mutations → Hooks → Real-time → Testing |
| **Success Metric** | Zero N+1 queries, <100ms latency, >80% test coverage, all acceptance criteria met |

### Current State (Pre-existing)
✅ GraphQL schema (Build, Part, TestRun) with resolvers  
✅ Apollo Server (port 4000) running with DataLoader  
✅ Express SSE endpoint (port 5000) with event bus  
✅ GraphQL query/mutation documents partially defined  
✅ Basic `useSSEEvents` hook for listening  
✅ Auth context with JWT token management  

### Gaps to Close (This Issue)
❌ Custom hooks missing optimistic update patterns  
❌ RealtimeEvents component not integrated with cache updates  
❌ No error handling (network errors, timeout retries)  
❌ No integration tests for queries, mutations, SSE sync  
❌ No performance verification (N+1 queries, latency)  
❌ No multi-client synchronization validation  

---

## 2. Detailed Phase Breakdown

### Phase A: Query Foundation (8 hours, Days 1 morning)

**Purpose**: Establish the baseline for data fetching with proper caching and no N+1 queries.

#### Tasks (from Issue #6)
- Task 1: Create Apollo query documents (Get Builds, Get Build by ID, Get Parts, Get TestRuns)

#### Deliverables
- `frontend/lib/graphql/queries.ts` — Organized query documents with fragments
- Verified query execution in GraphiQL IDE
- No N+1 queries in DataLoader (verified via backend logs)

#### Estimated Duration
- 2 hours: Refactor and organize query documents
- 1 hour: Test queries in GraphiQL IDE
- 1 hour: Verify DataLoader batching (check backend logs)
- 1 hour: Error handling for failed queries
- 3 hours: Write unit tests for query documents

#### Technical Decisions
- **Single file strategy**: Keep all queries in `frontend/lib/graphql/queries.ts` for simplicity (can split later if grows >500 LOC)
- **Fragment reuse**: Use fragments (BUILD_FRAGMENT, PART_FRAGMENT, TEST_RUN_FRAGMENT) to ensure consistency
- **Pagination**: Implement offset-based pagination (10 items per page by default, configurable)
- **Variables**: Use variables for all dynamic values (no string interpolation in queries)

#### Success Criteria
- ✓ All 4 query documents execute successfully in GraphiQL
- ✓ Backend logs show no N+1 queries (DataLoader batches parts and test runs)
- ✓ Queries return correct data shape matching BUILD_FRAGMENT, PART_FRAGMENT, TEST_RUN_FRAGMENT
- ✓ Query tests pass (>95% coverage)
- ✓ Error cases handled (invalid ID, network timeout)

#### Key Patterns
```typescript
// Correct: Use fragments for reusability
export const BUILDS_QUERY = gql`
  query GetBuilds($limit: Int!, $offset: Int!) {
    builds(limit: $limit, offset: $offset) {
      ...BuildInfo
    }
  }
  ${BUILD_FRAGMENT}
`;

// Correct: Include all necessary fields for UI
export const BUILD_DETAIL_QUERY = gql`
  query GetBuildDetail($id: ID!) {
    build(id: $id) {
      ...BuildInfo
      parts { ...PartInfo }
      testRuns { ...TestRunInfo }
    }
  }
`;
```

#### Integration Test Approach
- Mock Apollo responses with sample data
- Verify query documents are valid GraphQL
- Check that nested resolvers return correct types

#### Files Involved
- `frontend/lib/graphql/queries.ts` (update/refactor)
- `backend-graphql/src/schema.graphql` (reference only)
- `frontend/lib/__tests__/graphql-queries.test.ts` (new)

---

### Phase B: Mutation Foundation & Hooks (10 hours, Days 1 afternoon + Day 2 morning)

**Purpose**: Implement mutations and custom React hooks with proper error handling.

#### Tasks (from Issue #6)
- Task 2: Create Apollo mutation documents (Create Build, Update Build Status, Add Part, Add TestRun)
- Task 3: Implement custom React hooks (useBuilds, useBuildById, useCreateBuild, useUpdateStatus, etc.)

#### Deliverables
- `frontend/lib/graphql/mutations.ts` — Mutation documents with proper error handling
- Enhanced `frontend/lib/apollo-hooks.ts` — Custom hooks with refetch, refetchQueries
- Error handling wrapper for mutations
- Type-safe hooks with proper TypeScript signatures

#### Estimated Duration
- 2 hours: Create mutation documents (similar to queries)
- 2 hours: Enhance existing hooks with better error handling
- 2 hours: Add refetchQueries strategy
- 2 hours: Create error handling wrapper
- 2 hours: Write integration tests for hooks (MockedProvider)

#### Technical Decisions
- **Mutation strategy**: Use `refetchQueries` for simple cases (e.g., createBuild refetches BUILDS_QUERY)
- **Error handling**: Wrap mutations with try-catch, extract error messages, expose via hook
- **Hook factory pattern**: Export both individual hooks and a factory for advanced use cases
- **Optimistic response**: Prepare structure for Phase C (don't implement fully yet, just structure)

#### Success Criteria
- ✓ All 4 mutation documents execute successfully
- ✓ Mutations return correct response shape
- ✓ Hooks properly handle success and error states
- ✓ refetchQueries updates dependent caches automatically
- ✓ Error messages are user-friendly (not GraphQL internal errors)
- ✓ Mutation hook tests pass (MockedProvider with success and error scenarios)

#### Key Patterns
```typescript
// Correct: Mutation with refetchQueries
export function useCreateBuild() {
  const [createBuild, { loading, error }] = useMutation(
    CREATE_BUILD_MUTATION,
    {
      refetchQueries: [
        { query: BUILDS_QUERY, variables: { limit: 10, offset: 0 } }
      ],
      onError: (error) => {
        // Handle error, emit toast, etc.
      }
    }
  );
  
  return {
    createBuild: async (name, desc) => {
      try {
        const result = await createBuild({ variables: { name, description: desc } });
        return result.data?.createBuild;
      } catch (e) {
        // Error already handled in onError
        throw e;
      }
    },
    loading,
    error: error?.message || null
  };
}

// Correct: Wrap mutation errors for user-friendly display
export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    return error.graphQLErrors[0]?.message || 'GraphQL error occurred';
  }
  return 'Unknown error occurred';
}
```

#### Integration Test Approach
- Use MockedProvider to mock mutation responses
- Test success path (data returned correctly)
- Test error path (error message extracted)
- Test refetchQueries trigger

#### Files Involved
- `frontend/lib/graphql/mutations.ts` (new, or merge with queries)
- `frontend/lib/apollo-hooks.ts` (enhance)
- `frontend/lib/graphql-error-handler.ts` (new)
- `frontend/lib/__tests__/apollo-hooks.test.tsx` (update)

---

### Phase C: Optimistic Updates & Real-Time Sync (10 hours, Days 2 afternoon + Day 3 morning)

**Purpose**: Implement instant UI feedback and real-time synchronization across clients.

#### Tasks (from Issue #6)
- Task 5: Implement Apollo cache updates triggered by SSE events
- Task 6: Implement optimistic updates for all mutations

#### Deliverables
- Enhanced `frontend/lib/apollo-hooks.ts` with optimistic responses
- Enhanced `frontend/lib/use-sse-events.ts` with targeted cache updates
- RealtimeEvents component integration with Apollo cache
- Documentation of optimistic update patterns

#### Estimated Duration
- 2 hours: Add optimisticResponse to each mutation hook
- 2 hours: Enhance useSSEEvents to parse event data and update cache
- 2 hours: Implement cache invalidation strategy (selective vs. full refetch)
- 2 hours: Test optimistic update + server confirmation flow
- 2 hours: Integration tests (optimistic → server response → cache sync)

#### Technical Decisions
- **Optimistic response structure**: Mirror server response shape exactly
- **Cache update strategy**: Use `update` function for fine-grained control (not just refetchQueries)
- **SSE event parsing**: Extract `buildId` from event payload to target updates
- **Reconciliation**: If optimistic update differs from server response, update to server value
- **Cache invalidation**: Use selective cache updates for performance (evict only affected fields)

#### Success Criteria
- ✓ UI updates immediately when mutation is called (optimistic response visible)
- ✓ When server confirms, UI updates with actual server data
- ✓ SSE event triggers cache update on other clients
- ✓ If optimistic response differs from server, server wins
- ✓ Multiple clients stay in sync (no stale data)
- ✓ No duplicate renders or cache thrashing
- ✓ Tests pass for optimistic → server flow

#### Key Patterns
```typescript
// Correct: Optimistic update with exact response shape
export function useUpdateBuildStatus() {
  const [updateStatus, { loading, error }] = useMutation(
    UPDATE_BUILD_STATUS_MUTATION,
    {
      optimisticResponse: (variables) => ({
        __typename: 'Mutation',
        updateBuildStatus: {
          __typename: 'Build',
          id: variables.id,
          status: variables.status,
          updatedAt: new Date().toISOString(),
          // Include all fields from BUILD_FRAGMENT
        }
      }),
      update: (cache, { data }) => {
        if (!data?.updateBuildStatus) return;
        
        // Update cache with server response (reconciles optimistic if different)
        cache.modify({
          fields: {
            builds: (existing) => existing.map(b => 
              b.id === data.updateBuildStatus.id 
                ? data.updateBuildStatus 
                : b
            )
          }
        });
      }
    }
  );
  
  return { updateStatus, loading, error };
}

// Correct: SSE listener with targeted cache update
export function useSSEEvents() {
  const client = useApolloClient();
  
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/events');
    
    eventSource.addEventListener('buildStatusChanged', (event) => {
      const { buildId, status } = JSON.parse(event.data);
      
      // Update only the specific build in cache
      client.cache.modify({
        id: client.cache.identify({ __typename: 'Build', id: buildId }),
        fields: {
          status: () => status
        }
      });
    });
    
    return () => eventSource.close();
  }, [client]);
}
```

#### Integration Test Approach
- Test optimistic response shows before mutation completes
- Verify server response updates cache
- Simulate SSE event and verify cache update on other client instance
- Check no N+1 cache queries during updates

#### Files Involved
- `frontend/lib/apollo-hooks.ts` (enhance with optimistic + update)
- `frontend/lib/use-sse-events.ts` (enhance with event parsing)
- `frontend/components/RealtimeEvents.tsx` (new, if needed)
- `frontend/lib/__tests__/optimistic-updates.test.tsx` (new)

---

### Phase D: Error Handling & Resilience (6 hours, Day 3 afternoon)

**Purpose**: Build robust error handling for network issues, timeouts, and retry logic.

#### Tasks (from Issue #6)
- Task 7: Add error handling (network errors, timeout errors, retry logic)

#### Deliverables
- Error handling utilities (`frontend/lib/graphql-error-handler.ts`)
- Retry logic for queries and mutations
- Network error detection and user feedback
- Timeout handling with exponential backoff
- SSE reconnection strategy

#### Estimated Duration
- 1 hour: Error classification (network, timeout, GraphQL, validation)
- 1 hour: Retry logic with exponential backoff
- 1 hour: Network status detection
- 1 hour: Timeout configuration and handling
- 1 hour: SSE reconnection strategy
- 1 hour: Error tests

#### Technical Decisions
- **Retry strategy**: Exponential backoff (1s → 2s → 4s → 8s, max 5 retries)
- **Error types**: Network (fetch failed), GraphQL (bad query/mutation), Timeout (>10s), Validation (input error)
- **User feedback**: Toast notifications for errors, retry UI for network errors
- **SSE reconnection**: Automatic reconnection with exponential backoff, max 30s between attempts
- **Graceful degradation**: Show cached data if network fails (if available)

#### Success Criteria
- ✓ Network errors detected and reported to user
- ✓ Queries retry automatically with exponential backoff
- ✓ Mutations show error toast on failure
- ✓ Timeout errors are specific and actionable
- ✓ SSE reconnects automatically on disconnect
- ✓ Cached data shown during offline periods
- ✓ Error messages are user-friendly

#### Key Patterns
```typescript
// Correct: Network error detection and retry
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isNetworkError(error) || attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Correct: SSE reconnection with exponential backoff
export function useSSEEvents() {
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempt = useRef(0);
  
  useEffect(() => {
    function connect() {
      try {
        const es = new EventSource('http://localhost:5000/events');
        
        es.onopen = () => {
          setIsConnected(true);
          reconnectAttempt.current = 0; // Reset on successful connection
        };
        
        es.onerror = () => {
          es.close();
          setIsConnected(false);
          
          // Exponential backoff for reconnection
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
          reconnectAttempt.current++;
          
          setTimeout(connect, delay);
        };
      } catch (error) {
        console.error('Failed to connect to SSE:', error);
        setTimeout(connect, 5000); // Retry in 5s if initial connection fails
      }
    }
    
    connect();
  }, []);
}
```

#### Integration Test Approach
- Simulate network errors (fetch throws)
- Verify retry logic executes
- Test timeout scenarios
- Verify SSE reconnection attempts
- Check error messages are user-friendly

#### Files Involved
- `frontend/lib/graphql-error-handler.ts` (new)
- `frontend/lib/use-sse-events.ts` (enhance)
- `frontend/lib/__tests__/error-handling.test.ts` (new)

---

### Phase E: Testing & Performance Verification (6 hours, Day 4)

**Purpose**: Achieve >80% test coverage and verify performance targets.

#### Tasks (from Issue #6)
- Task 8: Create integration tests (queries, mutations, SSE sync, optimistic updates)
- Task 9: Performance testing (verify no N+1 queries, measure latency)

#### Deliverables
- Integration test suite for all queries and mutations
- SSE sync integration tests (multi-client scenarios)
- Optimistic update tests
- Performance benchmarks (query latency, mutation latency, N+1 check)
- Test coverage report (target >80%)

#### Estimated Duration
- 2 hours: Integration tests for queries and mutations
- 1.5 hours: SSE sync tests (multi-client scenarios)
- 1 hour: Optimistic update tests
- 1 hour: Performance benchmarks
- 0.5 hours: Coverage report and gap analysis

#### Technical Decisions
- **Test framework**: Vitest + React Testing Library
- **Mocking**: MockedProvider for Apollo, mock EventSource for SSE
- **Performance metrics**: Use `performance.now()` for latency, check Apollo cache queries count
- **N+1 detection**: Parse GraphQL queries in backend logs, verify batching
- **Coverage threshold**: Aim for 80+%, accept <75% with justified exceptions

#### Success Criteria
- ✓ Integration tests cover: query success, query error, mutation success, mutation error
- ✓ SSE tests verify cache updates on multiple client instances
- ✓ Optimistic update tests verify instant UI feedback + server reconciliation
- ✓ Performance tests show <100ms for queries and mutations
- ✓ N+1 detection confirms DataLoader batching (no cascading queries)
- ✓ Test coverage >80% for all frontend code
- ✓ All tests pass in CI/CD

#### Key Patterns
```typescript
// Correct: Integration test for mutation + SSE
describe('Build status update with real-time sync', () => {
  it('should update status optimistically, then sync via SSE', async () => {
    const { result, rerender } = renderHook(
      () => useBuildDetail('build-123'),
      { wrapper: MockedApolloProvider }
    );
    
    // Wait for initial query
    await waitFor(() => expect(result.current.build?.id).toBe('build-123'));
    expect(result.current.build?.status).toBe('PENDING');
    
    // Simulate mutation
    const { result: mutationResult } = renderHook(
      () => useUpdateBuildStatus(),
      { wrapper: MockedApolloProvider }
    );
    
    mutationResult.current.updateStatus('build-123', 'RUNNING');
    
    // Check optimistic update
    expect(result.current.build?.status).toBe('RUNNING');
    
    // Wait for server response
    await waitFor(() => {
      expect(result.current.build?.status).toBe('RUNNING');
      expect(result.current.build?.updatedAt).toBeTruthy();
    });
  });
});

// Correct: Performance test for N+1 detection
describe('N+1 query prevention', () => {
  it('should batch load parts and test runs with DataLoader', async () => {
    const queryCount = new Map<string, number>();
    
    // Spy on Apollo cache queries
    const client = makeClient();
    const originalQuery = client.query.bind(client);
    
    client.query = jest.fn(async (options) => {
      const key = options.query.loc?.source.body || 'unknown';
      queryCount.set(key, (queryCount.get(key) || 0) + 1);
      return originalQuery(options);
    });
    
    // Load builds with parts and test runs
    const result = await client.query({ query: GET_BUILDS });
    
    // Should be exactly 2 queries: builds + parts + testRuns
    expect(queryCount.size).toBeLessThanOrEqual(2);
  });
});
```

#### Integration Test Approach
- Use MockedProvider with mocked query/mutation results
- Mock EventSource for SSE tests
- Simulate multiple client instances (create multiple MockedProvider instances)
- Verify cache updates across instances
- Measure query and mutation latency with performance.now()

#### Files Involved
- `frontend/lib/__tests__/integration.test.tsx` (new, comprehensive)
- `frontend/lib/__tests__/sse-sync.test.tsx` (new, multi-client)
- `frontend/lib/__tests__/performance.test.ts` (new, N+1 and latency)

---

## 3. Day-by-Day Execution Roadmap

### **Day 1: Query Foundation & Mutation Setup (8 hours)**

#### Morning (4 hours): Phase A — Query Foundation
- **08:00–09:00**: Review schema and existing query documents
  - Read `backend-graphql/src/schema.graphql`
  - Review `frontend/lib/graphql-queries.ts`
  - Check for N+1 patterns in resolvers
  
- **09:00–10:00**: Refactor query documents for consistency
  - Extract reusable fragments (BUILD_FRAGMENT, PART_FRAGMENT, TEST_RUN_FRAGMENT)
  - Ensure all fields match schema
  - Add variables for pagination
  
- **10:00–11:00**: Test queries in GraphiQL IDE
  - Start `pnpm dev:graphql`
  - Execute each query in GraphiQL
  - Verify response shapes
  - Check backend logs for DataLoader batching
  
- **11:00–12:00**: Initial unit tests for queries
  - Create `frontend/lib/__tests__/graphql-queries.test.ts`
  - Test query document parsing
  - Test variable substitution

#### Afternoon (4 hours): Phase B — Mutation Setup (partial)
- **13:00–14:00**: Create mutation documents
  - Create `frontend/lib/graphql/mutations.ts`
  - Define CREATE_BUILD, UPDATE_BUILD_STATUS, ADD_PART, SUBMIT_TEST_RUN
  - Use same fragment pattern as queries
  
- **14:00–15:00**: Review existing hooks
  - Examine `frontend/lib/apollo-hooks.ts`
  - Identify what's already implemented
  - Plan enhancements for Phase B
  
- **15:00–16:00**: Start error handling utilities
  - Create `frontend/lib/graphql-error-handler.ts`
  - Define error classification functions
  - Plan retry logic (implement in Day 3)
  
- **16:00–17:00**: Documentation
  - Document query/mutation patterns
  - Add code comments for future reference
  - Prepare Phase B task list

#### Day 1 Checkpoint
- ✓ All query documents execute in GraphiQL
- ✓ Backend logs confirm no N+1 queries
- ✓ Mutation documents created and validated
- ✓ Error handling structure in place
- **Ready for**: Phase B hook implementation on Day 2

---

### **Day 2: Mutation Hooks & Optimistic Updates (8 hours)**

#### Morning (4 hours): Phase B — Complete Hooks
- **08:00–09:00**: Enhance mutation hooks with error handling
  - Update `frontend/lib/apollo-hooks.ts`
  - Add try-catch to all mutation functions
  - Extract and expose error messages
  
- **09:00–10:00**: Add refetchQueries strategy
  - Update `useCreateBuild` to refetch `BUILDS_QUERY`
  - Update `useAddPart` to refetch `BUILD_DETAIL_QUERY`
  - Document refetch strategy in comments
  
- **10:00–11:00**: Write hook integration tests
  - Create `frontend/lib/__tests__/apollo-hooks.test.tsx`
  - Test successful mutation flow
  - Test error handling path
  - Use MockedProvider for mocking
  
- **11:00–12:00**: Code review and refinement
  - Review hook signatures for consistency
  - Test all hooks in development environment
  - Fix any type errors

#### Afternoon (4 hours): Phase C — Optimistic Updates (partial)
- **13:00–14:00**: Plan optimistic response structure
  - Map each mutation to its response shape
  - Document required fields for optimistic update
  - Create helper for generating optimistic responses
  
- **14:00–15:00**: Implement optimistic updates in hooks
  - Add `optimisticResponse` to each mutation
  - Use helper for consistent responses
  - Test optimistic UI updates
  
- **15:00–16:00**: Plan cache update strategy
  - Design selective vs. full cache invalidation
  - Map SSE events to cache updates
  - Document patterns
  
- **16:00–17:00**: Prepare Phase C tasks
  - List all cache update scenarios
  - Prepare test cases for SSE sync
  - Document implementation approach

#### Day 2 Checkpoint
- ✓ All mutation hooks have error handling
- ✓ refetchQueries implemented for dependent queries
- ✓ Hook tests pass (MockedProvider)
- ✓ Optimistic responses implemented
- **Ready for**: Real-time sync integration on Day 3

---

### **Day 3: Real-Time Sync & Error Handling (8 hours)**

#### Morning (4 hours): Phase C — Real-Time Sync & Phase D — Errors
- **08:00–09:00**: Enhance useSSEEvents for cache updates
  - Update `frontend/lib/use-sse-events.ts`
  - Add event parsing and data extraction
  - Implement targeted cache updates (not full invalidation)
  
- **09:00–10:00**: Test SSE event flow
  - Trigger mutation in one client
  - Verify event broadcast from Express
  - Verify cache update in other client instance
  - Check no duplicate renders
  
- **10:00–11:00**: Implement network error detection
  - Add error classification in `graphql-error-handler.ts`
  - Detect network vs. GraphQL errors
  - Add error type constants
  
- **11:00–12:00**: Test error scenarios
  - Simulate network failure
  - Verify error detection
  - Test error message exposure

#### Afternoon (4 hours): Phase D — Error Handling & Resilience
- **13:00–14:00**: Implement retry logic
  - Add exponential backoff helper
  - Integrate with query and mutation hooks
  - Configure max retries and base delay
  
- **14:00–15:00**: Implement SSE reconnection
  - Add automatic reconnection with backoff
  - Track connection status
  - Expose connection status to UI (for connection indicator)
  
- **15:00–16:00**: Write error handling tests
  - Create `frontend/lib/__tests__/error-handling.test.ts`
  - Test retry logic
  - Test SSE reconnection
  - Verify error messages
  
- **16:00–17:00**: Integration testing
  - Test full mutation → SSE → cache update flow
  - Test error scenarios in full flow
  - Verify no orphaned promises or memory leaks

#### Day 3 Checkpoint
- ✓ SSE events update Apollo cache in real-time
- ✓ Multiple clients stay in sync
- ✓ Network errors are detected and retried
- ✓ SSE reconnects automatically
- ✓ Error tests pass
- **Ready for**: Performance testing on Day 4

---

### **Day 4: Integration Testing & Performance (8 hours)**

#### Morning (4 hours): Phase E — Integration Tests
- **08:00–09:00**: Create comprehensive integration test suite
  - Create `frontend/lib/__tests__/integration.test.tsx`
  - Test full query flow (load → render → update)
  - Test full mutation flow (optimistic → server → cache)
  
- **09:00–10:00**: Create SSE sync tests
  - Create `frontend/lib/__tests__/sse-sync.test.tsx`
  - Simulate multiple clients
  - Verify cross-client sync
  - Test edge cases (rapid mutations, network lag)
  
- **10:00–11:00**: Create optimistic update tests
  - Test optimistic response shows immediately
  - Test reconciliation when server response differs
  - Test error rollback (mutation fails, optimistic undone)
  
- **11:00–12:00**: Test coverage analysis
  - Run `pnpm test:frontend -- --coverage`
  - Identify gaps (target >80%)
  - Add missing test cases

#### Afternoon (4 hours): Phase E — Performance Testing
- **13:00–14:00**: Create performance benchmarks
  - Create `frontend/lib/__tests__/performance.test.ts`
  - Measure query latency (target <100ms)
  - Measure mutation latency (target <100ms)
  - Measure SSE event latency (target <50ms)
  
- **14:00–15:00**: N+1 query detection
  - Spy on Apollo cache queries
  - Load builds with nested parts and test runs
  - Verify ≤2 queries (builds + related data)
  - Check backend DataLoader logs
  
- **15:00–16:00**: Load testing
  - Simulate 10+ builds with parts and test runs
  - Verify performance remains acceptable
  - Check memory usage doesn't spike
  
- **16:00–17:00**: Final verification and documentation
  - Run all tests (`pnpm test:frontend`)
  - Verify coverage >80%
  - Document performance baselines
  - Prepare for Day 5 (if needed)

#### Day 4 Checkpoint
- ✓ Integration tests pass (>80% coverage)
- ✓ Performance tests show acceptable latency (<100ms)
- ✓ N+1 queries prevented
- ✓ All acceptance criteria met
- **Status**: Ready for final code review and PR

---

### **Day 5 (Optional): Code Review, Polish, and Integration**

If Days 1–4 finish early or if additional refinement is needed:

- **Code Review**: Address any issues from peer review
- **E2E Testing**: Run full application flow via Playwright (if E2E tests exist)
- **Documentation**: Update CLAUDE.md and DESIGN.md with new patterns
- **Cleanup**: Remove TODOs, add final comments
- **PR Preparation**: Push feature branch, create PR with detailed description

---

## 4. Sprinted Task List (Ready for Kanban/GitHub Projects)

| Task ID | Title | Est. Hours | Success Criteria | Dependencies | Phase | Priority |
|---------|-------|-----------|------------------|--------------|-------|----------|
| 6.1-A | Query Documents: Create & Organize | 2 | Queries execute in GraphiQL, fragments defined, no N+1 | schema.graphql | A | 🔴 |
| 6.1-B | Query Integration Tests | 3 | Tests mock and validate query responses, >95% coverage | 6.1-A | A | 🔴 |
| 6.2-A | Mutation Documents: Create All | 2 | Mutations defined, variables for all inputs, response shapes match schema | schema.graphql | B | 🔴 |
| 6.2-B | Mutation Hooks: Error Handling | 2 | Hooks extract error messages, expose via return value | 6.2-A | B | 🔴 |
| 6.2-C | Mutation Hooks: refetchQueries | 2 | Dependent queries auto-refetch on mutation success | 6.2-B | B | 🔴 |
| 6.2-D | Mutation Hook Tests | 2 | MockedProvider tests, success + error paths | 6.2-C | B | 🔴 |
| 6.3-A | Optimistic Updates: Implement | 2 | Optimistic response shows before server confirms, UI updates immediately | 6.2-C | C | 🟡 |
| 6.3-B | SSE Events: Cache Updates | 2 | Event payload parsed, specific cache fields updated, multiple clients sync | useSSEEvents | C | 🟡 |
| 6.3-C | SSE/Optimistic Integration Tests | 2 | Tests verify optimistic → server → cache flow, multi-client sync | 6.3-A, 6.3-B | C | 🟡 |
| 6.4-A | Error Classification Utilities | 1 | Network errors, GraphQL errors, timeouts distinguished | apollo-hooks | D | 🟡 |
| 6.4-B | Retry Logic with Exponential Backoff | 1 | Queries retry, max 5 attempts, delay: 1s, 2s, 4s, 8s, 16s | 6.4-A | D | 🟡 |
| 6.4-C | SSE Reconnection Strategy | 1 | Auto-reconnect on disconnect, exponential backoff, max 30s | useSSEEvents | D | 🟡 |
| 6.4-D | Error Handling Tests | 1 | Network error retry, timeout, SSE reconnection, error messages | 6.4-A, 6.4-B, 6.4-C | D | 🟡 |
| 6.5-A | Integration Test Suite | 2 | Query, mutation, error scenarios, MockedProvider | 6.1-B, 6.2-D, 6.3-C | E | 🟢 |
| 6.5-B | SSE Sync Multi-Client Tests | 1.5 | Multiple client instances, cache sync verified | 6.3-C | E | 🟢 |
| 6.5-C | Performance Benchmarks | 1 | Query <100ms, mutation <100ms, N+1 verification | All phases | E | 🟢 |
| 6.5-D | Test Coverage Report & Gap Analysis | 0.5 | Coverage >80%, gaps identified and justified | All tests | E | 🟢 |

### Task Dependencies Map

```
6.1-A (Query Documents)
  ├── 6.1-B (Query Tests)
  │   └── 6.5-A (Integration Tests)
  │       └── 6.5-C (Performance)
  │           └── Done!

6.2-A (Mutation Documents)
  ├── 6.2-B (Error Handling)
  │   ├── 6.2-C (refetchQueries)
  │   │   ├── 6.2-D (Mutation Tests)
  │   │   │   └── 6.5-A (Integration Tests)
  │   │   └── 6.3-A (Optimistic Updates)
  │   │       └── 6.3-C (SSE/Optimistic Tests)
  │   │           └── 6.5-A (Integration Tests)
  │   └── 6.4-A (Error Classification)
  │       ├── 6.4-B (Retry Logic)
  │       │   └── 6.4-D (Error Tests)
  │       └── 6.4-C (SSE Reconnection)
  │           └── 6.4-D (Error Tests)
  │               └── 6.5-A (Integration Tests)

6.3-B (SSE Cache Updates)
  └── 6.3-C (SSE/Optimistic Tests)
      └── 6.5-B (Multi-Client Tests)
          └── Done!
```

---

## 5. Risk Register & Mitigation

### Risk 1: N+1 Query Cascading (High Probability, High Impact)

**Description**: Frontend queries build with parts and test runs, but backend resolvers don't batch load, causing 1 + N + N*M queries.

**Impact**: Performance degradation, rejection of PR for exceeding <100ms latency target.

**Probability**: Medium (depends on resolver implementation in Issues #2–3)

**Mitigation**:
- ✅ Verify DataLoader is used in all nested resolvers (Build.parts, Build.testRuns)
- ✅ Check backend logs before starting frontend work
- ✅ Add performance test that counts GraphQL queries
- ✅ If N+1 detected, debug resolver DataLoader configuration

**Testing**:
```typescript
// Performance test catches N+1 immediately
it('should batch load related data without N+1', async () => {
  const queryLog = captureGraphQLQueries();
  
  // Load 10 builds with parts and test runs
  await client.query({ query: GET_BUILDS, variables: { limit: 10 } });
  
  // Should be 2-3 queries max (not 1 + 10 + 10*M)
  expect(queryLog.length).toBeLessThanOrEqual(3);
});
```

---

### Risk 2: SSE Connection Loss During Heavy Load (Medium Probability, High Impact)

**Description**: SSE connection drops under heavy mutation load (rapid updates), clients miss cache updates.

**Impact**: Data inconsistency across clients, user confusion, potential data loss.

**Probability**: Medium (depends on network and Express event bus stability)

**Mitigation**:
- ✅ Implement automatic SSE reconnection with exponential backoff (Phase D)
- ✅ Cache mutation optimistic responses locally until SSE confirms
- ✅ Add connection status indicator to UI
- ✅ Test reconnection under heavy load (10+ rapid mutations)
- ✅ Consider WebSocket upgrade if SSE unreliable (future)

**Testing**:
```typescript
// Test SSE reconnection under load
it('should maintain sync even if SSE disconnects', async () => {
  const eventSource = mockEventSource();
  
  // Simulate 10 rapid mutations
  for (let i = 0; i < 10; i++) {
    await updateBuild(i, 'RUNNING');
  }
  
  // Simulate SSE disconnect after 5 mutations
  eventSource.simulate('disconnect');
  
  // Mutations 6-10 should still be cached locally
  // When SSE reconnects, updates should sync
  eventSource.simulate('reconnect');
  
  // Verify all 10 updates applied to cache
  expect(cache.readQuery(GET_BUILDS).builds).toHaveLength(10);
});
```

---

### Risk 3: Optimistic Update Rollback Edge Case (Medium Probability, Medium Impact)

**Description**: User sees optimistic update (e.g., status = RUNNING), but server rejects mutation. UI shows RUNNING but server has PENDING. Reconciliation fails.

**Impact**: User confusion, potential data corruption if user re-acts on optimistic state.

**Probability**: Medium (depends on mutation validation in backend)

**Mitigation**:
- ✅ Implement explicit error rollback (revert optimistic response)
- ✅ Display error message when mutation fails
- ✅ Refetch affected data from server on error
- ✅ Add tests for mutation failure scenarios
- ✅ Mock validation errors (e.g., buildId not found)

**Testing**:
```typescript
// Test optimistic rollback on error
it('should rollback optimistic update on mutation error', async () => {
  const { result } = renderHook(
    () => useBuildDetail('nonexistent-id'),
    { wrapper: MockedApolloProvider }
  );
  
  // Initial state
  expect(result.current.build?.status).toBe('PENDING');
  
  // Attempt mutation (will fail on invalid ID)
  result.current.updateStatus('RUNNING');
  
  // Optimistic shows immediately
  expect(result.current.build?.status).toBe('RUNNING');
  
  // Wait for error
  await waitFor(() => expect(result.current.error).toBeTruthy());
  
  // Should revert to PENDING
  expect(result.current.build?.status).toBe('PENDING');
});
```

---

### Risk 4: Apollo Cache Thrashing on Rapid Updates (Low Probability, Medium Impact)

**Description**: Rapid SSE events cause excessive cache invalidations and re-renders, slowing UI.

**Impact**: Performance degradation, janky UI updates, possible memory leaks.

**Probability**: Low (Apollo caching is efficient, but worth verifying)

**Mitigation**:
- ✅ Use targeted cache updates (update specific fields, not full invalidation)
- ✅ Batch cache updates using `cache.batch()` if available
- ✅ Debounce SSE event listeners if needed
- ✅ Monitor re-renders with React DevTools profiler
- ✅ Add performance tests for cache update latency

**Testing**:
```typescript
// Monitor cache update performance
it('should update cache efficiently without thrashing', async () => {
  const renderSpy = jest.fn();
  
  const { result } = renderHook(
    () => {
      renderSpy();
      return useBuildDetail('build-1');
    },
    { wrapper: MockedApolloProvider }
  );
  
  // Simulate 100 rapid SSE events
  for (let i = 0; i < 100; i++) {
    eventBus.emit('buildStatusChanged', { buildId: 'build-1', status: 'RUNNING' });
  }
  
  // Should cause minimal re-renders (not 100+)
  expect(renderSpy.mock.calls.length).toBeLessThan(10);
});
```

---

### Risk 5: Test Isolation & Flakiness (Low Probability, Medium Impact)

**Description**: Tests pass locally but fail in CI due to timing issues, shared state, or race conditions.

**Impact**: Blocked PRs, team friction, reduced confidence in tests.

**Probability**: Low (with proper setup), but common in real-world projects

**Mitigation**:
- ✅ Use global test setup for cleaning state (already in place for localStorage)
- ✅ Avoid shared state across tests (use fresh MockedProvider for each test)
- ✅ Use `waitFor()` instead of arbitrary delays
- ✅ Run tests in parallel locally to catch race conditions
- ✅ Use `flaky: true` in test runner if race conditions unavoidable

**Testing**:
```bash
# Run tests in parallel to catch race conditions
pnpm test:frontend --run -- --sequence.parallel

# Run tests in random order to catch hidden dependencies
pnpm test:frontend --run -- --sequence.shuffle

# Both should pass with >95% success rate
```

---

## 6. Parallel Work Opportunities

### Independent Task Streams

Several tasks can run in parallel without blocking others. Here's the recommended parallelization:

#### Stream 1: Query & Test Foundation (Critical Path)
```
Day 1: Phase A (Query Documents) → Must complete
    → Phase B (Mutations) → Must complete
        → Phase C (Optimistic) → Must complete
            → Phase E (Tests) → Must complete
```
**Duration**: ~24 hours (Days 1–2.5)
**Assigned to**: Primary developer

#### Stream 2: Error Handling & Resilience (Parallel after Phase B)
```
After Phase B complete:
    Day 2.5: Phase D (Error Handling) → Can run in parallel with Phase C
    → Phase E Tests incorporate error scenarios
```
**Duration**: ~6 hours (Day 2.5–3)
**Can be done by**: Same developer (sequential phases)

#### Stream 3: Performance & Documentation (Parallel in final days)
```
After Phase C complete:
    Day 4: Phase E (Performance Tests) → Can run in parallel with final Phase D
    → Benchmark creation, N+1 detection, latency testing
```
**Duration**: ~4 hours (Day 4)
**Can be done by**: Same developer or separate reviewer

### Parallelization Timeline

```
Day 1
├─ Morning: Phase A (Query Documents) [4h]
└─ Afternoon: Phase B (Mutations) [4h]

Day 2
├─ Morning: Phase B Complete + Phase C Start [4h]
└─ Afternoon: Phase C (Optimistic) + Phase D Start [4h]

Day 3
├─ Morning: Phase C Complete + Phase D Continue [4h]
└─ Afternoon: Phase D Complete + Phase E Start [4h]

Day 4
├─ Morning: Phase E (Integration Tests) [4h]
└─ Afternoon: Phase E (Performance Tests) [4h]

Total: 32 hours (4 days, well within 4–5 day estimate)
```

### Recommended Coordinator Tasks (If Team of 2+)

If you have additional developer(s):

**Developer A (Primary)**:
- Phase A: Query Foundation
- Phase B: Mutation Hooks
- Phase C: Optimistic Updates
- Phase D: Error Handling
- Phase E Day 1: Integration Tests

**Developer B (Optional, for parallel work)**:
- After Phase B: Documentation & Code Comments
- During Phase C: Set up E2E tests (if using Playwright)
- During Phase D: Create error handling documentation
- Phase E Day 2: Performance benchmarking & profiling

**Coordinator (could be same as Developer A)**:
- Track progress against timeline
- Merge code and resolve conflicts
- Review for acceptance criteria
- Handle blockers from #2, #3, #4 if they arise

---

## 7. Critical Decision Points & Design Rationale

### Decision 1: Query Document Organization

**Question**: Single file (`frontend/lib/graphql/queries.ts`) or multiple files (`queries/builds.ts`, `queries/parts.ts`, etc.)?

**Decision**: **Single file** for Phase 1 (MVP)

**Rationale**:
- Current codebase already uses single file (`graphql-queries.ts`)
- Easier to navigate while learning patterns
- Easy to refactor if file grows >500 LOC
- Fragment reuse is clearer in single file
- Reduced import complexity

**Upgrade Path**: Split into multiple files in Phase 2 if needed

```typescript
// Single file (Phase 1) — Recommended
frontend/lib/graphql/queries.ts
  ├─ Fragments: BUILD_FRAGMENT, PART_FRAGMENT, TEST_RUN_FRAGMENT
  ├─ Queries: BUILDS_QUERY, BUILD_DETAIL_QUERY, TEST_RUNS_QUERY
  └─ Mutations: CREATE_BUILD_MUTATION, UPDATE_BUILD_STATUS_MUTATION, ...

// Multiple files (Phase 2) — Upgrade path
frontend/lib/graphql/
  ├─ fragments.ts
  ├─ queries/
  │   ├─ builds.ts
  │   ├─ parts.ts
  │   └─ testRuns.ts
  ├─ mutations/
  │   ├─ builds.ts
  │   ├─ parts.ts
  │   └─ testRuns.ts
  └─ hooks/
      ├─ useBuilds.ts
      ├─ useCreateBuild.ts
      └─ ...
```

---

### Decision 2: Custom Hook Patterns

**Question**: How to structure hooks? Individual hooks (`useBuilds`, `useCreateBuild`) or factory pattern?

**Decision**: **Individual hooks** with optional factory pattern for advanced use cases

**Rationale**:
- Simpler API for 90% of use cases
- Better TypeScript inference for return types
- Easier to test individually
- Better tree-shaking for unused hooks
- Can add factory later if needed

```typescript
// Recommended: Individual hooks (90% of cases)
const { builds, loading, error } = useBuilds(10, 0);
const { createBuild, loading, error } = useCreateBuild();
const { updateStatus, loading, error } = useUpdateBuildStatus();

// Optional: Factory for advanced cases (10%)
const buildOps = useBuildOperations({
  autoRefetch: true,
  onError: (error) => console.error(error),
  cachePolicy: 'cache-and-network'
});

const { builds } = await buildOps.query.builds();
const { build } = await buildOps.query.buildDetail('id');
const { result } = await buildOps.mutation.createBuild('name');
```

---

### Decision 3: Cache Update Strategy

**Question**: Invalidate entire cache (`evict` + `gc`) or selective updates?

**Decision**: **Selective cache updates** (targeted, efficient)

**Rationale**:
- Full invalidation (`evict` + `gc`) is hammer approach
- Selective updates use Apollo `modify()` to update specific fields
- Reduced re-renders and performance better
- Easier to debug
- Matches Apollo best practices

```typescript
// ❌ Avoid: Full invalidation (hammer approach)
eventSource.addEventListener('buildStatusChanged', () => {
  client.cache.evict({ fieldName: 'builds' });
  client.cache.gc(); // Forces full refetch
});

// ✅ Recommended: Selective update (surgical)
eventSource.addEventListener('buildStatusChanged', (event) => {
  const { buildId, status } = JSON.parse(event.data);
  
  client.cache.modify({
    id: client.cache.identify({ __typename: 'Build', id: buildId }),
    fields: {
      status: () => status
    }
  });
});
```

---

### Decision 4: Error Handling Strategy

**Question**: Handle errors at hook level or component level?

**Decision**: **Hybrid approach**: Handle at hook level (extraction), expose at component level (display)

**Rationale**:
- Hooks extract and classify errors
- Components decide how to display (toast, alert, inline)
- Separation of concerns
- Reusable error handling across components
- Better testability

```typescript
// Hook level: Extract and classify errors
export function useCreateBuild() {
  const [createBuild, { loading, error }] = useMutation(CREATE_BUILD_MUTATION, {
    onError: (apolloError) => {
      const message = extractErrorMessage(apolloError);
      console.error('Build creation failed:', message);
      // Could emit event here if needed
    }
  });
  
  return {
    createBuild,
    loading,
    error: error?.message || null
  };
}

// Component level: Display error
export function BuildForm() {
  const { createBuild, loading, error } = useCreateBuild();
  
  return (
    <>
      {error && <Toast severity="error" message={error} />}
      <button onClick={() => createBuild('name')} disabled={loading}>
        Create Build
      </button>
    </>
  );
}
```

---

### Decision 5: SSE Reconnection Strategy

**Question**: Exponential backoff or fixed delay?

**Decision**: **Exponential backoff** with cap (1s → 2s → 4s → 8s → 16s → 30s max)

**Rationale**:
- Avoids hammering server with rapid reconnection attempts
- Gives server time to recover from transient issues
- Reduces noise in logs
- Standard industry practice
- Configurable for different scenarios

```typescript
// Exponential backoff with cap
const MAX_BACKOFF_MS = 30000; // 30 seconds
const BASE_BACKOFF_MS = 1000; // 1 second
const MAX_ATTEMPTS = 10;

let attemptCount = 0;

function reconnect() {
  const delay = Math.min(
    BASE_BACKOFF_MS * Math.pow(2, attemptCount),
    MAX_BACKOFF_MS
  );
  
  attemptCount++;
  
  if (attemptCount > MAX_ATTEMPTS) {
    console.error('Max reconnection attempts reached');
    return;
  }
  
  console.log(`Attempting to reconnect in ${delay}ms...`);
  setTimeout(() => connect(), delay);
}
```

---

### Decision 6: Optimistic Response Handling

**Question**: Should optimistic response always match server, or can it be incomplete?

**Decision**: **Optimistic response must include all required fields** (BUILD_FRAGMENT fields)

**Rationale**:
- Ensures no UI errors from missing fields
- If field is optional in schema, it's optional in response
- If field is required in schema, must be in optimistic response
- Server reconciliation updates if values differ

```typescript
// ✅ Correct: Optimistic includes all required fields
optimisticResponse: {
  __typename: 'Mutation',
  updateBuildStatus: {
    __typename: 'Build',
    id: variables.id,
    name: 'Build Name',  // Required
    status: variables.status,  // Required
    createdAt: new Date().toISOString(),  // Required
    updatedAt: new Date().toISOString(),  // Required
    description: 'Description',  // Optional but good to include
    parts: [],  // Empty array is safe if type is [Part!]!
    testRuns: []  // Empty array is safe if type is [TestRun!]!
  }
};

// ❌ Avoid: Missing required fields
optimisticResponse: {
  __typename: 'Mutation',
  updateBuildStatus: {
    __typename: 'Build',
    id: variables.id,
    status: variables.status
    // Missing: name, createdAt, updatedAt → UI error
  }
};
```

---

## 8. Implementation Checklist

Use this checklist to track progress through the issue:

### Phase A: Query Foundation
- [ ] Review GraphQL schema and existing queries
- [ ] Refactor query documents with fragments
- [ ] Test all queries in GraphiQL IDE
- [ ] Verify DataLoader batching (check backend logs)
- [ ] Write query document tests (>95% coverage)
- [ ] Code review for correctness

### Phase B: Mutation Foundation & Hooks
- [ ] Create all mutation documents
- [ ] Enhance mutation hooks with error handling
- [ ] Add refetchQueries strategy
- [ ] Write mutation hook tests (MockedProvider)
- [ ] Test mutation flow end-to-end
- [ ] Code review

### Phase C: Optimistic Updates & Real-Time Sync
- [ ] Implement optimistic responses for all mutations
- [ ] Enhance useSSEEvents for cache updates
- [ ] Test SSE event → cache update flow
- [ ] Test multi-client synchronization
- [ ] Write integration tests
- [ ] Verify no cache thrashing

### Phase D: Error Handling & Resilience
- [ ] Create error classification utilities
- [ ] Implement retry logic with exponential backoff
- [ ] Implement SSE reconnection strategy
- [ ] Write error handling tests
- [ ] Test under load (rapid mutations)
- [ ] Code review

### Phase E: Testing & Performance
- [ ] Create comprehensive integration tests
- [ ] Create multi-client SSE sync tests
- [ ] Create performance benchmarks
- [ ] Verify <100ms query latency
- [ ] Verify <100ms mutation latency
- [ ] Verify N+1 prevention via DataLoader
- [ ] Achieve >80% test coverage
- [ ] Document performance baselines

### Pre-Merge Verification
- [ ] All tests pass locally (`pnpm test:frontend`)
- [ ] Tests pass in CI (`pnpm test:frontend -- --run`)
- [ ] All acceptance criteria met
- [ ] Code coverage >80%
- [ ] No TypeScript errors (`pnpm lint`)
- [ ] All code comments added
- [ ] Documentation updated (CLAUDE.md, DESIGN.md)
- [ ] Ready for PR review

---

## 9. File Structure & Deliverables

### New Files to Create
```
frontend/lib/
├── graphql/
│   ├── queries.ts (or separate queries/ folder)
│   ├── mutations.ts (or separate mutations/ folder)
│   └── error-handler.ts
├── use-sse-events.ts (enhance)
└── __tests__/
    ├── graphql-queries.test.ts
    ├── apollo-hooks.test.tsx
    ├── optimistic-updates.test.tsx
    ├── sse-sync.test.tsx
    ├── error-handling.test.ts
    ├── integration.test.tsx
    ├── performance.test.ts
    └── coverage-report.md
```

### Files to Update
```
frontend/lib/
├── apollo-hooks.ts (enhance with optimistic, error handling)
├── use-sse-events.ts (enhance with cache updates)
├── apollo-client.ts (optional: configure retry, timeout)
└── auth-context.tsx (reference only)

backend-graphql/src/
├── schema.graphql (reference only)
├── resolvers/ (reference only)
└── dataloaders/ (reference only)
```

### Documentation to Create/Update
```
/
├── docs/implementation-planning/ISSUE-6-IMPLEMENTATION-PLAN.md (this file)
├── CLAUDE.md (update with new patterns and examples)
├── DESIGN.md (update with frontend integration details)
└── frontend/lib/__tests__/README.md (new, test documentation)
```

---

## 10. Success Metrics & Definition of Done

### Quantitative Metrics
| Metric | Target | How to Verify |
|--------|--------|---------------|
| **Query Latency** | <100ms | Performance test with `performance.now()` |
| **Mutation Latency** | <100ms | Performance test with `performance.now()` |
| **SSE Event Latency** | <50ms | Event emitted → cache updated |
| **N+1 Query Count** | ≤2 queries per request | Spy on Apollo queries, backend DataLoader logs |
| **Test Coverage** | >80% | `pnpm test:frontend -- --coverage` |
| **Test Pass Rate** | 100% | `pnpm test:frontend -- --run` |
| **Multi-Client Sync** | 100% | SSE event received on all connected clients |
| **Error Recovery** | 100% | All error paths tested and handled |

### Qualitative Metrics
| Aspect | Success Criteria |
|--------|-----------------|
| **Code Quality** | No linting errors, TypeScript strict mode passes, clean code review |
| **Documentation** | All patterns documented, examples in comments, README updated |
| **Maintainability** | Hooks are reusable, errors are classified, cache strategy is clear |
| **Testability** | Tests are isolated, mocks are clear, edge cases covered |
| **User Experience** | Optimistic updates feel instant, errors are clear, SSE feels real-time |

### Acceptance Criteria (from Issue #6)
- [x] Queries load from GraphQL
- [x] Mutations update and emit events
- [x] Optimistic updates show immediately
- [x] SSE updates Apollo cache
- [x] Multiple clients sync
- [x] Errors handled gracefully
- [x] No N+1 queries
- [x] Performance acceptable
- [x] Tests pass (>80% coverage)

---

## 11. Appendix: Reference Documentation

### Useful Commands
```bash
# Development
pnpm dev                          # Start all services
pnpm dev:graphql                  # Start Apollo only
pnpm dev:frontend                 # Start Next.js only
pnpm dev:express                  # Start Express only

# Testing
pnpm test:frontend                # Run all frontend tests
pnpm test:frontend --watch        # Watch mode
pnpm test:frontend -- --coverage  # Coverage report
pnpm test:frontend -- --run -- --sequence.parallel  # Parallel execution

# Linting
pnpm lint                         # Check linting
pnpm lint:fix                     # Auto-fix

# GraphQL
# Visit http://localhost:4000/graphql for GraphiQL IDE

# Express SSE
curl -N http://localhost:5000/events  # Listen to SSE stream
```

### External Resources
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [Apollo Caching Best Practices](https://www.apollographql.com/docs/react/caching/overview/)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Docs](https://vitest.dev/)

### Related Issues
- **Issue #2**: GraphQL Schema & Resolvers (dependency ✓)
- **Issue #3**: Apollo Server Setup (dependency ✓)
- **Issue #4**: Express Event Bus (dependency ✓)
- **Issue #5**: Authentication & Authorization (dependency ✓)
- **Issue #7**: E2E Testing (future enhancement)

---

## 12. Handoff & Next Steps

### Immediate Next Steps (Week of April 28)
1. **Day 1 morning**: Validate that all dependencies (#2–4) are working
2. **Day 1**: Start Phase A (Query Foundation)
3. **Daily**: Update task status and log blockers
4. **Daily EOD**: Commit progress to feature branch

### Integration Points
- If backend issues are found → escalate to #2/#3/#4 owners
- If test failures → check MockedProvider setup and test isolation
- If performance targets missed → profile with Apollo DevTools and React DevTools

### Post-Completion (Week of May 5)
- Code review from team lead
- Merge to `main` branch (depends on Issue #6 PR review cycle)
- Deploy to staging for E2E testing
- Update CLAUDE.md and DESIGN.md with production patterns
- Consider opening follow-up issues (e.g., WebSocket upgrade, caching strategy refinement)

---

**Document Version**: 1.0  
**Last Updated**: April 26, 2026  
**Author**: Strategic Planning for Issue #6  
**Status**: Ready for Implementation
