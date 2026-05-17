# Issue #208 Implementation Plan: TestRunDetailsPanel Component

**Status:** Production-Ready Implementation Plan  
**Depends On:** Issue #207 (SubmitTestRunForm) - NOW MERGED (commit 67d1242)  
**Parallelizable With:** Issue #209 (useTestRuns Polling)  
**Target:** React 19 + TypeScript Details Panel Component  
**Effort Estimate:** 1.5–2 hours total  
**Test Coverage Target:** 80%+

---

## Executive Summary

Issue #208 delivers **TestRunDetailsPanel**, a read-only details component that displays comprehensive information about a single test run. When a user clicks on a test run row in the BuildDetailModal, this panel opens to show:

1. **Status Badge** with icon (✓ PASSED, ✗ FAILED, ⏳ PENDING)
2. **Result Summary** - Text description of test outcome
3. **File Download Link** - Direct download of test evidence (if fileUrl exists)
4. **Timestamps** - Creation time and completion time (formatted)
5. **Loading State** - Spinner while useTestRuns hook fetches data
6. **Error Handling** - User-friendly message if test run not found
7. **Close Button** - Return to test run table

This component is **critical for audit compliance**: technicians must be able to retrieve and verify test evidence at any time. It directly supports the manufacturing workflow where test evidence is the primary proof of quality assurance.

**Business Impact:** Completes the read-only workflow: submit test run → view in table → click row → inspect details + download evidence for audit/compliance verification.

---

## Table of Contents

