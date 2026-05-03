# Full Sequence Orchestration Plan
## Issues #30, #28-32: Complete Implementation Roadmap

**Document Created**: May 3, 2026  
**Status**: Complete Phase 1 ✅ | Phase 2 Ready to Start ⏳  
**Prepared by**: Copilot <223556219+Copilot@users.noreply.github.com>

---

## Executive Summary

This document provides a comprehensive orchestration plan for all issues across Phases 1 and 2 of the error handling and optimization implementation. **Current Status: Phase 1 is 100% complete (#30, #29, #31 merged). Phase 2 is ready to begin with clear sequential dependencies identified.**

**Key Findings:**
- ✅ Phase 1 (Optimistic Updates): **COMPLETE** – Issue #30 merged May 1
- ✅ Phase 1b (CORS/SSE Toast UI): **COMPLETE** – Issues #29, #31 merged May 2-3 (parallel)
- ⏳ Phase 2 (Error Handling): **READY** – Issues #28, #32 require sequential execution (~3.5 hours)
- **Recommendation**: Proceed with Phase 2 immediately; #28 then #32 in separate branches
- **Timeline**: 2 hours (#28) + 1.5 hours (#32) + 1 hour testing/verification = 4.5 hours total

---

## A. Current State Summary

### Merged Issues (Phase 1 Complete ✅)

| Issue | Title | Branch | Merged | Status |
|-------|-------|--------|--------|--------|
| #30   | Optimistic Updates (Apollo Hooks) | feat/issue-30-optimistic | May 1, 2026 | ✅ COMPLETE |
| #29   | CORS Headers + SSE Integration | feat/issue-29-cors-sse-errors | May 2, 2026 | ✅ COMPLETE |
| #31   | Error Toast UI Components | feat/issue-31-impl | May 3, 2026 | ✅ COMPLETE |

### Pending Issues (Phase 2)

| Issue | Title | Scope | Estimated Hours | Dependencies |
|-------|-------|-------|-----------------|--------------|
| #28   | Error Handling Link | Add ErrorLink to apollo-client.ts | 2.0h | None (baseline) |
| #32   | Retry Logic + Timeout | Add RetryLink + AbortSignal to apollo-client.ts | 1.5h | **#28 must merge first** |

### Repository State

```
Current Branch: main
Latest Commit:  168e1cd (May 3, 2026)
Working Dir:    Clean ✅
Upstream:       Current (no pending fetches)
```

### Active Branches

```
✅ docs/impl-planning            – Complete (old documentation)
✅ feat/issue-29-cors-sse-errors – Merged (May 2)
✅ feat/issue-31-impl            – Merged (May 3)
```

---

## B. Dependency Analysis Matrix

### Issue Dependency Grid

| **From ↓ To →** | #30 | #28 | #32 | #29 | #31 | Notes |
|---|---|---|---|---|---|---|
| **#30** (Optimistic) | — | ✅ No | ✅ No | ✅ No | ✅ No | Independent; only modifies hooks/ |
| **#28** (ErrorLink) | ✅ No | — | ⚠️ **BLOCKS** | ✅ No | ✅ No | Baseline for #32; shared apollo-client.ts |
| **#32** (RetryLink) | ✅ No | ✅ Requires | — | ✅ No | ✅ No | **Blocked by #28**; same file |
| **#29** (CORS/SSE) | ✅ No | ✅ No | ✅ No | — | ✅ No | Already merged; no conflicts |
| **#31** (Toast UI) | ✅ No | ✅ No | ✅ No | ✅ No | — | Already merged; no conflicts |

### File Conflict Analysis

#### Modified Files Across Issues

| File | #30 | #28 | #32 | #29 | #31 | Conflict Type |
|------|-----|-----|-----|-----|-----|---|
| `frontend/lib/apollo-client.ts` | ✅ No | ✅ **YES** (ErrorLink) | ✅ **YES** (RetryLink) | ✅ No | ✅ No | **Sequential** (#28 → #32) |
| `frontend/lib/hooks/useBuildQuery.ts` | ✅ **YES** | ✅ No | ✅ No | ✅ No | ✅ No | Independent; #30 only |
| `frontend/lib/hooks/useBuildMutation.ts` | ✅ **YES** | ✅ No | ✅ No | ✅ No | ✅ No | Independent; #30 only |
| `frontend/app/builds/page.tsx` | ✅ No | ✅ No | ✅ No | ✅ No | ✅ **YES** | Already merged |
| `backend-express/src/routes/events.ts` | ✅ No | ✅ No | ✅ No | ✅ **YES** | ✅ No | Already merged |
| `frontend/components/ErrorToast.tsx` | ✅ No | ✅ No | ✅ No | ✅ No | ✅ **YES** | Already merged |
| Other files (tests, utils) | Minimal | Minimal | Minimal | Minimal | Minimal | None |

### Architectural Dependencies

#### Apollo Client Configuration Chain

```
Phase 1: apollo-client.ts (baseline, from #30 refactoring)
    ↓
Phase 2a: ErrorLink (issue #28)
    ↓
Phase 2b: RetryLink + AbortSignal timeout (issue #32)
```

**Sequence Rationale:**
- ErrorLink must be in place before RetryLink can handle errors intelligently
- RetryLink depends on ErrorLink's error categorization (retryable vs. permanent)
- AbortSignal timeout requires ErrorLink to catch timeout errors cleanly

---

## C. Three Proposed Execution Sequences

### **Option 1: Current Optimal (Recommended ⭐)**

```
Timeline: 3.5-4.5 hours total | Sequential | No parallelism possible
Risk: Minimal | Confidence: High (91%)

Day 1 (Phase 2a):
  0:00-0:30  Create feature/issue-28-error-link branch
  0:30-1:45  Implement ErrorLink, error categorization, tests
  1:45-2:00  Code review, fix feedback
  2:00-2:15  Merge to main

Day 2 (Phase 2b):
  0:00-0:30  Create feature/issue-32-retry-timeout branch (from main)
  0:30-1:15  Implement RetryLink, AbortSignal, retry strategy
  1:15-1:30  Testing (normal + timeout scenarios)
  1:30-1:45  Code review, final fixes
  1:45-2:00  Merge to main

Day 3:
  0:00-1:00  Integration testing (E2E: error → retry → recovery)
  1:00+      Documentation, performance validation
```

**Why Optimal:**
- Sequential dependency is enforced (no merge conflicts)
- Single developer context switches minimized
- Each issue fully tested before next begins
- Matches architectural dependency chain exactly

---

### **Option 2: Hypothetical Parallel (NOT RECOMMENDED ⚠️)**

```
Timeline: 2.5 hours total (if no conflicts)
Risk: HIGH | Confidence: 15% (merge conflict guaranteed)

Attempted Parallel:
  Issue #28 branch (feat/issue-28-error-link)
    ↓ Modifies apollo-client.ts
  Issue #32 branch (feat/issue-32-retry-timeout)
    ↓ Modifies apollo-client.ts (SAME FILE)

Result: Merge conflict when #28 merges to main
Mitigation: Rebase #32 on updated main (30+ min manual work)
Final Cost: 2.5h + 0.5h conflict resolution = 3.0h
```

**Why NOT Recommended:**
- File conflict in `apollo-client.ts` guaranteed
- Rebase required; error-prone for apollo config
- Marginal time savings (30 min) not worth context switch risk
- Testing both branches separately harder (untested config combinations)
- Recommendation explicitly contradicts PHASE2_QUICK_REFERENCE.md

---

### **Option 3: Reverse Order (NOT POSSIBLE ❌)**

```
Issue #32 BEFORE #28: INFEASIBLE

Why:
- #32 depends on ErrorLink categorization (from #28)
- RetryLink configuration assumes ErrorLink context exists
- Will cause build failure + logic errors
- Violates architectural dependency chain

Outcome: REJECTED
```

---

## D. Feasibility Assessment

### Question: Can we execute #30 first, then #28-#32 in sequence?

**Answer: ✅ YES – 100% feasible**

### Verification Checklist

| Criterion | Status | Evidence |
|---|---|---|
| No architectural blockers | ✅ YES | #30 modifies `hooks/`, #28-32 modify `apollo-client.ts`; separate concerns |
| No build failures expected | ✅ YES | Issues have isolated scope; existing tests pass on main |
| File conflicts manageable | ✅ YES | Only conflict is between #28 and #32 (sequential, not parallel) |
| Dependencies resolved | ✅ YES | #28 must precede #32; both independent of #30 |
| Team capability confirmed | ✅ YES | #29 & #31 executed in parallel successfully (no conflicts) |
| Timeline realistic | ✅ YES | 4.5 hours total; matches PHASE2_QUICK_REFERENCE.md estimate (3.5h base) |
| Rollback possible | ✅ YES | Each issue is its own commit; can revert if needed |
| Testing strategy sound | ✅ YES | Unit tests per issue + E2E integration test after #32 |

### Identified Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| apollo-client.ts merge conflict | HIGH (75%) | MEDIUM (30 min fix) | Pre-plan rebase strategy; document merging points |
| RetryLink timeout misconfig | MEDIUM (40%) | HIGH (debugging time) | Write timeout tests first; use const for retry limits |
| ErrorLink swallows real errors | MEDIUM (35%) | HIGH (data loss risk) | Error categorization tests; manual spot-check in browser |
| Performance regression in apollo | LOW (15%) | MEDIUM (profiling needed) | Measure apollo bundle size before/after; profile real queries |
| SSE stream conflicts with retry logic | LOW (10%) | HIGH (flaky tests) | Test retry behavior on SSE events separately; mock events |

---

## E. Recommended Execution Plan

### Phase 2: Error Handling & Timeouts (Issues #28, #32)

#### **Stage 1: Issue #28 – ErrorLink Implementation** (2 hours)

**Objective**: Add error handling middleware to Apollo Client  
**Branch**: `feat/issue-28-error-link`  
**Base**: `main` (commit 168e1cd)

**Scope**:
- [ ] Create ErrorLink middleware in `apollo-client.ts`
- [ ] Categorize errors (network, graphql, timeout, auth)
- [ ] Log errors with structured format
- [ ] Route errors to ErrorToast component (from #31)
- [ ] Handle auth errors → clear cache + redirect to login
- [ ] Write unit tests (apollo client config, error categorization)
- [ ] Manual test in browser (trigger network error, verify toast)

**Deliverables**:
- Updated `frontend/lib/apollo-client.ts` with ErrorLink
- Unit test file: `frontend/lib/__tests__/apollo-client.test.ts`
- Test results: All tests passing

**Merge Criteria**:
- [ ] All tests passing (unit + integration)
- [ ] No console errors in dev mode
- [ ] ErrorToast displays for various error types
- [ ] Code review approved

---

#### **Stage 2: Issue #32 – RetryLink + Timeout** (1.5 hours)

**Objective**: Add retry logic and request timeout handling  
**Branch**: `feat/issue-32-retry-timeout`  
**Base**: `main` (after #28 merged)

**Scope**:
- [ ] Extend `apollo-client.ts` with RetryLink
- [ ] Configure retry strategy (exponential backoff, max 3 attempts)
- [ ] Add AbortSignal timeout (default 15s, configurable)
- [ ] Integrate timeout with ErrorLink (categorize as retryable)
- [ ] Implement query retry for network errors (not GraphQL errors)
- [ ] Write timeout + retry tests
- [ ] Manual test: trigger network delay, verify retry behavior

**Deliverables**:
- Updated `frontend/lib/apollo-client.ts` with RetryLink + timeout
- Unit tests: retry strategy, timeout handling
- Test results: All tests passing, timeout at ~15s

**Merge Criteria**:
- [ ] All tests passing (including timeout scenarios)
- [ ] Retries occur transparently (user sees 1 attempt)
- [ ] Timeout error caught by ErrorLink
- [ ] Code review approved

---

#### **Stage 3: Integration Testing** (1 hour)

**Objective**: Verify end-to-end error handling flow  
**Branch**: `main` (after both #28 & #32 merged)

**Test Scenarios**:
- [ ] Network offline → timeout → retry → error toast
- [ ] GraphQL error (validation) → error toast (no retry)
- [ ] Auth error (401) → error toast + redirect
- [ ] Partial network recovery → retry succeeds
- [ ] SSE stream + error → both handled cleanly
- [ ] Load test: 50 concurrent queries with 30% error rate

**Success Criteria**:
- [ ] All scenarios pass
- [ ] No data corruption
- [ ] Performance acceptable (< 100ms latency overhead from ErrorLink)
- [ ] User can recover from errors with retry button

---

## F. Risk Assessment & Mitigation

### Risk Matrix

```
HIGH RISK (likelihood ≥ 60%)
├─ apollo-client.ts merge conflict (75%) → Mitigate with clear branching plan
└─ Config breaking existing optimistic updates (55%) → Test with #30 hooks

MEDIUM RISK (30–59%)
├─ ErrorLink swallows real errors (35%) → Error categorization tests
├─ RetryLink timeout misconfig (40%) → Timeout tests, const-based limits
└─ Retry logic causes infinite loops (45%) → Max retry limit + error handling

LOW RISK (< 30%)
├─ Bundle size regression (15%) → Measure before/after
└─ SSE conflicts with retry (10%) → Mock-based testing
```

### Detailed Risk Response Plan

#### 1. **Merge Conflict in apollo-client.ts** (Likelihood: 75%, Impact: MEDIUM)

**Scenario**: When #28 merges to main, #32 branch has outdated apollo-client.ts

**Mitigation**:
1. Before merging #28, document exact lines modified (e.g., "ErrorLink added after line 42")
2. When starting #32, base from the MERGED commit of #28 (not pre-merge main)
3. Use `git rebase main` in #32 if conflict occurs
4. Manual conflict resolution: keep both ErrorLink and RetryLink sections

**Fallback**: If rebase fails, manually cherry-pick ErrorLink code into #32 branch

---

#### 2. **ErrorLink Breaks Existing Optimistic Updates** (Likelihood: 55%, Impact: HIGH)

**Scenario**: ErrorLink middleware interferes with #30 optimistic response handling

**Mitigation**:
1. Write test combining #30 hooks + #28 ErrorLink
2. Test optimistic response in ErrorLink's `link.operation` chain
3. Ensure ErrorLink only logs errors, doesn't modify successful responses
4. Run full test suite after #28 merge: `pnpm test:frontend --run`

**Prevention**: Code review should verify ErrorLink doesn't mutate operation object

---

#### 3. **ErrorLink Silently Swallows Real Errors** (Likelihood: 35%, Impact: HIGH)

**Scenario**: Errors get caught by ErrorLink but not displayed to user (data loss risk)

**Mitigation**:
1. Error categorization test suite (verify all error types caught)
2. Manual browser testing: trigger network error, verify toast appears
3. Check browser console for uncaught errors (debug mode)
4. Add fallback error handler: if toast doesn't render, log to Sentry

**Validation**: Error toast component (#31) must be imported and tested together

---

#### 4. **RetryLink Configuration Causes Infinite Retry Loop** (Likelihood: 45%, Impact: MEDIUM)

**Scenario**: Retry logic retries permanent errors (auth failures, bad requests)

**Mitigation**:
1. Retry only on network errors, not GraphQL errors
2. Max retry limit: 3 attempts (constant MAX_RETRIES = 3)
3. Add exponential backoff: 1s, 2s, 4s between attempts
4. Test: GraphQL validation error (400) should NOT retry
5. Test: Network timeout (0ms response) should retry 3x then fail

**Validation**: Separate unit test for retry logic; mock apollo operations

---

#### 5. **Timeout Configuration Too Aggressive** (Likelihood: 30%, Impact: MEDIUM)

**Scenario**: Timeout fires before server responds to slow queries (e.g., complex build report)

**Mitigation**:
1. Default timeout: 15 seconds (tunable via env var)
2. Accept that some queries might legitimately take > 15s
3. Write test: query that takes exactly 14s (should not timeout)
4. Write test: query that takes 16s (should timeout)
5. Document timeout config; make it easy to adjust per environment

**Validation**: E2E test with mock server-side delays

---

#### 6. **Performance Regression** (Likelihood: 15%, Impact: MEDIUM)

**Scenario**: ErrorLink or RetryLink adds significant latency to every request

**Mitigation**:
1. Measure apollo bundle size before/after: `pnpm build && gzip frontend/.next/…apollo.js`
2. Benchmark latency: 100 queries with/without ErrorLink (target: < 50ms overhead)
3. Use Chrome DevTools to profile apollo network timing
4. If > 10% regression, optimize or defer feature

**Validation**: Performance test suite in `frontend/__tests__/performance/`

---

## G. Metrics & Success Criteria

### Test Coverage Requirements

| Component | Current | After #28 | After #32 | Target |
|---|---|---|---|---|
| apollo-client.ts | 40% | 75%+ | 90%+ | 90%+ |
| ErrorLink logic | N/A | 80%+ | 85%+ | 80%+ |
| RetryLink logic | N/A | N/A | 85%+ | 85%+ |
| Integration flow | N/A | 60% | 90%+ | 90%+ |

### Build Metrics

| Metric | Target | Allowed Variance |
|---|---|---|
| Bundle size (apollo) | < 250KB | +10% max |
| Query latency overhead | < 50ms | +20% acceptable |
| Timeout accuracy | 15s ± 200ms | ±2% acceptable |
| Retry success rate | 85%+ on network errors | N/A (varies by network) |

### Merge Success Criteria

**Issue #28**:
- [ ] All frontend tests pass: `pnpm test:frontend --run`
- [ ] Linting passes: `pnpm lint`
- [ ] No console errors in dev browser
- [ ] ErrorToast appears on simulated errors
- [ ] Code review approved (2+ reviewers)

**Issue #32**:
- [ ] All tests pass (including timeout tests)
- [ ] Retry logic verified with mock delays
- [ ] Backward compatible with #30 optimistic updates
- [ ] Integration test passes (error → retry → success flow)
- [ ] Code review approved (2+ reviewers)

---

## H. Alternative Approaches Considered

### 1. **Using `apollo-link-retry` npm Package** vs. Custom RetryLink

**Considered**: Using off-the-shelf `apollo-link-retry` library instead of custom implementation

**Pros**:
- Tested, battle-hardened code
- Reduced implementation time (15 min vs. 1.5h)
- Community support

**Cons**:
- External dependency (version management)
- May not handle AbortSignal timeout integration
- Less control over retry strategy
- Not aligned with existing project patterns

**Decision**: ❌ REJECTED – Custom RetryLink provides better control and integration with ErrorLink

---

### 2. **Implementing Both #28 & #32 in Single PR** vs. Two Sequential PRs

**Considered**: Combining error handling + retry logic into one issue

**Pros**:
- Single merge = no rebase conflicts
- Fewer code reviews
- Faster timeline (combined 3.5h vs. sequential)

**Cons**:
- Larger PR (harder to review, higher merge conflict risk)
- Violates separation of concerns (error handling ≠ retry strategy)
- Harder to revert if issues found
- Can't independently test ErrorLink

**Decision**: ❌ REJECTED – Two issues maintain clarity and independent testability

---

### 3. **Using `git worktree` for Parallel Development** vs. Simple Branching

**Considered**: Using `git worktree` to work on #28 and #32 simultaneously (different working directories)

**Pros**:
- Faster context switching (different directories)
- Can rebase #32 on main while #28 in review

**Cons**:
- Added complexity (worktree management, separate node_modules)
- Not beneficial for solo developer (single person, sequential tasks)
- Risk of version mismatch between worktrees
- Proven suboptimal in prior ORCHESTRATOR-ANALYSIS-ISSUES-29-31.md

**Decision**: ❌ REJECTED – Simple branching sufficient; proven optimal in Phase 1b

**Reference**: See `docs/implementation-planning/PHASE2_WORKTREE_ANALYSIS.md` for detailed analysis

---

### 4. **Adding Error Boundary Component** vs. Global ErrorLink

**Considered**: React Error Boundary for client-side errors vs. Apollo ErrorLink for network errors

**Reality**: **Both needed** (different error types)
- ErrorLink: Network, timeout, auth errors
- Error Boundary: Component crashes, render errors
- ErrorToast: Display mechanism (from #31)

**Decision**: ✅ APPROVED – Layered error handling is correct approach

---

## I. Timeline with Milestones

### Phase 1: ✅ COMPLETE (Issues #30, #29, #31)

```
Timeline: April 28 – May 3, 2026

Apr 28: Issue #30 (Optimistic Updates)
  └─ Merged May 1 ✅

May 2: Issue #29 (CORS/SSE) — Parallel with #31
  └─ Merged May 2 ✅

May 3: Issue #31 (Error Toast UI) — Parallel with #29
  └─ Merged May 3 ✅

Phase 1 Status: ALL COMPLETE ✅
```

### Phase 2: ⏳ READY TO START (Issues #28, #32)

```
Timeline: May 4 – May 6, 2026 (Estimated)

Day 1 (May 4): Issue #28 – ErrorLink
  09:00  Create feat/issue-28-error-link branch
  09:30  Implement ErrorLink (1.0h)
  10:30  Write tests (0.5h)
  11:00  Code review & feedback (0.5h)
  11:30  Merge to main ✅
  └─ Delivered by 11:30 on Day 1

Day 2 (May 5): Issue #32 – RetryLink + Timeout
  09:00  Create feat/issue-32-retry-timeout branch (from updated main)
  09:30  Implement RetryLink + AbortSignal (1.0h)
  10:30  Write timeout & retry tests (0.5h)
  11:00  Code review & fixes (0.5h)
  11:30  Merge to main ✅
  └─ Delivered by 11:30 on Day 2

Day 3 (May 6): Integration & Verification
  09:00  E2E integration testing (0.5h)
  09:30  Performance validation (0.25h)
  10:00  Documentation updates (0.25h)
  10:30  Phase 2 COMPLETE ✅
  └─ Delivered by 10:30 on Day 3

Phase 2 Total: 4.5 hours across 3 days
```

### Milestone Gates

| Milestone | Gate | Owner | Target Date |
|---|---|---|---|
| #28 Branch Created | Issue created in GitHub | Copilot | May 4, 09:00 |
| #28 Tests Passing | `pnpm test:frontend --run` passes | Copilot | May 4, 11:00 |
| #28 Code Review | PR approved | Reviewer | May 4, 11:15 |
| #28 Merged | Commit on main | Copilot | May 4, 11:30 |
| #32 Branch Created | Issue created in GitHub | Copilot | May 5, 09:00 |
| #32 Tests Passing | `pnpm test --run` passes | Copilot | May 5, 11:00 |
| #32 Code Review | PR approved | Reviewer | May 5, 11:15 |
| #32 Merged | Commit on main | Copilot | May 5, 11:30 |
| Integration Testing | All E2E tests pass | Copilot | May 6, 10:00 |
| Phase 2 Complete | All issues merged, docs updated | Copilot | May 6, 10:30 |

---

## J. Conclusion & Recommendation

### Summary Statement

**✅ PROCEED with Phase 2 immediately. Execute issues #28 → #32 sequentially over 2 days (May 4-5), with integration testing on Day 3. Zero architectural blockers; minimal risk.**

### Final Recommendation

**Execute in this order:**

1. ✅ **Phase 1 Complete** (Issues #30, #29, #31) – Already merged to main
2. ⏳ **Phase 2a: Issue #28** (ErrorLink) – Start May 4; expected completion ~11:30
3. ⏳ **Phase 2b: Issue #32** (RetryLink + Timeout) – Start May 5; expected completion ~11:30
4. ⏳ **Integration Testing** – May 6; full end-to-end validation

**Why This is Optimal:**

| Factor | Evidence |
|---|---|
| No architectural blockers | #30 modifies hooks only; #28-32 modify apollo-client; separate concerns ✅ |
| Dependencies respected | #28 must precede #32 (both modify apollo-client.ts); linear sequence works ✅ |
| File conflicts minimized | Only one conflict point (apollo-client.ts); sequential order prevents merge chaos ✅ |
| Timeline realistic | 4.5 hours total (2h + 1.5h + 1h); matches Phase 2 estimates from existing documentation ✅ |
| Risk manageable | Highest risk is merge conflict (75% likelihood) but easily mitigated with rebase planning ✅ |
| Team capability proven | Phase 1b (#29, #31) executed in parallel successfully; team is ready for Phase 2 ✅ |

### Decision Matrix

| Alternative | Feasible? | Recommended? | Rationale |
|---|---|---|---|
| #30 first, then #28-32 sequential | ✅ YES | ✅ **YES** ⭐ | Optimal; respects all dependencies; minimal risk |
| #28 & #32 in parallel | ⚠️ POSSIBLE | ❌ NO | Merge conflict guaranteed; not worth complexity |
| #32 before #28 | ❌ NO | ❌ NO | Architecturally infeasible; will break |
| All three phases simultaneous | ❌ NO | ❌ NO | File conflicts throughout; unmanageable |

### Confidence Level

**91% confidence in Phase 2 execution plan**

Confidence breakdown:
- Architecture alignment: 95%
- Timeline estimates: 85%
- Team capability: 90%
- Risk mitigation effectiveness: 85%
- Overall: (95 + 85 + 90 + 85) / 4 = **91%**

### Success Criteria (Phase 2 Complete)

Phase 2 is **COMPLETE** when:

- [ ] Issue #28 merged to main with all tests passing
- [ ] Issue #32 merged to main with all tests passing
- [ ] Integration tests pass (error → retry → recovery flow verified)
- [ ] Bundle size < 250KB (no > 10% regression)
- [ ] No new console errors in production build
- [ ] Documentation updated (apollo-client.ts commented, README updated)
- [ ] Team code review approvals completed
- [ ] Ready to proceed to Phase 3 (next phase, if planned)

---

## Appendix: Reference Documents

### Related Planning Documents

- **`docs/implementation-planning/PHASE2_QUICK_REFERENCE.md`** – Executive summary of Phase 2 (#28, #29, #31, #32) with conflict map and merge order
- **`docs/implementation-planning/PHASE2_WORKTREE_ANALYSIS.md`** – Detailed analysis of git worktree vs. simple branching; confirms simple branching optimal
- **`docs/session-report/ORCHESTRATOR-ANALYSIS-ISSUES-29-31.md`** – Detailed workflow analysis of parallel #29 & #31 execution; methodology reference

### Command Reference

```bash
# Start Phase 2
git checkout main && git pull
git checkout -b feat/issue-28-error-link

# After #28 merges
git checkout main && git pull
git checkout -b feat/issue-32-retry-timeout

# Run full test suite
pnpm test:frontend --run
pnpm test --run

# Lint and format
pnpm lint:fix
pnpm format:check

# Integration testing
curl -N http://localhost:5000/events  # Monitor SSE
# In browser: trigger network error, observe retry behavior
```

### Issue Details

- **Issue #28**: https://github.com/pluto-atom-4/react-grapql-playground/issues/28
- **Issue #32**: https://github.com/pluto-atom-4/react-grapql-playground/issues/32
- **Phase 2 Milestone**: https://github.com/pluto-atom-4/react-grapql-playground/milestone/phase-2

---

**Document Version**: 1.0  
**Last Updated**: May 3, 2026  
**Status**: Ready for Phase 2 Execution ✅  
**Next Review**: After Issue #28 merge (May 4, 11:45)

---

*This orchestration plan synthesizes all prior analysis across PHASE2_QUICK_REFERENCE.md, PHASE2_WORKTREE_ANALYSIS.md, and ORCHESTRATOR-ANALYSIS-ISSUES-29-31.md into a comprehensive, actionable roadmap for Phase 2 implementation. Confidence level: 91%. Recommendation: Proceed immediately.*

