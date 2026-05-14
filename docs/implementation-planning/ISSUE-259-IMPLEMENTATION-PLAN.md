# Issue #259: Build Status Visualization & Activity Feed - Implementation Plan

**Issue ID**: #259  
**Phase**: Phase 2 - Information Architecture  
**Created**: May 13, 2026  
**Status**: Planning Phase  
**Estimated Duration**: 3-4 hours  
**Complexity**: Medium  
**Depends On**: Issue #258 (Dashboard Metrics foundation)  
**Parallelizable With**: Issue #260 (Tab Organization)  

---

## Section 1: Issue Overview

### Title
#259: Build Status Visualization & Activity Feed

### Description
Part of Phase 2: Information Architecture from UX Design Review. Implement build status progression visualization and activity feed component for build history tracking. This issue builds on the metrics patterns established in Issue #258 and provides detailed status tracking and event history visualization.

### GitHub Acceptance Criteria
- [ ] Status progression flowchart renders for each build
- [ ] Activity feed shows chronological build events
- [ ] Timeline component displays status changes
- [ ] Real-time status indicators update without page refresh
- [ ] Activity feed pagination working
- [ ] Filters available (by event type, date range)
- [ ] Responsive on mobile
- [ ] Integration tests for feed updates

### Business Value
Status visualization enables operators to track individual build progression in detail, understand historical status changes, and identify patterns in build workflows. Activity feeds provide an audit trail for compliance and debugging. Establishes visual patterns (timelines, status indicators) for Phase 2 enhancements.

### Dependencies
- **Blocking Issues**: #258 (Dashboard Metrics) - provides MetricCard and ActivityTimeline patterns
- **Related Issues**: 
  - #260 (Tab Organization) - may share timeline components
  - #261 (Responsive Table) - responsive patterns consistency
- **Phase Dependencies**: GraphQL BUILDS_QUERY exists; no backend changes needed

---

## Section 2: Technical Analysis

### Current State

