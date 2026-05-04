# Issue #32: Timeouts & Retry Logic - Documentation Index

## 📄 Documents Delivered

### 1. **ISSUE-32-TIMEOUT-RETRY.md** (688 lines, 23 KB)
   **The Complete Implementation Plan**
   - Everything needed to implement Issue #32
   - Architecture decisions with full rationale
   - Code structure examples
   - 26 test cases fully specified
   - Risk mitigation strategies

   **Contents:**
   ```
   1. Approach Decision (Complex vs Simple) ✓
   2. Task Breakdown (Sequential) ✓
   3. File Structure (Create/Modify) ✓
   4. Implementation Details (Code + Strategy) ✓
   5. Testing Strategy (26 tests) ✓
   6. Acceptance Criteria Checklist ✓
   7. Risks & Mitigations (7 risks) ✓
   8. TypeScript Considerations ✓
   9. Implementation Sequence (5 phases) ✓
   10. Interview Value (8 talking points) ✓
   11. Branch & Verification Strategy ✓
   12. Summary & Next Steps ✓
   ```

### 2. **ISSUE-32-SUMMARY.txt** (260 lines, 10 KB)
   **Quick Reference for Implementation**
   - What was delivered (10 sections)
   - Key recommendations
   - Implementation checklist (30+ items)
   - Acceptance criteria reference
   - Key file references
   - Estimated effort breakdown
   - Next steps

### 3. **ISSUE-32-INDEX.md** (This file)
   **Navigation Guide**

---

## 🎯 Key Recommendations at a Glance

### Recommended Approach: **Option A - Apollo RetryLink + TimeoutLink (Complex)**

```typescript
// Link chain order (CRITICAL):
link: timeoutLink
  .concat(retryLink)
  .concat(errorLink)
  .concat(authLink)
  .concat(httpLink)
```

**Why:**
1. ✅ Apollo best practice (not naive fetch wrapper)
2. ✅ Leverages existing graphql-error-handler.ts utilities
3. ✅ Separates concerns (timeout vs retry vs error handling)
4. ✅ Apollo DevTools compatible
5. ✅ Interview-grade architecture

---

## 📋 Implementation Phases

| Phase | Task | Duration | Key Deliverable |
|-------|------|----------|-----------------|
| **1** | Foundation | 20 min | timeout-link.ts + retry-link.ts |
| **2** | Integration | 10 min | apollo-client.ts updated |
| **3** | Testing | 40 min | 26 test cases passing |
| **4** | SSE + Docs | 15 min | use-sse-events.ts + CLAUDE.md |
| **5** | Verification | 15 min | Build + Lint + Test all pass |
| **TOTAL** | | **1h 40 min** | Production-ready code |

---

## 🧪 Test Coverage

### TimeoutLink Unit Tests (8)
- ✅ Timeout after 10 seconds
- ✅ No timeout on success < 10s
- ✅ Custom timeout config
- ✅ Cleanup on completion
- ✅ Unsubscribe handling
- ✅ Concurrent requests
- ✅ Sync/async error handling
- ✅ Resource cleanup verification

### RetryLink Unit Tests (12)
- ✅ No retry on first success
- ✅ Retry network errors 3x
- ✅ Don't retry 4xx errors
- ✅ Do retry 5xx errors
- ✅ Exponential backoff calculation
- ✅ Retry logging with operation name
- ✅ maxRetries configuration
- ✅ Timeout errors are retryable
- ✅ Concurrent operations
- ✅ Operation context preservation
- ✅ Completion after retry
- ✅ Configuration inheritance

### Integration Tests (6)
- ✅ Recover from timeout via retry
- ✅ Link chain order enforcement
- ✅ No retry after timeout exhaustion
- ✅ Auth token injection per retry
- ✅ Error toast after final failure
- ✅ Timeout + retry logging

**Total: 26 comprehensive test cases**

---

## ✅ Acceptance Criteria Mapping

