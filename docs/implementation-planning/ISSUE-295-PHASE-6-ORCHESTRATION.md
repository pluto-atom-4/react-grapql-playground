# Issue #295: Phase 6 Orchestration - Event Handler Wiring

**Date**: June 1, 2026  
**Orchestrator Status**: ✅ Resumed after successful rebase  
**Branch**: `feat/issue-295-tab-integration` (6 commits ahead of main)  
**Current Progress**: 50% (Phases 1-5 complete)  

---

## Orchestration Summary

**CONTEXT**: Issue #295 (Tab Integration into BuildDetailModal) has completed Phases 1-5 with three production-ready UI components:
- InlineEditor.tsx
- PartDetailsModal.tsx
- TestRunResultViewer.tsx

The branch was successfully rebased onto main with **zero conflicts**, integrating #256 styling foundation.

**STATUS**: All components built and tested. Now entering **Phase 6: Event Handler Wiring**.

**TIMELINE**: 
- Phase 6 (2-3 days): Event handlers
- Phase 7 (2 days): Accessibility audit
- Phase 8 (2 days): E2E workflows
- Phase 9 (1-2 days): PR preparation
- **Total**: 7-9 days to merge (target: June 4, 2026)

**TEST BASELINE**: ✅ 1103 tests passing (57 files)

---

## Phase 6 Work Package: Event Handler Wiring

### Objectives

Wire up the three new UI components with event handlers so user interactions flow correctly through the BuildDetailModal data layer to GraphQL mutations.

### Detailed Work Items

#### 6.1: BuildPartsTab - Part Details Drilldown Handler
**Component**: `frontend/components/BuildPartsTab.tsx`
**Task**: Add "View Details" button that opens PartDetailsModal

**Changes Required**:
1. Add state for selected part (or drilldown mode)
2. Render "View Details" button in parts list
3. On click, call `onPartDrillDown(partId)` handler
4. Conditionally render PartDetailsModal
5. Pass selected part data to PartDetailsModal
6. Connect PartDetailsModal `onSave`/`onDelete`/`onClose` handlers to parent

**File**: 
- `frontend/components/BuildPartsTab.tsx` (+30-50 lines)

**Test Cases** (3-4 tests):
- ✓ Render "View Details" button for each part
- ✓ Click button opens PartDetailsModal with correct part data
- ✓ Modal close handler clears selection
- ✓ Modal save handler calls parent update handler

---

#### 6.2: BuildTestRunsTab - Test Result Viewer Handler
**Component**: `frontend/components/BuildTestRunsTab.tsx`
**Task**: Wire test result rows to open TestRunResultViewer modal

**Changes Required**:
1. Add state for selected test run
2. Make test result rows clickable
3. On click, call `onTestRunDrillDown(testRunId)` handler
4. Conditionally render TestRunResultViewer
5. Pass test run data to viewer
6. Connect viewer `onRerun`/`onDownloadResult`/`onClose` handlers

**File**: 
- `frontend/components/BuildTestRunsTab.tsx` (+40-60 lines)

**Test Cases** (4-5 tests):
- ✓ Test result row is clickable
- ✓ Click opens TestRunResultViewer modal
- ✓ Modal displays correct test data
- ✓ Close handler clears selection
- ✓ Rerun handler triggers mutation

---

#### 6.3: InlineEditor Integration in BuildOverviewTab
**Component**: `frontend/components/BuildOverviewTab.tsx`
**Task**: Add edit handler that opens InlineEditor for build fields

**Changes Required**:
1. Add edit mode state
2. Add "Edit Build" button
3. On click, render InlineEditor with build fields (name, status, etc.)
4. Connect InlineEditor `onSave` to `onBuildUpdate()` mutation handler
5. Connect InlineEditor `onCancel` to exit edit mode
6. Show loading/error states

**File**: 
- `frontend/components/BuildOverviewTab.tsx` (+50-70 lines)

**Test Cases** (3-4 tests):
- ✓ Render "Edit Build" button
- ✓ Click opens InlineEditor with build fields
- ✓ Save calls parent update handler
- ✓ Cancel exits edit mode without saving

---

#### 6.4: PartDetailsModal Edit & Delete Handlers
**Component**: `frontend/components/PartDetailsModal.tsx`
**Task**: Complete modal interaction handlers

**Changes Required** (may already be in place):
1. `onSave`: Call mutation to update part, handle response, close modal
2. `onDelete`: Show confirmation, call mutation, handle response, close modal
3. Error handling: Display mutation errors, retry logic
4. Loading states: Disable buttons during mutation

