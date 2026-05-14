# Issue #260: Detail Modal Tab Organization & Content Refactor - Implementation Plan

**Issue ID**: #260  
**Phase**: Phase 2 - Information Architecture  
**Created**: May 13, 2026  
**Status**: Planning Phase  
**Estimated Duration**: 2-3 hours  
**Complexity**: Medium  
**Depends On**: Issue #258 (Dashboard Metrics foundation) - for UI patterns  
**Parallelizable With**: Issue #259 (Status Visualization)  

---

## Section 1: Issue Overview

### Title
#260: Detail Modal Tab Organization & Content Refactor

### Description
Part of Phase 2: Information Architecture from UX Design Review. Reorganize modal content into tabbed interface (Overview, Parts, Tests, History) for better information organization. This improves information hierarchy and reduces cognitive load for users viewing build details.

### GitHub Acceptance Criteria
- [ ] Tabs component created with styling
- [ ] Modal reorganized into 4 tabs: Overview | Parts | TestRuns | History
- [ ] Tab navigation keyboard accessible
- [ ] Content lazy loads for each tab
- [ ] Nested count badges show on tab labels
- [ ] Tab indicator styling matches design
- [ ] Search/filter available within tabs
- [ ] Mobile drawer layout implemented

### Business Value
Tabbed interface reduces clutter in detail views, improves scannability, and organizes related information logically. Count badges help users understand data volume at a glance. Mobile drawer adaptation ensures usability on shop floor devices. Establishes tab pattern for future modal refactoring.

