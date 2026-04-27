# Issue #6 Day 3 Progress: Optimistic Updates + Error Handling

**Date**: April 27, 2026 (09:00 UTC - 17:00 UTC)  
**Sprint**: Days 1-5 Full-Stack Integration  
**Branch**: feat/issue-6-impl-3  
**Status**: 🚀 EXECUTION IN PROGRESS

---

## Task Status

| Task ID | Phase | Title | Status | Duration | Completeness |
|---------|-------|-------|--------|----------|--------------|
| issue-6-c1-optimistic | C | Add optimistic updates to mutations | IN_PROGRESS | 4h | 0% |
| issue-6-c2-sse | C | Enhance SSE for cache updates | IN_PROGRESS | 2h | 0% |
| issue-6-d1-retry | D | Error classification and retry logic | IN_PROGRESS | 2h | 0% |

**Total Day 3 Time Budget**: 8 hours  
**Cumulative Progress**: 14/20 tasks (70% overall)

---

## Day 3 Execution Plan

### Morning Session (09:00-13:00): Phase C Optimistic Updates

**Task C1: Add optimistic updates to mutations**
- [ ] Modify `useCreateBuild` hook to include optimisticResponse
  - Mock response structure: `{ createBuild: { id, status: 'PENDING', ... } }`
  - Integrate with existing refetchQueries
  - Add timeout handling (5s default, configurable)
- [ ] Modify `useUpdateBuildStatus` hook
  - Immediate status reflection in UI
  - Rollback on error with user notification
- [ ] Modify `useAddPart` hook
  - Optimistic part addition to builds list
  - Cache invalidation strategy
- [ ] Modify `useSubmitTestRun` hook
  - Optimistic test run creation
  - File reference handling

**Task C2: Enhance SSE for cache updates**
- [ ] Parse SSE events with type safety (schema: `{ event, buildId, payload, timestamp }`)
- [ ] Implement cache.modify() for each event type
  - `buildCreated`: Add to builds list
  - `buildStatusChanged`: Update build status in cache
  - `partAdded`: Update parts list for affected build
  - `testRunSubmitted`: Add test run to build.testRuns
- [ ] Set up subscription cleanup (unsubscribe on unmount)
- [ ] Handle out-of-order events gracefully

### Afternoon Session (13:00-17:00): Phase D Error Handling

**Task D1: Error classification and retry logic**
- [ ] Extend error handler with retry classification
  - Retryable errors: Network failures, 5xx, timeout
  - Non-retryable: 4xx (except 429), auth errors, validation
- [ ] Implement exponential backoff with jitter
  - Initial delay: 100ms
  - Max delay: 10s
  - Jitter: ±20%
  - Max retries: 3
- [ ] Integrate retry logic into mutation hooks
  - Add retry mechanism to useCreateBuild
  - Add retry mechanism to useUpdateBuildStatus
  - Add retry mechanism to useAddPart
  - Add retry mechanism to useSubmitTestRun
- [ ] Add retry UI indicators (pulse indicator, retry count badge)
- [ ] Create retry test suite (20+ test cases)

---

## Technical Implementation Details

### C1: Optimistic Updates Pattern

```typescript
// Hook structure with optimistic response
const useCreateBuild = () => {
  const [createBuild, { loading, error }] = useMutation(CREATE_BUILD, {
    optimisticResponse: {
      createBuild: {
        __typename: 'Build',
        id: generateTempId(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        // ... other fields with sensible defaults
      }
    },
    refetchQueries: [{ query: GET_BUILDS, variables: { limit: 10, offset: 0 } }],
    onError: (err) => {
      const message = extractErrorMessage(err);
      // Show error toast, UI reverts automatically
    }
  });
};
```

**Integration points:**
- Optimistic response + refetchQueries = Instant UI + eventual consistency
- Error handling: Use Day 1's extractErrorMessage() for user-friendly messaging
- Timeout: Implement with setTimeout for optimistic rollback after 5s

