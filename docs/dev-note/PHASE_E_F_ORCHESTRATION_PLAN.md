# Issue #7: Phase E & F Orchestration Plan

**Status:** Ready for execution  
**Current:** Phase A-D merged (459/459 tests passing)  
**Objective:** Complete Phases E & F to reach 100% Issue #7 completion (21/21 tasks)  
**Timeline:** Estimated 8-10 hours total

---

## Executive Summary

### Context
- **Phase A (Design):** Event schema + 10 domain types ✅ MERGED
- **Phase B (Backend Express):** Event dedup, metrics, SSE heartbeat ✅ MERGED  
- **Phase C (GraphQL):** Event emission in 4 mutations with retry logic ✅ MERGED
- **Phase D (Frontend):** SSE reconnection, dedup, cache handlers ✅ MERGED
- **Main Branch Status:** Clean, all tests passing, ready for new work

### Phase E: Integration Testing (BLOCKING for Phase F)
**Duration:** ~4 hours | **3 critical tasks**
1. **E1: Backend Integration Tests** - Verify GraphQL → Express → Frontend event flow
2. **E2: Frontend E2E Tests** - Verify user-visible event bus behavior with Playwright
3. **E3: Memory & Stress Testing** - Sustained load (1000+ events), connection cleanup

### Phase F: Documentation & Validation (After Phase E)
**Duration:** ~4 hours | **4 documentation tasks**  
1. **F1: API Documentation** - Event types, payloads, endpoints, curl examples
2. **F2: Debugging Guide** - Metrics, debug mode, troubleshooting
3. **F3: Production Readiness** - Final review & signoff
4. **F4: Acceptance Criteria Verification** - 10-point checklist sign-off

---

## Phase E: Integration Testing (Prerequisite for Phase F)

### Task E1: Backend Integration Tests (2.5 hrs)
**File:** `backend-express/src/routes/__tests__/integration.test.ts` (create)

**Scope:** Test the complete event flow through all 3 layers
- Mock GraphQL client emitting events
- Express broadcasts to multiple connected clients
- Deduplication prevents duplicate events
- Measure end-to-end latency
- Verify client cleanup on disconnect

**Test Cases:**
1. Single client receives event from GraphQL mutation
2. Multi-client broadcast: 5 clients receive same event
3. Deduplication: duplicate eventIds filtered correctly
4. Latency measurement: <100ms end-to-end
5. Client disconnect cleanup: closed clients removed from broadcast
6. Error handling: invalid events rejected
7. Metrics accumulation: event counts, throughput, latency recorded

**Key Implementation Details:**
- Use supertest for HTTP testing
- Mock EventEmitter for GraphQL events
- Create real EventSource connections for clients
- Measure latency with performance.now()
- Verify metrics endpoint returns correct data

**Acceptance Criteria (E1):**
- ✅ All 7 test cases pass
- ✅ Latency consistently <100ms
- ✅ No race conditions in concurrent sends
- ✅ Dedup correctly filters duplicates

---

### Task E2: Frontend E2E Tests (3.0 hrs)
**File:** `frontend/e2e/sse-integration.spec.ts` (create)

**Scope:** Real browser flow demonstrating full event bus integration
- User creates a Build via GraphQL
- Express broadcasts buildCreated event
- Frontend SSE listener receives event
- Apollo cache updates automatically
- UI reflects change without page reload

**Test Scenario:**
```
1. Login to app
2. Navigate to Builds page
3. Create new Build (GraphQL mutation)
4. Verify: Apollo cache updated with new Build
5. Listen on SSE stream
6. Trigger build status change (another window)
7. Verify: Second browser window sees status change in real-time
8. Verify: UI updates <100ms after event received
```

**Test Cases:**
1. Create build: mutation triggers event → UI shows new build
2. Status change: second browser sees update in real-time
3. SSE reconnection: connection drops → auto-reconnects
4. Multi-event sync: 5 rapid events all processed correctly
5. Error handling: malformed event dismissed gracefully
6. Concurrent clients: 3 browsers in sync on status change

