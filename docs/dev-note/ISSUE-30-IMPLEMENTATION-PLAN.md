# Issue #30 Implementation Plan — Optimistic Updates

**Status:** In Progress  
**Date Started:** April 30, 2026  
**Target Completion:** May 2, 2026  
**Effort Estimate:** 2-3 days

---

## Executive Summary

This document provides the detailed phase-by-phase implementation plan for Issue #30 (Optimistic Updates). The issue requires implementing Apollo Client optimistic updates across 4 mutations to make the UI feel 3-5x faster on slow networks.

**Key Success Criteria:**
- ✅ All 9 acceptance criteria pass
- ✅ TypeScript build succeeds
- ✅ Tests pass
- ✅ Manual verification on slow network

---

## Current State Analysis

### Issues Found in `frontend/lib/apollo-hooks.ts`

| Issue | Current | Impact | Fix |
|-------|---------|--------|-----|
| **useCreateBuild** | Temp ID generated at init, static placeholder values | Doesn't use actual mutation variables | Generate new temp ID per call, use variables |
| **useUpdateBuildStatus** | Empty ID and status in optimisticResponse | Shows wrong data in UI | Use actual ID and status from variables |
| **useAddPart** | Temp ID generated at init, empty values | Part doesn't appear until server response | Generate new ID per call, use variables |
| **useSubmitTestRun** | Temp ID generated at init, empty values | Test run doesn't appear until server response | Generate new ID per call, use variables |
| **Cache Updates** | No `update` functions in mutations | New items don't appear in lists automatically | Add `cache.modify()` to each mutation |
| **Refetch Calls** | Using `refetchQueries` redundantly | Wastes bandwidth, conflicting with optimistic updates | Remove refetch calls, rely on cache |

### Issues Found in Components

| File | Issue | Impact | Fix |
|------|-------|--------|-----|
| **build-dashboard.tsx:58** | Calls `refetch()` after mutation | Wastes bandwidth | Remove refetch() |
| **build-detail-modal.tsx:94, 113, 141** | Calls `refetch()` after mutations | Wastes bandwidth | Remove refetch() |
| **build-detail-modal.tsx** | No button disable state during mutations | Can duplicate submissions | Add `disabled={isAddingPart}` etc. |

---

## Phase 1: Update Apollo Hooks (2 hours)

### Step 1.1: Fix `useCreateBuild()` Hook

**File:** `frontend/lib/apollo-hooks.ts` (lines 89-133)

**Changes:**
1. Remove static `optimisticResponse` from useMutation config (line 97-109)
2. Move optimisticResponse into the async function call
3. Use variables: `name`, `description`
4. Generate new temp ID per call
5. Add `update` function to cache.modify for builds array
6. Remove `refetchQueries` (line 110)

**Expected Result:**
```typescript
// Instead of:
const result = await createBuild({ variables: { name, description } });

// Will become:
const result = await createBuild({
  variables: { name, description },
  optimisticResponse: { ... },  // Uses variables
  update(cache, { data }) { ... }  // Updates cache
});
```

### Step 1.2: Fix `useUpdateBuildStatus()` Hook

**File:** `frontend/lib/apollo-hooks.ts` (lines 136-194)

**Changes:**
1. Remove static optimisticResponse from useMutation config
2. Move optimisticResponse into function call
3. Use actual `id` and `status` from variables
4. Add `update` function to modify builds array
5. Remove `refetchQueries`

**Key Insight:** Update function must find the build by ID and update only the status field.

### Step 1.3: Fix `useAddPart()` Hook

**File:** `frontend/lib/apollo-hooks.ts` (lines 197-261)

**Changes:**
1. Already has variables in optimisticResponse (good!)
2. Remove static optimisticResponse from useMutation config
3. Generate new temp ID in function call (not at hook init)
4. Add `update` function to append part to parts array in cache
5. Remove `refetchQueries`

**New Pattern:** Append new part to `build.parts` array in cache.modify

### Step 1.4: Fix `useSubmitTestRun()` Hook

**File:** `frontend/lib/apollo-hooks.ts` (lines 264-331)

**Changes:**
1. Already has variables in optimisticResponse
2. Remove static optimisticResponse from useMutation config
3. Generate new temp ID in function call
4. Add `update` function to append testRun to testRuns array
5. Remove `refetchQueries`

---

## Phase 2: Update Components (1.5 hours)

### Step 2.1: Fix `build-dashboard.tsx`

**File:** `frontend/components/build-dashboard.tsx`

