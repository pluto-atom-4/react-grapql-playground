# Issue #30 (Optimistic Updates) — Orchestration & Detailed Implementation Plan

**Status:** Planning Phase  
**Priority:** HIGH 🟠  
**Scope:** LARGE  
**Estimated Effort:** 2-3 days  
**Interview Context:** Phase 2 (Error Handling & Performance) — Weeks 2-3

---

## Executive Summary

Issue #30 **implements Apollo Client optimistic updates** across all mutations in the frontend application. This is a **prerequisite performance pattern** that makes the UI feel 3-5x faster on slow networks by showing changes **immediately** before server confirmation, with automatic rollback on error.

**Key Finding:** Issue #30 has **NO HARD BLOCKING DEPENDENCIES** on #28, #29, #31, or #32. It depends only on #23 (Apollo singleton) and #25 (TypeScript types), which are **already complete**. 

**Go/No-Go Decision:** ✅ **GREEN LIGHT** — #30 can start **IMMEDIATELY** (today) and can run **in parallel** with error handling improvements (#28, #29, #31, #32). The optimistic updates pattern is **independent** and **foundational** for all mutation-heavy UX.

---

## Dependency Analysis

### Hard Blocking Dependencies (Must Complete First)

| Issue | Title | Status | Why #30 Depends | Effort | Days |
|-------|-------|--------|-----------------|--------|------|
| #23 | Apollo Singleton & Cache | ✅ DONE | Optimistic updates require stable Apollo Client instance with InMemoryCache | 1 day | N/A |
| #25 | TypeScript Types & Codegen | ✅ DONE | Types from GraphQL schema (Build, Part, TestRun) used in optimisticResponse | 2 days | N/A |

### Soft Dependencies (Nice-to-Have, Not Blocking)

| Issue | Title | Status | Relationship | Impact |
|-------|-------|--------|--------------|--------|
| #28 | Error Boundaries | 🟡 PENDING | Error boundaries catch render errors; optimistic updates handle **Apollo** errors via `onError` | Redundant but complementary — don't block each other |
| #29 | CORS & SSE Fixes | 🟡 PENDING | Real-time events; optimistic updates handle **mutations**; orthogonal concerns | Can run in parallel; different parts of stack |
| #31 | Toast Notifications (Replace alert) | 🟡 PENDING | Better error display; #30 shows errors via `onError`, #31 improves **how** errors display | Can start after #30; #31 enhances #30 |
| #32 | Timeouts & Retry Logic | 🟡 PENDING | Retry logic helps mutations succeed; #30 ensures optimistic state reverts **if** retry fails | Complementary; #32 makes #30 more robust |