**Key Implementation Details:**
- Use Playwright fixtures for authentication
- Open 2-3 concurrent browsers for real-time sync tests
- Use page.waitForURL() to detect UI updates
- Measure time from event → visible change
- Use page.evaluate() to check Apollo cache state

**Acceptance Criteria (E2):**
- ✅ All 6 test scenarios pass
- ✅ Real-time sync verified across 2+ browsers
- ✅ UI updates within <100ms of event
- ✅ SSE reconnection works automatically

---

### Task E3: Memory & Stress Testing (2.0 hrs)
**Files:** 
- `backend-express/src/routes/__tests__/stress.test.ts` (create)
- `frontend/__tests__/sse-stress.test.ts` (create)

**Scope:** Verify no memory leaks, dedup cleanup works, connections don't leak

**Backend Stress Tests:**
1. Emit 1000+ events rapidly to 50 concurrent clients
2. Monitor memory usage: should not grow unbounded
3. Verify dedup window cleanup: old events dropped after TTL
4. Test client removal: disconnect 10 clients, verify removed
5. Sustained connections: 100 clients connected 5+ minutes, memory stable
6. High throughput: 100 events/sec for 60 seconds, no crashes

**Frontend Stress Tests:**
1. Receive 1000+ SSE events in sequence
2. Verify Apollo cache doesn't grow unbounded
3. Monitor listeners: no event listener leaks
4. Test reconnect loop: 20 forced disconnects, auto-reconnects
5. Dedup stress: duplicate events (same eventId) filtered correctly
6. Memory: 1000 events don't cause heap growth

**Key Implementation Details:**
- Use process.memoryUsage() to track heap before/after
- Use setInterval to monitor sustained memory usage
- Create real SSE connections (not mocked)
- Force garbage collection between tests: require('v8').writeHeapSnapshot()
- Log memory deltas: before, after, peak

**Acceptance Criteria (E3):**
- ✅ Memory growth <5MB for 1000 events
- ✅ No event listener leaks detected
- ✅ Dedup cleanup works (old events removed)
- ✅ 100 concurrent clients stable >5 minutes
- ✅ No crashes under 100 events/sec

---

## Phase F: Documentation & Validation (After Phase E Merged)

### Task F1: API Documentation (1.5 hrs)
**File:** `docs/EVENT_BUS_API.md` (create)

**Contents:**
1. **Event Types & Schemas** - All 10 event types with JSON examples
   - BUILD_CREATED, BUILD_STATUS_CHANGED, PART_ADDED, PART_REMOVED
   - TEST_RUN_SUBMITTED, TEST_RUN_UPDATED, FILE_UPLOADED
   - CI_RESULTS, SENSOR_DATA, WEBHOOK

2. **EventEnvelope Structure** - eventId, timestamp, sourceLayer, userId, metadata

3. **GraphQL Mutations Emitting Events**
   - createBuild() → buildCreated event
   - updateBuildStatus() → buildStatusChanged event
   - addPart() → partAdded event
   - submitTestRun() → testRunSubmitted event

4. **Express Endpoints**
   - `GET /events` - SSE connection
   - `GET /health` - Health check
   - `GET /metrics` - Metrics data
   - `POST /emit` - Event emission from GraphQL

5. **curl Examples**
   ```bash
   # Connect to SSE stream
   curl -N http://localhost:5000/events
   
   # Check metrics
   curl http://localhost:5000/metrics
   
   # Emit event (from GraphQL)
   curl -X POST http://localhost:5000/events/emit \
     -H "Authorization: Bearer <secret>" \
     -d '{"eventType":"buildCreated",...}'
   ```

