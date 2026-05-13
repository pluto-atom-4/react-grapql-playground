# Issue #258: Dashboard Metrics & Stats Section - Implementation Plan

**Issue ID**: #258  
**Phase**: Phase 2 - Information Architecture  
**Created**: May 12, 2026  
**Status**: Planning Phase  

---

## Section 1: Issue Overview

### Title
#258: Dashboard Metrics & Stats Section

### Description
Part of Phase 2: Information Architecture from UX Design Review. Add metrics cards and dashboard widgets showing high-level build statistics and insights to the dashboard.

### Acceptance Criteria
- [x] Metrics cards display (Total Builds, In Progress, Completed, Failed)
- [x] Status distribution pie chart renders correctly
- [x] Recent activity timeline component working
- [x] Quick action cards link to relevant features
- [x] Metrics refresh on build mutations
- [x] Mobile responsive layout implemented
- [x] Performance optimized (<500ms load time)
- [x] Integration tests pass

### Business Value
Dashboard metrics provide at-a-glance visibility into build status and health. This addresses the UX design review requirement for information architecture and establishes UI patterns (metrics cards, activity timelines) that will be reused in Issues #259-260.

### Dependencies
- **Blocking Issues**: None (Issue #275 pre-resolved)
- **Related Issues**: 
  - #259 (Status Visualization) - depends on metrics patterns
  - #260 (Tab Organization) - may reuse metric card components
- **Phase Dependencies**: No backend/GraphQL changes needed (derives from existing BUILDS_QUERY)

### Effort Estimate
- **GitHub Issue**: 12-16 hours  
- **Phase 2 Analysis**: 4-5 hours (foundation for other work)
- **Reconciliation**: 12-16 hours likely includes responsive patterns, accessibility, and comprehensive testing. Using 4-5 hours for minimal feature scope, 6-8 hours for production quality with accessibility.

---

## Section 2: Technical Analysis

### Current State
- **Dashboard Component**: `frontend/components/build-dashboard.tsx` exists with BuildsTable
- **Metrics Query**: No GraphQL query exists for aggregated metrics yet
- **Patterns Established** (from Phase 1):
  - TypeScript with strict mode enabled
  - Apollo Client with cache management
  - Vitest + React Testing Library for tests
  - Tailwind CSS for styling
  - Accessibility requirements (aria-labels, focus management)
  - Server Components for data fetch, Client Components for interactivity

### Required Changes

#### 1. GraphQL Query Addition
**File**: `frontend/lib/graphql-queries.ts`

Add a metrics query that derives stats from existing builds:
```typescript
export const DASHBOARD_METRICS_QUERY = gql`
  query GetDashboardMetrics {
    builds(limit: 1000, offset: 0) {
      items {
        id
        status
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`
```

Note: This uses existing `BUILDS_QUERY` logic but no backend query changes needed. Frontend derives metrics from response.

#### 2. New Components
- **`frontend/components/DashboardMetrics.tsx`**: Main container component
- **`frontend/components/MetricCard.tsx`**: Reusable metric card with icon, label, value
- **`frontend/components/ActivityTimeline.tsx`**: Timeline of recent builds with status badges

#### 3. Hooks Addition
- **`frontend/lib/hooks/useDashboardMetrics.ts`**: Custom hook for metrics calculation

#### 4. Utilities Addition
- **`frontend/lib/dashboard-utils.ts`**: Helper functions for metrics aggregation, formatting

#### 5. Styling
- Tailwind CSS (no new CSS files needed, use utility classes)
- Responsive breakpoints: mobile (<640px), tablet (640px-1024px), desktop (>1024px)
- Dark mode support via CSS variables (prepared for Issue #264)

#### 6. Testing
- **`frontend/components/__tests__/dashboard-metrics.test.tsx`**: Unit tests for DashboardMetrics
- **`frontend/components/__tests__/metric-card.test.tsx`**: Unit tests for MetricCard
- **`frontend/components/__tests__/activity-timeline.test.tsx`**: Unit tests for ActivityTimeline
- **`frontend/lib/hooks/__tests__/useDashboardMetrics.test.ts`**: Hook tests

### Architecture Decisions

#### 1. Client-Side Metrics Calculation
**Decision**: Derive metrics from `BUILDS_QUERY` response, not a separate backend query.  
**Rationale**: 
- Reduces backend complexity (no new resolvers needed)
- Metrics always consistent with latest builds data
- Simpler caching strategy
- Phase 2 is UI/UX focused; Phase 3+ can optimize with dedicated backend metrics endpoint

#### 2. Real-Time Updates via Apollo Cache
**Decision**: Metrics automatically update when BUILD mutations complete.  
**Rationale**:
- Apollo cache invalidation on `createBuild`, `updateBuildStatus` mutations
- No separate subscription needed
- Consistent with Phase 1 patterns (optimistic updates, cache management)

#### 3. Component Composition
**Decision**: Separate `MetricCard` for reusability, `ActivityTimeline` for readability.  
**Rationale**:
- `MetricCard` used in dashboards, reports, detail views
- `ActivityTimeline` used in main dashboard and detail modals
- Each component independently testable

#### 4. Performance Strategy
**Decision**: Lazy load chart component if needed, memoize calculations.  
**Rationale**:
- <500ms load time requirement (very fast for 10-50 builds)
- `useMemo` for metrics calculation
- `React.memo` for MetricCard to prevent re-renders
- Pie chart library: lightweight option (e.g., recharts or simple canvas)

### New Dependencies or Imports
- **recharts** (optional, for pie chart): ~50KB gzipped
- **date-fns** (optional, for date formatting): ~13KB gzipped
- **No new packages recommended** - keep Phase 1 stack, use Tailwind for styling, native Date for formatting

### Potential Risks or Gotchas

#### Risk 1: Pie Chart Library Weight
**Issue**: Adding large chart library bloats bundle size.  
**Mitigation**: Use lightweight canvas-based chart or SVG alternative. Consider Recharts (well-maintained, tree-shakeable).  
**Fallback**: Simple CSS-based visual representation (donut chart via CSS border-radius)

#### Risk 2: Metrics Calculation Performance
**Issue**: Calculating metrics on 1000+ builds every render could be slow.  
**Mitigation**: `useMemo` with explicit dependency array. Benchmark on realistic dataset (10-100 builds).  
**Fallback**: Limit query to recent 500 builds, calculate only on-demand

#### Risk 3: Timezone Issues in Activity Timeline
**Issue**: Build timestamps might display in wrong timezone if not handled.  
**Mitigation**: Use `date-fns` for consistent formatting, always store/display UTC internally, format to user's local time in UI.

#### Risk 4: Mobile Responsive Layout
**Issue**: Card grid might break on small screens or with long metric values.  
**Mitigation**: Use Tailwind responsive classes (`md:`, `lg:`). Test on iPhone 12, iPad, desktop. Use `truncate` + tooltips for overflow.

#### Risk 5: Cache Invalidation Edge Cases
**Issue**: Metrics might not update if Apollo cache invalidation fails.  
**Mitigation**: Test mutations with network throttling. Use Apollo DevTools to inspect cache state.

---

## Section 3: Implementation Breakdown

### Task 1: GraphQL Query & Hooks Setup
**Estimated Time**: 45 minutes  
**Files to Create/Modify**:
- `frontend/lib/graphql-queries.ts` (add DASHBOARD_METRICS_QUERY)
- `frontend/lib/hooks/useDashboardMetrics.ts` (create)
- `frontend/lib/dashboard-utils.ts` (create)

**Success Criteria**:
- Query returns builds with id, status, createdAt
- Hook calculates: totalBuilds, inProgress, completed, failed counts
- Utils provide formatDate, getStatusColor, calculateMetrics functions
- TypeScript no errors

**Dependencies**: None - can start immediately

### Task 2: MetricCard Component
**Estimated Time**: 1 hour  
**Files to Create/Modify**:
- `frontend/components/MetricCard.tsx` (create)
- `frontend/components/__tests__/metric-card.test.tsx` (create)

**Success Criteria**:
- Renders icon, label, value in card layout
- Responsive on mobile (single column), tablet/desktop (grid)
- Accessibility: proper aria-labels, semantic HTML
- Unit tests: render, icon display, responsive behavior

**Dependencies**: Task 1 (needs types from dashboard-utils)

### Task 3: ActivityTimeline Component
**Estimated Time**: 1.5 hours  
**Files to Create/Modify**:
- `frontend/components/ActivityTimeline.tsx` (create)
- `frontend/components/__tests__/activity-timeline.test.tsx` (create)

**Success Criteria**:
- Renders list of recent builds (last 5-10) with status badge
- Timeline visual with connecting lines (CSS)
- Date formatting (relative: "2 hours ago" or absolute: "May 12")
- Mobile responsive (vertical timeline)
- Unit tests: render, date formatting, status display

**Dependencies**: Task 1 (needs useDashboardMetrics, date formatting)

### Task 4: DashboardMetrics Container Component
**Estimated Time**: 1.5 hours  
**Files to Create/Modify**:
- `frontend/components/DashboardMetrics.tsx` (create)
- `frontend/components/__tests__/dashboard-metrics.test.tsx` (create)

**Success Criteria**:
- Fetches builds using useDashboardMetrics hook
- Renders 4 metric cards + activity timeline
- Loading state shows skeleton
- Error state handled gracefully
- Performance: <500ms render time on 10-50 builds
- Mobile responsive layout (stack cards vertically on mobile)

**Dependencies**: Tasks 1, 2, 3

### Task 5: Integration Testing
**Estimated Time**: 1.5 hours  
**Files to Create/Modify**:
- `frontend/components/__tests__/integration/dashboard-metrics.integration.test.tsx` (create)
- Update `.copilot/agents/orchestrator.md` if new patterns needed

**Success Criteria**:
- Test metrics update on BUILD mutation
- Test Apollo cache invalidation
- Test network error handling with retry
- Test with MockedProvider
- All tests pass in parallel mode (`pnpm test -- --sequence.parallel`)

**Dependencies**: Tasks 1, 2, 3, 4

### Task 6: Responsive Design & Mobile Testing
**Estimated Time**: 1 hour  
**Files to Create/Modify**:
- `frontend/components/DashboardMetrics.tsx` (update with responsive breakpoints)
- Manual testing on Responsive Design Mode (Chrome DevTools) + actual devices if available

**Success Criteria**:
- Mobile (<640px): cards stack vertically, single column
- Tablet (640px-1024px): 2-column grid
- Desktop (>1024px): 4-column grid for metrics, timeline below
- Touch targets: 44px minimum for interactive elements
- No horizontal scroll on mobile
- Font sizes readable on mobile

**Dependencies**: Task 4

### Task 7: Performance Optimization & Documentation
**Estimated Time**: 1 hour  
**Files to Create/Modify**:
- `frontend/components/DashboardMetrics.tsx` (add React.memo, useMemo)
- `frontend/lib/hooks/useDashboardMetrics.ts` (add comments, JSDoc)
- Code comments explaining metrics calculation
- Update `docs/DESIGN.md` with metrics section

**Success Criteria**:
- Load time <500ms (benchmark with React DevTools Profiler)
- JSDoc comments on all exported functions
- No unnecessary re-renders (check with React DevTools)
- Architecture documented in DESIGN.md

**Dependencies**: Tasks 1-6

---

## Section 4: File Structure

```
frontend/
  ├── components/
  │   ├── DashboardMetrics.tsx (NEW)
  │   ├── MetricCard.tsx (NEW)
  │   ├── ActivityTimeline.tsx (NEW)
  │   ├── build-dashboard.tsx (MODIFY - integrate DashboardMetrics)
  │   └── __tests__/
  │       ├── dashboard-metrics.test.tsx (NEW)
  │       ├── metric-card.test.tsx (NEW)
  │       ├── activity-timeline.test.tsx (NEW)
  │       └── integration/
  │           └── dashboard-metrics.integration.test.tsx (NEW)
  │
  ├── lib/
  │   ├── graphql-queries.ts (MODIFY - add DASHBOARD_METRICS_QUERY)
  │   ├── dashboard-utils.ts (NEW)
  │   ├── hooks/
  │   │   ├── useDashboardMetrics.ts (NEW)
  │   │   └── __tests__/
  │   │       └── useDashboardMetrics.test.ts (NEW)
  │   └── __tests__/
  │       └── dashboard-utils.test.ts (NEW)
  │
  └── styles/ (if needed)
      └── dashboard.css (OPTIONAL - use Tailwind utilities if possible)
```

---

## Section 5: Type Definitions

### Main Types

```typescript
// frontend/lib/dashboard-utils.ts

import type { BuildStatus } from '@/lib/generated/graphql';

/**
 * Aggregated metrics for the dashboard
 */
export interface DashboardMetrics {
  totalBuilds: number;
  inProgress: number;
  completed: number;
  failed: number;
  completionRate: number; // percentage: 0-100
}

/**
 * Status distribution for pie chart
 */
export interface StatusDistribution {
  status: BuildStatus;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Activity timeline entry
 */
export interface ActivityEntry {
  id: string;
  buildId: string;
  buildName: string;
  status: BuildStatus;
  timestamp: Date;
  relativeTime: string; // "2 hours ago"
}

/**
 * Metric card props
 */
export interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  aria-label?: string;
}

/**
 * Activity timeline props
 */
export interface ActivityTimelineProps {
  entries: ActivityEntry[];
  isLoading?: boolean;
  maxItems?: number;
}

/**
 * Dashboard metrics container props
 */
export interface DashboardMetricsProps {
  onMetricsRefresh?: (metrics: DashboardMetrics) => void;
}

/**
 * Hook return type
 */
export interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics;
  statusDistribution: StatusDistribution[];
  recentActivity: ActivityEntry[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

---

## Section 6: Testing Strategy

### Unit Tests

#### MetricCard Component
- Renders with icon, label, value
- Handles optional properties (subtext, trend, onClick)
- Responsive class names applied
- Accessibility: aria-label present and correct
- Click handler called when present

#### ActivityTimeline Component
- Renders list of activity entries
- Formats relative time correctly ("2 hours ago")
- Shows status badge with correct color
- Empty state when no entries
- Truncates to maxItems prop
- Mobile responsive (single column)

#### useDashboardMetrics Hook
- Returns correct metrics object
- Calculates totalBuilds, inProgress, completed, failed
- Calculates completionRate percentage
- refetch() updates data
- Error handling works

#### dashboard-utils
- formatDate() returns correct format
- getStatusColor() maps status to Tailwind color
- calculateMetrics() returns correct structure
- calculateStatusDistribution() returns array with percentages

### Integration Tests

#### DashboardMetrics Component
- Fetches metrics on mount
- Updates when BUILD mutation completes
- Shows loading skeleton while fetching
- Error boundary catches errors gracefully
- Refetch button works
- Apollo cache updated on mutations

### Edge Cases
- Empty builds list (show 0s in metrics)
- Single build (100% in one category)
- All builds in same status
- Timezone differences (test with different locales)
- Large builds dataset (100+ builds) - performance test
- Network timeout - verify retry logic
- Very long build names (truncate in timeline)

### Test Coverage Target
- Line coverage: >80%
- Branch coverage: >75%
- All accessibility tests pass
- All responsive design tests pass

### Test Locations
```
frontend/components/__tests__/
  ├── dashboard-metrics.test.tsx
  ├── metric-card.test.tsx
  ├── activity-timeline.test.tsx
  └── integration/
      └── dashboard-metrics.integration.test.tsx

frontend/lib/__tests__/
  ├── dashboard-utils.test.ts
  └── hooks/
      └── useDashboardMetrics.test.ts
```

---

## Section 7: Timeline Estimate

### Optimistic (No Blockers, Expert Developer)
- Task 1: 30 min
- Task 2: 45 min
- Task 3: 1 hour
- Task 4: 1 hour
- Task 5: 1 hour
- Task 6: 30 min
- Task 7: 30 min
- **Total: 5.5 hours**

### Realistic (Includes Testing, Review Cycles)
- Task 1: 45 min
- Task 2: 1 hour
- Task 3: 1.5 hours
- Task 4: 1.5 hours
- Task 5: 1.5 hours
- Task 6: 1 hour
- Task 7: 1 hour
- PR review + fixes: 1 hour
- **Total: 8-9 hours**

### Pessimistic (Includes Blockers, Testing Issues)
- All tasks: as above
- Chart library decision delay: 30 min
- Performance optimization: 1 hour
- Accessibility testing issues: 1 hour
- Mobile responsive refinements: 1 hour
- PR review cycles (2-3 iterations): 2 hours
- **Total: 12-14 hours**

### Summary
- **Minimum**: 5.5 hours
- **Expected**: 8-9 hours
- **Maximum**: 12-14 hours
- **Phase 2 Baseline**: 4-5 hours (foundation work only)
- **GitHub Estimate**: 12-16 hours (comprehensive with all testing)

---

## Section 8: Success Criteria Checklist

### Functionality
- [ ] All 4 metric cards display (Total, In Progress, Completed, Failed)
- [ ] Status distribution calculated correctly
- [ ] Activity timeline shows recent builds
- [ ] Quick action cards link to relevant features (e.g., "Create Build")

### Reactivity
- [ ] Metrics refresh when BUILD mutations complete
- [ ] Apollo cache invalidation works
- [ ] No manual refetch needed

### Performance
- [ ] Load time <500ms on 10-50 builds
- [ ] No unnecessary re-renders (React DevTools check)
- [ ] useMemo optimizations in place

### Responsive Design
- [ ] Mobile (<640px): cards stack vertically
- [ ] Tablet (640px-1024px): 2-column grid
- [ ] Desktop (>1024px): 4-column grid
- [ ] Touch targets 44px minimum
- [ ] No horizontal scroll

### Accessibility
- [ ] aria-label on all interactive elements
- [ ] Proper heading hierarchy (h2 > h3)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Status badges use both color AND icon/text
- [ ] Keyboard navigation works (Tab through cards)
- [ ] Focus indicators visible

### Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Tests pass in parallel mode (`pnpm test -- --sequence.parallel`)
- [ ] Coverage >80% lines, >75% branches
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Code Quality
- [ ] JSDoc comments on all exported functions
- [ ] Props interfaces documented
- [ ] Error handling with user-friendly messages
- [ ] No console.errors in tests
- [ ] Code follows Phase 1 patterns (useCallback, explicit types)

### Documentation
- [ ] Code comments explain metric calculation
- [ ] DESIGN.md updated with metrics section
- [ ] README.md updated if necessary
- [ ] Component API documented

### Integration
- [ ] DashboardMetrics integrated into build-dashboard.tsx
- [ ] COMPONENT-REGISTRY.md updated
- [ ] No breaking changes to existing components
- [ ] GraphQL query working with Apollo client

### Git & PR
- [ ] Feature branch created: `feat/issue-258-dashboard-metrics`
- [ ] All commits reference Issue #258
- [ ] PR description includes acceptance criteria
- [ ] All PR checks pass (ESLint, TypeScript, tests)
- [ ] Code reviewed and approved by at least one reviewer

---

## Section 9: Known Risks & Mitigation

### Risk 1: Chart Library Selection
**Severity**: Medium  
**Description**: Adding a pie chart library could bloat bundle size or introduce version conflicts  
**Mitigation**: 
- Evaluate: Recharts (lightweight, tree-shakeable), Chart.js, or CSS-based donut
- Test bundle impact: `npm run build` and check bundle size
- Keep as optional feature (status distribution is "nice to have", not required)
- Fallback: Simple text representation (e.g., "PENDING: 3, RUNNING: 2") if library too heavy  

### Risk 2: Performance Degradation
**Severity**: Medium  
**Description**: Calculating metrics on 1000+ builds every render could exceed <500ms target  
**Mitigation**:
- Profile with React DevTools Profiler before/after
- Add `useMemo` with explicit dependency array
- Limit initial query to 500 recent builds
- Fallback: Server-side metrics query if client-side calculation too slow

### Risk 3: Apollo Cache Invalidation Edge Cases
**Severity**: Low-Medium  
**Description**: Metrics might not update if mutations don't trigger cache updates  
**Mitigation**:
- Test all mutation flows: createBuild, updateBuildStatus, submitTestRun
- Verify Apollo DevTools shows cache changes
- Fallback: Manual refetch button if auto-update fails

### Risk 4: Timezone Display Issues
**Severity**: Low  
**Description**: Activity timeline might display wrong times for users in different timezones  
**Mitigation**:
- Use `date-fns` for consistent formatting
- Store timestamps in UTC, format to user's local time
- Test with different browser timezone settings
- Fallback: Always show UTC if local time can't be detected

### Risk 5: Mobile Responsive Breakpoints
**Severity**: Low  
**Description**: Metrics cards might break layout on certain screen sizes  
**Mitigation**:
- Test on real devices: iPhone 12, iPad, Pixel 4, desktop
- Use Tailwind responsive classes with clear breakpoints
- Manual testing in DevTools Responsive Design Mode
- Fallback: Single-column layout on all mobile devices if grid problematic

### Risk 6: Test Flakiness with Real Timestamps
**Severity**: Low  
**Description**: Tests comparing relative times ("2 hours ago") might fail randomly  
**Mitigation**:
- Mock `Date.now()` in tests
- Use fixed test timestamps (e.g., "2026-05-12T12:00:00Z")
- Avoid time-dependent assertions

### Risk 7: Conflicting with Issue #259
**Severity**: Low  
**Description**: Issue #259 (Status Visualization) also uses metrics/dashboard patterns  
**Mitigation**:
- Refer to PHASE-2-COORDINATION-GUIDE.md for component ownership
- Ensure MetricCard and ActivityTimeline are reusable
- Coordinate with #259 developer on shared components

---

## Section 10: Implementation Order

### Recommended Sequence
1. **Day 1 (Morning)**: Tasks 1-2 (Query setup + MetricCard) - 1.5-2 hours
2. **Day 1 (Afternoon)**: Tasks 3-4 (ActivityTimeline + Container) - 2.5-3 hours
3. **Day 2 (Morning)**: Tasks 5-6 (Testing + Responsive) - 2-2.5 hours
4. **Day 2 (Afternoon)**: Task 7 (Performance + Docs) + PR Review - 1-2 hours

### Parallel Work Opportunities
- Task 2 and Task 3 can start in parallel after Task 1 done
- Task 5 (integration tests) can start after Task 4
- Task 6 (responsive testing) can run during Task 5

---

## Next Steps When Ready to Implement

1. **Create feature branch**: `git branch feat/issue-258-dashboard-metrics origin/main && git push -u origin feat/issue-258-dashboard-metrics`
2. **Review this plan with team**: Verify dependencies, timeline, component ownership
3. **Set up development environment**: `pnpm install && pnpm build && pnpm test`
4. **Start Task 1**: GraphQL query setup (no UI changes yet)
5. **Reference Phase 1 patterns**: Use existing component styles from `build-dashboard.tsx`, `StatusBadge.tsx`
6. **Create PR early**: Draft PR after Task 4 for early feedback
7. **Coordinate with #259 developer**: Share component patterns (MetricCard, ActivityTimeline)

---

## References

- **GitHub Issue**: https://github.com/pluto-atom-4/react-grapql-playground/issues/258
- **Phase 2 Plan**: `docs/implementation-planning/PHASE-2-ORCHESTRATION-ANALYSIS.md`
- **Phase 2 Coordination**: `docs/implementation-planning/PHASE-2-COORDINATION-GUIDE.md`
- **Component Registry**: `docs/implementation-planning/COMPONENT-REGISTRY.md`
- **Design Document**: `DESIGN.md` (update with metrics section)
- **Phase 1 Patterns**: `docs/PHASE-1-LESSONS-LEARNED.md`
- **Copilot Instructions**: `.copilot/copilot-instructions.md`

---

**Last Updated**: May 12, 2026  
**Status**: Ready for Implementation  
**Assigned to**: (To be assigned by Orchestrator)  
**PR Number**: (To be created by Developer)