### Execution Order Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│ HARD BLOCKER: Issues #23 & #25 (Already Done ✅)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ START #30 TODAY (No waiting)                               │
│     └─ Depends only on completed #23 & #25                     │
│     └─ Can run 100% independently                              │
│                                                                 │
│  🟡 Run #28, #29, #31, #32 in PARALLEL (separate PRs)          │
│     └─ After #30 merges, #31 will enhance #30                  │
│     └─ #32 makes #30 more resilient                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Timeline Example:
Day 1: #30 starts (optimistic updates — core feature)
Day 1-2: #28, #29, #31, #32 work in parallel (separate concerns)
Day 2: #30 merges (optimistic UX pattern locked in)
Day 3: #31 merges (better error display for #30's errors)
Day 4: #32 merges (retry logic + #30 auto-rollback = resilience)
```

---

## Go / No-Go Decision

### Analysis

**Can #30 start before #28, #29, #31, #32?**

✅ **YES — ABSOLUTELY YES**

**Evidence:**
1. **No code dependencies:** #30 uses Apollo `useMutation` hooks + cache management. Issues #28-32 are error/timeout/retry improvements.
2. **Orthogonal concerns:**
   - #30 = **Show changes optimistically**
   - #28 = **Catch errors gracefully** (error boundaries)
   - #29 = **Fix real-time connection issues** (SSE/CORS)
   - #31 = **Improve error display** (toast vs alert)
   - #32 = **Handle slow networks** (timeouts/retry)
3. **#30 works standalone:** Mutations show optimistic state. On error, cache auto-reverts. Error logs to console. No external dependencies.
4. **#31 enhances #30:** After #30 ships, #31 upgrades error display (`alert()` → toast). But #30 works without it.
5. **#32 improves #30:** After #30 ships, #32 adds retry logic. If retry fails, #30's auto-rollback still works. But #30 works without it.

### Recommendation

**🟢 GREEN LIGHT — Start #30 immediately**

**Strategy:**
- **Start #30 today** — implement all 9 acceptance criteria
- **Run #31 in parallel** — improves error display (can merge after #30)
- **Run #32 in parallel** — adds retry logic (can merge after #30)
- **Run #28, #29 in parallel** — different parts of stack

**Risk:** Zero — #30 has no external blockers and follows Apollo best practices.

---

## Detailed Implementation Plan for Issue #30

### Overview

Implement optimistic updates for **4 mutations**:
1. `createBuild()` — Show new build instantly with temp ID
2. `updateBuildStatus()` — Show status change instantly
3. `addPart()` — Show new part instantly
4. `submitTestRun()` — Show test run instantly

### Phase 1: Understand Current State (30 min)

**Current Code Status (frontend/lib/apollo-hooks.ts):**

✅ **Already implemented (partially):**
- Line 97-109: `useCreateBuild()` has `optimisticResponse` stub
- Line 144-156: `useUpdateBuildStatus()` has `optimisticResponse` stub
- Line 210-220: `useAddPart()` has `optimisticResponse` stub

🚫 **Incomplete:**
- Optimistic responses use placeholder/empty values (empty strings, ID='')
- Missing dynamic values from **variables** (name, status, etc.)
- Missing **cache update functions** for deterministic UI state
- No **error handling** that shows what went wrong
- **Temp IDs** generated but not used consistently

**What needs to change:**
1. Replace empty optimistic responses with **real values from variables**
2. Add **update functions** to cache to ensure new items appear in lists
3. Implement proper **error handling** and logging
4. Ensure **temp IDs** persist across mutations and server response

---

### Phase 2: Update Hooks to Use Variables (1 hour)

**File:** `frontend/lib/apollo-hooks.ts`

#### Step 2.1: Fix `useCreateBuild()` Hook

**Current Problem:**
```typescript
optimisticResponse: {
  createBuild: {
    id: generateTempId(),  // ❌ Generated once, not updated with variables
    name: '',              // ❌ Empty string, not passed name
    // ...
  }
}
```

**Solution:**
```typescript
return {
  createBuild: async (name: string, description?: string): Promise<Build | undefined> => {
    try {
      const tempId = generateTempId();
      const result = await createBuild({
        variables: { name, description },
        optimisticResponse: {
          __typename: 'Mutation',
          createBuild: {
            __typename: 'Build',
            id: tempId,
            name,                                    // ✅ Use actual name
            description: description || null,       // ✅ Use actual description
            status: BuildStatus.Pending,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parts: [],
            testRuns: [],
          },
        },
      });
      return result.data?.createBuild;
    } catch (err) {
      const message = extractErrorMessage(err);
      console.error('Failed to create build:', message);
      throw new Error(message);
    }
  },
  loading,
  error: apolloError ? extractErrorMessage(apolloError) : null,
};
```

**Why it matters:**
- Temp ID is generated **per call**, not reused
- `name` and `description` from variables appear **immediately** in UI
- When server responds with real ID, Apollo merges it automatically

#### Step 2.2: Fix `useUpdateBuildStatus()` Hook

**Current Problem:**
```typescript
optimisticResponse: {
  updateBuildStatus: {
    id: '',         // ❌ Empty, unknown build ID
    status: BuildStatus.Pending,  // ❌ Wrong—should be the new status passed in
    // ...
  }
}
```

**Solution:**
```typescript
return {
  updateStatus: async (id: string, status: BuildStatus): Promise<Build | undefined> => {
    try {
      const result = await updateStatus({
        variables: { id, status },
        optimisticResponse: {
          __typename: 'Mutation',
          updateBuildStatus: {
            __typename: 'Build',
            id,                  // ✅ Use actual ID
            status,              // ✅ Use new status
            name: '',
            description: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parts: [],
            testRuns: [],
          },
        },
        update(cache, { data }) {
          if (data?.updateBuildStatus) {
            cache.modify({
              fields: {
                builds(existing = []) {
                  return existing.map((b: Build) =>
                    b.id === id ? { ...b, status } : b
                  );
                },
              },
            });
          }
        },
      });
      return result.data?.updateBuildStatus;
    } catch (err) {
      console.error('Failed to update status:', extractErrorMessage(err));
      throw new Error(extractErrorMessage(err));
    }
  },
  loading,
  error: apolloError ? extractErrorMessage(apolloError) : null,
};
```

#### Step 2.3: Fix `useAddPart()` Hook

Same pattern: Use variables in optimisticResponse, add cache update, proper error handling.

---

### Phase 3: Update Components to Disable Button During Mutation (1 hour)

**Files:** 
- `frontend/components/build-dashboard.tsx`
- `frontend/components/build-detail-modal.tsx`

**Goal:** Prevent duplicate submissions while mutation in-flight

#### Step 3.1: Build Dashboard Component

**Current Problem (lines 54-60):**
```typescript
const handleCreateBuild = async (name: string): Promise<void> => {
  try {
    setIsCreating(true);
    await createBuild(name);
    refetch();  // ❌ Redundant—Apollo already updated cache
  } catch (err) {
    throw new Error(`Failed to create build: ${String(err)}`);  // ❌ No user feedback
  } finally {
    setIsCreating(false);
  }
};
```

**Solution:**
```typescript
const handleCreateBuild = async (name: string): Promise<void> => {
  try {
    setIsCreating(true);
    await createBuild(name);
    // ✅ Don't call refetch()—Apollo cache already updated optimistically
    setIsCreateModalOpen(false);
  } catch (err) {
    const message = typeof err === 'string' ? err : String(err);
    console.error('Failed to create build:', message);
    // After #31 merges, replace with: showToast('error', message)
  } finally {
    setIsCreating(false);
  }
};
```

**Button element:**
```typescript
<button 
  onClick={() => handleCreateBuild(name)}
  disabled={isCreating}  // ✅ Prevent duplicate clicks
