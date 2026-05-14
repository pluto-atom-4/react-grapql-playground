# Issue #295 Implementation Plan
## Phase 3: Integrate Tab Components into BuildDetailModal & Standardize Data Flow

**Issue**: #295  
**Effort**: 11 days  
**Complexity**: Medium-Large  
**Priority**: High (Foundation for Phase 3 Block 3)  
**Phase**: Phase 2-3 Transition  

---

## A. Issue Overview

### Title
Integrate Tab Components into BuildDetailModal & Standardize Data Flow

### Business Value
- **Efficiency Gains**: 12-20% across user personas
- **User Personas**: Technicians (80% faster), QA Engineers (85% faster), Managers (90% faster)
- **Critical Path**: Unblocks Issue #261 (Responsive Table) and all Phase 3 work

### Acceptance Criteria

1. **Tab Integration in Modal**
   - BuildDetailModal refactored to use Tabs component
   - All 4 tab contents properly rendered (Overview, Parts, TestRuns, History)
   - Tab state persisted during modal session
   - Keyboard navigation functional (arrow keys, Home/End)

2. **Data Flow Standardization**
   - All components accept data via props (not hardcoded hooks)
   - Props-based pattern enforced across all tab components
   - Circular import dependencies eliminated
   - Single source of truth for build data

3. **Interaction Handlers Complete**
   - Edit button triggers inline edit mode per tab
   - View Details actions navigate to detailed views
   - Test run actions (rerun, download results) implemented
   - Part details drilldown functional
   - All handlers properly wired to GraphQL mutations

4. **Real-Time Event Integration**
   - SSE event listener attached to modal
   - Event types: buildStatusChanged, partAdded, testRunSubmitted
   - Cache updates on received events
   - Event deduplification working correctly

5. **Error Resilience**
   - Error boundaries wrap each tab component
   - Retry logic for failed data fetches
   - Graceful fallbacks for network errors
   - Error states properly displayed to users

6. **Testing & Accessibility**
   - 95%+ test coverage across all components
   - WCAG AA keyboard navigation verified
   - Screen reader testing (NVDA/JAWS)
   - Axe accessibility audit passing
   - All 6 acceptance criteria verified by pre-merge checklist

---

## B. Detailed Implementation Plan

### B.1 Components to Create/Modify

#### **Primary Components**