### C2: SSE Cache Updates

```typescript
// Parse and apply SSE events to Apollo cache
eventSource.addEventListener('buildStatusChanged', (event) => {
  const data = JSON.parse(event.data);
  client.cache.modify({
    fields: {
      builds: (existingBuilds, { readField }) => {
        return existingBuilds.map((build) => {
          if (readField('id', build) === data.buildId) {
            return { ...build, status: data.status };
          }
          return build;
        });
      }
    }
  });
});
```

### D1: Retry Logic with Exponential Backoff

```typescript
// Implemented in Day 1's error handler, integrated here
const delay = getExponentialBackoffDelay(attempt, jitter: true);
// Apply to mutation hooks with onError retry trigger
```

---

## Day 3 Readiness Criteria

### Before Starting Work
- [x] All Day 1 + Day 2 tasks merged to main
- [x] 302 tests passing (baseline)
- [x] 0 ESLint errors
- [x] TypeScript strict mode clean

### Success Criteria for Day 3
- [ ] All 4 hooks support optimistic updates (no pending state in UI)
- [ ] SSE events update Apollo cache within 500ms
- [ ] Retry logic handles 3 failure scenarios (network, timeout, server error)
- [ ] All new tests (40+ tests) passing
- [ ] <100ms latency for cache updates (performance target)
- [ ] Full type safety: No `any` types, 100% TypeScript coverage

### Dependency Status
- ✅ Phase A (queries) - Complete, stable
- ✅ Phase B (hooks/mutations) - Complete, stable
- ⏳ Phase C (optimistic updates) - Ready to start
- ⏳ Phase D (error handling) - Ready to start
- ⏳ Phase E (testing/perf) - Awaits Day 4

---

## Files to Create/Modify (Day 3)

### Create
- `frontend/lib/__tests__/optimistic-updates.test.tsx` - 25+ tests for optimistic patterns
- `frontend/lib/__tests__/sse-cache-updates.test.ts` - 20+ tests for event parsing
- `frontend/lib/__tests__/retry-logic.test.ts` - 20+ tests for backoff strategy

### Modify
- `frontend/lib/apollo-hooks.ts` - Add optimisticResponse to all 4 hooks
- `frontend/lib/use-sse-events.ts` - Implement cache.modify() for events
- `frontend/lib/graphql-error-handler.ts` - Add retry classification functions
- `frontend/components/build-dashboard.tsx` - Add visual retry indicators

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Optimistic updates conflict with SSE events | Medium | High | Implement event deduplication in cache.modify() |
| Retry loops cause infinite requests | Low | High | Strict max retry count (3) + exponential backoff limit (10s) |
| Cache.modify() performance degradation | Low | Medium | Profile cache operations during implementation |
| Type safety issues in SSE parsing | Low | Medium | Add runtime validation schema for event payloads |

---

## Day 3 Checkpoint

**Expected Outcome**: 
- 17/20 tasks complete (85% overall)
- Optimistic updates fully functional
- Error handling with retry logic operational
- All tests passing (340+ tests)
- Real-time synchronization ready for Day 4 acceptance testing

**Merge Plan**:
- Push feat/issue-6-impl-3 with 4-6 commits
- Create PR #173 for Day 3
- Merge to main for Day 4 finalization

**Next Phase** (Day 4):
- Phase E: Testing & Performance verification
- Acceptance criteria validation
- Final integration tests
- Performance benchmarking (<100ms latency)

---

## Implementation Notes

- Leverage Day 1's error handler (extractErrorMessage, classifyError)
- Reuse Day 2's refetchQueries pattern as foundation
- Maintain type safety: `string | null` for errors (no `unknown`)
- Test in isolation first, then integration (optimistic + SSE + retry together)
- Monitor test pass rate: Target >98% (340+ tests)

---

**Status**: 🚀 Execution in progress  
**Next Update**: Upon completion of Task C1 (expected ~12:30 UTC)  
**Last Updated**: 2026-04-27 13:01 UTC
