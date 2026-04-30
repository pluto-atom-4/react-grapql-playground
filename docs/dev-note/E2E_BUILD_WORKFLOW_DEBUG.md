# E2E Build Workflow Test Failure Analysis (Issue #193)

**Date**: April 17, 2026  
**Test**: TC-E2E-BW-001: Complete workflow - Create Build → Upload → Status Update  
**Status**: ❌ FAILING at form input step

---

## Executive Summary

The E2E test TC-E2E-BW-001 is failing because the test expects a modal form component with `data-testid="build-name-input"`, but the current implementation uses a **browser `prompt()` dialog** instead. Playwright's `waitFor()` cannot interact with native browser prompts—they exist outside the DOM.

**Progress Timeline**:
1. ✅ **beforeEach Timeout** (RESOLVED): Fixed by capping hydration check with Promise.race() (1s max)
2. ❌ **Form Input Wait** (NEW ISSUE): Modal form expected but not implemented

---

## Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Test beforeEach | ✅ PASS | Completes in ~1.3 seconds (was 26+ seconds) |
| Dashboard Navigation | ✅ PASS | Page loads, builds visible |
| Create Button Click | ✅ PASS | Button element exists, clickable, executes line 43 |
| Form Input Wait | ❌ FAIL | **Timeout 10000ms** - Element not found |

**Error Details**:
```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="build-name-input"]') to be visible

at DashboardPage.waitForTestId (BasePage.ts:66:36)
at build-workflow.spec.ts:46:25
```

**Screenshot Analysis** (test-failed-1.png):
- Dashboard loads successfully with existing builds visible
- "Create Build" button is clearly visible (blue button, top right)
- Button appears clickable with no modal/form visible after click
- Builds table shows existing builds with PENDING status and View Details buttons

---

## Root Cause Analysis

### The Problem: Browser `prompt()` Dialog vs. Test Infrastructure

**Current Implementation** (`build-dashboard.tsx`, lines 52-67):

```typescript
const handleCreateBuild = (): void => {
  const name = prompt('Enter build name:');  // ← Uses native browser prompt()
  if (!name) return;

  void (async (): Promise<void> => {
    try {
      setIsCreating(true);
      await createBuild(name);
      refetch();
    } catch (err) {
      alert(`Failed to create build: ${String(err)}`);
    } finally {
      setIsCreating(false);
    }
  })();
};
```

**Why This Breaks E2E Tests**:
- `prompt()` creates a **native browser dialog**, not a DOM element
- Playwright cannot find `[data-testid="build-name-input"]` because it doesn't exist in the DOM
- `waitFor()` searches the DOM only—browser prompts are outside the DOM hierarchy
- Result: Test times out waiting for an element that will never appear

**Test Code** (build-workflow.spec.ts, lines 42-46):
```typescript
// Step 2: Click "Create Build" button
await dashboardPage.clickByTestId('create-build-button');

// Step 3: Wait for create modal/form to appear
await dashboardPage.waitForTestId('build-name-input', 10000);  // ← FAILS HERE

// Step 4: Fill build form
await dashboardPage.fillByTestId('build-name-input', buildName);
```

### Root Cause: Design Mismatch

| Aspect | Test Expects | Current Implementation | Result |
|--------|--------------|------------------------|--------|
| **Form Type** | React Modal Component | Browser `prompt()` Dialog | ❌ Incompatible |
| **Element DOM** | `<input data-testid="build-name-input">` | N/A (native dialog) | ❌ Not in DOM |
| **Playwright Interaction** | DOM locator queries | Cannot interact with prompts | ❌ Fails |
| **User Experience** | Modern modal/form UX | Dated browser prompt | ⚠️ Poor UX |

---

## Component Architecture Analysis

### Current Flow: Button → `prompt()` → GraphQL Mutation

```
1. User clicks "Create Build" button
   └─ data-testid="create-build-button"
   └─ Location: build-dashboard.tsx:90-97

2. handleCreateBuild() triggered
   └─ Shows browser prompt("Enter build name:")
   └─ No React modal rendered

3. If user enters name:
   └─ Calls createBuild(name) hook
   └─ GraphQL mutation sent to Apollo
   └─ Builds list refetched on success

4. Test Flow BREAKS HERE:
   └─ Test clicks button ✅
   └─ Test waits for 'build-name-input' ❌
   └─ Element never appears (it's a browser prompt, not DOM)
   └─ Timeout after 10 seconds
```

