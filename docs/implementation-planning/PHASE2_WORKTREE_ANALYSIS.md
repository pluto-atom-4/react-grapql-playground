# Phase 2 Issues - Git Worktree Analysis & Recommendation

## Current State

### Git Status
- **Active branch**: main
- **Uncommitted changes**: None (clean working tree)
- **Existing worktrees**: None
- **Recent commits**:
  ```
  495a76d (HEAD -> main, origin/main) Merge pull request #199
  104cbb0 fix: Remove unused _startMemory variable (Issue #198)
  7dea318 Merge pull request #197 (feat/issue-30-impl)
  422fa13 fix: Correct cache scoping in addPart mutations (Issue #30)
  84febd2 docs: Add implementation notes for Issue #30
  ```

---

## Phase 2 Issues File Dependencies

### Issue #28: Add Global Error Handling & Error Boundaries

**Scope**: Frontend only  
**Effort**: 2 hours

**Files to Create**:
```
- frontend/components/error-boundary.tsx (NEW)
- frontend/app/error.tsx (NEW)
- frontend/app/error-styles.css (NEW - optional)
```

**Files to Modify**:
```
- frontend/app/layout.tsx (wrap with error boundary)
- frontend/lib/apollo-client.ts (add Apollo error link)
```

---

### Issue #29: Fix CORS & SSE Error Handling

**Scope**: Frontend + Backend (Express)  
**Effort**: 2 hours

**Files to Modify**:
```
- frontend/lib/use-sse-events.ts (rewrite with error handling)
- backend-express/src/routes/events.ts (fix CORS headers)
- backend-express/src/middleware/cors.ts (optional: centralize config)
```

---

### Issue #31: Enhance Error UI (Replace alert())

**Scope**: Frontend only  
**Effort**: 1.5 hours

**Files to Create**:
```
- frontend/components/toast-notification.tsx (NEW)
```

**Files to Modify**:
```
- frontend/components/build-detail-modal.tsx (lines 54, 71, 86 - replace alert with toast)
```

---

### Issue #32: Add Timeouts & Retry Logic

**Scope**: Frontend only  
**Effort**: 1.5 hours

**Files to Modify**:
```
- frontend/lib/apollo-client.ts (entire file - add RetryLink, timeout handling)
```

---

## File-Level Conflict Analysis

### 🔴 CRITICAL CONFLICT

**File**: `frontend/lib/apollo-client.ts`

| Issue | Change | Details |
|-------|--------|---------|
| #28 | ADD | Add Apollo error link (`onError` from `@apollo/client/link/error`) |
| #32 | MODIFY | Entire file rewrite with RetryLink + AbortSignal.timeout |

**Conflict Type**: Same file, overlapping concerns (error handling + retry/timeout)  
**Merge Complexity**: MEDIUM (can be combined, but requires careful integration)  
**Solution Options**:
1. **Sequential**: #28 then #32 (simple, but slower)
2. **Single branch**: One person implements both features together
3. **Git worktree**: Separate branches merged carefully

---

### 🟡 MODERATE CONFLICTS

**File**: `frontend/app/layout.tsx`

| Issue | Change | Details |
|-------|--------|---------|
| #28 | ADD | Wrap root with ErrorBoundary component |
| (others) | ? | Unknown future modifications |

**Conflict Type**: Potential coordination needed  
**Merge Complexity**: LOW (layout is typically modified sequentially)

---

### 🟢 INDEPENDENT (No Conflicts)

**Issue #29** (`frontend/lib/use-sse-events.ts`, `backend-express/src/routes/events.ts`)
- Only issue modifying these files
- Can be worked in parallel with #31, #32
- Conflict with #28 only if error handling is needed (manageable)

**Issue #31** (`frontend/components/build-detail-modal.tsx`, new `toast-notification.tsx`)
- Completely isolated component work
- Zero conflicts with #28, #29, #32
- Can be fully parallelized

---

## Logical Dependency Analysis

### Documented Dependencies (from issue bodies)

**Issue #28** depends on:
- #23 (Apollo singleton) ✅ Likely already available

**Issue #29** depends on:
- #23 (Apollo singleton) ✅ Likely already available
- #24 (Real-time Event Bus) ✅ Likely already available

**Issue #31** (no hard dependencies, but benefits from #28)

**Issue #32** depends on:
- #23 (Apollo singleton) ✅ Likely already available

