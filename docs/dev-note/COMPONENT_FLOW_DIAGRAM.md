# E2E Test Failure: Component Flow Analysis

## Current Implementation Flow (BROKEN)

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard Page Loads                                             │
│ • beforeEach: ✅ PASS (~1.3s)                                   │
│ • isDashboardReady: ✅ PASS                                      │
│ • Builds table visible                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ User Clicks "Create Build" Button                               │
│ • Component: build-dashboard.tsx:90-97                          │
│ • data-testid="create-build-button" ✅                          │
│ • Handler: handleCreateBuild() ✅ CALLED                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ handleCreateBuild() Executes                                     │
│ Location: build-dashboard.tsx:52-67                             │
│                                                                  │
│ const handleCreateBuild = (): void => {                         │
│   const name = prompt('Enter build name:');  ◄─── PROBLEM!     │
│   if (!name) return;                                            │
│   ...                                                           │
│ }                                                               │
│                                                                  │
│ Issues:                                                         │
│ ❌ Uses native browser prompt()                                │
│ ❌ Creates dialog OUTSIDE DOM                                  │
│ ❌ Not queryable by Playwright                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ E2E Test Waits for Form Input                                   │
│ Location: build-workflow.spec.ts:46                            │
│                                                                  │
│ await dashboardPage.waitForTestId(                             │
│   'build-name-input',                                          │
│   10000                                                         │
│ ); ◄─────────────────────────────────────────── ❌ FAILS HERE   │
│                                                                  │
│ Error:                                                          │
│ TimeoutError: locator.waitFor: Timeout 10000ms exceeded         │
│ Call log:                                                       │
│   - waiting for locator(                                        │
│     '[data-testid="build-name-input"]'                         │
│   ) to be visible                                              │
│                                                                  │
│ Why it fails:                                                   │
│ ❌ Element doesn't exist in DOM                                │
│ ❌ prompt() is native browser dialog (not in DOM)              │
│ ❌ Playwright can only query DOM elements                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Test Timeout ❌                                                  │
│ Remaining test steps not executed:                              │
│ ❌ await dashboardPage.fillByTestId(...)                       │
│ ❌ await dashboardPage.clickByTestId('create-build-submit')    │
│ ❌ Build creation never completes                              │
│ ❌ GraphQL mutation never called                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Expected Flow (NEEDED FIX)

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard Page Loads                                             │
│ • beforeEach: ✅ PASS (~1.3s)                                   │
│ • isDashboardReady: ✅ PASS                                      │
│ • Builds table visible                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ User Clicks "Create Build" Button                               │
│ • Component: build-dashboard.tsx:90-97                          │
│ • data-testid="create-build-button"                            │
│ • Handler: onOpenCreateModal() NEW                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Modal State Updated                                              │
│ • build-dashboard.tsx: isCreateModalOpen = true                │
│ • Component re-renders                                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ CreateBuildModal Component Renders                              │
│ NEW FILE: frontend/components/create-build-modal.tsx            │
│                                                                  │
│ Renders:                                                        │
│ ✅ Modal overlay (dark background)                             │
│ ✅ Modal container (centered form)                             │
│ ✅ Modal header (title)                                        │
│ ✅ Form with:                                                  │
│    └─ Input field: data-testid="build-name-input" ✅          │
│    └─ Submit button: data-testid="create-build-submit" ✅     │
│    └─ Cancel/Close button                                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ E2E Test Waits for Form Input                                   │
│ Location: build-workflow.spec.ts:46                            │
│                                                                  │
│ await dashboardPage.waitForTestId(                             │
│   'build-name-input',                                          │
│   10000                                                         │
│ ); ✅ ELEMENT FOUND!                                            │
│                                                                  │
│ • Playwright finds element in DOM ✅                           │
│ • Element becomes visible ✅                                   │
│ • waitFor() completes successfully ✅                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ E2E Test Fills Form                                             │
│                                                                  │
│ await dashboardPage.fillByTestId(                              │
│   'build-name-input',                                          │
│   buildName                                                     │
│ ); ✅ SUCCESS                                                   │
│                                                                  │
│ • Input element now contains buildName ✅                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ E2E Test Submits Form                                           │
│                                                                  │
│ await dashboardPage.clickByTestId(                             │
│   'create-build-submit'                                        │
│ ); ✅ SUCCESS                                                   │
│                                                                  │
│ • Submit button clicked ✅                                     │
│ • Form submission triggered ✅                                 │
│ • Modal calls onCreateBuild(buildName) ✅                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ GraphQL Mutation Executes                                        │
│ Hook: useCreateBuild()                                          │
│                                                                  │
│ await createBuild(buildName)                                   │
│ • Apollo mutation: CREATE_BUILD                               │
│ • Variables: { name: buildName }                              │
│ • Server response: Build created ✅                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Event Emitted                                                    │
│ • Event type: BUILD_CREATED                                   │
│ • Express event bus receives event                            │
│ • SSE stream broadcasts to all clients                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Modal Closes & Builds List Updates                              │
│                                                                  │
│ • Modal: isCreateModalOpen = false                             │
│ • Builds list: refetch() called                               │
│ • Apollo cache: Updated with new build                        │
│ • UI: New build appears in table ✅                            │
│                                                                  │
│ Test verifications succeed:                                    │
│ ✅ Build appears in dashboard                                 │
│ ✅ Build has correct name                                     │
│ ✅ Build has PENDING status                                   │
│ ✅ No latency issues (< 2000ms)                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Test Continues to Next Steps ✅                                 │
│ • Click build to view details ✅                               │
│ • Verify build detail page ✅                                  │
│ • Continue workflow (upload, status update) ✅                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Side-by-Side Comparison