### Expected Flow: Button → Modal Form → Input → Submit

```
1. User clicks "Create Build" button
   └─ Should trigger modal to appear

2. Modal component renders with form
   └─ <input data-testid="build-name-input"> 
   └─ <button data-testid="create-build-submit">

3. Test fills form and submits
   └─ await dashboardPage.fillByTestId('build-name-input', buildName)
   └─ await dashboardPage.clickByTestId('create-build-submit')

4. GraphQL mutation executes
   └─ BUILD_CREATED event emitted
   └─ Builds list updates with new build
```

---

## File Structure & Affected Components

### Component Files

1. **`frontend/components/build-dashboard.tsx`** (Main Issue)
   - **Lines 52-67**: `handleCreateBuild()` uses `prompt()`
   - **Line 90-97**: Create button with `data-testid="create-build-button"`
   - **Missing**: Modal component for create form

2. **`frontend/components/build-detail-modal.tsx`** (Reference)
   - Implements modal for build details
   - Uses `prompt()` for add part (lines 101-120)
   - Pattern can be adapted for create build

3. **`frontend/e2e/pages/DashboardPage.ts`** (Test Page Object)
   - **Line 22**: Defines `createBuildButton()` accessor
   - **Lines 101-115**: `createBuild()` helper method
   - Expects form elements that don't exist

4. **`frontend/e2e/tests/event-bus/build-workflow.spec.ts`** (Test Cases)
   - **Lines 33-78**: TC-E2E-BW-001 (FAILING HERE)
   - **Lines 43**: Clicks button ✅
   - **Line 46**: Waits for input ❌ TIMEOUT
   - **Lines 88-103**: TC-E2E-BW-002, TC-E2E-BW-003 (Also use same pattern)

### Test ID Expectations

| Test ID | Expected Element | Current Implementation | Status |
|---------|------------------|------------------------|--------|
| `create-build-button` | Button to open form | ✅ Exists (line 93) | ✅ |
| `build-name-input` | Input field for name | ❌ Missing (prompt() used) | ❌ |
| `create-build-submit` | Button to submit form | ❌ Missing | ❌ |

---

## Why Tests Were Written This Way

The E2E tests (`build-workflow.spec.ts`) were designed with **proper modal form expectations**:
- They assume a React modal component manages the create build UI
- They expect form inputs with test IDs (`build-name-input`, `create-build-submit`)
- They follow modern E2E testing best practices (no browser prompts)

**Why Prompts Exist in Code**:
- Placeholder implementation while UI components were being developed
- Simpler to mock in isolated unit tests
- Predates E2E test infrastructure setup

---

## Potential Root Causes Checklist

- [x] **Create button doesn't actually open modal when clicked**
  - ✅ **CONFIRMED**: Button calls `prompt()` instead of showing modal
  
- [x] **Modal exists but 'build-name-input' element uses different testid**
  - ✅ No modal component exists at all
  
- [x] **Form is rendered but hidden (display: none or visibility: hidden)**
  - ✅ N/A - form doesn't exist
  
- [x] **Form element exists but takes longer than 10 seconds to appear**
  - ✅ N/A - no form to wait for
  
- [x] **Click on create button has no effect (event handler not attached)**
  - ✅ Handler IS attached, but it triggers `prompt()`
  
- [x] **Modal requires async data loading before showing form**
  - ✅ N/A - no async loading needed for simple input form
  
- [x] **Test ID attribute is missing or different**
  - ✅ **CONFIRMED**: Test IDs don't exist because form doesn't exist

---

## Screenshot Analysis

**File**: `frontend/test-results/event-bus-build-workflow-E-2b415-ld-→-Upload-→-Status-Update-firefox/test-failed-1.png`

### Visible Elements
- ✅ **Navigation**: "Builds" section visible, "Logout" button present
- ✅ **Page Title**: "Build Dashboard" heading visible
- ✅ **Create Button**: Blue "Create Build" button visible in top right (clickable)
- ✅ **Builds Table**: 7 builds visible with columns: Name, Status, Created, Action
- ✅ **Status Badges**: Each build shows "PENDING" badge
- ✅ **Action Buttons**: "View Details" buttons present for each build