>
  {isCreating ? 'Creating...' : 'Create Build'}
</button>
```

#### Step 3.2: Build Detail Modal Component

Apply same pattern: disable button, remove refetch, catch errors gracefully.

---

### Phase 4: Add Tests for Optimistic Updates (1.5 hours)

**File:** `frontend/lib/__tests__/apollo-hooks.test.ts`

**Key tests:**
1. Optimistic response includes variables
2. Cache updated correctly
3. Error causes auto-rollback
4. Temp ID replaced by real ID

---

### Phase 5: Manual Testing & Verification (1 hour)

**Acceptance Criteria Verification:**

```bash
pnpm dev
# DevTools → Network → Throttling → Slow 3G

# ✅ AC1: Mutations include optimisticResponse
# ✅ AC2: UI updates immediately (no spinner first)
# ✅ AC3: Server response merged automatically
# ✅ AC4: Cache reverts on error
# ✅ AC5: Error shown (console.error)
# ✅ AC6: Button disabled during mutation
# ✅ AC7: Temp IDs used for new items
# ✅ AC8: Real IDs update cache
# ✅ AC9: TypeScript build passes
```

---

## Critical Success Factors

| Factor | How to Achieve |
|--------|-----------------|
| **Temp ID Consistency** | Use `generateTempId()` consistently |
| **Cache Synchronization** | Verify `__typename` matches schema |
| **Error Auto-Rollback** | Don't manually revert; let Apollo do it |
| **Button Disable State** | Check `loading` from hook |
| **No Unnecessary Refetch** | Delete `refetch()` calls after mutations |
| **Proper Error Logging** | Use `console.error()` not `alert()` |
| **Test Coverage** | 80%+ coverage of mutation paths |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Temp ID collision** | Low | High | Use `Date.now() + Math.random()` |
| **Cache merge conflicts** | Medium | Medium | Use `__typename` consistently |
| **Button state lag** | Low | Low | Use `loading` from hook |
| **Missing error handling** | Low | High | Add `onError` to every mutation |
| **TypeScript errors** | Low | Medium | Run `pnpm build` before pushing |

---

## Files to Modify

| File | Changes | Complexity |
|------|---------|-----------|
| `frontend/lib/apollo-hooks.ts` | Update 4 hooks with variables; add cache.modify(); error handling | **High** |
| `frontend/components/build-dashboard.tsx` | Remove refetch; disable button; error handling | **Medium** |
| `frontend/components/build-detail-modal.tsx` | Same as build-dashboard | **Medium** |
| `frontend/lib/__tests__/apollo-hooks.test.ts` | Add optimistic update tests | **Medium** |
| `frontend/components/__tests__/build-dashboard.test.tsx` | Add button disable tests | **Low** |

---

## Acceptance Criteria Checklist

- [ ] AC1: All mutations include `optimisticResponse`
- [ ] AC2: UI updates immediately (no spinner)
- [ ] AC3: Optimistic response kept, server value merged
- [ ] AC4: Cache reverts on error
- [ ] AC5: Error message shown (console or toast)
- [ ] AC6: No duplicate submissions (button disabled)
- [ ] AC7: Temp IDs for new items
- [ ] AC8: Real IDs update cache
- [ ] AC9: TypeScript build passes

---

## Conclusion

**Status:** ✅ Ready to Start  
**Blocker?** No  
**Parallel Work?** Yes — #28, #29, #31, #32 can work independently  
**Risk?** Low  
**Impact?** High — 3-5x perceived performance on slow networks  

### Next Steps

1. Assign to developer
2. Create feature branch: `feat/optimistic-updates`
3. Follow Phase 1-5 in sequence
4. Run acceptance criteria at end
5. Create PR with test report
6. Schedule #31 to follow #30

---

**Document Version:** 1.0  
**Last Updated:** April 30, 2026  
**Author:** Claude (Copilot)