6. **Environment Variables**
   - EXPRESS_PORT, EVENT_DEDUP_WINDOW_SIZE, EVENT_DEDUP_TTL_MS
   - EXPRESS_EVENT_SECRET, GRAPHQL_EVENT_URL

7. **Rate Limiting & Quotas** (if applicable)

8. **Error Codes & Responses**

**Acceptance Criteria (F1):**
- ✅ All 10 event types documented with examples
- ✅ All endpoints documented with curl examples
- ✅ Sample JSON payloads provided
- ✅ Environment configuration documented
- ✅ Audience: developers integrating with event bus

---

### Task F2: Debugging Guide (1.5 hrs)
**File:** `docs/EVENT_BUS_DEBUGGING.md` (create)

**Contents:**
1. **Metrics Endpoint Guide**
   - How to read /metrics JSON
   - Interpreting throughput, latency, error counts
   - Example metrics response with annotations

2. **Debug Mode in Frontend**
   - Enable: `window.__SSE_DEBUG = true`
   - Output: logs to console with event details
   - window.__SSE_METRICS object: 7 counters

3. **Connection Inspection**
   - How to inspect SSE connection in DevTools
   - Network tab: watch for message frames
   - Check for heartbeats, timeout detection

4. **Latency Analysis**
   - How to measure end-to-end latency
   - Use browser performance API
   - Correlate event timestamp with Apollo cache update

5. **Common Issues & Solutions**
   - "No events received" → Check /health, /metrics
   - "Duplicate events" → Check dedup window
   - "Connection drops" → Check heartbeat, idle timeout
   - "Memory growth" → Check for event listener leaks
   - "Stale cache" → Check Apollo cache invalidation

6. **Troubleshooting Checklist**
   - Is SSE endpoint reachable? (`curl http://localhost:5000/health`)
   - Are events being emitted? (Check /metrics)
   - Is frontend connected? (Check browser DevTools Network)
   - Are events deduplicated? (Check eventId in logs)
   - Is cache updating? (Check Apollo DevTools cache)

7. **Example Debug Session**
   ```
   1. Enable debug mode: window.__SSE_DEBUG = true
   2. Trigger mutation: Create Build
   3. Check console logs: Event received, dedup check, cache update
   4. Check metrics: POST /metrics returns new event count
   5. Verify UI updated within <20ms
   ```

**Acceptance Criteria (F2):**
- ✅ Metrics endpoint fully documented
- ✅ Debug mode examples provided
- ✅ Common issues & solutions documented
- ✅ Troubleshooting checklist complete
- ✅ Audience: developers debugging event bus

---

### Task F3: Production Readiness Review (1.0 hr)
**File:** `docs/PRODUCTION_READINESS.md` (create)

**Contents:**
1. **Error Handling Review**
   - ✅ GraphQL mutation errors don't crash event emission
   - ✅ Express route errors return proper HTTP status
   - ✅ Frontend handles SSE errors gracefully
   - ✅ Invalid events rejected with logging

2. **Logging & Observability**
   - ✅ Event emission logged (debug level)
   - ✅ Event delivery logged (info level)
   - ✅ Errors logged (error level) with context
   - ✅ Metrics endpoint provides telemetry

3. **Performance Checklist**
   - ✅ Latency <100ms end-to-end
   - ✅ Memory stable under 1000 events
   - ✅ 100+ concurrent clients supported
   - ✅ No N+1 query issues

4. **Security Checklist**
   - ✅ /emit endpoint authenticated (event secret)
   - ✅ No sensitive data in events
   - ✅ EventId UUIDs prevent forgery
   - ✅ No XSS vectors in event payload

5. **Testing Coverage**
   - ✅ Integration tests: GraphQL → Express → Frontend
   - ✅ E2E tests: real browser flow verified
   - ✅ Stress tests: 1000+ events, memory stable
   - ✅ Unit tests: 118 in GraphQL, 51 in Frontend

