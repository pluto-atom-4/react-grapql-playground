# Issue #6: Quick Reference Card

**Strategic Plan for Issue #6**: Frontend ↔ Apollo GraphQL with Real-Time SSE Integration  
**Duration**: 4–5 days (32 hours) | **Status**: Ready for Implementation

---

## 🎯 Quick Facts

| Aspect | Detail |
|--------|--------|
| **Issue** | #6 - Critical Blocker |
| **Scope** | 9 tasks across queries, mutations, hooks, real-time, testing |
| **Phases** | 5 sequential phases (A→B→C→D→E) |
| **Team** | Single developer, 4–5 days intensive |
| **Dependencies** | #2 ✓, #3 ✓, #4 ✓ (all complete) |
| **Success Metric** | <100ms latency, 0 N+1 queries, >80% coverage, all acceptance criteria ✓ |

---

## 📋 Phase Overview

### Phase A: Query Foundation (8h)
- Create query documents with fragments
- Verify DataLoader batching
- Test in GraphiQL

### Phase B: Mutation & Hooks (10h)
- Create mutation documents
- Implement custom hooks
- Error handling + refetchQueries

### Phase C: Optimistic & Real-time (10h)
- Add optimisticResponse to mutations
- Enhance useSSEEvents for cache updates
- Multi-client sync tests

### Phase D: Error Handling (6h)
- Error classification + retry logic
- SSE reconnection with exponential backoff
- Network resilience

### Phase E: Testing & Performance (6h)
- Integration tests (queries, mutations, SSE)
- Performance benchmarks (<100ms)
- N+1 detection + coverage >80%

---

## 📅 4-Day Timeline

```
Day 1 (8h)  │ Phase A (4h) + Phase B partial (4h)
Day 2 (8h)  │ Phase B complete (4h) + Phase C partial (4h)
Day 3 (8h)  │ Phase C complete (4h) + Phase D (4h)
Day 4 (8h)  │ Phase E: Integration + Performance tests (8h)
────────────┼─────────────────────────────────────────
Total: 32h  │ All acceptance criteria ✓
```

---

## ✅ Acceptance Criteria Checklist

- [ ] Queries load from GraphQL (<100ms)
- [ ] Mutations update and emit events
- [ ] Optimistic updates show immediately
- [ ] SSE updates Apollo cache in real-time
- [ ] Multiple clients stay in sync
- [ ] Errors handled gracefully (network, timeout, retry)
- [ ] Zero N+1 queries (DataLoader verified)
- [ ] Performance acceptable (<100ms queries/mutations)
- [ ] Tests pass (>80% coverage)

---

## 🏗️ Critical Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Query Organization** | Single file + fragments | Simpler, easier to refactor later |
| **Hook Pattern** | Individual hooks | Better TypeScript inference, testability |
| **Cache Updates** | Selective (targeted) | Performance, efficiency vs. full invalidation |
| **Error Handling** | Hybrid (hook + component) | Separation of concerns, reusability |
| **SSE Reconnection** | Exponential backoff | 1s → 2s → 4s → 8s → 16s → 30s max |
| **Optimistic Response** | Must match server shape | Prevents UI errors from missing fields |

---

## 📊 Task Dependencies

```
Critical Path:
6.1-A → 6.1-B → 6.5-A (Integration Tests)
  ↓
6.2-A → 6.2-B → 6.2-C → 6.2-D
          ↓
        6.3-A → 6.3-C → 6.5-A (Integration Tests)
          ↓
        6.3-B → 6.3-C → 6.5-B (Multi-client Tests)

Error Handling (Parallel after Phase B):
6.4-A → 6.4-B → 6.4-D
  ↓
6.4-C → 6.4-D

Performance Testing (Parallel after Phase C):
6.5-C (Performance) happens in Day 4 afternoon
```

---

## 🚀 Day 1 Checklist

### Morning (4 hours): Phase A
- [ ] Review schema and existing queries
- [ ] Refactor query documents with fragments
- [ ] Test in GraphiQL IDE
- [ ] Verify DataLoader (check backend logs)
- [ ] Start query unit tests

### Afternoon (4 hours): Phase B Setup
- [ ] Create mutation documents
- [ ] Review existing hooks
- [ ] Start error classification utilities
- [ ] Code comments for patterns

**Checkpoint**: All queries execute, no N+1 detected

---

## 🔧 Key Code Patterns

### 1. Query with Fragments
```typescript
export const BUILDS_QUERY = gql`
  query GetBuilds($limit: Int!, $offset: Int!) {
    builds(limit: $limit, offset: $offset) { ...BuildInfo }
  }
  ${BUILD_FRAGMENT}
`;
```

### 2. Mutation with Optimistic Response
```typescript
export function useUpdateBuildStatus() {
  const [updateStatus] = useMutation(UPDATE_BUILD_STATUS_MUTATION, {
    optimisticResponse: (vars) => ({
      __typename: 'Mutation',
      updateBuildStatus: {
        __typename: 'Build',
        id: vars.id,
        status: vars.status,
        updatedAt: new Date().toISOString()
        // Include ALL required fields
      }
    })
  });
}
```

### 3. SSE Targeted Cache Update
```typescript
eventSource.addEventListener('buildStatusChanged', (event) => {
  const { buildId, status } = JSON.parse(event.data);
  client.cache.modify({
    id: client.cache.identify({ __typename: 'Build', id: buildId }),
    fields: { status: () => status }
  });
});
```