**Existing Components** (from Phase 1 & Issue #258):
- `StatusBadge.tsx` - Status display component with color mapping
- `ActivityTimeline.tsx` - Basic timeline structure (from #258)
- `MetricCard.tsx` - Card container pattern
- `build-detail-modal.tsx` - Detail display modal
- `build-dashboard.tsx` - Dashboard container

**Existing GraphQL Queries**:
- `BUILDS_QUERY` - Fetches builds with status and timestamps
- No specific status event history query yet

**Established Patterns** (from Phase 1 & #258):
- TypeScript with strict mode
- React 19 with Server/Client Components
- Apollo Client 4 with cache management
- Vitest + React Testing Library
- Tailwind CSS for styling
- Global test setup with localStorage mock
- Accessibility requirements (WCAG AA)

### Required Changes

#### 1. New GraphQL Query Addition

**File**: `frontend/lib/graphql-queries.ts`

Add query to fetch build status history:
```typescript
export const BUILD_STATUS_HISTORY_QUERY = gql`
  query GetBuildStatusHistory($buildId: ID!, $limit: Int = 50, $offset: Int = 0) {
    buildStatusHistory(buildId: $buildId, limit: $limit, offset: $offset) {
      items {
        id
        buildId
        status
        previousStatus
        timestamp
        reason
        changedBy
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const BUILD_EVENTS_QUERY = gql`
  query GetBuildEvents($buildId: ID!, $eventTypes: [String], $startDate: DateTime, $endDate: DateTime) {
    buildEvents(buildId: $buildId, eventTypes: $eventTypes, startDate: $startDate, endDate: $endDate) {
      id
      buildId
      eventType
      timestamp
      description
      metadata
    }
  }
`
```

**Note**: These queries derive from existing BUILDS data; no backend schema changes required if events are calculated client-side from timestamps.

#### 2. New Components

**Component 1: StatusProgression.tsx**
- **Purpose**: Renders visual flowchart showing build status progression
- **Props**: 
  - `buildId: string` (required)
  - `statuses: BuildStatus[]` (status history array)
  - `interactive?: boolean` (clickable nodes)
  - `size?: 'small' | 'medium' | 'large'` (responsive sizing)
- **Features**:
  - Horizontal flow diagram with status nodes
  - Arrows connecting nodes
  - Timestamps on each node
  - Color-coded by status (success=green, failed=red, pending=gray, etc.)
  - Hover shows detail (timestamp, duration in status)
  - Responsive layout (vertical on mobile, horizontal on desktop)
  - Accessibility: `role="figure"`, ARIA labels on nodes
- **Dependencies**: StatusBadge component
- **Testing**:
  - Renders correct number of nodes
  - Correct color mapping per status
  - Responsive layout changes
  - Hover behavior
  - Accessibility attributes

**Component 2: ActivityFeed.tsx**
- **Purpose**: Displays chronological list of build events with pagination
- **Props**:
  - `buildId: string` (required)
  - `eventTypes?: string[]` (filter available event types)
  - `dateRange?: { start: Date; end: Date }` (date filter)
  - `pageSize?: number` (default 20)
  - `onEventClick?: (event: BuildEvent) => void` (callback)
- **Features**:
  - Chronological list of events (newest first)
  - Event type badges (e.g., "status_change", "test_run", "manual_update")
  - Timestamps with relative format (e.g., "2 hours ago")
  - Description text for each event
  - Expandable event details (metadata)
  - Pagination controls
  - Filter UI (event type dropdown, date range picker)
  - Empty state when no events
  - Loading skeleton state (from #258 patterns)
  - Real-time updates via Apollo subscription or cache invalidation
  - Responsive: stacked on mobile, inline on desktop
  - Accessibility: `role="feed"`, semantic HTML
- **Dependencies**: TimelineEvent component, StatusBadge, Pagination
- **Testing**:
  - Renders events in correct order
  - Pagination controls work
  - Filter combinations work (type + date range)
  - Empty state displays
  - Loading state displays
  - Responsive layout

**Component 3: TimelineEvent.tsx**
- **Purpose**: Individual event row in activity feed
- **Props**:
  - `event: BuildEvent` (event data)
  - `expanded?: boolean` (show details)
  - `onExpand?: () => void` (expand callback)
  - `index?: number` (for timeline connection lines)
- **Features**:
  - Event icon (varies by event type)
  - Event type label
  - Timestamp (absolute + relative)
  - Description text
  - Status badge if status change event
  - Metadata section (expandable)
  - Visual connection line to next event
  - Hover highlight
  - Click to expand details
  - Accessibility: `role="listitem"`, keyboard navigation
- **Dependencies**: StatusBadge
- **Testing**:
  - Renders all event type variations
  - Expandable state management
  - Timeline connector rendering
  - Accessibility keyboard support

#### 3. Custom Hook

**File**: `frontend/lib/hooks/useStatusHistory.ts`
- **Purpose**: Fetch and manage status history data with pagination
- **Features**:
  - Fetches BUILD_STATUS_HISTORY_QUERY
  - Handles pagination state
  - Provides filtering logic
  - Integrates with Apollo cache
  - Automatic refetch on build mutation
  - Error handling with retry
  - Loading state tracking
- **Usage**:
```typescript
const { data, loading, error, fetchMore, refetch } = useStatusHistory(buildId);
```

**File**: `frontend/lib/hooks/useActivityFeed.ts`
- **Purpose**: Manage activity feed state and filtering
- **Features**:
  - Combines status history and other events
  - Filter state management (eventTypes, dateRange)
  - Pagination state
  - Real-time update handling
  - Cache invalidation on mutations

#### 4. Utility Functions

**File**: `frontend/lib/status-utils.ts`
- `formatStatusTransition(from, to)` - Human-readable status change description
- `getStatusColor(status)` - Consistent color mapping
- `groupEventsByDate(events)` - Group events for date sections
- `calculateStatusDuration(events, index)` - Time spent in status
- `filterEventsByType(events, types)` - Event type filtering
- `filterEventsByDateRange(events, start, end)` - Date range filtering

#### 5. Styling

**Tailwind CSS** (no new files, use existing utility classes):
- Responsive grid layout (mobile: 1 col, tablet: 2 col, desktop: horizontal flow)
- Status color scheme (green/success, red/failure, amber/warning, gray/pending, blue/progress)
- Timeline visual elements (vertical lines, connection dots)
- Cards with consistent spacing from #258 MetricCard pattern
- Dark mode support via CSS variables (prepare for #264)

#### 6. GraphQL Subscription (Optional, for Real-Time)

**File**: `frontend/lib/graphql-subscriptions.ts`
```typescript
export const BUILD_STATUS_CHANGED_SUBSCRIPTION = gql`
  subscription OnBuildStatusChanged($buildId: ID!) {
    buildStatusChanged(buildId: $buildId) {
      buildId
      newStatus
      previousStatus
      timestamp
      reason
    }
  }
`
```

#### 7. Testing

**Unit Tests** (`frontend/components/__tests__/`):

- **`status-progression.test.tsx`** (~80 lines):
  - Renders nodes for each status
  - Correct status color mapping
  - Responsive layout (mobile vs desktop)
  - Hover interaction
  - Accessibility attributes (role, aria-label)
  - Keyboard navigation (Tab through nodes)

- **`activity-feed.test.tsx`** (~120 lines):
  - Renders event list in chronological order
  - Pagination controls appear/disappear correctly
  - Filter interactions (dropdown, date picker)
  - Empty state displays when no events
  - Loading skeleton displays
  - Event details expand/collapse
  - Real-time event addition (Apollo cache update)
  - Responsive layout changes

- **`timeline-event.test.tsx`** (~80 lines):
  - Renders event type icon
  - Shows timestamp (absolute + relative)
  - Displays status badge for status changes
  - Expandable metadata section
  - Keyboard navigation
  - Accessibility labels

- **`use-status-history.test.ts`** (~100 lines):
  - Fetches with pagination
  - Refetch on cache update
  - Error handling
  - Loading state
  - Dependency changes trigger refetch

- **`use-activity-feed.test.ts`** (~100 lines):
  - Filter state management
  - Event combination logic
  - Pagination state
  - Real-time updates

- **`status-utils.test.ts`** (~150 lines):
  - formatStatusTransition cases
  - Color mapping all statuses
  - Event grouping by date
  - Duration calculation
  - Filter functions

**Integration Tests** (`frontend/components/__tests__/integration/`):
- **`status-visualization.integration.test.tsx`** (~150 lines):
  - StatusProgression + ActivityFeed together
  - Click status node opens event details
  - Filter changes update UI
  - Pagination works end-to-end
  - Real-time updates via subscription
  - Apollo cache invalidation after mutations
  - No race conditions

---

## Section 3: Component Architecture

### Component Hierarchy

```
ActivityFeed
├── LoadingSkeletonState (from #258 patterns)
├── EmptyState (existing component)
├── FilterBar
│   ├── EventTypeDropdown
│   └── DateRangeSelector
├── TimelineEvent[] (list)
│   ├── StatusBadge (for status changes)
│   └── ExpandableDetails
└── Pagination (existing component)

StatusProgression
├── StatusNode (each status)
│   ├── StatusBadge
│   └── Tooltip (timestamp, duration)
├── ConnectionArrow (between nodes)
└── ResponsiveContainer

BuildDetail (existing modal - contains both)
├── StatusProgression (top)
└── ActivityFeed (main area)
```

### Props Flow & Type Definitions

**BuildStatusHistory interface**:
```typescript
interface BuildStatusHistory {
  id: string;
  buildId: string;
  status: BuildStatus;
  previousStatus?: BuildStatus;
  timestamp: Date;
  reason?: string;
  changedBy?: string;
  duration?: number; // milliseconds in this status
}

interface BuildEvent {
  id: string;
  buildId: string;
  eventType: 'status_change' | 'test_run' | 'manual_update' | 'system_event';
  timestamp: Date;
  description: string;
  metadata?: Record<string, any>;
}

type BuildStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

interface FilterOptions {
  eventTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
```

---

## Section 4: Data Requirements

### GraphQL Query Strategy

**Option A: Backend Provides History** (Recommended)
- Backend calculates status history from audit log
- Frontend simply queries and displays
- Better for large datasets, real-time consistency

**Option B: Frontend Calculates from Builds**
- Query existing BUILDS_QUERY (already exists)
- Frontend maps status + timestamp + updatedAt to history
- Works with current schema, simpler deployment

**Recommended Approach**: Start with Option B (client-side calculation), migrate to Option A if performance becomes issue.

### Apollo Cache Strategy

**Cache Invalidation Points**:
1. User performs mutation (updateBuildStatus, createTestRun, etc.)
2. Apollo cache updates via optimisticResponse
3. Subscription or cache.evict() triggers refetch
4. Activity feed refreshes with new event

**Cache Configuration**:
```typescript
apollo.cache.modify({
  fields: {
    buildStatusHistory(existing, { DELETE }) {
      return DELETE; // Force refetch
    }
  }
});
```

### Pagination Implementation

**Strategy**: Cursor-based or offset-based pagination
- Initial load: fetch first 20 events
- "Load More" button appends next 20
- User can scroll to bottom to trigger auto-load
- `pageInfo` includes `hasNextPage`, `endCursor`

---

## Section 5: Responsive Design

### Mobile Design (<640px)

**StatusProgression**:
- Vertical layout (top to bottom)
- Status nodes stacked
- Narrow connectors
- Touch-friendly node size (44px min)
- Swipe to scroll horizontally if needed

**ActivityFeed**:
- Full-width event list
- Single column layout
- Event details collapsible
- Filter bar stacked (dropdown for event types, date range on tap)
- Pagination buttons full-width

### Tablet Design (640px-1024px)

**StatusProgression**:
- Horizontal layout with wrapping
- Nodes arranged in 2-3 rows
- Visible connectors

**ActivityFeed**:
- Increased event card width
- Filter bar side-by-side
- Compact event details

### Desktop Design (>1024px)

**StatusProgression**:
- Full horizontal flowchart
- All nodes visible in single row
- Hover details

**ActivityFeed**:
- Full width with max-width constraint
- Filter bar inline
- Event details inline expandable

### Breakpoint Strategy
```typescript
// Tailwind breakpoints
sm: 640px   // Mobile
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
```

---

## Section 6: Accessibility

### Requirements
- WCAG AA compliance (from Phase 1)
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader support (ARIA labels)
- Color contrast ≥4.5:1

### Components Accessibility

**StatusProgression**:
- `role="figure"` on container
- `aria-label` on each node: "Status: pending, 2 hours"
- Tab navigation through nodes
- Arrow keys to move focus
- Enter to toggle details

**ActivityFeed**:
- `role="feed"` on container
- `role="listitem"` on each event
- `aria-expanded` on expandable events
- Timestamp in accessible format: "May 13, 2026 at 2:30 PM"
- Event type label visible (not just icon)

**TimelineEvent**:
- Semantic structure: `<article role="listitem">`
- Heading: `<h3>Event Type</h3>`
- Status badge has aria-label if just icon
- Metadata section with aria-expanded

---

## Section 7: Testing Strategy

### Test Coverage Target: >80%

**Unit Tests** (~500 lines):
- Component rendering (props variations)
- User interactions (click, expand, filter)
- Responsive behavior
- Accessibility attributes
- Error states
- Loading states

**Integration Tests** (~150 lines):
- Components work together
- Data flow (props, callbacks)
- Apollo cache updates
- Real-time subscriptions
- Pagination
- Filter + pagination combinations

**Key Test Scenarios**:

1. **Empty State**: No events/history
   - Empty state component displays
   - Message is helpful
   - Action available (back to dashboard)

2. **Large Dataset**: 100+ events
   - Pagination works
   - Performance acceptable (<500ms)
   - Lazy load works

3. **Filters**:
   - Single filter (event type)
   - Combined filters (type + date range)
   - Filter clears work
   - Filtered count updates

4. **Real-Time Updates**:
   - New event appears without reload
   - Apollo cache updates correctly
   - UI reflects new data

5. **Mobile Responsive**:
   - Vertical layout on <640px
   - Touch-friendly targets (44px)
   - No horizontal scroll
   - Accessible on touch devices

### Testing Tools
- **Vitest**: Test runner (from Phase 1)
- **React Testing Library**: DOM queries and user interactions
- **MSW (Mock Service Worker)**: Mock GraphQL responses
- **@testing-library/user-event**: Simulate user interactions
- **axe-core**: Accessibility testing

### Test File Structure
```
frontend/components/__tests__/
├── status-progression.test.tsx
├── activity-feed.test.tsx
├── timeline-event.test.tsx
├── hooks/
│   ├── use-status-history.test.ts
│   └── use-activity-feed.test.ts
├── utils/
│   └── status-utils.test.ts
└── integration/
    └── status-visualization.integration.test.tsx
```

---

## Section 8: File Structure & Implementation Order

### New Files to Create

```
frontend/
├── components/
│   ├── StatusProgression.tsx
│   ├── ActivityFeed.tsx
│   ├── TimelineEvent.tsx
│   └── __tests__/
│       ├── status-progression.test.tsx
│       ├── activity-feed.test.tsx
│       ├── timeline-event.test.tsx
│       └── integration/
│           └── status-visualization.integration.test.tsx
├── lib/
│   ├── graphql-queries.ts (add new queries)
│   ├── status-utils.ts (new)
│   ├── hooks/
│   │   ├── useStatusHistory.ts (new)
│   │   ├── useActivityFeed.ts (new)
│   │   └── __tests__/
│   │       ├── use-status-history.test.ts
│   │       └── use-activity-feed.test.ts
│   └── __tests__/
│       └── status-utils.test.ts
```

### Files to Modify

```
frontend/
├── components/
│   └── build-detail-modal.tsx (integrate StatusProgression + ActivityFeed)
└── lib/
    ├── graphql-queries.ts (add BUILD_STATUS_HISTORY_QUERY, BUILD_EVENTS_QUERY)
    └── graphql-subscriptions.ts (optional: add BUILD_STATUS_CHANGED_SUBSCRIPTION)
```

### Implementation Order

1. **Phase 1**: Utility functions & hooks (status-utils.ts, useStatusHistory.ts)
2. **Phase 2**: Component structure (TimelineEvent.tsx, StatusProgression.tsx)
3. **Phase 3**: ActivityFeed.tsx (most complex)
4. **Phase 4**: Integration with build-detail-modal.tsx
5. **Phase 5**: Testing (unit → integration)
6. **Phase 6**: Real-time updates (subscriptions, optional)
7. **Phase 7**: Performance optimization (if needed)

---

## Section 9: API Definitions & Type Safety

### TypeScript Interfaces

```typescript
// In frontend/lib/graphql-types.ts (generated or manual)

interface BuildStatus {
  id: string;
  buildId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  previousStatus?: string;
  timestamp: Date;
  reason?: string;
  changedBy?: string;
  duration?: number;
}

interface BuildEvent {
  id: string;
  buildId: string;
  eventType: 'status_change' | 'test_run' | 'manual_update' | 'system_event' | string;
  timestamp: Date;
  description: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  buildId: string;
  eventTypes?: string[];
  dateRange?: DateRange;
  pageSize?: number;
  onEventClick?: (event: BuildEvent) => void;
}

interface StatusProgressionProps {
  buildId: string;
  statuses: BuildStatus[];
  interactive?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface TimelineEventProps {
  event: BuildEvent;
  expanded?: boolean;
  onExpand?: () => void;
  index?: number;
}
```

### GraphQL Types (from queries)

```typescript
type GetBuildStatusHistoryQuery = {
  buildStatusHistory: {
    items: BuildStatus[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string;
    };
  };
};

type GetBuildEventsQuery = {
  buildEvents: BuildEvent[];
};
```

---

## Section 10: Success Criteria Checklist

### Implementation Complete When:

- [ ] StatusProgression component renders with correct number of nodes
- [ ] StatusProgression nodes display correct colors per status
- [ ] StatusProgression responsive on mobile (vertical), desktop (horizontal)
- [ ] ActivityFeed displays events in chronological order
- [ ] ActivityFeed pagination works (load more, next/previous)
- [ ] Event type filter works
- [ ] Date range filter works
- [ ] Both filters together work
- [ ] TimelineEvent expands to show details
- [ ] TimelineEvent shows status badge for status changes
- [ ] Empty state displays when no events
- [ ] Loading skeleton displays while fetching
- [ ] Real-time update works (new event appears without reload)
- [ ] Apollo cache invalidation works after mutations
- [ ] All components responsive (mobile, tablet, desktop)
- [ ] All components accessible (WCAG AA)
- [ ] Keyboard navigation works (Tab, Enter, Arrow keys)
- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass
- [ ] No TypeScript errors (strict mode)
- [ ] No ESLint errors
- [ ] Production build passes
- [ ] Performance acceptable (<500ms load time)
- [ ] No duplicate code (reuse from #258)

### Definition of Done

✅ All success criteria checked  
✅ All tests passing  
✅ Zero TypeScript errors  
✅ Zero ESLint errors  
✅ PR reviewed and approved  
✅ Merged to main  
✅ No performance regressions  

---

## Section 11: Dependencies & Estimated Effort

### External Dependencies
- **None new** - Reuse React 19, Tailwind CSS, Apollo Client, Vitest from Phase 1

### Internal Dependencies
- **#258**: MetricCard pattern, ActivityTimeline base structure, LoadingSkeletonState
- **StatusBadge**: Existing component for status display
- **Pagination**: Existing component for feed pagination

### Effort Breakdown
- Component development: 60 min
- Hook development: 45 min
- Utility functions: 30 min
- Testing: 90 min
- Integration: 30 min
- **Total: 3-4 hours** (as estimated by Phase 2 analysis)

### Risk Factors
- Real-time updates complexity (mitigate: optional feature, implement basic first)
- Large dataset performance (mitigate: pagination, lazy loading)
- GraphQL query changes (mitigate: confirm schema first)

---

## Section 12: Next Steps

1. **Confirm GraphQL Schema**: Verify BUILDS_QUERY structure and timestamp fields
2. **Design Review**: Review StatusProgression visual design with team
3. **Start Implementation**: Begin with utility functions and hooks
4. **Daily Standups**: Coordinate with #260 team (Tab Organization)
5. **Merge Strategy**: Merge to main after 2-person code review
6. **Integration Test**: Run full test suite after merge

---

**Last Updated**: May 13, 2026  
**Ready for Implementation**: Yes  
**Blockers**: None (Issue #258 must complete first)  
**Parallel Work**: Issue #260 can run simultaneously after #258 merges  