### Recommended Execution Order

1. **Start in parallel** (#31, #29):
   - Issue #31: Toast UI work (100% independent)
   - Issue #29: SSE/CORS fixes (independent backend work)

2. **Then sequential** (#28 → #32):
   - Issue #28: Error boundaries + error link in Apollo
   - Issue #32: Wrap error link with retry + timeout logic

3. **OR combined** (#28 + #32):
   - Single developer implements error handling + retry + timeout in one cohesive PR

---

## Parallel Work Feasibility Matrix

| Issue Pair | Can Parallel? | Risk | Notes |
|------------|---------------|------|-------|
| #31 + #29 | ✅ YES | NONE | Completely independent |
| #31 + #28 | ✅ YES | LOW | Toast UI vs Error Boundaries |
| #31 + #32 | ✅ YES | LOW | Toast UI vs Apollo config |
| #29 + #28 | ✅ YES | MEDIUM | SSE needs error handling, but manageable |
| #29 + #32 | ✅ YES | MEDIUM | Both update SSE/Apollo, different concerns |
| #28 + #32 | ⚠️ CONDITIONAL | HIGH | **Conflict in apollo-client.ts** |

---

## Recommendation

### 🎯 PRIMARY RECOMMENDATION: **Simple Branching (NOT Git Worktree)**

**Rationale**:

1. **Low parallelization benefit**
   - Only 2-4 developers would gain from true parallel work
   - Current apparent solo development (based on git history)
   - Sequential branching sufficient

2. **Manageable file conflicts**
   - Only `apollo-client.ts` has true conflict (#28 + #32)
   - Conflict is solvable in a single merged implementation
   - Not complex enough to justify worktree overhead

3. **Simpler developer experience**
   - No worktree setup/cleanup burden
   - Easier to switch between issues
   - Lower risk of accidental branch pollution
   - Familiar Git workflow

4. **Small codebase size**
   - Changes are localized (frontend-only mostly)
   - Build times are fast
   - No heavy dependency on long-lived branches

5. **Low integration testing complexity**
   - Issues don't require simultaneous testing across branches
   - Frontend tests can run independently
   - Apollo client changes don't require parallel backend testing

---

### 🚀 ALTERNATIVE RECOMMENDATION: **Use Git Worktree IF** 

Use worktrees only if:
- **Multiple team members** actively developing #28 and #32 simultaneously
- **Continuous integration testing** needed across multiple error-handling scenarios
- **Different backend/frontend testing** phases happening in parallel
- **Developer prefers** working on multiple branches without checking out

**Setup** (if chosen):
```bash
git worktree add ../phase2-issue-28 -b feat/issue-28-error-boundaries main
git worktree add ../phase2-issue-29 -b feat/issue-29-cors-sse main
git worktree add ../phase2-issue-31 -b feat/issue-31-error-ui main
git worktree add ../phase2-issue-32 -b feat/issue-32-timeouts main

# Work in parallel:
cd ../phase2-issue-28  # Error Boundaries
cd ../phase2-issue-29  # CORS/SSE
cd ../phase2-issue-31  # Toast UI
cd ../phase2-issue-32  # Retry/Timeout
```

**Cleanup**:
```bash
# After PRs merged
git worktree prune
```

---

## Implementation Approach (Recommended: Simple Branching)

### Phase 1: Independent Issues (Parallel)

**Branch 1: Issue #31 (Toast UI)**
```bash
git checkout -b feat/issue-31-error-ui main
# Work on: toast-notification.tsx, build-detail-modal.tsx
# Time: 1.5 hours
# Push & PR
```

**Branch 2: Issue #29 (CORS/SSE)**
```bash
git checkout -b feat/issue-29-cors-sse main
# Work on: use-sse-events.ts, events.ts
# Time: 2 hours
# Push & PR
```

### Phase 2: Sequential (Coordinated)

**Branch 3: Issue #28 (Error Boundaries)**
```bash
git checkout -b feat/issue-28-error-boundaries main
# Create: error-boundary.tsx, error.tsx, error-styles.css
# Modify: layout.tsx, apollo-client.ts (add error link)
# Time: 2 hours
# Merge to main
```

**Branch 4: Issue #32 (Retry/Timeout) - ON TOP OF #28**
```bash
git checkout -b feat/issue-32-timeouts feat/issue-28-error-boundaries
# (OR) Rebase onto main after #28 merges
# Modify: apollo-client.ts (integrate error link + retry + timeout)
# Time: 1.5 hours
# Push & PR (depends on #28)
```

### Merge Order
1. ✅ #31 (Toast UI) - Independent, lands first
2. ✅ #29 (CORS/SSE) - Independent, lands second
3. ✅ #28 (Error Boundaries) - Prepares apollo-client.ts
4. ✅ #32 (Retry/Timeout) - Builds on #28

---

## Benefits of This Approach

| Benefit | How Achieved |
|---------|-------------|
| **Parallelization** | Issues #31 and #29 can be developed simultaneously |
| **Reduced Merge Conflicts** | Sequential #28→#32 ensures clean apollo-client.ts integration |
| **Simpler Workflow** | No worktree setup/teardown burden |
| **Lower Risk** | Fewer branches to manage, easier debugging |
| **Clear Dependencies** | #32 explicitly depends on #28 merge |
| **Faster Development** | Avoids worktree overhead, quicker context switching |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| #28 + #32 merge conflict in apollo-client.ts | Implement #32 *after* #28 merges to main; test together |
| #29 error handling needs #28 first | #29 mostly independent; integrate error handling afterward if needed |
| Accidental work on wrong branch | Clear branch naming (feat/issue-XX-*) + frequent PR reviews |
| #31 and #29 merge conflicts (layout changes) | Unlikely; monitor `frontend/app/layout.tsx` during review |

---

## Testing Strategy (Per Phase)

### Phase 1 Tests (Parallel)

**Issue #31 Tests**:
```bash
pnpm test frontend/components/__tests__/toast-notification.test.tsx
pnpm test frontend/components/__tests__/build-detail-modal.test.tsx
```

**Issue #29 Tests**:
```bash
pnpm test frontend/lib/__tests__/use-sse-events.test.ts
pnpm test backend-express/src/routes/__tests__/events.test.ts
```

### Phase 2 Tests (Sequential)

**Issue #28 Tests**:
```bash
pnpm test frontend/components/__tests__/error-boundary.test.tsx
pnpm test frontend/app/__tests__/error.test.tsx
# Manual: Stop GraphQL, verify error UI appears
```

**Issue #32 Tests** (after #28 merges):
```bash
pnpm test frontend/lib/__tests__/apollo-client.test.ts
# Manual: Throttle network, verify retry + timeout behavior
```

### Integration Test (After All Merge)
```bash
pnpm dev  # Start all services
# Create a build (tests error boundaries + retry logic + toast + SSE)
# Stop GraphQL server (tests timeout + reconnect)
# Check console for proper error logs
```

---

## Success Criteria

- ✅ All 4 issues implemented
- ✅ `frontend/lib/apollo-client.ts` cleanly integrates error link + retry + timeout
- ✅ No git conflicts during merges (or easily resolved)
- ✅ All tests pass (`pnpm test`)
- ✅ Build succeeds (`pnpm build`)
- ✅ Manual testing: Error UI displays, SSE reconnects, timeouts handled
- ✅ Type safety maintained (TypeScript strict mode)
- ✅ Code review feedback incorporated
- ✅ Final branch structure: All feature branches merged to main

---

## Timeline (Recommended Execution)

| Phase | Issues | Duration | Parallelizable? |
|-------|--------|----------|-----------------|
| **1** | #31, #29 | 2 hours each | ✅ YES (simultaneous) |
| **2** | #28 | 2 hours | Sequential start |
| **3** | #32 | 1.5 hours | After #28 merges |
| **Testing & Integration** | All | 1 hour | Sequential |
| **TOTAL** | 4 issues | ~9.5 hours | ~7.5 hours if parallelized |

---

## Conclusion

**Recommended Approach**: Simple Git branching with sequential merge of #28→#32.

**Why NOT git worktree**:
- Solo/small team development (based on git history)
- Only one true file conflict (manageable)
- Simpler, faster, lower-risk workflow
- Familiar to all developers

**When TO use worktree**:
- If 3+ developers working simultaneously on all 4 issues
- If continuous integration testing across all branches needed
- If team has worktree experience and strong git discipline

---

**Prepared**: April 18, 2026  
**Analyzed Issues**: #28, #29, #31, #32  
**Recommendation Level**: HIGH CONFIDENCE  
**Next Step**: Begin Issue #31 and #29 in parallel; queue #28 for after one phase completes.