### 4. Error Classification
```typescript
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || 
         (error instanceof Error && error.message.includes('fetch'));
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    return error.graphQLErrors[0]?.message || 'GraphQL error';
  }
  return 'Unknown error';
}
```

### 5. Exponential Backoff Retry
```typescript
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 5
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isNetworkError(error) || attempt === maxRetries - 1) throw error;
      await new Promise(r => 
        setTimeout(r, 1000 * Math.pow(2, attempt))
      );
    }
  }
}
```

---

## ⚠️ Top 5 Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **N+1 Query Cascading** | ❌ Performance fail | Verify DataLoader before starting; add performance test |
| **SSE Connection Loss** | ❌ Data inconsistency | Implement automatic reconnection; test under load |
| **Optimistic Rollback** | ❌ Data corruption | Explicit error rollback; mock validation errors |
| **Cache Thrashing** | ⚠️ Janky UI | Use selective updates; monitor re-renders |
| **Test Flakiness** | ❌ Blocked PRs | Global setup; avoid shared state; run parallel tests |

---

## 📈 Performance Targets

| Metric | Target | Verification |
|--------|--------|--------------|
| Query Latency | <100ms | Performance test with `performance.now()` |
| Mutation Latency | <100ms | Performance test with `performance.now()` |
| SSE Event Latency | <50ms | Event emit → cache updated |
| N+1 Queries | ≤2 per request | Spy on Apollo queries; backend logs |
| Test Coverage | >80% | `pnpm test:frontend -- --coverage` |

---

## 🧪 Testing Strategy

### Phase-by-Phase
- **Phase A**: Unit tests for queries (>95%)
- **Phase B**: Integration tests for hooks (MockedProvider)
- **Phase C**: Multi-client SSE tests, optimistic update tests
- **Phase D**: Error scenario tests (network, timeout, reconnect)
- **Phase E**: Performance benchmarks, N+1 detection, full coverage

### Test Tools
- **Framework**: Vitest + React Testing Library
- **Mocking**: MockedProvider (Apollo), mock EventSource (SSE)
- **Performance**: `performance.now()`, Apollo cache query count
- **Coverage**: `pnpm test:frontend -- --coverage`

---

## 📁 File Structure

### Create
```
frontend/lib/__tests__/
├── graphql-queries.test.ts (Phase A)
├── apollo-hooks.test.tsx (Phase B)
├── optimistic-updates.test.tsx (Phase C)
├── sse-sync.test.tsx (Phase C)
├── error-handling.test.ts (Phase D)
├── integration.test.tsx (Phase E)
└── performance.test.ts (Phase E)

frontend/lib/
├── graphql-error-handler.ts (Phase D)
└── [update]
   ├── apollo-hooks.ts (all phases)
   └── use-sse-events.ts (Phase C + D)
```

### Update
- `frontend/lib/graphql-queries.ts` → Add mutations, enhance fragments
- `frontend/lib/apollo-hooks.ts` → Error handling, optimistic responses
- `frontend/lib/use-sse-events.ts` → Cache updates, reconnection

---

## 🎬 Getting Started

1. **Pre-flight Check** (Day 1 morning, 30 min)
   - Verify dependencies (#2–4) are working
   - Check backend logs show DataLoader batching
   - Start all services: `pnpm dev`

2. **Phase A** (Day 1 morning, 3.5h)
   - Refactor queries → test in GraphiQL → verify no N+1

3. **Commit Early & Often**
   - Stage progress after each phase
   - Use feature branch: `git checkout -b feat/issue-6-integration`
   - Push daily to track progress

4. **Daily Standup**
   - Report blockers immediately
   - If performance targets missed, profile with Apollo DevTools
   - If tests fail, check MockedProvider setup

---

## 📞 Blockers & Escalation

### If Backend Issues Found
- N+1 queries detected → Check DataLoader in resolvers (#2 owner)
- SSE events not broadcasting → Check Express event bus (#4 owner)
- GraphQL queries fail → Check schema and resolvers (#2/#3 owner)

### If Performance Targets Missed
- Use Apollo DevTools to inspect cache queries
- Use React DevTools Profiler to check re-renders
- Enable SQL query logging in backend

### If Test Failures
- Check MockedProvider setup and mocked responses
- Verify test isolation (no shared state)
- Run tests in parallel to catch race conditions

---

## ✨ Success Looks Like

✅ **Day 1 EOD**: All queries work, no N+1, mutations documented  
✅ **Day 2 EOD**: All hooks implemented with error handling, optimistic responses ready  
✅ **Day 3 EOD**: SSE sync working, error handling complete, multi-client tests pass  
✅ **Day 4 EOD**: All 9 tasks complete, >80% coverage, <100ms latency, all acceptance criteria ✓  

---

## 📖 Full Documentation

See **`docs/implementation-planning/ISSUE-6-IMPLEMENTATION-PLAN.md`** for:
- 12 major sections with detailed technical decisions
- 80+ subsections with code examples
- Phase-by-phase breakdown
- 18-task sprinted task list
- 5 risk registers with mitigation
- Day-by-day execution roadmap
- Parallel work opportunities
- Critical design rationale

---

**Last Updated**: April 26, 2026  
**Status**: Ready for Implementation  
**Next Step**: Start Day 1 Phase A