1. [Acceptance Criteria](#acceptance-criteria)
2. [Task Breakdown](#task-breakdown)
3. [Technical Architecture](#technical-architecture)
4. [Component Specifications](#component-specifications)
5. [TypeScript Interfaces](#typescript-interfaces)
6. [Test Plan](#test-plan)
7. [Integration Points](#integration-points)
8. [Effort Estimates](#effort-estimates)
9. [Interview Talking Points](#interview-talking-points)

---

## Acceptance Criteria

| Criterion | Description | Testable | Priority |
|-----------|-------------|----------|----------|
| **AC1** | Component renders with prop destructuring: buildId, testRunId, onClose | Unit test | Must |
| **AC2** | Component queries useTestRuns hook and filters by testRunId | Unit test | Must |
| **AC3** | Shows loading spinner while useTestRuns hook is loading | Unit test | Must |
| **AC4** | Shows error message if test run not found | Unit test | Must |
| **AC5** | Displays status badge with correct icon (CheckIcon, XIcon, ClockIcon) | Unit test | Must |
| **AC6** | Shows result summary text (or placeholder if empty) | Unit test | Must |
| **AC7** | Shows file download link with FileIcon if fileUrl exists | Unit test | Must |
| **AC8** | Hides download link if fileUrl is null/undefined | Unit test | Must |
| **AC9** | Formats timestamps as readable dates (e.g., "Apr 16, 2026 2:30 PM") | Unit test | Must |
| **AC10** | Displays completedAt timestamp if available, shows placeholder if pending | Edge case test | Must |
| **AC11** | Close button calls onClose callback and returns to test runs table | Unit test | Must |
| **AC12** | Component integrates into BuildDetailModal row click handler | Integration test | Should |

---

## Task Breakdown

### Phase 1: Component Foundation (25 minutes)

**T1.1: Project structure, imports, and types (15 min)**
- Create `frontend/components/test-run-details-panel.tsx` file
- Import React, hooks (useEffect, useMemo)
- Import icons: CheckIcon, XIcon, ClockIcon, FileIcon, XMarkIcon
- Import utility: formatDate or similar timestamp formatter
- Import useTestRuns hook from graphql hooks
- Define component props interface
- Add TODO comments for each section
- Estimate: 15 min

**T1.2: Component skeleton and props (10 min)**
- Export component function with TypeScript props
- Define prop destructuring: buildId, testRunId, onClose
- Create JSDoc comment explaining component purpose
- Add prop validation (ensure testRunId is not empty)
- Estimate: 10 min

### Phase 2: Hook Integration & Data Fetching (20 minutes)

**T2.1: useTestRuns hook integration (15 min)**
- Call useTestRuns(buildId) hook in component
- Extract: testRuns, loading, error from hook
- Use useMemo to find current testRun by testRunId
- Handle three states: loading, error, success
- Add state checks to conditionally render each state
- Estimate: 15 min

**T2.2: Handle edge cases (5 min)**
- If testRuns is empty, show "Test run not found" message
- If error from hook, show error message with reload option
- If loading and no cached data, show spinner
- Estimate: 5 min

### Phase 3: Status Badge Component (20 minutes)

**T3.1: Implement status badge with icons (20 min)**
- Create small status badge UI with icon + text
- Map TestRunStatus to Icon component:
  - PASSED → CheckIcon (green, ✓)
  - FAILED → XIcon (red, ✗)
  - PENDING → ClockIcon (gray, ⏳)
- Add Tailwind classes for colors and sizing
- Display status text next to icon (e.g., "PASSED")
- Add aria-label for accessibility
- Estimate: 20 min

### Phase 4: Result Display (20 minutes)

**T4.1: Display test result summary (20 min)**
- Show result field from testRun object
- If result is empty/null, show placeholder text: "No result summary provided"
- Wrap in section with label: "Test Result"
- Add Tailwind classes for text styling
- Estimate: 20 min

### Phase 5: File Download & Timestamps (25 minutes)

**T5.1: Implement file download link (15 min)**
- Check if testRun.fileUrl exists
- If yes, render download link with FileIcon
- Link href should be testRun.fileUrl
- Add target="_blank" for external download
- Show extracted filename if available (or generic "Download Evidence")
- If no fileUrl, show placeholder: "No evidence file attached"
- Add aria-label for accessibility
- Estimate: 15 min

**T5.2: Format and display timestamps (10 min)**
- Show createdAt timestamp with label "Created"
- Show completedAt timestamp if available with label "Completed"
- If completedAt is null/undefined, show "Pending" or "In Progress"
- Use formatDate utility (or native Intl.DateTimeFormat)
- Format: "Apr 16, 2026 2:30 PM" (readable, localized)
- Estimate: 10 min

### Phase 6: UI Layout & Styling (20 minutes)

**T6.1: Component layout with Tailwind (15 min)**
- Render as a panel/card with:
  - Header with close button (X icon top-right)
  - Body with sections for status, result, file, timestamps
  - Footer with close button (optional, if also in header)
- Use Tailwind classes:
  - Card: `bg-white rounded-lg shadow-md p-6`
  - Sections: `mb-4` for spacing
  - Labels: `text-sm font-semibold text-gray-700`
  - Values: `text-base text-gray-900`
  - Icons: `w-5 h-5 inline mr-2`
  - Close button: `absolute top-2 right-2` with hover effect
- Estimate: 15 min

**T6.2: Close button and panel behavior (5 min)**
- Add close button (X icon) in top-right corner
- onClick calls onClose callback
- Button has hover state (lighten background)
- Button is keyboard accessible (focus visible)
- Estimate: 5 min

### Phase 7: Loading State & Error Handling (15 minutes)

**T7.1: Implement loading spinner (10 min)**
- Show spinner while useTestRuns hook is loading
- Center spinner in panel
- Add aria-busy="true" for accessibility
- Estimate: 10 min

**T7.2: Error state UI (5 min)**
- Show error message: "Test run not found" or "Failed to load test run details"
- Show optional reload button
- Add error icon (TriangleIcon or ExclamationIcon)
- Estimate: 5 min

### Phase 8: Testing & Documentation (45 minutes)

**T8.1: Unit tests for component (25 min)**
- Test rendering with valid testRunId
- Test loading state (spinner visible)
- Test error state (test not found)
- Test status badge rendering with all 3 statuses
- Test result summary display (with and without result)
- Test file download link (with and without fileUrl)
- Test timestamps formatting (createdAt, completedAt)
- Test close button calls onClose
- Estimate: 25 min

**T8.2: Integration tests with mocked hook (15 min)**
- Mock useTestRuns hook with sample data
- Test full panel rendering end-to-end
- Test edge cases: empty result, missing fileUrl, pending status
- Test component integrates into BuildDetailModal row click
- Estimate: 15 min

**T8.3: Accessibility and documentation (5 min)**
- Verify ARIA labels on all interactive elements
- Verify keyboard navigation works
- Add JSDoc comments
- Estimate: 5 min

---

## Technical Architecture

### Component Hierarchy

```
BuildDetailModal (container)
  ├── TestRuns Table (list view)
  │   └── Row onClick → opens TestRunDetailsPanel
  └── TestRunDetailsPanel (#208)
      ├── Loading spinner (while fetching)
      ├── Error message (if not found)
      └── Details section
          ├── Status badge (icon + text)
          ├── Result summary (text)
          ├── File download link (if fileUrl exists)
          ├── Created timestamp
          └── Completed timestamp (if available)
```

### Data Flow

```
Frontend State (useTestRuns Hook)
  ├── buildId: string
  ├── testRuns: TestRun[] (fetched from GraphQL)
  ├── loading: boolean
  └── error: Error | null

Component Local:
  ├── testRunId: string (from props)
  ├── testRun: TestRun | undefined (found by filtering testRuns)
  └── onClose: () => void (callback to parent modal)

Rendering Logic:
  1. If loading → Show spinner
  2. If error → Show error message
  3. If !testRun → Show "Test run not found"
  4. If testRun → Show details panel:
     - Status badge with icon
     - Result summary
     - File download (if fileUrl)
     - Timestamps (createdAt, completedAt)
     - Close button
```

### Integration with BuildDetailModal

```typescript
// In BuildDetailModal parent component:

const [selectedTestRunId, setSelectedTestRunId] = useState<string | null>(null);

// When user clicks test run row:
<tr onClick={() => setSelectedTestRunId(testRun.id)}>
  {/* row cells */}
</tr>

// Render TestRunDetailsPanel as overlay:
{selectedTestRunId && (
  <TestRunDetailsPanel
    buildId={buildId}
    testRunId={selectedTestRunId}
    onClose={() => setSelectedTestRunId(null)}
  />
)}
```

---

## Component Specifications

### TestRunDetailsPanel Component

**Location:** `frontend/components/test-run-details-panel.tsx`

**Responsibility:** Display detailed information about a single test run, including status, result, file download link, and timestamps.

**Props:**
```typescript
interface TestRunDetailsPanelProps {
  buildId: string;              // Build ID to fetch test runs from
  testRunId: string;            // Test run ID to display
  onClose: () => void;          // Callback when user closes panel
}
```

**Renders:**
1. **Loading State** - Spinner while useTestRuns hook fetches data
2. **Error State** - Error message if test run not found or hook errors
3. **Status Badge** - Icon + text showing PASSED/FAILED/PENDING
4. **Result Summary** - Test result text (or placeholder)
5. **File Download** - Link to fileUrl if exists (or placeholder)
6. **Timestamps** - Created and completed times (formatted)
7. **Close Button** - X icon in top-right corner

**Behavior:**
- Query data via useTestRuns(buildId) hook
- Filter testRuns array to find matching testRunId
- Show loading spinner while fetching
- Show error if test run not found
- Display all test run details when loaded
- Call onClose callback when user clicks close button

---

## TypeScript Interfaces

### Component Props

```typescript
// frontend/components/test-run-details-panel.tsx (top of file)

import React, { useMemo } from 'react';
import { CheckIcon, XIcon, ClockIcon, FileIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTestRuns } from '../lib/apollo-hooks';
import { formatDate } from '../lib/date-utils';
import type { TestRun, TestRunStatus } from '../types/graphql';

export interface TestRunDetailsPanelProps {
  /** The build ID this test run belongs to */
  buildId: string;
  /** The test run ID to display */
  testRunId: string;
  /** Called when user closes the panel */
  onClose: () => void;
}
```

### Test Run Type (From GraphQL)

```typescript
// Assumed to exist in types/graphql.ts
interface TestRun {
  id: string;
  buildId: string;
  status: TestRunStatus;                // 'PASSED' | 'FAILED' | 'PENDING'
  result?: string;                      // Optional test result summary
  fileUrl?: string;                     // URL to download evidence file
  createdAt: string;                    // ISO 8601 timestamp
  completedAt?: string;                 // ISO 8601 timestamp (if available)
}

type TestRunStatus = 'PASSED' | 'FAILED' | 'PENDING';
```

### Hook Return Type

```typescript
// useTestRuns hook return type (assumed to exist)
interface UseTestRunsResult {
  testRuns: TestRun[];
  loading: boolean;
  error: Error | null;
}
```

### Component-Level Types

```typescript
// Internal component types
interface StatusBadgeProps {
  status: TestRunStatus;
  icon: React.ReactNode;
  label: string;
}
```

---

## Test Plan

### Unit Tests (30 min)

**Test Suite 1: Component Rendering (12 min)**
- ✅ T1.1: Component renders without crashing
- ✅ T1.2: Component renders close button
- ✅ T1.3: Component renders all major sections when test run loaded
- ✅ T1.4: Component renders with correct props passed

**Test Suite 2: Loading State (8 min)**
- ✅ T2.1: Shows spinner when useTestRuns loading is true
- ✅ T2.2: Hides details when loading
- ✅ T2.3: Spinner has aria-busy="true" for accessibility

**Test Suite 3: Error & Not Found States (8 min)**
- ✅ T3.1: Shows error message when useTestRuns hook has error
- ✅ T3.2: Shows "Test run not found" when testRun is undefined
- ✅ T3.3: Error message is visible and readable

**Test Suite 4: Status Badge (8 min)**
- ✅ T4.1: Renders CheckIcon for PASSED status
- ✅ T4.2: Renders XIcon for FAILED status
- ✅ T4.3: Renders ClockIcon for PENDING status
- ✅ T4.4: Status text matches status value

**Test Suite 5: Result Display (8 min)**
- ✅ T5.1: Displays result summary when result exists
- ✅ T5.2: Shows placeholder when result is empty
- ✅ T5.3: Shows "No result summary provided" message for null result

**Test Suite 6: File Download (10 min)**
- ✅ T6.1: Shows download link with FileIcon when fileUrl exists
- ✅ T6.2: Download link href is testRun.fileUrl
- ✅ T6.3: Download link has target="_blank"
- ✅ T6.4: Shows placeholder when fileUrl is null/undefined
- ✅ T6.5: Placeholder text is "No evidence file attached"

**Test Suite 7: Timestamps (8 min)**
- ✅ T7.1: Formats and displays createdAt timestamp
- ✅ T7.2: Formats and displays completedAt timestamp when available
- ✅ T7.3: Shows "Pending" for missing completedAt
- ✅ T7.4: Timestamps are readable format (e.g., "Apr 16, 2026 2:30 PM")

**Test Suite 8: Close Button (8 min)**
- ✅ T8.1: Close button onClick calls onClose callback
- ✅ T8.2: Close button has X icon
- ✅ T8.3: Close button is keyboard accessible (focus visible)

### Integration Tests (15 min)

**Test Suite 9: Hook Integration (15 min)**
- ✅ T9.1: Component calls useTestRuns with correct buildId
- ✅ T9.2: Component filters testRuns to find matching testRunId
- ✅ T9.3: Panel renders correctly with mocked hook data
- ✅ T9.4: Edge case: testRunId not in testRuns array

### Edge Cases & Accessibility (10 min)

**Test Suite 10: Edge Cases (10 min)**
- ✅ T10.1: Handles empty result string gracefully
- ✅ T10.2: Handles null fileUrl gracefully
- ✅ T10.3: Handles missing completedAt gracefully
- ✅ T10.4: Panel handles rapid close/reopen
- ✅ T10.5: ARIA labels present on all text and icons

### Mock Setup

```typescript
// Mock useTestRuns hook
jest.mock('../lib/apollo-hooks', () => ({
  useTestRuns: jest.fn((buildId) => ({
    testRuns: [
      {
        id: 'test-run-1',
        buildId,
        status: 'PASSED',
        result: 'All tests passed',
        fileUrl: 'http://example.com/test-report.pdf',
        createdAt: '2026-04-16T14:30:00Z',
        completedAt: '2026-04-16T14:35:00Z',
      },
    ],
    loading: false,
    error: null,
  })),
}));

// Mock date formatter
jest.mock('../lib/date-utils', () => ({
  formatDate: (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
}));
```

---

## Integration Points

### BuildDetailModal Integration

**How it connects:**
1. BuildDetailModal renders TestRuns table with row click handlers
2. When user clicks a test run row:
   ```typescript
   const handleRowClick = (testRunId: string) => {
     setSelectedTestRunId(testRunId);
   };
   ```
3. Modal conditionally renders TestRunDetailsPanel:
   ```tsx
   {selectedTestRunId && (
     <TestRunDetailsPanel
       buildId={buildId}
       testRunId={selectedTestRunId}
       onClose={() => setSelectedTestRunId(null)}
     />
   )}
   ```
4. Close button in panel calls onClose, which sets selectedTestRunId to null
5. Panel unmounts, user returns to table view

### useTestRuns Hook Integration

**How it connects:**
1. Component calls hook with buildId: `const { testRuns, loading, error } = useTestRuns(buildId)`
2. Hook returns array of all test runs for the build
3. Component uses useMemo to find matching testRunId:
   ```typescript
   const testRun = useMemo(
     () => testRuns.find(t => t.id === testRunId),
     [testRuns, testRunId]
   );
   ```
4. If testRun found, display details; otherwise show "Not found" message
5. Hook handles caching and polling (see Issue #209)

### Apollo Client Cache Integration

**Automatic Cache Hit:**
1. SubmitTestRunForm mutation (Issue #207) updates Apollo cache when test run submitted
2. TestRunDetailsPanel uses same useTestRuns hook
3. Apollo automatically returns cached data (no refetch needed)
4. Component renders details immediately (fast UX)
5. If user manually refreshes, hook refetches from server

### Timestamps Formatting

**Dependency on date-utils:**
- Component uses formatDate utility to display readable timestamps
- Format: "Apr 16, 2026 2:30 PM" (locale-aware, human-readable)
- If dateUtils doesn't exist, create simple formatter or use native Intl.DateTimeFormat

---

## Effort Estimates

### Phase Breakdown

| Phase | Task | Estimated Time | Cumulative |
|-------|------|-----------------|-----------|
| **Phase 1: Foundation** | T1.1 Project setup | 15 min | 15 min |
| | T1.2 Component skeleton | 10 min | 25 min |
| **Phase 2: Hook Integration** | T2.1 useTestRuns integration | 15 min | 40 min |
| | T2.2 Edge case handling | 5 min | 45 min |
| **Phase 3: Status Badge** | T3.1 Status badge with icons | 20 min | 1h 5m |
| **Phase 4: Result Display** | T4.1 Result summary | 20 min | 1h 25m |
| **Phase 5: File & Timestamps** | T5.1 File download link | 15 min | 1h 40m |
| | T5.2 Timestamp formatting | 10 min | 1h 50m |
| **Phase 6: UI & Styling** | T6.1 Tailwind layout | 15 min | 2h 5m |
| | T6.2 Close button | 5 min | 2h 10m |
| **Phase 7: Loading & Error** | T7.1 Loading spinner | 10 min | 2h 20m |
| | T7.2 Error state UI | 5 min | 2h 25m |
| **Phase 8: Testing** | T8.1 Unit tests | 25 min | 2h 50m |
| | T8.2 Integration tests | 15 min | 3h 5m |
| | T8.3 Docs & accessibility | 5 min | 3h 10m |

### Total Effort: 3h 10m (range: 1.5–2 hours with optimizations)

**Note:** This estimate assumes Issue #207 code is already merged and useTestRuns hook is stable. If hook changes are needed, add 30–60 min.

### Time Breakdown by Category

- **Component Development:** 1.5 hours
- **Hook Integration:** 0.75 hours
- **Testing:** 0.5 hours
- **Polish & Documentation:** 0.35 hours

### Parallel Work Opportunity

After Issue #207 is merged to main:
- **Issue #208 (TestRunDetailsPanel)** can start immediately (independent UI component)
- **Issue #209 (Polling logic)** can start immediately (independent hook logic)
- Both can run in parallel; no dependencies between them
- Estimated completion: 3–4 hours each (total 6–8 hours for both in parallel)

---

## Interview Talking Points

**When discussing TestRunDetailsPanel component:**

1. **"This is a read-only display component, not complex like the form."**
   - Contrasts with SubmitTestRunForm (Issue #207) which handles mutations and state
   - Demonstrates component simplicity when UI is just displaying cached data
   - Good example of when NOT to overthink: props → render data → done

2. **"It shows best practices for reusing hooks across components."**
   - Same useTestRuns hook is used by both SubmitTestRunForm and TestRunDetailsPanel
   - Apollo cache prevents redundant fetches
   - Example of hook composability: hook handles fetch, component handles display

3. **"Error handling matters even for read-only views."**
   - Test run might not exist (user navigates with stale ID)
   - Hook might fail to fetch (network issue)
   - Component gracefully handles all three states: loading, error, success
   - User gets clear feedback instead of blank screen

4. **"Formatting is more complex than it looks."**
   - Timestamps must be locale-aware (show user's timezone, not UTC)
   - File download link needs proper href and target attributes
   - Status colors must match design system (not hardcoded)
   - Small details make huge UX difference

5. **"This demonstrates the read-side of Apollo Client patterns."**
   - Form (Issue #207) shows mutations and optimistic updates
   - This component shows queries and cache hits
   - Together they show full Apollo lifecycle: fetch → cache → mutate → refetch

6. **"The component is easy to test because it has no hidden state."**
   - Props fully determine behavior
   - No setTimeout, no side effects (except hook call)
   - Mock the hook, pass props, verify output
   - No need for elaborate test setup

---

## Code Review Checklist

Before submitting PR, verify:

- [ ] All 12 acceptance criteria met and testable
- [ ] 48+ test cases with 80%+ coverage
- [ ] No ESLint errors (run `pnpm lint:fix`)
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] ARIA labels on all interactive elements
- [ ] Error messages are user-friendly
- [ ] Timestamps use locale-aware formatter
- [ ] Component follows same patterns as SubmitTestRunForm (Issue #207)
- [ ] useTestRuns hook integration is correct
- [ ] File download link has correct attributes (href, target, aria-label)
- [ ] Status badge icons match design system
- [ ] Component handles edge cases (empty result, null fileUrl, etc.)

---

## Next Steps (After #208)

Once Issue #208 is merged to main:

1. **Issue #209: useTestRuns Polling** (4–5 hours)
   - Add polling logic to useTestRuns hook
   - Start polling when modal mounts (2s interval)
   - Stop polling when all tests in terminal state (PASSED/FAILED)
   - Returns startPolling/stopPolling functions for modal control

2. **Integration Testing**
   - All three components wired in BuildDetailModal
   - End-to-end workflow: upload → submit → table → click → details → download
   - Real-time status updates via polling

3. **Performance Optimization (optional)**
   - Memoize components to prevent unnecessary re-renders
   - Consider virtual scrolling for large test run lists
   - Cache file URLs to reduce graphql query size

---

## Related Documentation

- **Issue #207:** SubmitTestRunForm Component (depends on this; now merged)
- **Issue #209:** useTestRuns Polling Hook (can parallelize with this)
- **Master Plan:** `/docs/implementation-planning/ISSUE-33-207-208-209-MASTER-PLAN.md` (business context)
- **GraphQL Hooks:** `frontend/lib/apollo-hooks.ts` (useTestRuns reference)

---

**Document Version:** 1.0  
**Last Updated:** April 17, 2026  
**Status:** Ready for Implementation (can start immediately after #207 merged)