| # | Criterion | Implementation | File |
|---|-----------|-----------------|------|
| 1 | 10s timeout | TimeoutLink class | timeout-link.ts |
| 2 | 3x retry | RetryLink + counter | retry-link.ts |
| 3 | Backoff delays | getExponentialBackoffDelay() | (existing) |
| 4 | No retry 4xx | isRetryableError() | (existing) |
| 5 | Retry 5xx | isRetryableError() | (existing) |
| 6 | Retry timeouts | Timeout classified as retryable | (existing) |
| 7 | Console logging | console.log in RetryLink | retry-link.ts |
| 8 | Show error after 3 retries | errorLink after exhaust | apollo-client.ts |

---

## 📁 Files to Create/Modify

### Create (5 files)
```
frontend/lib/
├── retry-link.ts                    # 80 lines - RetryLink class
├── timeout-link.ts                  # 60 lines - TimeoutLink class
└── __tests__/
    ├── retry-link.test.ts           # 200 lines - 12 unit tests
    ├── timeout-link.test.ts         # 150 lines - 8 unit tests
    └── timeout-retry-integration.test.ts # 120 lines - 6 integration tests
```

### Modify (2 files)
```
frontend/lib/
├── apollo-client.ts                 # +10 lines - import + link order
└── use-sse-events.ts                # +5 lines - shared retry config
```

### Reference (Existing - No Changes)
```
frontend/lib/
├── graphql-error-handler.ts         # Utilities we reuse
└── __tests__/
    └── retry-logic.test.ts          # Existing tests to verify
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 + React 19 + Apollo Client 4)    │
└──────────┬──────────────────────────────────────────────┘
           │
           ├─ GraphQL Query/Mutation
           │  ↓
           └─ Apollo Link Chain:
              
              ┌─────────────────────────────────────────┐
              │ 1. TimeoutLink (10s hard timeout)       │
              │    - Timeout errors as retryable        │
              └──────────────┬──────────────────────────┘
                             ↓
              ┌─────────────────────────────────────────┐
              │ 2. RetryLink (up to 3 retries)          │
              │    - Exponential backoff 300/600/1200ms │
              │    - Skip 4xx, retry 5xx/network        │
              └──────────────┬──────────────────────────┘
                             ↓
              ┌─────────────────────────────────────────┐
              │ 3. ErrorLink (handle final errors)      │
              │    - Toast notification to user         │
              │    - Console logging                    │
              └──────────────┬──────────────────────────┘
                             ↓
              ┌─────────────────────────────────────────┐
              │ 4. AuthLink (inject JWT token)          │
              │    - Reapplied on each retry            │
              └──────────────┬──────────────────────────┘
                             ↓
              ┌─────────────────────────────────────────┐
              │ 5. HttpLink (actual network request)    │
              │    - POST to localhost:4000/graphql     │
              └──────────────┬──────────────────────────┘
                             ↓
              ┌─────────────────────────────────────────┐
              │ GraphQL Server (Apollo 4 + PostgreSQL)  │
              └─────────────────────────────────────────┘
```

---

## 🎓 Interview Talking Points

1. **Architecture Knowledge**
   - "Apollo RetryLink is the standard pattern, better than naive fetch wrapper"
   - "Link chain order is critical - timeout first, then retry"

2. **Error Handling Sophistication**
   - "We distinguish retryable (5xx, network, timeout) from non-retryable (4xx) errors"
   - "4xx errors fail fast (no wasted retries), 5xx retry intelligently"

3. **Distributed Systems**
   - "Exponential backoff with ±20% jitter prevents thundering herd"
   - "Backoff formula: 100 * 2^attempt (capped at 10s)"

4. **Code Organization**
   - "Each concern is a separate link (timeout, retry, error, auth)"
   - "Changes to one don't affect others"

5. **Testing Rigor**
   - "26 comprehensive test cases covering success/failure/edge cases"
   - "Unit tests for each link + integration tests for full flow"

6. **Production Readiness**
   - "Structured console logging for debugging [Apollo Retry] prefix"
   - "SSE reconnection uses same backoff config (consistency)"

7. **Type Safety**
   - "Full TypeScript strict mode, no `any` types"
   - "Observable<FetchResult> properly typed"