6. **Downstream Issue Unblocking**
   - ✅ Issue #6: (description) - event bus ready
   - ✅ Issue #8: (description) - real-time updates working
   - ✅ Issue #9: (description) - metrics available

7. **Sign-Off Checklist**
   - ✅ All acceptance criteria met
   - ✅ No known bugs or limitations
   - ✅ Ready for production deployment
   - ✅ Documentation complete

**Acceptance Criteria (F3):**
- ✅ Production readiness checklist complete
- ✅ All security/performance items verified
- ✅ Downstream issues unblocked
- ✅ Ready for deployment

---

### Task F4: Acceptance Criteria Verification (1.0 hr)
**File:** `docs/ACCEPTANCE_CRITERIA_VERIFICATION.md` (create)

**Complete Checklist (10 points from Issue #7):**

1. **✅ All 10 mutations emit events correctly**
   - Verified in Phase C tests
   - CI_RESULTS, SENSOR_DATA working via webhooks
   - File upload event working in Phase B

2. **✅ Express broadcasts to 100+ concurrent clients without memory leaks**
   - Verified in Phase E3 stress tests
   - Memory growth <5MB for 1000 events
   - 100 concurrent clients stable >5 minutes

3. **✅ Frontend SSE reconnects automatically with exponential backoff**
   - Verified in Phase D tests
   - Max 10 attempts: 1s→2s→4s→8s→16s→30s
   - All 51 frontend tests passing

4. **✅ Apollo cache updates within <20ms of event receipt**
   - Measured in Phase E1 integration tests
   - Consistently <20ms in stress tests

5. **✅ Multi-client real-time sync verified**
   - Verified in Phase E2 E2E tests
   - 2+ browsers synchronized on status changes
   - <100ms end-to-end latency

6. **✅ <100ms end-to-end latency measured**
   - Verified in Phase E1 & E2
   - GraphQL emit → Express relay → Frontend receive <100ms

7. **✅ Zero race conditions in integration tests**
   - Verified in Phase E tests
   - No flaky tests, all deterministic

8. **✅ Metrics endpoint operational and functional**
   - GET /metrics returns: throughput, latency, event counts
   - Verified in Phase E tests

9. **✅ Debug mode available for troubleshooting**
   - window.__SSE_DEBUG = true enables logging
   - window.__SSE_METRICS provides 7 counters
   - Verified in Phase D tests

10. **✅ All 4 acceptance criteria from Issue #7 verified**
    - Points 1-4 above from issue description
    - All confirmed working

**Acceptance Criteria (F4):**
- ✅ 10/10 acceptance criteria verified
- ✅ Comprehensive checklist documented
- ✅ All tests passing & metrics collected
- ✅ Ready to mark Issue #7 COMPLETE

---

## Execution Strategy

### Delegation Approach

**Phase E (Testing):**
- **E1 (Backend Integration):** general-purpose agent (2.5 hrs)
  - Implement comprehensive integration test
  - Mock GraphQL, test multi-client broadcast
  - Measure latency, verify dedup

- **E2 (Frontend E2E):** general-purpose agent (3.0 hrs)
  - Implement Playwright real browser tests
  - Test create → SSE → cache → UI flow
  - Verify multi-browser sync

- **E3 (Memory & Stress):** code-review agent (2.0 hrs)
  - Implement stress tests
  - Verify memory stability
  - Check dedup cleanup

**Phase F (Documentation):**
- **F1 (API Docs):** general-purpose agent (1.5 hrs)
  - Complete API documentation
  - Curl examples, JSON payloads

- **F2 (Debugging Guide):** general-purpose agent (1.5 hrs)
  - Troubleshooting documentation
  - Debug mode guide, common issues

- **F3 (Production Readiness):** code-review agent (1.0 hr)
  - Final security/performance review
  - Sign-off checklist

- **F4 (Acceptance Verification):** general-purpose agent (1.0 hr)
  - Create verification checklist
  - Confirm all 10 criteria

### Parallel Opportunities

**Phase E Sequential:**
- E1 → (must complete before) → E2
- E3 can run parallel with E2 after E1 passes

**Phase F Parallel:**
- F1 & F2 can be written in parallel
- F3 depends on F1 & F2 complete
- F4 depends on F3 complete

### Git Workflow

**Phase E Branch:**
```
git checkout -b feat/issue-7-impl-e
# Implement E1, E2, E3 tests
pnpm test  # Verify all pass (459+N new tests)
pnpm lint:fix  # Format
# Commit with message: "feat: Implement Phase E integration & E2E tests"
git push -u origin feat/issue-7-impl-e
# Create PR, code review, merge to main
```

**Phase F Branch:**
```
git checkout -b feat/issue-7-impl-f
# Implement F1, F2, F3, F4 documentation
# Manual verification of acceptance criteria
# Commit with message: "docs: Complete Phase F documentation & acceptance verification"
git push -u origin feat/issue-7-impl-f
# Create PR, merge to main
```

---

## Success Metrics

**Phase E Complete (Gate for Phase F):**
- ✅ E1: All integration tests pass, latency verified <100ms
- ✅ E2: All E2E tests pass, multi-client sync verified
- ✅ E3: No memory leaks, 1000 events, 100 clients stable
- ✅ Total tests: 459 + N (all pass)
- ✅ ESLint: Clean
- ✅ Code review: No critical issues

**Phase F Complete (Issue #7 Complete):**
- ✅ F1: API documentation complete & accurate
- ✅ F2: Debugging guide covers all common issues
- ✅ F3: Production readiness confirmed
- ✅ F4: All 10 acceptance criteria verified & signed off
- ✅ GitHub Issue #7: Marked COMPLETE (21/21 tasks)

---

## Risk Mitigation

**Potential Risks & Mitigation:**
1. **E2E tests flaky** → Retry logic, longer waits, more deterministic flow
2. **Memory leak detection difficult** → Use heapsnapshot, monitor sustained usage
3. **Multi-client sync race conditions** → Use barriers, ensure event ordering
4. **Documentation incomplete** → Use checklist, ask for feedback
5. **Acceptance criteria unclear** → Reference Issue #7 description, confirm with PM

---

## Timeline Estimate

| Phase | Task | Duration | Start | End |
|-------|------|----------|-------|-----|
| **E** | E1 Integration | 2.5 hrs | T+0 | T+2:30 |
| **E** | E2 E2E | 3.0 hrs | T+2:30 | T+5:30 |
| **E** | E3 Stress | 2.0 hrs | T+5:30 | T+7:30 |
| **E** | Code Review & Merge | 0.5 hrs | T+7:30 | T+8:00 |
| **F** | F1 API Docs | 1.5 hrs | T+8:00 | T+9:30 |
| **F** | F2 Debugging Guide | 1.5 hrs | T+8:00 | T+9:30 |
| **F** | F3 Production Review | 1.0 hr | T+9:30 | T+10:30 |
| **F** | F4 Acceptance Checklist | 1.0 hr | T+9:30 | T+10:30 |
| **F** | Code Review & Merge | 0.5 hrs | T+10:30 | T+11:00 |
| **Total** | **All Phases** | **~11 hrs** | **T+0** | **T+11** |

---

## Next Steps

1. ✅ **Plan Complete** (this document)
2. ⏭️ **Delegate E1** - Backend integration tests
3. ⏭️ **Delegate E2** - Frontend E2E tests (after E1 passes)
4. ⏭️ **Delegate E3** - Memory & stress tests (parallel with E2)
5. ⏭️ **Merge Phase E** to main
6. ⏭️ **Delegate F1-F4** - Documentation (after E merged)
7. ⏭️ **Merge Phase F** to main
8. ⏭️ **Update Issue #7** - Mark COMPLETE (21/21 tasks)

___BEGIN___COMMAND_DONE_MARKER___0
