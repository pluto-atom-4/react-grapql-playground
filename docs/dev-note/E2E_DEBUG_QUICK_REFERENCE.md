# E2E Test Debugging Quick Reference

## Issue #193: TC-E2E-BW-001 Build Workflow Test

### Quick Facts

| Aspect | Details |
|--------|---------|
| **Test File** | `frontend/e2e/tests/event-bus/build-workflow.spec.ts` |
| **Test Name** | TC-E2E-BW-001: Complete workflow - Create Build → Upload → Status Update |
| **Lines** | 33-104 |
| **Error** | TimeoutError: Timeout 10000ms waiting for 'build-name-input' element |
| **Branch** | `fix/e2e-build-workflow-timeout` |
| **Commit** | cb9f33b |

---

## What Was Fixed

### 🔧 Change Applied
- ❌ **Removed**: Line 40 redundant `await dashboardPage.goto()` call
- ✅ **Added**: 10+ debug logging statements with test context
- **Why**: Dashboard already loaded in `beforeEach`, re-navigation caused state confusion

### 🎯 Debug Logging Added
Every major step now logs with format: `[TC-E2E-BW-001] <action>`

```
Step 1: Dashboard ready (from beforeEach) [no log needed]
Step 2: [TC-E2E-BW-001] Clicking create-build-button
Step 3: [TC-E2E-BW-001] Waiting for build-name-input element (10s timeout)
Step 4: [TC-E2E-BW-001] ✓ build-name-input appeared successfully
Step 5: [TC-E2E-BW-001] Filling build-name-input with: "<buildName>"
Step 6: [TC-E2E-BW-001] Clicking create-build-submit button
Step 7: [TC-E2E-BW-001] Waiting for network to idle after create mutation
Step 8: [TC-E2E-BW-001] Build created in <latency>ms, waiting for build card
Step 9: [TC-E2E-BW-001] Fetching builds list to verify new build
Step 10: [TC-E2E-BW-001] Clicking build card to open details
Step 11: [TC-E2E-BW-001] Waiting for build details page to load
Step 12: [TC-E2E-BW-001] Verifying build status element is visible
Step 13: [TC-E2E-BW-001] ✓ Test completed successfully
```

---

## Root Cause: Why Test Still Fails

### Problem: Browser `prompt()` vs. React Modal

| Component | Test Expects | Code Provides | Result |
|-----------|--------------|---------------|--------|
| Create Build Dialog | React modal form | Browser `prompt()` | ❌ Element not in DOM |
| Input Element | `<input data-testid="build-name-input">` | N/A | ❌ Doesn't exist |
| Submit Button | `<button data-testid="create-build-submit">` | N/A | ❌ Doesn't exist |
| User Interaction | Fill form + click submit | Browser dialog interaction | ❌ Incompatible |

### Why Playwright Times Out

```
1. Test clicks "Create Build" button ✓
2. Browser prompt() is shown (native dialog, outside DOM)
3. Test looks for [data-testid="build-name-input"] in DOM
4. Element doesn't exist (it's a browser prompt, not HTML)
5. Wait for 10 seconds
6. Timeout ✗
```

### Code Location: The Problem

**File**: `frontend/components/build-dashboard.tsx`  
**Lines**: 52-67  
**Issue**: Uses native `prompt()` instead of React modal

```typescript
const handleCreateBuild = (): void => {
  const name = prompt('Enter build name:');  // ← PROBLEM: Browser prompt
  if (!name) return;
  // ... rest of handler
};
```

---

## How to Run Tests

### Run Specific Test
```bash
cd /home/pluto-atom-4/Documents/stoke-full-stack/react-grapql-playground
pnpm test:e2e build-workflow.spec.ts --grep "TC-E2E-BW-001"
```

### Run All Build Workflow Tests
```bash
pnpm test:e2e build-workflow.spec.ts
```

### Run with Debug Output
```bash
pnpm test:e2e build-workflow.spec.ts --reporter=verbose
```

### Watch for Debug Logs
Look for output like:
```
[TC-E2E-BW-001] Clicking create-build-button
[TC-E2E-BW-001] Waiting for build-name-input element (10s timeout)
[TC-E2E-BW-001] ✓ build-name-input appeared successfully
```

---

## What Happens Now?