8. **Scalability**
   - "Easy to extend with circuit breakers, rate limiting"
   - "New links can be inserted anywhere in chain"

---

## 🚀 Quick Start Checklist

```
PRE-IMPLEMENTATION:
  [ ] Read: docs/implementation-planning/ISSUE-32-TIMEOUT-RETRY.md (full plan)
  [ ] Review: Section 1 (Approach Decision) - understand why Option A
  [ ] Review: Section 2 (Task Breakdown) - understand sequence
  [ ] Create branch: git checkout -b feat/timeout-retry-logic

PHASE 1 - Create Links (20 min):
  [ ] Create timeout-link.ts
  [ ] Create retry-link.ts
  [ ] Verify TypeScript: pnpm build

PHASE 2 - Integrate (10 min):
  [ ] Update apollo-client.ts (link order)
  [ ] Verify: makeClient() works

PHASE 3 - Test (40 min):
  [ ] Create timeout-link.test.ts (8 tests)
  [ ] Create retry-link.test.ts (12 tests)
  [ ] Create timeout-retry-integration.test.ts (6 tests)
  [ ] Run: pnpm test (all pass)

PHASE 4 - SSE + Docs (15 min):
  [ ] Update use-sse-events.ts
  [ ] Update CLAUDE.md
  [ ] Manual browser test (5-point checklist)

PHASE 5 - Verify (15 min):
  [ ] pnpm build
  [ ] pnpm lint
  [ ] pnpm test
  [ ] Manual browser testing

POST-IMPLEMENTATION:
  [ ] Create PR with comprehensive description
  [ ] Link to this plan
  [ ] Include acceptance criteria checklist
```

---

## 📚 Document Organization

```
docs/implementation-planning/
├── README.md                           (Project overview)
├── ISSUE-32-INDEX.md                   ← You are here
├── ISSUE-32-TIMEOUT-RETRY.md           (Complete technical plan - 688 lines)
├── ISSUE-32-SUMMARY.txt                (Quick reference)
└── [Other issue plans...]
```

---

## 🔗 Related Documentation

- **CLAUDE.md** - Update after implementation with new patterns
- **frontend/lib/graphql-error-handler.ts** - Reuse retry utilities
- **frontend/lib/sse-error-handler.ts** - Reference for error classification patterns
- **Issue #23** - Apollo singleton dependency (related)
- **Issue #28** - Error Boundaries (related)

---

## ⏱️ Time Investment

| Activity | Duration | ROI |
|----------|----------|-----|
| Read full plan | 15 min | Prevents mistakes |
| Implement Phase 1-2 | 30 min | Foundation solid |
| Write Phase 3 tests | 40 min | Confidence in code |
| Manual verification | 10 min | Catch edge cases |
| **TOTAL** | **95 min** | **Interview-grade code** |

---

## ✨ Why This Implementation Wins Interviews

✅ **Demonstrates Apollo Expertise** - RetryLink vs naive fetch wrapper
✅ **Error Classification** - Retryable vs non-retryable logic
✅ **Distributed Systems** - Exponential backoff understanding
✅ **Code Organization** - Clean separation of concerns
✅ **Testing Discipline** - 26 comprehensive test cases
✅ **TypeScript Mastery** - Strict types, no `any`
✅ **Production Thinking** - Logging, error messages, monitoring
✅ **Scalability** - Easy to extend with new links

---

## 📞 Getting Help

**For specific questions, see:**
- Implementation Details → Section 4 in ISSUE-32-TIMEOUT-RETRY.md
- Test Cases → Section 5 in ISSUE-32-TIMEOUT-RETRY.md
- Risk Mitigation → Section 7 in ISSUE-32-TIMEOUT-RETRY.md
- TypeScript Issues → Section 8 in ISSUE-32-TIMEOUT-RETRY.md

**To understand architecture:**
- See Section 1 (Approach Decision)
- See Section 9 (Implementation Sequence)
- See Architecture Overview (above)

---

**Status**: Ready for Implementation ✅
**Last Updated**: 2024-05-04
**Version**: 1.0 Complete