**File**: 
- `frontend/components/PartDetailsModal.tsx` (refine existing handlers, +20-30 lines)

**Test Cases** (4-5 tests):
- ✓ Save handler calls mutation with edited data
- ✓ Error display on mutation failure
- ✓ Delete handler shows confirmation dialog
- ✓ Confirmed delete calls mutation
- ✓ Modal closes on successful save/delete

---

#### 6.5: TestRunResultViewer Rerun Handler
**Component**: `frontend/components/TestRunResultViewer.tsx`
**Task**: Complete rerun test handler

**Changes Required** (may already be in place):
1. `onRerun`: Call mutation to resubmit test
2. Track loading state during rerun
3. Disable rerun button during submission
4. Handle success/error responses
5. Close modal after successful rerun

**File**: 
- `frontend/components/TestRunResultViewer.tsx` (refine existing handlers, +15-20 lines)

**Test Cases** (3-4 tests):
- ✓ Rerun button disabled when test status is PASSED
- ✓ Rerun button enabled when status is FAILED
- ✓ Click rerun calls mutation
- ✓ Loading state shown during rerun

---

#### 6.6: Integration Tests
**Create New Test File**: `frontend/components/__tests__/BuildDetailModal.integration.test.tsx`

**Test Scenarios** (12-15 tests total):

1. **Part Drilldown Flow** (3 tests)
   - ✓ Click part → view details
   - ✓ Edit part name → save → see update in list
   - ✓ Delete part → confirm → see removed from list

2. **Test Result Flow** (3 tests)
   - ✓ Click test result → view details
   - ✓ Rerun failed test → see status change
   - ✓ Download test result → file URL opens

3. **Build Overview Edit** (3 tests)
   - ✓ Click edit → InlineEditor opens
   - ✓ Change build name → save → see update
   - ✓ Cancel edit → no changes saved

4. **Error Handling** (3 tests)
   - ✓ Save error displays message
   - ✓ Network error shows retry button
   - ✓ Delete error doesn't close modal

5. **Modal State Management** (3 tests)
   - ✓ Opening PartDetailsModal doesn't close parent BuildDetailModal
   - ✓ Closing PartDetailsModal returns to BuildPartsTab
   - ✓ Multiple drilldowns work correctly (A→B→A)

---

### Acceptance Criteria for Phase 6

- ✅ All 6 event handlers connected (drilldown, edit, delete, rerun)
- ✅ Modal data flows correctly through parent component
- ✅ All mutations called with correct parameters
- ✅ Error handling implemented for all paths
- ✅ 12-15 integration tests written and passing
- ✅ No regressions in existing tests (maintain 1103+ passing)
- ✅ All components fully type-safe (TypeScript strict mode)

---

## Files to Modify

```
frontend/components/
├── BuildDetailModal.tsx              [ENHANCE - add drilldown state handlers]
├── BuildPartsTab.tsx                 [ENHANCE - add View Details handler]
├── BuildTestRunsTab.tsx              [ENHANCE - add click handler for rows]
├── BuildOverviewTab.tsx              [ENHANCE - add Edit handler]
├── PartDetailsModal.tsx              [ENHANCE - finalize save/delete handlers]
├── TestRunResultViewer.tsx           [ENHANCE - finalize rerun handler]
└── __tests__/
    └── BuildDetailModal.integration.test.tsx  [NEW - 12-15 tests]
```

---

## Mutation Connections

Each handler should be wired to GraphQL mutations already defined in the schema:

1. **updateBuild** - BuildOverviewTab edit
2. **updatePart** - PartDetailsModal save
3. **deletePart** - PartDetailsModal delete
4. **submitTestRun** (rerun) - TestRunResultViewer rerun

**Check**: Verify all mutations are in `frontend/lib/graphql/queries.ts`

---

## Next Milestone: Phase 7

After Phase 6 completion:
- All event handlers wired and tested
- Data flows correctly through modal system
- Ready for accessibility audit

**Phase 7**: Accessibility audit with axe-core, keyboard nav tests, screen reader tests (20+ tests)

---

## Execution Notes

**Start Time**: June 1, 2026 (this session)  
**Target Completion**: June 3, 2026  
**Estimated Duration**: 2-3 days (40-50 hours of focused work)

**Parallelization**: None (Phase 6 is sequential - handlers depend on component props)

**Risk Items**: None (components already built and tested)

---

**Status**: 🚀 Ready to begin Phase 6  
**Approved**: ✅ Orchestrator (resuming after successful rebase)