### What's Missing
- ❌ **No Modal**: No modal overlay or form appears after clicking button
- ❌ **No Input Fields**: No form inputs visible
- ❌ **No Modal Overlay**: No darkened background or modal container
- ❌ **Browser Prompt**: Native browser prompt not captured in screenshot (happens before screenshot taken)

### Conclusion
Screenshot confirms the button exists and is visible, but **no form UI appears** when clicked. The browser prompt (if shown to the test runner) would not be visible in the Playwright screenshot.

---

## Recommendations for Fix

### Option A: Implement Create Build Modal Component (RECOMMENDED)

**Pros**:
- ✅ Modern, professional UI/UX
- ✅ Consistent with rest of application
- ✅ E2E tests work immediately
- ✅ Better error handling and validation
- ✅ Accessible (ARIA labels, keyboard navigation)

**Cons**:
- Requires new component development
- More code than prompt()

**Implementation Steps**:
1. Create `frontend/components/create-build-modal.tsx`
   - Modal overlay with form
   - Input field with `data-testid="build-name-input"`
   - Submit button with `data-testid="create-build-submit"`
   - Close button and keyboard escape handling

2. Add state management to `build-dashboard.tsx`
   - `isCreateModalOpen` state
   - `onOpenCreateModal()` handler
   - `onCloseCreateModal()` handler

3. Update `handleCreateBuild()` to open modal instead of prompt

4. E2E tests will pass immediately

---

## Next Steps (Priority Order)

1. **Immediate**: Implement Create Build Modal Component
   - Time estimate: 30-45 minutes
   - Unblocks all E2E tests using create flow
   - See Option A above for details

2. **Follow-up**: Remove all `prompt()` usage
   - Update `build-detail-modal.tsx` to use proper forms instead of prompts
   - Affects: Add Part, Submit Test Run workflows

3. **Testing**: Verify E2E tests pass
   ```bash
   pnpm test:e2e build-workflow.spec.ts
   ```

4. **Documentation**: Update test documentation
   - Note: Modal implementation required for E2E testing
   - Update component patterns guide

---

## Code References

### Files to Examine
- `frontend/components/build-dashboard.tsx` - Line 52-67 (handleCreateBuild)
- `frontend/e2e/pages/DashboardPage.ts` - Line 101-115 (createBuild method)
- `frontend/e2e/tests/event-bus/build-workflow.spec.ts` - Line 33-78 (TC-E2E-BW-001)
- `frontend/e2e/helpers/BasePage.ts` - Line 66 (waitForTestId)

### Related Test Cases Affected
- TC-E2E-BW-001: Create Build workflow (Lines 33-78)
- TC-E2E-BW-002: Create Build with real-time update (Lines 83-103)
- TC-E2E-BW-003: Update status workflow (Lines 108-148)
- TC-E2E-BW-004: Add part workflow (Lines 153-205)
- TC-E2E-BW-005: Multiple operations sequence (Lines 210-272)

### GraphQL Hooks Used
- `useCreateBuild()` - Apollo hook for create mutation
- `useBuilds()` - Apollo hook for fetching builds list
- Location: `frontend/lib/apollo-hooks.ts`

---

## Success Criteria for Fix

- [x] Understand root cause (browser prompt instead of modal)
- [x] Identify affected components (build-dashboard.tsx)
- [x] Document component flow
- [x] Create action plan (implement modal component)
- [x] List all affected E2E tests (5 test cases)
- [x] Provide code references
- [ ] Implement Create Build Modal (next phase)
- [ ] Verify E2E tests pass

---

## Debugging Timeline

**Session 1** (Previous):
- Investigated beforeEach timeout (26+ seconds)
- Applied Promise.race() fix to BasePage.goto()
- beforeEach now completes in ~1.3 seconds ✅

**Session 2** (Current):
- Investigated form input wait failure
- Found browser prompt() used instead of modal
- Documented root cause and provided implementation plan

**Next Session**:
- Implement Create Build Modal component
- Remove all prompt() usage
- Verify all E2E tests pass

---

## Appendix: Related Documentation

- **Issue #193**: E2E test timeout investigation
- **Architecture**: `docs/start-from-here.md` - 7-day practice plan
- **Design Patterns**: `DESIGN.md` - Dual-backend architecture
- **Testing Guide**: `frontend/e2e/README.md` - E2E testing setup

---

**Report Status**: ✅ Complete - Ready for implementation phase  
**Created**: April 17, 2026  
**Last Updated**: April 17, 2026
