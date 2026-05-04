# useTestRun Hook Implementation: Sub-Issue Breakdown

**Generated**: May 4, 2026  
**Analysis Document**: `USETESTRUN-ANALYSIS.md`  
**Repository**: pluto-atom-4/react-grapql-playground

---

## Executive Summary

Analysis of the orphaned `useTestRun` hook identified 3 critical implementation gaps that prevent the hook from being actively used in the UI. Three focused sub-issues have been created to break down the work into deliverable, testable components.

**Key Finding**: The `useTestRun` hook is well-designed but **not consumed by any frontend components**. Phase 2 issues provide the context needed to integrate it properly.

---

## Sub-Issue Overview

### 1. **SubmitTestRunForm Component** (#207)
**Parent Issue**: #33 (Add FileUploader Component)  
**Status**: Ready to Start  
**Priority**: Medium  
**Estimated Effort**: 2-3 hours

#### Purpose
Bridge the gap between FileUploader (#33) and GraphQL `useSubmitTestRun` mutation by creating a form component.

#### Key Features
- Integrate FileUploader component for test result file attachment
- Dropdown for test status (PASSED/FAILED/PENDING)
- Textarea for optional test result summary
- Form validation (require status)
- Call `useSubmitTestRun` with validated data (buildId, status, result, fileUrl)
- Error handling and loading states

#### Acceptance Criteria
- ✓ Form renders with FileUploader + status dropdown + result textarea
- ✓ File upload sets fileUrl state via FileUploader callback
- ✓ Submit button disabled until status selected
- ✓ Calls useSubmitTestRun mutation with all fields
- ✓ Success toast + onSuccess callback on completion
- ✓ Specific error messages for validation/network/GraphQL errors
- ✓ Tests cover happy path + error scenarios
- ✓ Replaces `prompt()` placeholder in BuildDetailModal

#### Why This Matters
- **Manufacturing Workflow**: Technicians need a professional form to submit test results with evidence
- **UX**: Replaces the current `prompt()` placeholder with a proper form
- **Compliance**: File attachment is required for audit trail in manufacturing

#### GitHub Issue Link
https://github.com/pluto-atom-4/react-grapql-playground/issues/207

---

### 2. **TestRunDetailsPanel Component** (#208)
**Parent Issue**: #37 (Add Integration Tests)  
**Status**: Ready to Start  
**Priority**: Medium  
**Estimated Effort**: 1.5-2 hours

#### Purpose
Create a detailed view component for individual test runs that uses the `useTestRun` hook and displays complete information.

#### Key Features
- Status badge with icon (✓ PASSED | ✗ FAILED | ⏳ PENDING)
- Result summary text display
- Downloadable link for attached test result file
- Formatted timestamps (created, completed)
- Loading and error states
- Close button to dismiss panel

#### Acceptance Criteria
- ✓ Uses `useTestRuns(buildId)` hook to fetch test runs
- ✓ Status badge shows appropriate icon and formatting
- ✓ File download link present if fileUrl exists
- ✓ Timestamps formatted as readable dates
- ✓ Loading spinner shown while fetching
- ✓ Graceful handling of "not found" case
- ✓ Tests cover: found, not found, loading, error states
- ✓ Can be opened from BuildDetailModal row click

#### Why This Matters
- **User Experience**: Shows complete test run details instead of just table row
- **Evidence Access**: Provides easy download link for test evidence files
- **Hook Demonstration**: First real consumer of the `useTestRuns` hook
- **Manufacturing**: Technicians need to review test details and download reports

#### GitHub Issue Link
https://github.com/pluto-atom-4/react-grapql-playground/issues/208

---

### 3. **useTestRuns Hook Integration in BuildDetailModal** (#209)
**Parent Issue**: #37 (Add Integration Tests)  
**Status**: Ready to Start  
**Priority**: Medium  
**Estimated Effort**: 2-2.5 hours

#### Purpose
Activate the orphaned hook by integrating it into BuildDetailModal with polling for in-progress tests.

#### Key Features
- Import and use `useTestRuns(buildId)` hook
- Implement polling when test.status === 'RUNNING'
- Manual refetch on test run submission
- Polling interval: 2 seconds (configurable)
- Proper cleanup to prevent memory leaks
- Documentation explaining hook purpose

#### Implementation Strategy
```typescript
// Polling for in-progress tests
useEffect(() => {
  const isTestRunning = testRuns.some(t => t.status === 'RUNNING');
  if (!isTestRunning) return;
  
  const interval = setInterval(() => {
    refetch();
  }, 2000);
  
  return () => clearInterval(interval);
}, [testRuns, refetch]);
```

#### Acceptance Criteria
- ✓ BuildDetailModal uses `useTestRuns(buildId)` hook
- ✓ TestRun list renders from hook instead of embedded in build query
- ✓ Manual refetch triggered after test run submission
- ✓ Polling active when any test.status === 'RUNNING'
- ✓ Polling stops when all tests complete
- ✓ Intervals properly cleared on unmount
- ✓ Error states displayed to user
- ✓ Loading state shown while fetching
- ✓ Code comment explains separation of concerns
- ✓ Integration tests validate polling behavior

#### Why This Matters
- **Hook Activation**: The hook is well-designed but unused; this brings it into production use
- **Separation of Concerns**: Builds and TestRuns fetched independently
- **Real-Time Foundation**: Polling is foundation for future SSE upgrade
- **N+1 Prevention**: Demonstrates DataLoader efficiency (backend batches TestRuns per build)
- **Interview Pattern**: Shows understanding of hook composition and fetch strategies

#### GitHub Issue Link
https://github.com/pluto-atom-4/react-grapql-playground/issues/209

---

## Implementation Dependencies

### Execution Order
1. **First**: #207 (SubmitTestRunForm) — needs #33 (FileUploader) to be complete
2. **Second**: #208 (TestRunDetailsPanel) — can run in parallel with #207
3. **Third**: #209 (useTestRuns Integration) — can run in parallel with #207/#208

### Cross-Component Dependencies
- **#207 calls #209's refetch**: After successful submission, refetch test runs
- **#208 uses hook from #209**: TestRunDetailsPanel uses `useTestRuns` data
- **#209 references #207**: BuildDetailModal includes SubmitTestRunForm

### Parent Issue Dependencies
- All three sub-issues are part of **Phase 2 features (#32-#37)**
- #33 must be complete before #207
- #37 validation test should cover all three components end-to-end

---

## Component Architecture

### Complete BuildDetailModal Enhancement
```
BuildDetailModal (parent)
├─ BuildInfo (existing)
├─ PartsSection (existing)
└─ TestRunsSection (ENHANCED)
   ├─ useTestRuns(buildId) hook integration (#209)
   ├─ TestRunsList
   │  └─ TestRunRow → TestRunDetailsPanel (on click) (#208)
   ├─ SubmitTestRunForm (#207)
   │  ├─ FileUploader component (#33)
   │  ├─ StatusDropdown
   │  └─ ResultTextarea
   └─ TestRunHistory (future enhancement)
```

---

## Manufacturing Workflow Covered

### Complete Test Run Lifecycle
1. **Technician** opens Build details
2. **Technician** clicks "Submit Test Run"
3. **SubmitTestRunForm** appears (#207)
4. **Technician** uploads test report via FileUploader
5. **Technician** selects status (PASSED/FAILED) and adds notes
6. **Form** calls `useSubmitTestRun` mutation with fileUrl
7. **useTestRuns** polling (#209) detects new test run (if RUNNING)
8. **UI** updates automatically
9. **Technician** clicks test run to view details
10. **TestRunDetailsPanel** (#208) shows complete information
11. **Technician** downloads test evidence file

**Result**: End-to-end compliance-ready test management with audit trail.

---

## Interview Talking Points

### Why useTestRuns Hook Exists
"The hook separates concerns. A Build can have many TestRuns. Querying all related data in one shot causes N+1 problems. The hook lets us:
- Fetch test runs independently if needed (polling)
- Lazy-load details without re-querying entire Build
- Refetch just test runs when tests complete (SSE)
- Implement different caching strategies per use case

On the backend, DataLoader batch-loads TestRuns per build in one query."

### Why FileUploader Integration Matters
"In manufacturing, test evidence is not optional. When a rocket engine passes a pressure test, we need proof—the actual PDF report.
- Test harness exports result file
- Technician uploads via drag-and-drop
- File stored on Express backend
- GraphQL mutation links fileUrl to TestRun
- Audit trail complete: Build → TestRun → Evidence"

### Real-Time with Polling
"When tests are running, we poll every 2 seconds instead of manual refresh. Foundation for SSE upgrade:
- User sees in-progress indicator
- Polling detects completion
- UI updates automatically
- No need to refresh page
- Scales to WebSocket for multiple concurrent tests"

### System Design Pattern
"This demonstrates production SaaS patterns:
- Separation of concerns (frontend hooks)
- N+1 prevention (DataLoader batching)
- Real-time UX (polling → SSE)
- Compliance-ready (file uploads + audit trail)
- Type safety (GraphQL schema + generated types)"

---

## Testing Strategy

### Unit Tests
- **#207**: Form component with mock FileUploader, mock mutation
- **#208**: Panel component with mock hook, various test states
- **#209**: Hook integration with mock apollo client, polling behavior

### Integration Tests (Part of #37)
- Create Build → Add Parts → Submit TestRun → View Details → Download File
- Verify polling detects running test and stops on completion
- Verify form validation and error handling

### Test Approach
- Use `MockedProvider` with sample TestRun data
- React Testing Library for component tests
- Focus on user interactions (click, type, submit)
- No real database or file uploads needed

---

## Summary Table

| Issue | Component | Purpose | Depends On | Status |
|-------|-----------|---------|-----------|--------|
| #207 | SubmitTestRunForm | Form for test submission + file upload | #33 | Ready |
| #208 | TestRunDetailsPanel | Detailed view + file download | None | Ready |
| #209 | useTestRuns Integration | Activate hook with polling | None | Ready |

**Total Effort**: 5.5-7.5 hours (2-3 + 1.5-2 + 2-2.5)  
**Timeline**: 1-2 days for senior developer  
**Impact**: Completes test run workflow for manufacturing domain

---

## Related Documentation

- **USETESTRUN-ANALYSIS.md**: Complete analysis of hook and Phase 2 issues
- **USETESTRUN-SUMMARY.txt**: Quick reference of key findings
- **Phase 2 Issues**: #32-#37 in GitHub
- **GraphQL Schema**: `backend-graphql/src/schema.graphql` (TestRun type)

---

## Next Steps

1. **Review** this breakdown with team
2. **Assign** issues in priority order: #207 → #208/#209
3. **Track** progress in GitHub
4. **Test** end-to-end once all three complete
5. **Deploy** to production or staging
6. **Document** interview walkthrough

**Success Criteria**: All three sub-issues completed + integration test in #37 passing