### CURRENT (BROKEN) vs EXPECTED (FIX)

```
CURRENT IMPLEMENTATION          EXPECTED IMPLEMENTATION
─────────────────────────────  ─────────────────────────────────
prompt() dialog                 React Modal Component
  │                              │
  ├─ Native browser UI          ├─ Controlled React component
  ├─ Outside DOM                ├─ Inside DOM
  ├─ Not queryable              ├─ Queryable by Playwright
  ├─ Poor UX                    ├─ Professional UX
  └─ E2E tests can't interact   └─ E2E tests can interact

Playwright limitations          Full Playwright capability
  │                              │
  ├─ Cannot find elements       ├─ Can find elements
  ├─ Cannot fill forms          ├─ Can fill forms
  ├─ Cannot submit              ├─ Can submit
  ├─ Timeouts on wait           ├─ Immediate detection
  └─ Tests fail                 └─ Tests pass
```

---

## Component Hierarchy (After Fix)

```
BuildDashboard
├── BuildsTable
│   ├── Dashboard Header
│   │   ├── h1: "Build Dashboard"
│   │   └── CreateBuildButton (data-testid="create-build-button")
│   ├── Builds Table
│   │   └── Build Rows
│   │       └── View Details Buttons
│   │
│   └── CreateBuildModal (NEW) ◄─── CONDITIONAL RENDER
│       ├── Overlay (click to close)
│       ├── Modal Container
│       │   ├── Header: "Create Build"
│       │   ├── Body:
│       │   │   └── Form
│       │   │       └── Input: data-testid="build-name-input" ✅
│       │   └── Footer:
│       │       ├── Cancel Button
│       │       └── Submit Button: data-testid="create-build-submit" ✅
│       │
│       └── Event Handlers:
│           ├── onSubmit() → calls createBuild() → Apollo mutation
│           ├── onCancel() → closes modal
│           └── onEscape() → closes modal
│
└── BuildDetailModal (existing)
    ├── Existing for build details view
    ├── Also uses prompt() (separate issue)
    └── Can be improved in Phase 2
```

---

## Implementation Checklist

```
PHASE 1: Create Build Modal Component (NEW)
───────────────────────────────────────────────

□ Create file: frontend/components/create-build-modal.tsx
  ├─ Export CreateBuildModal component
  ├─ Props: isOpen, onClose, onCreateBuild
  ├─ State: buildName input value
  ├─ Handlers: onSubmit, onCancel, onEscape
  └─ Test IDs: build-name-input, create-build-submit

□ Add to build-dashboard.tsx
  ├─ Import CreateBuildModal component
  ├─ Add state: isCreateModalOpen
  ├─ Add handler: onOpenCreateModal()
  ├─ Add handler: onCloseCreateModal()
  ├─ Replace handleCreateBuild() logic
  └─ Render <CreateBuildModal> conditionally

□ Test locally
  ├─ pnpm dev:frontend
  ├─ Manual: Click Create Build → Modal appears
  ├─ Manual: Fill form → Submit works
  └─ Manual: Form closes after submit

PHASE 2: Run E2E Tests
──────────────────────

□ Run E2E suite
  ├─ pnpm test:e2e
  ├─ Verify TC-E2E-BW-001 passes ✅
  ├─ Verify TC-E2E-BW-002 passes ✅
  ├─ Verify TC-E2E-BW-003 passes ✅
  └─ Verify TC-E2E-BW-004 passes ✅

□ Document results
  ├─ All 5 tests passing
  ├─ No regressions
  └─ Update issue #193

PHASE 3: Future Improvements (OPTIONAL)
────────────────────────────────────────

□ Remove other prompt() usages
  ├─ build-detail-modal.tsx: Add Part
  ├─ build-detail-modal.tsx: Submit Test Run
  └─ Any other components

□ Add form validation
  ├─ Build name required
  ├─ Build name length validation
  └─ Error messages

□ Add loading states
  ├─ Disable submit while creating
  ├─ Show spinner during API call
  └─ Handle error cases
```

---

## Files to Modify

### NEW FILE (Create)
- `frontend/components/create-build-modal.tsx` (NEW)

### MODIFY
- `frontend/components/build-dashboard.tsx`
  - Remove handleCreateBuild() logic
  - Add modal state management
  - Render CreateBuildModal component

### NO CHANGE NEEDED
- E2E tests already correct
- Test page object already correct
- GraphQL hooks already work

---

## Summary

| Aspect | Current | After Fix |
|--------|---------|-----------|
| **Form Type** | Browser prompt() | React Modal |
| **DOM Location** | Outside DOM | Inside DOM |
| **Testable** | ❌ No | ✅ Yes |
| **Playwright Compatible** | ❌ No | ✅ Yes |
| **Test Status** | ❌ Timeout | ✅ Pass |
| **E2E Tests Affected** | 5 tests fail | 5 tests pass |
| **Implementation Time** | N/A | ~45 minutes |
| **User Experience** | Poor | Professional |