### ✅ Fixed (Already Done)
1. Redundant `goto()` call removed
2. Debug logging added for easier troubleshooting
3. Page state is now consistent
4. Element queries are more reliable

### ⚠️ Still Broken (Requires Implementation)
1. Component still uses `prompt()` instead of modal
2. Test will still timeout waiting for non-existent form element
3. Modal component needs to be implemented

---

## Full Fix Timeline

### Phase 1: Debug Logging ✅ DONE
- Remove redundant navigation
- Add debug logging
- Commit to branch

### Phase 2: Implement Modal Component (NEXT)
- Create `CreateBuildModal` component
- Update `build-dashboard.tsx` to use modal
- Test manually to verify UI works

### Phase 3: Verify E2E Tests (AFTER Phase 2)
- Run all 5 build workflow tests
- All should pass once modal is implemented
- Update documentation if needed

---

## Debug Output Examples

### Before Fix (Broken)
```
Error: TimeoutError: Timeout 10000ms exceeded waiting for locator
  '[data-testid="build-name-input"]'
```
❌ No context about what step failed

### After Fix (Better)
```
[TC-E2E-BW-001] Clicking create-build-button
[TC-E2E-BW-001] Waiting for build-name-input element (10s timeout)
TimeoutError: Timeout 10000ms exceeded waiting for locator
  '[data-testid="build-name-input"]'
```
✅ Clear context: failed after button click, waiting for input

### After Modal Implementation (Success)
```
[TC-E2E-BW-001] Clicking create-build-button
[TC-E2E-BW-001] Waiting for build-name-input element (10s timeout)
[TC-E2E-BW-001] ✓ build-name-input appeared successfully
[TC-E2E-BW-001] Filling build-name-input with: "E2E Build 1743385234"
[TC-E2E-BW-001] Clicking create-build-submit button
[TC-E2E-BW-001] Waiting for network to idle after create mutation
[TC-E2E-BW-001] Build created in 234ms, waiting for build card
[TC-E2E-BW-001] ✓ Test completed successfully
```
✅ Complete flow with all steps logged

---

## Related Files

| File | Purpose | Status |
|------|---------|--------|
| `frontend/e2e/tests/event-bus/build-workflow.spec.ts` | E2E test cases | ✅ Updated |
| `frontend/components/build-dashboard.tsx` | Uses prompt() | ⏳ Needs modal |
| `frontend/components/create-build-modal.tsx` | NEW: Modal form | ⏳ Needs implementation |
| `docs/dev-note/E2E_BUILD_WORKFLOW_DEBUG.md` | Original analysis | ✅ Reference |
| `docs/dev-note/E2E_FIX_AND_ROOT_CAUSE_ANALYSIS.md` | This fix + root cause | ✅ Updated |

---

## Commands for Testing Fix

```bash
# Navigate to repo
cd /home/pluto-atom-4/Documents/stoke-full-stack/react-grapql-playground

# Check current branch
git branch --show-current
# Output: fix/e2e-build-workflow-timeout

# View the fix
git show HEAD
# Shows: Removed line 40, added debug logging

# Run the test to see debug output
pnpm test:e2e build-workflow.spec.ts --grep "TC-E2E-BW-001"

# After implementing modal, test should pass
pnpm test:e2e build-workflow.spec.ts
```

---

## Affected Test Cases (All 5 Use Same Pattern)

```
❌ TC-E2E-BW-001: Create Build → Upload → Status Update (lines 33-104)
❌ TC-E2E-BW-002: Create Build with real-time update (lines 83-103)
❌ TC-E2E-BW-003: Update status workflow (lines 108-148)
❌ TC-E2E-BW-004: Add part workflow (lines 153-205)
❌ TC-E2E-BW-005: Multiple operations sequence (lines 210-272)
```

All will pass once modal component is implemented.

---

## See Also

- **Detailed Analysis**: `docs/dev-note/E2E_FIX_AND_ROOT_CAUSE_ANALYSIS.md`
- **Original Investigation**: `docs/dev-note/E2E_BUILD_WORKFLOW_DEBUG.md`
- **Component Flow**: `docs/dev-note/COMPONENT_FLOW_DIAGRAM.md`
- **GitHub Issue**: #193

---

**Created**: April 30, 2026  
**Status**: ✅ Fix Applied | ⏳ Awaiting Modal Implementation  
**Next Phase**: Implement CreateBuildModal component (see detailed analysis)