| Component | Current Status | Changes Required | LOC Impact | Files |
|-----------|----------------|------------------|-----------|-------|
| **BuildDetailModal** | Exists (flat structure) | Complete refactor to use Tabs component, data consolidation | ~150 LOC | 1 file |
| **Tabs.tsx** | Created (Issue #260) | Add error boundary wrapper, verify lazy loading | ~50 LOC | 1 file |
| **BuildOverviewTab.tsx** | Created (Issue #260) | Refactor hooks→props, add edit handlers | ~100 LOC | 1 file |
| **BuildPartsTab.tsx** | Created (Issue #260) | Add inline editor, drill-down modal, search filters | ~200 LOC | 1 file |
| **BuildTestRunsTab.tsx** | Created (Issue #260) | Add filter UI, result viewer, rerun handler | ~180 LOC | 1 file |
| **BuildHistoryTab.tsx** | Created (Issue #260) | Integrate ActivityFeed, add event filter, date picker | ~160 LOC | 1 file |

#### **Supporting Files**

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `frontend/lib/types/modal-types.ts` | Types | Modal and tab prop interfaces | Create new |
| `frontend/lib/hooks/useBuildDetailModal.ts` | Hook | Unified modal state management | Create new |
| `frontend/components/ErrorBoundary.tsx` | Component | Wrap tabs for error handling | Create new |
| `frontend/components/__tests__/Modal.test.tsx` | Test | Comprehensive modal integration tests | Create new |

### B.2 File Structure & Organization

```
frontend/
├── components/
│   ├── BuildDetailModal.tsx              [REFACTOR]
│   ├── Tabs.tsx                          [ENHANCE - add error boundary]
│   ├── BuildOverviewTab.tsx              [REFACTOR - hooks→props]
│   ├── BuildPartsTab.tsx                 [ENHANCE - inline editor]
│   ├── BuildTestRunsTab.tsx              [ENHANCE - filters, result viewer]
│   ├── BuildHistoryTab.tsx               [ENHANCE - activity filter]
│   ├── ErrorBoundary.tsx                 [NEW]
│   ├── InlineEditor.tsx                  [NEW - for Part/Overview edits]
│   ├── PartDetailsModal.tsx              [NEW - drill-down view]
│   ├── TestRunResultViewer.tsx           [NEW - detailed test results]
│   └── __tests__/
│       ├── BuildDetailModal.test.tsx     [NEW - integration tests]
│       ├── Tabs.integration.test.tsx     [NEW - tab navigation tests]
│       └── TabAccessibility.test.tsx     [NEW - a11y tests]
├── lib/
│   ├── types/
│   │   ├── modal-types.ts                [NEW]
│   │   └── activity-types.ts             [EXISTING]
│   ├── hooks/
│   │   ├── useBuildDetailModal.ts        [NEW - unified state]
│   │   ├── useBuildTabs.ts               [EXISTING]
│   │   └── useSSEEvents.ts               [EXISTING]
│   └── apollo-client.ts                  [UPDATE - add event handlers]
```

### B.3 Dependencies & Integration Points

**Hard Dependencies:**
- Issue #259 (Issue #260 merged): ActivityFeed component, useActivityFeed hook
- Issue #260 (merged): Tabs component, all tab content components
- GraphQL schema: Build, Part, TestRun queries (existing)
- Apollo Client: Already configured (existing)
- Express Event Bus: SSE endpoint at /events (existing Issue #7)

**Integration Points:**
1. **GraphQL Queries**: Build detail query with nested parts and test runs
2. **Apollo Cache**: Update cache on mutations and SSE events
3. **Event Bus**: Listen to buildStatusChanged, partAdded, testRunSubmitted events
4. **Modal Container**: Integration with existing page layout (parent component)

### B.4 Data Flow Diagram

```
BuildDetailModal (Main Container)
├── Props: buildId, onClose
├── State: activeTab, tabData (fetched via GraphQL)
│
├─ Tabs (Tab Navigation Component)
│  ├── Props: tabs=[], activeTab, onTabChange
│  └── Children: 4 Tab Components
│
├── BuildOverviewTab
│   ├── Props: build, onEdit, onSave
│   └── State: editMode (local)
│
├── BuildPartsTab
│   ├── Props: parts, onAddPart, onEditPart, onDeletePart
│   ├── State: selectedPart, editingPart
│   └── Child: PartDetailsModal (drill-down)
│
├── BuildTestRunsTab
│   ├── Props: testRuns, onRerun, onDownload
│   ├── State: selectedRun, resultViewer
│   └── Child: TestRunResultViewer
│
├── BuildHistoryTab
│   ├── Props: buildId, events
│   ├── Imports: ActivityFeed (from Issue #259)
│   └── State: eventFilter, dateRange
│
└── SSE Event Listener (useSSEEvents Hook)
    ├── Listens: buildStatusChanged, partAdded, testRunSubmitted
    ├── Action: Updates Apollo cache
    └── Notifies: Tabs to re-render with fresh data
```

### B.5 API & GraphQL Integration

**Primary Query** (to fetch all modal data):
```graphql
query GetBuildDetail($id: ID!) {
  build(id: $id) {
    id
    name
    status
    metadata { ... }
    parts {
      id
      name
      status
      quantity
      ...
    }
    testRuns {
      id
      name
      status
      result
      completedAt
      fileUrl
      ...
    }
    events {
      id
      type
      timestamp
      data
      ...
    }
  }
}
```

**Mutations to Implement**:
- `updateBuild(id, input)` → updates status, metadata
- `updatePart(id, input)` → updates part details
- `deletePart(id)` → removes part
- `addPart(buildId, input)` → creates new part
- `retestRun(id)` → re-runs a test
- Custom mutations from Issue #256 (button/form handlers)

**Event Types to Handle**:
- `buildStatusChanged` → invalidate build cache
- `partAdded` → add to parts list
- `partUpdated` → update parts cache
- `testRunSubmitted` → add to test runs list
- `testRunCompleted` → update test run status

---

## C. Test Strategy

### C.1 Unit Tests

**Components (95%+ coverage each):**

| Component | Test File | Test Cases | Expected Coverage |
|-----------|-----------|-----------|------------------|
| BuildDetailModal | Modal.test.tsx | 24+ | 95% |
| Tabs (enhanced) | Tabs.test.tsx | 18+ (existing + 8 new) | 95% |
| BuildOverviewTab | OverviewTab.test.tsx | 20+ | 95% |
| BuildPartsTab | PartsTab.test.tsx | 28+ (including inline editor) | 95% |
| BuildTestRunsTab | TestRunsTab.test.tsx | 26+ (including filters) | 95% |
| BuildHistoryTab | HistoryTab.test.tsx | 16+ (ActivityFeed integration) | 95% |
| ErrorBoundary | ErrorBoundary.test.tsx | 12+ | 95% |
| InlineEditor | InlineEditor.test.tsx | 20+ | 95% |

**Total Unit Tests**: 164+ test cases

### C.2 Integration Tests

**Tab Navigation & State Management:**
- Test: Tab switching preserves data across tabs
- Test: Active tab persists during modal session
- Test: Tab state resets on modal reopen

**Data Flow:**
- Test: Props passed correctly from modal to tabs
- Test: Child component mutations trigger parent updates
- Test: GraphQL cache updates correctly on mutations

**SSE Event Handling:**
- Test: New events trigger cache updates
- Test: Events from other modals don't affect this modal
- Test: Duplicate events are deduplicated

**Keyboard Navigation:**
- Test: Arrow keys switch tabs (Left/Right)
- Test: Home/End jump to first/last tab
- Test: Tab key cycles through interactive elements
- Test: Escape key closes modal

### C.3 E2E Test Scenarios

**Scenario 1: View Build Overview**
```
1. Open BuildDetailModal with buildId
2. Verify Overview tab is active
3. Verify build metadata displays correctly
4. Verify all tabs are visible and clickable
```

**Scenario 2: Edit Build Metadata**
```
1. Open Overview tab
2. Click Edit button
3. Modify fields (name, status, etc.)
4. Click Save
5. Verify GraphQL mutation called
6. Verify cache updated
7. Verify Overview tab shows updated data
```

**Scenario 3: View and Manage Parts**
```
1. Navigate to Parts tab
2. Verify parts list displays
3. Click Part to drill-down
4. View part details in PartDetailsModal
5. Close drill-down modal
6. Verify back to Parts tab
```

**Scenario 4: View and Filter Test Runs**
```
1. Navigate to TestRuns tab
2. Verify test runs display
3. Apply status filter
4. Verify list updates
5. Click test run to view results
6. Verify result viewer displays
```

**Scenario 5: Real-Time Event Updates**
```
1. Open BuildDetailModal
2. SSE event arrives (e.g., testRunSubmitted)
3. Verify TestRuns tab updates automatically
4. Verify tab indicator shows badge if needed
5. Verify no UI flicker during update
```

**Scenario 6: Error Handling**
```
1. Open modal during network error
2. Verify error boundary displays
3. Click retry button
4. Verify data fetches and displays
```

### C.4 Accessibility Testing

**Keyboard Navigation:**
- ✅ Tab key navigates all interactive elements
- ✅ Arrow keys switch between tabs
- ✅ Enter/Space activate buttons
- ✅ Escape closes modal

**Screen Reader:**
- ✅ Modal announced with role="dialog"
- ✅ Tab panel announced with role="tabpanel"
- ✅ Tab buttons have aria-selected and aria-controls
- ✅ Active tab indicated via aria-selected="true"
- ✅ Error messages announced to screen readers

**Visual:**
- ✅ Focus ring visible on all interactive elements
- ✅ Focus ring meets WCAG AAA contrast ratio
- ✅ Tab indicator highlights current tab
- ✅ Error states clearly marked with icons + text

---

## D. Feature Implementation Details

### D.1 BuildDetailModal Refactor (Step-by-Step)

**Current Structure** (flat):
```tsx
<Modal>
  <OverviewSection {...} />
  <PartsSection {...} />
  <TestRunsSection {...} />
  <HistorySection {...} />
</Modal>
```

**New Structure** (tabbed):
```tsx
<Modal>
  <Tabs 
    activeTab={activeTab} 
    onTabChange={setActiveTab}
    tabs={[
      { id: 'overview', label: 'Overview', ... },
      { id: 'parts', label: 'Parts', ... },
      { id: 'testruns', label: 'Test Runs', ... },
      { id: 'history', label: 'History', ... },
    ]}
  >
    <BuildOverviewTab build={build} onEdit={handleEdit} />
    <BuildPartsTab parts={parts} onEdit={handleEditPart} />
    <BuildTestRunsTab testRuns={testRuns} onRerun={handleRerun} />
    <BuildHistoryTab buildId={buildId} events={events} />
  </Tabs>
</Modal>
```

**Implementation Steps:**

1. **Create useBuildDetailModal Hook** (unified state management)
   ```tsx
   const {
     build,
     parts,
     testRuns,
     events,
     loading,
     error,
     activeTab,
     setActiveTab,
     refetch,
     updateBuild,
     updatePart,
     deletePart,
     addPart,
     retestRun,
   } = useBuildDetailModal(buildId);
   ```

2. **Refactor Modal Props** (from prop drilling to context if needed)
   - Pass unified state object instead of individual props
   - All mutations available on modal instance
   - Error boundaries wrap each tab

3. **Implement Tab Components Props** (standardize prop interfaces)
   - Each component receives data as props, not via hooks
   - Handlers passed down for mutations
   - Callbacks for edit/delete/view actions

4. **Add SSE Event Listener** (in useBuildDetailModal)
   - useEffect listens to 'buildStatusChanged', 'partAdded', etc.
   - On event, invalidate Apollo cache for that entity
   - Triggers re-render automatically

5. **Wire Interaction Handlers** (Edit, Delete, Drill-down, etc.)
   - Edit button → toggles inline editor or modal
   - Delete button → confirms then calls mutation
   - View Details → opens drill-down modal
   - All handlers call GraphQL mutations via Apollo

### D.2 Data Fetching Consolidation

**Before** (hardcoded hooks in each tab):
```tsx
// In BuildOverviewTab
const { build, loading } = useQuery(GET_BUILD_QUERY, { variables: { id: buildId } });
```

**After** (props from parent):
```tsx
// In BuildDetailModal
const { build, loading } = useQuery(GET_BUILD_DETAIL_QUERY, { variables: { id: buildId } });

// Pass to tab
<BuildOverviewTab build={build} loading={loading} />
```

**Benefits:**
- Single GraphQL query (not 4 separate ones)
- Reduced network overhead
- Unified loading/error states
- Better cache management

### D.3 SSE Event Listener Integration

```tsx
useEffect(() => {
  const unsubscribe = onSSEEvent('buildStatusChanged', (event) => {
    apolloClient.cache.modify({
      fields: {
        build(existing) {
          return { ...existing, status: event.data.status };
        },
      },
    });
  });

  return () => unsubscribe();
}, [buildId]);
```

### D.4 Lazy Loading Implementation

**Per-Tab Lazy Loading:**
- Only active tab renders component (visibility: hidden not used)
- Inactive tabs render but with conditional data fetch
- Data fetches on first tab activation, then cached

```tsx
<Tabs {...}>
  {activeTab === 'overview' && <BuildOverviewTab {...} />}
  {activeTab === 'parts' && <BuildPartsTab {...} />}
  {activeTab === 'testruns' && <BuildTestRunsTab {...} />}
  {activeTab === 'history' && <BuildHistoryTab {...} />}
</Tabs>
```

### D.5 Error Boundary Placement

```tsx
<ErrorBoundary fallback="Failed to load overview tab">
  <BuildOverviewTab {...} />
</ErrorBoundary>
```

---

## E. Success Criteria & Validation

### E.1 Pre-Merge Checklist

**Code Quality:**
- ✅ TypeScript strict mode: 0 errors
- ✅ ESLint: 0 errors across all modified files
- ✅ Prettier: All code formatted
- ✅ No unused variables or imports

**Functionality:**
- ✅ All 6 acceptance criteria verified
- ✅ Modal opens and closes correctly
- ✅ All 4 tabs render and navigate
- ✅ Data displays correctly in each tab
- ✅ Mutations work (edit, delete, add)

**Testing:**
- ✅ 164+ unit tests passing
- ✅ 95%+ code coverage per component
- ✅ 6+ E2E scenarios passing
- ✅ No test regressions

**Accessibility:**
- ✅ WCAG AA audit passing (axe)
- ✅ Keyboard navigation working (all tabs, modals)
- ✅ Screen reader tested (NVDA/JAWS)
- ✅ Focus visible on all interactive elements

**Performance:**
- ✅ Modal open time: <500ms
- ✅ Tab switch time: <100ms
- ✅ Data fetch time: <2s (with network latency)
- ✅ No memory leaks detected

**Browser Compatibility:**
- ✅ Chrome/Edge latest
- ✅ Firefox latest
- ✅ Safari latest
- ✅ Mobile browsers (iOS Safari, Chrome Android)

### E.2 Acceptance Criteria Verification

| Criterion | Verification Method | Status |
|-----------|-------------------|--------|
| Tab Integration | Manual test: Open modal, verify all 4 tabs present | ⬜ |
| Keyboard Navigation | Automated: Playwright test for arrow keys, Home/End | ⬜ |
| Data Standardization | Code review: Verify no hardcoded hooks in tabs | ⬜ |
| Edit Handlers | Manual test: Edit button triggers inline editor | ⬜ |
| Drill-down Actions | Manual test: View Details opens PartDetailsModal | ⬜ |
| Real-Time Events | Manual test: Open modal, trigger mutation, verify update | ⬜ |
| Error Resilience | Manual test: Trigger error, verify boundary catches it | ⬜ |
| Accessibility | Automated: axe audit passing | ⬜ |
| Test Coverage | Report: 95%+ coverage on all files | ⬜ |
| Performance | Audit: Lighthouse score maintained | ⬜ |

### E.3 Performance Benchmarks

| Metric | Target | Method |
|--------|--------|--------|
| Modal Open Time | <500ms | Lighthouse, DevTools |
| Tab Switch Time | <100ms | Playwright timer |
| Initial Data Load | <2s | Network tab, 3G throttle |
| Tab Lazy Load | <200ms | Playwright measurement |
| SSE Event Processing | <100ms | Custom timer hook |
| Memory Usage | <10MB delta | DevTools heap snapshot |

---

## F. Parallel Execution Strategy

### F.1 Can Issues #256 and #295 Run in Parallel?

**Answer: YES - Zero file conflicts**

**File Ownership Analysis:**
```
#256 (Interactive Polish):
  - Button.tsx, Form*.tsx, Input.tsx, etc.
  - CSS/animations for focus rings, hover states
  
#295 (Tab Integration):
  - BuildDetailModal.tsx, Tabs.tsx, Tab*.tsx
  - Modal and tab-specific logic
  - NO OVERLAP
```

**Why Safe:**
- Different components modified
- Different stylesheets (if any)
- No shared hooks affected
- No GraphQL schema changes

### F.2 Merge Order & Dependencies

**Recommended Sequence:**
1. **Start both in parallel** (feat/issue-256-* and feat/issue-295-*)
2. **Merge #256 first** (fewer files, lower risk)
   - No rebase needed for #295
3. **PR review #295** while #256 in review
4. **After #256 merged**: Rebase #295 if needed (expect 0 conflicts)
5. **Merge #295** when ready

**Why This Order:**
- #256 provides CSS foundation (button styles) that #295 uses
- Smaller PR (#256) merges faster
- Rebase risk very low (if needed)
- Reduces overall timeline

### F.3 Integration Points Between Issues

| Point | #256 | #295 | Impact |
|-------|------|------|--------|
| Button Styles | Provides | Consumes | Modal action buttons use new focus ring |
| Form Styles | Provides | Consumes | Inline editor uses form inputs from #256 |
| Hover States | Provides | Consumes | Tab items use hover effects from #256 |
| Focus Rings | Provides | Consumes | All modal interactive elements use focus from #256 |
| Error Boundaries | Shared | Shared | Both use same error handling pattern |

### F.4 Team Allocation Options

**Option A: Parallel (Recommended) - 12-14 days**
```
Developer 1: #256 (2-3 days)
Developer 2: #295 (11 days)
Timeline: Work simultaneously, stagger merges
Result: 12-14 days total (10-11 days savings vs. sequential)
```

**Option B: Sequential - 19-22 days**
```
Developer 1: #256 (2-3 days)
Developer 1: #295 (11 days)
Timeline: Complete #256, then start #295
Result: 19-22 days total
Risk: Lower (one developer on both), Slower (no parallelism)
```

**Recommended: Option A (Parallel)**

---

## G. Risk Assessment & Mitigation

### High-Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Real-time Event Bus failure | Tab updates fail silently | Medium | Unit test event handlers, integration test with mock SSE |
| SSE connection drops | Modal loses real-time sync | Medium | Implement reconnection with exponential backoff (existing) |
| GraphQL cache invalidation bugs | Stale data in modal | Medium | Comprehensive cache update tests, manual verification |
| Keyboard nav breaks in modal | Accessibility failure | Low | Playwright a11y tests, screen reader testing |
| Performance degradation | Modal slow to open | Low | Lighthouse audits, performance profiling during review |

### Mitigation Strategies

1. **Real-Time Events**
   - Write unit tests for each event type handler
   - Integration test: Trigger mutation in one modal, verify update in another
   - Mock SSE for predictable testing

2. **Cache Invalidation**
   - Test cache updates with Apollo's `cache.modify()`
   - Verify stale data doesn't persist across tab switches
   - Use React DevTools Apollo extension to inspect cache

3. **Keyboard Navigation**
   - Run Playwright accessibility tests
   - Manual testing with screen reader (NVDA/JAWS)
   - Compare with existing tab tests (Issue #260)

4. **Performance**
   - Profile with Chrome DevTools before/after
   - Lighthouse audit on modal open
   - Lazy load tabs to prevent bundle bloat

---

## H. Success Timeline

**Critical Path: 11 days**

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Planning & Setup** | 0.5 day | Implementation plan (this doc), component breakdown, test plan |
| **Core Modal Refactor** | 2-3 days | Modal integrates Tabs, useBuildDetailModal hook created |
| **Component Standardization** | 2-3 days | All 4 tabs refactored to accept props, handlers wired |
| **Real-Time Integration** | 2 days | SSE listeners added, event handlers for all event types |
| **Error Handling** | 1.5 days | Error boundaries, retry logic, fallbacks |
| **Testing** | 2 days | Unit tests (164+), integration tests, E2E scenarios |
| **Accessibility Audit** | 0.5 day | WCAG AA verification, keyboard nav testing, screen reader testing |
| **Performance Tuning** | 0.5 day | Lighthouse audit, memory profiling, optimization |
| **Code Review & Fixes** | 1-2 days | Address reviewer feedback, re-test |
| **Final Validation** | 0.5 day | Pre-merge checklist, all criteria verified |

**Total: 11-13 days**

---

## I. Sign-Off & Handoff

**Ready for Implementation:** ✅ YES

**Developer Onboarding:**
1. Read this document end-to-end (90 min)
2. Review related PRs (#259, #260) and their tests (30 min)
3. Understand data flow: BuildDetailModal → Tabs → Handlers → GraphQL (30 min)
4. Set up test environment and run existing tests (15 min)
5. Create feature branch and commit initial setup (15 min)

**Code Review Expectations:**
- Detailed review of modal refactor (high-risk area)
- Verify accessibility changes are comprehensive
- Check test coverage and E2E scenarios
- Performance review with Lighthouse

**Success Definition:** All items in Section E.1 (Pre-Merge Checklist) verified and signed off.

---

**Document Version**: 1.0  
**Last Updated**: May 14, 2026  
**Status**: Ready for Implementation