### Dependencies
- **Blocking Issues**: None (Issue #258 establishes patterns; #260 is independent)
- **Related Issues**: 
  - #258 (Dashboard Metrics) - UI pattern consistency
  - #259 (Status Visualization) - may share modal display
- **Phase Dependencies**: No GraphQL schema changes needed

---

## Section 2: Technical Analysis

### Current State

**Existing Components** (from Phase 1):
- `build-detail-modal.tsx` - Current flat modal layout
- `StatusBadge.tsx` - Status display and styling
- `EmptyState.tsx` - Empty state handling
- `SubmitTestRunForm.tsx` - Test run submission form

**Existing GraphQL Queries**:
- `BUILDS_QUERY` - Fetches build with related parts and test runs
- `BUILD_PARTS_QUERY` - Fetches parts for build
- `BUILD_TEST_RUNS_QUERY` - Fetches test runs for build

**Established Patterns** (from Phase 1 & #258):
- TypeScript strict mode
- React 19 Server/Client Components
- Apollo Client 4 with cache
- Vitest + React Testing Library
- Tailwind CSS utilities
- Global test setup
- Accessibility requirements (WCAG AA)

### Required Changes

#### 1. New Tabs Component

**File**: `frontend/components/Tabs.tsx`
- **Purpose**: Reusable tabbed interface component
- **Props**:
  - `tabs: Tab[]` - Array of tab definitions
  - `defaultTab?: string` - Default active tab ID
  - `onTabChange?: (tabId: string) => void` - Tab change callback
  - `lazy?: boolean` - Lazy load tab content (default true)
  - `variant?: 'default' | 'pills'` - Style variant
- **Tab Interface**:
  ```typescript
  interface Tab {
    id: string;
    label: string;
    icon?: ReactNode;
    badge?: number | string;
    content: ReactNode;
    disabled?: boolean;
    badgeVariant?: 'default' | 'warning' | 'danger';
  }
  ```
- **Features**:
  - Tab list with semantic HTML (`<ul role="tablist">`)
  - Tab buttons with aria-selected, aria-controls
  - Tab panel with role="tabpanel"
  - Keyboard navigation (Arrow keys, Tab)
  - Visual indicator (underline or background)
  - Badge display on tab labels (count)
  - Icon support
  - Lazy loading (render only active tab content)
  - Disabled state support
  - Responsive: horizontal on desktop, scrollable on mobile
  - Animation: smooth tab switch
- **Styling**:
  - Tailwind utilities
  - Tab list: flex row, scrollable on mobile
  - Tab button: hover, active, disabled states
  - Tab panel: smooth fade in/out
  - Badge: corner position, color variants
- **Accessibility**:
  - `role="tablist"` on container
  - `role="tab"` on buttons with `aria-selected`, `aria-controls`
  - `role="tabpanel"` on content area with `aria-labelledby`
  - Keyboard support: Arrow keys, Tab
  - Focus management (trap within tab)
  - No color-only communication (labels + icons)
- **Testing**:
  - Tab switching works
  - Keyboard navigation (arrow keys, tab)
  - Lazy loading only renders active
  - Badge displays correctly
  - Disabled tabs not interactive
  - Accessibility attributes present

#### 2. Refactored BuildModal Component

**File**: `frontend/components/build-detail-modal.tsx` (refactor)
- **Current Structure**: All content in single view
- **New Structure**: Organized into 4 tabs
- **Tabs**:

  **Tab 1: Overview**
  - Build ID, Name, Description
  - Status badge and progress
  - Created/Updated timestamps
  - Owner/Assignee info
  - Quick actions (Edit, Delete, Run)
  - Build metadata (version, tags)
  
  **Tab 2: Parts**
  - Table/List of parts in build
  - Part ID, Name, Quantity
  - Part status indicators
  - Add Part button
  - Search/Filter within tab
  - Counts badge: "Parts (5)"
  
  **Tab 3: TestRuns**
  - Table/List of test runs
  - Test run ID, Name, Status
  - Pass/Fail count
  - Timestamp, Duration
  - Results link
  - Add Test Run button
  - Search/Filter within tab
  - Counts badge: "Tests (12)"
  
  **Tab 4: History**
  - Activity feed of changes (from #259 patterns)
  - Status change timeline
  - Event log
  - Timestamps, who made change
  - Change details (before/after)
  - Filter by event type
  - Counts badge: "History (47)"

- **Props**:
  ```typescript
  interface BuildDetailModalProps {
    buildId: string;
    isOpen: boolean;
    onClose: () => void;
    onBuildUpdated?: (build: Build) => void;
    defaultTab?: 'overview' | 'parts' | 'tests' | 'history';
  }
  ```

- **Features**:
  - Tabs with badge counts
  - Lazy loading (only fetch active tab data)
  - Search/filter available in each tab
  - Keyboard navigation (Escape to close)
  - Mobile drawer layout (stack tabs vertically)
  - Real-time updates (Apollo cache)
  - Loading states per tab
  - Error states per tab

#### 3. Tab-Specific Components

**BuildOverviewTab.tsx**
- Displays overview information
- Part of BuildDetailModal
- Props: `buildId: string`
- Features: Editable fields, quick actions

**BuildPartsTab.tsx**
- Parts list/table
- Add/remove parts
- Part search filter
- Props: `buildId: string`, `parts: Part[]`

**BuildTestRunsTab.tsx**
- Test runs list
- Add test run form
- Test search/filter
- Props: `buildId: string`, `testRuns: TestRun[]`

**BuildHistoryTab.tsx**
- Activity feed (reuses components from #259)
- Status changes + other events
- Event filtering
- Props: `buildId: string`

#### 4. Hooks for Tab Management

**File**: `frontend/lib/hooks/useBuildTabs.ts`
- **Purpose**: Manage tab state and lazy loading
- **Features**:
  - Track active tab
  - Manage loaded tab content
  - Handle tab data fetching
  - Coordinate with Apollo cache
- **Usage**:
  ```typescript
  const { activeTab, setActiveTab, loadedTabs, isLoading } = useBuildTabs();
  ```

#### 5. Styling & Layout

**Responsive Layout**:
- **Desktop (>1024px)**:
  - Modal width: 800px
  - Tabs horizontal at top
  - Content area full width
  - Side panel for metadata

- **Tablet (640px-1024px)**:
  - Modal width: 90% of screen
  - Tabs horizontal with scroll
  - Content stacked

- **Mobile (<640px)**:
  - Full-screen drawer
  - Tabs vertical (stack) or horizontal (scroll)
  - Content full width
  - Increased touch targets (44px)

**Tailwind Classes** (examples):
```tsx
// Tab container
<div className="flex border-b border-gray-200 dark:border-gray-700">

// Tab button
<button className="px-4 py-2 font-medium text-gray-700 border-b-2 border-transparent hover:border-gray-300 aria-selected:border-blue-500 aria-selected:text-blue-600 dark:text-gray-300 dark:aria-selected:text-blue-400">

// Badge
<span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
```

#### 6. Accessibility

**Requirements**:
- WCAG AA compliance
- Keyboard navigation (Tab, Arrow keys, Escape)
- Screen reader support
- Color contrast ≥4.5:1

**Implementation**:
- `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `aria-selected`, `aria-controls`, `aria-labelledby`
- Tab key cycles through tabs
- Arrow keys navigate between tabs
- Escape closes modal
- Focus visible on all interactive elements
- No color-only information (badges have text)
- Status badges have aria-label
- Timestamp formats accessible

#### 7. Testing

**Unit Tests** (~300 lines):

- **`tabs.test.tsx`** (~100 lines):
  - Renders all tabs
  - Tab switching works
  - Keyboard navigation (arrows, tab)
  - Badge displays
  - Lazy loading
  - Accessibility attributes
  - Mobile responsive

- **`build-detail-modal.test.tsx`** (~150 lines):
  - All 4 tabs render
  - Correct content in each tab
  - Tab switching preserves data
  - Search/filter works per tab
  - Counts badges update
  - Modal closes on Escape
  - Mobile drawer layout
  - Real-time updates

- **`build-overview-tab.test.tsx`** (~50 lines):
  - Displays all overview fields
  - Edit actions work
  - Quick action buttons

- **`build-parts-tab.test.tsx`** (~60 lines):
  - Parts list renders
  - Add/remove parts
  - Search filter works
  - Empty state

- **`build-test-runs-tab.test.tsx`** (~60 lines):
  - Test runs list renders
  - Add test run form
  - Search filter works
  - Empty state

- **`build-history-tab.test.tsx`** (~40 lines):
  - Activity feed renders (from #259)
  - Event filtering works
  - Timestamps display

**Integration Tests** (~100 lines):

- **`build-modal-tabs.integration.test.tsx`** (~100 lines):
  - Open modal, tab switch, close
  - Data updates across tabs
  - Search in one tab doesn't affect others
  - Real-time updates (Apollo cache)
  - Mobile layout responsive
  - No race conditions

### 8. GraphQL Updates

**File**: `frontend/lib/graphql-queries.ts`

Optimize existing queries or add tab-specific queries:
```typescript
export const BUILD_OVERVIEW_QUERY = gql`
  query GetBuildOverview($buildId: ID!) {
    build(id: $buildId) {
      id
      name
      description
      status
      createdAt
      updatedAt
      owner
      version
      tags
    }
  }
`

export const BUILD_WITH_PARTS_QUERY = gql`
  query GetBuildWithParts($buildId: ID!) {
    build(id: $buildId) {
      id
      parts {
        id
        name
        quantity
        status
      }
    }
  }
`

export const BUILD_WITH_TEST_RUNS_QUERY = gql`
  query GetBuildWithTestRuns($buildId: ID!) {
    build(id: $buildId) {
      id
      testRuns {
        id
        name
        status
        createdAt
        result
        duration
      }
    }
  }
`
```

---

## Section 3: Component Architecture

### Component Hierarchy

```
BuildDetailModal
├── Tabs (container)
│   ├── Tab (Overview)
│   │   └── BuildOverviewTab
│   │       ├── BuildMetadata
│   │       └── QuickActions
│   ├── Tab (Parts)
│   │   └── BuildPartsTab
│   │       ├── PartsTable/List
│   │       ├── SearchFilter
│   │       └── AddPartButton
│   ├── Tab (TestRuns)
│   │   └── BuildTestRunsTab
│   │       ├── TestRunsTable/List
│   │       ├── SearchFilter
│   │       └── AddTestRunButton
│   └── Tab (History)
│       └── BuildHistoryTab
│           ├── ActivityFeed (from #259)
│           └── EventFilter
└── ModalFooter (Close button)
```

### State Management

**Local Component State**:
```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'parts' | 'tests' | 'history'>('overview');
const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview']));
const [searchFilter, setSearchFilter] = useState<Record<string, string>>({});
```

**Apollo Cache**:
- Each tab query cached separately
- Mutations update relevant tab data
- Subscriptions keep data fresh

**Query Variables**:
```typescript
const buildId = useParams().buildId; // Or from props
const [fetchBuildOverview, { data: overviewData }] = useLazyQuery(BUILD_OVERVIEW_QUERY);
const [fetchBuildParts, { data: partsData }] = useLazyQuery(BUILD_WITH_PARTS_QUERY);
// ... etc
```

---

## Section 4: Mobile Responsive Behavior

### Mobile Layout Strategy

**< 640px (Mobile)**:
- Full-screen modal/drawer
- Tabs display vertically (stack) OR horizontally (scrollable)
- Touchable tab buttons (44px height)
- Content single column
- Search filters collapse/expand
- Pagination visible if many items

**640px-1024px (Tablet)**:
- Modal width 90% screen width
- Tabs horizontal with scroll capability
- Content two columns (if space)
- Compact search bars

**> 1024px (Desktop)**:
- Modal fixed width (800px)
- Tabs horizontal top
- Full content area
- Sidebar metadata

### Touch Interaction
- No hover states (or subtle versions)
- Large touch targets (44px minimum)
- Swipe to change tabs (optional, later enhancement)
- No long-hover tooltips

---

## Section 5: Keyboard Navigation & Accessibility

### Keyboard Support

**Tab Key Navigation**:
- Focus cycles through visible tab buttons
- From last tab → first tab (wrapping)
- Enter/Space activates tab
- Tab key within content area focused to next interactive element

**Arrow Keys**:
- Left/Right arrow: Previous/Next tab
- Up/Down arrow: Within tab list (if vertical layout)
- Home: First tab
- End: Last tab

**Other Keys**:
- Escape: Close modal
- Enter: Confirm actions (e.g., Add Part)
- Ctrl+F: Search (browser default, enhanced in tab)

### Screen Reader Support

**Semantic HTML**:
```html
<div role="tablist" aria-label="Build Details">
  <button role="tab" aria-selected="true" aria-controls="overview-panel">
    Overview
  </button>
  <button role="tab" aria-selected="false" aria-controls="parts-panel">
    Parts
    <span aria-label="5 parts">5</span>
  </button>
  <!-- ... -->
</div>

<div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
  <!-- Content -->
</div>
```

**ARIA Labels**:
- `aria-label` on modal: "Build details for [name]"
- `aria-label` on tabs: "[Tab Name]"
- `aria-label` on badges: "[Count] [Type]"
- `aria-live="polite"` on loading states
- `aria-busy="true"` during loading

**Color Contrast**:
- Active tab indicator: ≥4.5:1 contrast
- Text on backgrounds: ≥4.5:1 contrast
- Badge colors meaningful beyond color alone

---

## Section 6: Testing Strategy

### Test Coverage Target: >80%

**Test Types**:

1. **Component Unit Tests**:
   - Tabs component renders
   - Tab switching works
   - Keyboard navigation
   - Badge display
   - Lazy loading
   - Responsive layouts

2. **Tab Content Tests**:
   - Overview tab displays correct fields
   - Parts tab shows parts list
   - Tests tab shows test runs
   - History tab shows activity feed

3. **Integration Tests**:
   - Modal opens → Tab switches → Modal closes
   - Data persists across tab switches
   - Search in one tab doesn't affect others
   - Apollo cache updates reflected

4. **Accessibility Tests**:
   - Keyboard navigation works
   - ARIA attributes present and correct
   - Focus visible
   - Color contrast sufficient
   - Screen reader announcements

5. **Responsive Tests**:
   - Mobile layout renders
   - Tablet layout renders
   - Desktop layout renders
   - Touch targets 44px on mobile

### Test File Organization

```
frontend/components/__tests__/
├── tabs.test.tsx (~100 lines)
├── build-detail-modal.test.tsx (~150 lines)
├── build-overview-tab.test.tsx (~50 lines)
├── build-parts-tab.test.tsx (~60 lines)
├── build-test-runs-tab.test.tsx (~60 lines)
├── build-history-tab.test.tsx (~40 lines)
└── integration/
    └── build-modal-tabs.integration.test.tsx (~100 lines)
```

### Key Test Scenarios

1. **Tab Switching**:
   ```typescript
   it('should switch tabs on button click', () => {
     const { getByRole } = render(<BuildDetailModal buildId="123" />);
     expect(getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'overview-tab');
     fireEvent.click(getByRole('tab', { name: /parts/i }));
     expect(getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'parts-tab');
   });
   ```

2. **Keyboard Navigation**:
   ```typescript
   it('should navigate with arrow keys', () => {
     const { getByRole } = render(<BuildDetailModal buildId="123" />);
     const firstTab = getByRole('tab', { name: /overview/i });
     firstTab.focus();
     fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
     expect(getByRole('tab', { name: /parts/i })).toHaveFocus();
   });
   ```

3. **Lazy Loading**:
   ```typescript
   it('should lazy load tab content', () => {
     const { queryByText } = render(<BuildDetailModal buildId="123" />);
     expect(queryByText(/test run/i)).not.toBeInTheDocument();
     fireEvent.click(getByRole('tab', { name: /tests/i }));
     expect(queryByText(/test run/i)).toBeInTheDocument();
   });
   ```

---

## Section 7: File Structure & Implementation Order

### New Files to Create

```
frontend/
├── components/
│   ├── Tabs.tsx
│   ├── BuildOverviewTab.tsx
│   ├── BuildPartsTab.tsx
│   ├── BuildTestRunsTab.tsx
│   ├── BuildHistoryTab.tsx
│   └── __tests__/
│       ├── tabs.test.tsx
│       ├── build-detail-modal.test.tsx
│       ├── build-overview-tab.test.tsx
│       ├── build-parts-tab.test.tsx
│       ├── build-test-runs-tab.test.tsx
│       ├── build-history-tab.test.tsx
│       └── integration/
│           └── build-modal-tabs.integration.test.tsx
├── lib/
│   ├── hooks/
│   │   ├── useBuildTabs.ts
│   │   └── __tests__/
│   │       └── use-build-tabs.test.ts
│   └── graphql-queries.ts (add tab queries)
```

### Files to Modify

```
frontend/
├── components/
│   └── build-detail-modal.tsx (refactor to use Tabs)
```

### Implementation Order

1. **Phase 1**: Core Tabs component (Tabs.tsx) with base styling & keyboard nav
2. **Phase 2**: useBuildTabs hook for state management
3. **Phase 3**: Tab-specific components (BuildOverviewTab, etc.)
4. **Phase 4**: Refactor BuildDetailModal to use tabs
5. **Phase 5**: GraphQL query optimization
6. **Phase 6**: Testing (unit tests for components)
7. **Phase 7**: Integration tests
8. **Phase 8**: Responsive refinement & accessibility validation

---

## Section 8: API Definitions & Type Safety

### TypeScript Interfaces

```typescript
// Tab management
interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
  content: ReactNode;
  disabled?: boolean;
  badgeVariant?: 'default' | 'warning' | 'danger';
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  lazy?: boolean;
  variant?: 'default' | 'pills';
  className?: string;
}

// Modal props
interface BuildDetailModalProps {
  buildId: string;
  isOpen: boolean;
  onClose: () => void;
  onBuildUpdated?: (build: Build) => void;
  defaultTab?: 'overview' | 'parts' | 'tests' | 'history';
}

// Tab component props
interface BuildOverviewTabProps {
  buildId: string;
  isLoading?: boolean;
  onUpdate?: () => void;
}

interface BuildPartsTabProps {
  buildId: string;
  parts?: Part[];
  isLoading?: boolean;
  onPartAdded?: (part: Part) => void;
  onPartRemoved?: (partId: string) => void;
}

interface BuildTestRunsTabProps {
  buildId: string;
  testRuns?: TestRun[];
  isLoading?: boolean;
  onTestRunAdded?: (testRun: TestRun) => void;
}

interface BuildHistoryTabProps {
  buildId: string;
  events?: BuildEvent[];
  isLoading?: boolean;
}

// Hook return type
interface UseBuildTabsReturn {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  loadedTabs: Set<string>;
  isLoading: Record<string, boolean>;
}
```

---

## Section 9: Success Criteria Checklist

### Implementation Complete When:

- [ ] Tabs component renders all 4 tabs
- [ ] Tab buttons display labels and badges correctly
- [ ] Tab switching works (click button)
- [ ] Tab switching works (keyboard arrows)
- [ ] Escape key closes modal
- [ ] Tab Panel displays correct content for each tab
- [ ] Overview tab shows build info
- [ ] Parts tab shows parts list with search
- [ ] Tests tab shows test runs with search
- [ ] History tab shows activity feed
- [ ] Count badges display on each tab
- [ ] Lazy loading works (only active tab renders)
- [ ] Mobile layout stacks tabs correctly
- [ ] Tablet layout responsive
- [ ] Desktop layout full width
- [ ] Search filter works in Parts tab
- [ ] Search filter works in Tests tab
- [ ] Real-time updates work (Apollo cache)
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] All components keyboard accessible
- [ ] All ARIA attributes present
- [ ] Color contrast ≥4.5:1
- [ ] Focus visible on all interactive elements
- [ ] No TypeScript errors (strict mode)
- [ ] No ESLint errors
- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass
- [ ] Production build passes
- [ ] No performance regressions

### Definition of Done

✅ All success criteria checked  
✅ All tests passing  
✅ Zero TypeScript errors  
✅ Zero ESLint errors  
✅ PR reviewed and approved  
✅ Merged to main  
✅ Modal works with both desktop and mobile users  

---

## Section 10: Dependencies & Estimated Effort

### External Dependencies
- **None new** - Reuse React 19, Tailwind CSS, Apollo Client, Vitest from Phase 1

### Internal Dependencies
- **#258**: MetricCard pattern, styling conventions
- **#259** (optional): ActivityFeed component for History tab
- **StatusBadge**: Existing component for status display
- **EmptyState**: Existing component for empty states

### Effort Breakdown
- Tabs component development: 45 min
- Tab content components: 45 min
- BuildDetailModal refactor: 30 min
- Testing: 60 min
- **Total: 2-3 hours** (as estimated by Phase 2 analysis)

### Risk Factors
- Complex refactor of existing modal (mitigate: careful testing, backup)
- Lazy loading complexity (mitigate: simple React.lazy approach first)
- Data fetching coordination (mitigate: useBuildTabs hook)

---

## Section 11: Integration Points

### With Issue #259
- **Shared**: ActivityFeed component for History tab
- **Pattern Reuse**: TimelineEvent, StatusBadge styling
- **Coordination**: Both use Apollo cache for real-time updates
- **Branch Strategy**: Can merge independently (different components)

### With Issue #258
- **Pattern Reuse**: Card styling, badge conventions
- **Consistency**: Same color scheme, Tailwind classes
- **Testing Approach**: Same patterns (Vitest, React Testing Library)

---

## Section 12: Next Steps

1. **Confirm Existing Modal Structure**: Review build-detail-modal.tsx
2. **Design Tab Layout**: Finalize tab order and grouping
3. **Start with Tabs Component**: Reusable first
4. **Build Tab Content**: One tab at a time
5. **Refactor Modal**: Integrate tabs
6. **Test Thoroughly**: Unit + integration tests
7. **Coordinate with #259**: Share test patterns if needed
8. **Merge After Review**: One PR per issue

---

**Last Updated**: May 13, 2026  
**Ready for Implementation**: Yes (after #258 merges, or in parallel)  
**Blockers**: None (#258 not strictly required, but useful for patterns)  
**Parallel Work**: Can run simultaneously with Issue #259 after #258 foundation established  