**Changes:**
1. **Line 58:** Remove `refetch()` call
2. **Line 88-93:** Button already has `disabled={isCreating}` (good!)
3. **Line 288:** Close modal after success: `setIsCreateModalOpen(false)`
4. **Line 291-292:** Add console.error for user feedback (temporary, until #31 adds toast)

**Expected Behavior:**
- User clicks "Create Build"
- Button shows "Creating..." and is disabled
- New build appears in table immediately (optimistic)
- When form closes, Apollo cache has new build
- No refetch call

### Step 2.2: Fix `build-detail-modal.tsx`

**File:** `frontend/components/build-detail-modal.tsx`

**Changes:**
1. **Line 94:** Remove `refetch()` after updateStatus
2. **Line 113:** Remove `refetch()` after addPart
3. **Line 141:** Remove `refetch()` after submitTestRun
4. **Line 49:** Add `isUpdatingStatus` state for button disable
5. **Line 172:** Disable status buttons when updating: `disabled={isUpdatingStatus || buildData.status === status}`
6. **Line 108-119:** Disable "Add Part" button when adding
7. **Line 137-147:** Disable "Submit Test" button when submitting
8. **Line 95-98, 114-118, 142-145:** Add error console.error (temporary)

**Expected Behavior:**
- Each button disabled while mutation in-flight
- No duplicate submissions possible
- Data updates optimistically in UI
- Error logged to console (better UX in #31)

---

## Phase 3: Testing & Verification (2 hours)

### Step 3.1: Unit Tests for Hooks

**File:** Create `frontend/lib/__tests__/apollo-hooks.test.ts` (if not exists)

**Test Cases:**
1. `useCreateBuild` returns function that accepts variables
2. Optimistic response includes name from variables
3. Cache updated with new build in builds array
4. Temp ID included in optimistic response
5. Error scenario: Cache reverts (Apollo automatic)

**Strategy:** Mock useMutation with Apollo MockedProvider

### Step 3.2: Component Tests

**File:** Update/create component tests in `frontend/components/__tests__/`

**Test Cases:**
1. CreateBuild button disabled while isCreating=true
2. Build appears in table before server response
3. Error shown on failure
4. Status buttons disabled during mutation
5. No refetch() calls triggered

### Step 3.3: Manual Testing Checklist

```bash
# 1. Start dev server
pnpm dev

# 2. Enable network throttling (DevTools → Network → Slow 3G)

# 3. Test Create Build
#   ✅ Click "Create Build"
#   ✅ Enter name, click Create
#   ✅ See new build in table IMMEDIATELY (before network response)
#   ✅ Network tab shows mutation still pending
#   ✅ Verify in Apollo DevTools that cache has the build

# 4. Test Update Status
#   ✅ Click build, see status buttons
#   ✅ Click new status
#   ✅ Status badge changes IMMEDIATELY
#   ✅ Button disabled during mutation

# 5. Test Error Scenario
#   ✅ Start backend: pnpm dev:graphql
#   ✅ Stop backend: kill process
#   ✅ Try to create build
#   ✅ See error in console
#   ✅ Status reverts (cache auto-reverts)

# 6. Verify No Duplicate Submissions
#   ✅ Click "Create Build"
#   ✅ Rapidly click button 5x
#   ✅ Only ONE build should appear
#   ✅ Only ONE mutation request sent
```

---

## Phase 4: Build & TypeScript Verification

```bash
# Run TypeScript check
pnpm build

# Run tests
pnpm test

# Verify no errors
```

---

## Acceptance Criteria Checklist

- [ ] **AC1:** All mutations include `optimisticResponse` ✅
- [ ] **AC2:** UI updates immediately when mutation called ✅
- [ ] **AC3:** If mutation succeeds: optimistic response kept, server value merged ✅
- [ ] **AC4:** If mutation fails: cache reverts to previous state automatically ✅
- [ ] **AC5:** Error message shown on failure (console.error) ✅
- [ ] **AC6:** No duplicate submissions (button disabled during mutation) ✅
- [ ] **AC7:** Temp IDs for new items (temp-{timestamp}) ✅
- [ ] **AC8:** Real IDs received from server update cache ✅
- [ ] **AC9:** TypeScript build passes + tests pass ✅

---

## Implementation Order

1. **Fix `useCreateBuild()`** — Simplest, no complex cache logic
2. **Fix `useUpdateBuildStatus()`** — Update single field in existing record
3. **Fix `useAddPart()`** — Append to array in cache
4. **Fix `useSubmitTestRun()`** — Append to array in cache
5. **Update `build-dashboard.tsx`** — Remove refetch, close modal
6. **Update `build-detail-modal.tsx`** — Remove refetch, add button states
7. **Create/Update tests** — Verify all scenarios
8. **Manual testing** — Verify on slow network
9. **Build & verify** — TypeScript and tests pass

---

## Code Pattern Reference

All mutations follow this pattern:

```typescript
export function useMyMutation() {
  const [mutate, { loading, error: apolloError }] = useMutation(MUTATION);

  return {
    doMutation: async (arg1: string): Promise<Result | undefined> => {
      try {
        const tempId = generateTempId();  // Generate per call, not at hook init
        const result = await mutate({
          variables: { arg1 },
          optimisticResponse: {
            __typename: 'Mutation',
            myMutation: {
              __typename: 'MyType',
              id: tempId,
              arg1,  // Use variables!
              // ... other fields with actual values
            },
          },
          update(cache, { data }) {
            if (data?.myMutation) {
              cache.modify({
                fields: {
                  myItems: (existing = []) => [data.myMutation, ...existing],
                },
              });
            }
          },
        });
        return result.data?.myMutation;
      } catch (err) {
        console.error('Mutation failed:', extractErrorMessage(err));
        throw new Error(extractErrorMessage(err));
      }
    },
    loading,
    error: apolloError ? extractErrorMessage(apolloError) : null,
  };
}
```

---

## Success Indicators

- ✅ Build appears in list **before** network response (Slow 3G test)
- ✅ Status changes **instantly** in UI
- ✅ Button disabled prevents duplicate submissions
- ✅ Error handling: Cache reverts, error logged
- ✅ TypeScript build passes
- ✅ All tests pass
- ✅ No refetch calls made
- ✅ Apollo DevTools shows optimistic responses

---

## Next Phase (After #30 Merges)

- **Issue #31:** Replace `console.error()` with toast notifications
- **Issue #32:** Add retry logic + exponential backoff
- **Issue #28:** Error boundaries for render errors

---

**Document Version:** 1.0  
**Last Updated:** April 30, 2026
