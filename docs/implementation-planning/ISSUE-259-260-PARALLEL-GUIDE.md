# Phase 2 Block 2: Issues #259 & #260 - Parallel Execution Guide

**Document Version**: 1.0  
**Phase**: Phase 2 - Information Architecture  
**Block**: Block 2 (Visualization & Organization)  
**Created**: May 13, 2026  
**Scope**: Coordinating parallel implementation of Issue #259 (Status Visualization) and Issue #260 (Tab Organization)  

---

## Executive Summary

### Block 2 Overview
- **Issues**: #259 (Status Visualization) + #260 (Tab Organization)
- **Total Effort**: 5-7 hours combined
- **Duration**: 1-2 days with 2 developers
- **Parallelism**: Full parallel possible (different components)
- **File Conflicts**: ZERO (different file ownership)
- **Coordination Level**: Low (minimal shared state)
- **Recommended Team**: 2 developers (1 per issue)

### Key Insight
These two issues are **completely independent** with minimal overlap. Developers can work simultaneously without conflicts, coordinating only on:
- Shared visual patterns (colors, spacing, status indicators)
- Real-time update synchronization (Apollo cache)
- Testing approach consistency

---

## Part 1: Shared Files Analysis

### File Ownership Matrix

| File Path | Issue #259 | Issue #260 | Conflict Risk | Notes |
|-----------|-----------|-----------|---------------|-------|
| `build-detail-modal.tsx` | 🔍 Read | ✏️ **Modify** | ⚠️ MEDIUM | #260 refactors; #259 just reads structure |
| `StatusBadge.tsx` | ✅ Use | ✅ Use | ✅ NONE | Both read-only; no modifications |
| `ActivityTimeline.tsx` | ✅ Base | ❌ Unused | ✅ NONE | From #258; #259 expands |
| `graphql-queries.ts` | ✏️ Add | ✏️ Add | ✅ NONE | Different queries; no overlap |
| `lib/hooks/` | ✏️ Add | ✏️ Add | ✅ NONE | Different hooks; namespaced |
| `components/__tests__/` | ✏️ Add | ✏️ Add | ✅ NONE | Different test files |

### Critical Coordination Point

**File**: `frontend/components/build-detail-modal.tsx`

| Item | Issue #259 | Issue #260 | Strategy |
|------|-----------|-----------|----------|
| **Action** | Integrate ActivityFeed | Integrate Tabs | Sequential |
| **Timeline** | After #258 merge | After #258 merge | Can start simultaneously |
| **Merge Order** | #259 PRs first | #260 PRs after | Stagger PRs by 1 hour |
| **Rebase** | Yes, before merge | Only if #259 merged first | Rebase #260 onto #259 |

**Recommendation**: Have #259 developer merge their feature first, then #260 developer rebases onto updated `main`.

### Safe Parallel Implementation

**Phase 1** (Days 1-2, parallel):
- #259 Dev: Create StatusProgression, ActivityFeed, TimelineEvent in `/components/`
- #260 Dev: Create Tabs, BuildOverviewTab, etc. in `/components/`
- Both: Add queries to `graphql-queries.ts` (different sections)
- Both: Add hooks to `lib/hooks/` (different files)
- Both: Add tests to `__tests__/` (different files)
- ✅ **NO CONFLICTS** - different file paths

**Phase 2** (Day 2, sequential):
- #259 Developer: Integrate StatusProgression + ActivityFeed into build-detail-modal.tsx
- Merge PR #259 to main
- #260 Developer: Rebase onto updated main
- #260 Developer: Integrate Tabs into build-detail-modal.tsx
- Merge PR #260 to main

**Result**: Both features working in single modal, build-detail-modal.tsx handles both integrations sequentially.

---

## Part 2: Git Branch Strategy

### Feature Branch Naming

**Issue #259**:
```
Branch: feat/issue-259-status-visualization
Pattern: feat/issue-#259-status-visualization
Clean: No special characters, lowercase, hyphens for spaces
```

**Issue #260**:
```
Branch: feat/issue-260-tab-organization
Pattern: feat/issue-#260-tab-organization
Clean: No special characters, lowercase, hyphens for spaces
```

### Branch Setup (Before Starting)

```bash
# Developer 1 (Issue #259)
git branch feat/issue-259-status-visualization origin/main
git push -u origin feat/issue-259-status-visualization
git switch feat/issue-259-status-visualization

# Developer 2 (Issue #260)
git branch feat/issue-260-tab-organization origin/main
git push -u origin feat/issue-260-tab-organization
git switch feat/issue-260-tab-organization
```

### Branch Lifecycle

**Timeline**:
1. **Day 1, 0:00-4:00**: Both work on parallel branches (no sync needed)
2. **Day 1, 4:00-5:00**: #259 creates PR, code review
3. **Day 1, 5:00-6:00**: #259 merge to main (GitHub Actions passes)
4. **Day 2, 0:00-1:00**: #260 rebase onto updated main
5. **Day 2, 1:00-2:00**: #260 create PR, code review
6. **Day 2, 2:00+**: #260 merge to main

### Rebase Strategy

**When to Rebase**:
- After #259 merged to main, before #260 creates modal integration
- ONLY if #260 modifies `build-detail-modal.tsx`
- Safe to rebase: #260's new files don't conflict

**Rebase Command** (for #260 developer):
```bash
# Pull latest main
git fetch origin main

# Rebase onto latest main
git rebase origin/main

# If conflicts in build-detail-modal.tsx:
#   - Review #259's changes
#   - Keep both features (don't overwrite)
#   - Test integration

git rebase --continue

# Force push to feature branch
git push -f origin feat/issue-260-tab-organization
```

**Conflict Resolution**:
- If both issues modify `build-detail-modal.tsx`:
  - #259 adds ActivityFeed integration
  - #260 adds Tabs refactoring
  - Manual merge: Both features need to coexist
  - **Simple**: Tabs wraps main content, ActivityFeed inside History tab

---

## Part 3: Coordination Points

### Daily Standup Topics

**For Both Developers**:
1. ✅ PR status (created, in review, merged?)
2. ⚠️ Any blockers (GraphQL queries ready? Test setup?)
3. 🎯 Today's target (merge by end of day?)
4. 🔄 Need for rebase?

**Specific Questions**:
- #259 Dev: "Are your GraphQL queries ready?"
- #260 Dev: "Does the Tabs component work in isolation?"
- Both: "Any shared component changes needed?"

### Merge Coordination

**Merge Order** (IMPORTANT):

1. **#259 Merges First**:
   - Cleaner git history
   - #260 can see patterns for modal integration
   - Less conflict potential

2. **#260 Rebases and Merges**:
   - Ensures compatibility with #259's ActivityFeed
   - If conflicts, fix in PR, not in main

### Code Review Checklist

**Common to Both**:
- [ ] TypeScript strict mode (no errors)
- [ ] ESLint passes (`pnpm lint`)
- [ ] All tests pass (`pnpm test`)
- [ ] >80% test coverage
- [ ] Accessibility (WCAG AA)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] No performance regression

**#259-Specific**:
- [ ] Status colors consistent with StatusBadge
- [ ] ActivityFeed pagination works
- [ ] Real-time updates via Apollo
- [ ] TimelineEvent has proper ARIA labels

**#260-Specific**:
- [ ] Tabs keyboard navigation works (arrows, tab, escape)
- [ ] Lazy loading doesn't break content
- [ ] Tab switching smooth
- [ ] Count badges accurate
- [ ] Mobile drawer responsive

---

## Part 4: Conflict Prevention Strategies

### Strategy 1: Component Isolation

**What It Means**:
- Each issue creates components in separate files
- Don't modify shared components (StatusBadge, Pagination, etc.)
- If needed: PR a separate small fix (get approval first)

**Benefit**: Zero file conflicts

**Implementation**:
- #259 creates: StatusProgression.tsx, ActivityFeed.tsx, TimelineEvent.tsx
- #260 creates: Tabs.tsx, BuildOverviewTab.tsx, BuildPartsTab.tsx, etc.
- Both: Add to different sections of `graphql-queries.ts`

### Strategy 2: GraphQL Query Namespacing

**What It Means**:
- #259 queries: BUILD_STATUS_HISTORY_QUERY, BUILD_EVENTS_QUERY
- #260 queries: BUILD_OVERVIEW_QUERY, BUILD_WITH_PARTS_QUERY, etc.
- Different variable names, different sections in file

**Benefit**: No merge conflicts in queries

**Implementation**:
```typescript
// frontend/lib/graphql-queries.ts

// ============================================
// Issue #259: Status Visualization
// ============================================
export const BUILD_STATUS_HISTORY_QUERY = gql`...`
export const BUILD_EVENTS_QUERY = gql`...`

// ============================================
// Issue #260: Tab Organization
// ============================================
export const BUILD_OVERVIEW_QUERY = gql`...`
export const BUILD_WITH_PARTS_QUERY = gql`...`
export const BUILD_WITH_TEST_RUNS_QUERY = gql`...`
```

### Strategy 3: Hook Separation

**What It Means**:
- #259 hooks: useStatusHistory.ts, useActivityFeed.ts
- #260 hooks: useBuildTabs.ts
- Different files, no overlap

**Benefit**: Zero hook conflicts

**Implementation**:
```
frontend/lib/hooks/
├── useStatusHistory.ts      (Issue #259)
├── useActivityFeed.ts       (Issue #259)
├── useBuildTabs.ts          (Issue #260)
└── __tests__/
    ├── use-status-history.test.ts
    ├── use-activity-feed.test.ts
    └── use-build-tabs.test.ts
```

### Strategy 4: Test File Organization

**What It Means**:
- Each component gets its own test file
- Different file names prevent merge conflicts
- Same test patterns (Vitest + React Testing Library)

**Benefit**: No test conflicts

**Implementation**:
```
frontend/components/__tests__/
├── status-progression.test.tsx
├── activity-feed.test.tsx
├── timeline-event.test.tsx
├── tabs.test.tsx
├── build-overview-tab.test.tsx
├── build-parts-tab.test.tsx
├── build-test-runs-tab.test.tsx
├── build-history-tab.test.tsx
└── integration/
    ├── status-visualization.integration.test.tsx
    └── build-modal-tabs.integration.test.tsx
```

### Strategy 5: Build-Detail-Modal Integration (Sequential)

**What It Means**:
- Only one developer modifies build-detail-modal.tsx at a time
- #259 integrates first (adds ActivityFeed area)
- #260 integrates second (refactors to Tabs)

**Why It Works**:
- Different concerns (Activity display vs Tab organization)
- #260 refactoring naturally wraps #259's component
- Minimal merge conflict potential

**Integration Pattern**:
```tsx
// After #259 merges (v1):
<BuildDetailModal>
  <BuildMetadata />
  <ActivityFeed buildId={buildId} />
</BuildDetailModal>

// After #260 merges (v2):
<BuildDetailModal>
  <Tabs tabs={[
    { id: 'overview', label: 'Overview', content: <BuildOverviewTab /> },
    { id: 'parts', label: 'Parts', content: <BuildPartsTab /> },
    { id: 'tests', label: 'Tests', content: <BuildTestRunsTab /> },
    { id: 'history', label: 'History', content: <BuildHistoryTab /> }
  ]} />
</BuildDetailModal>
```

### Strategy 6: Visual Pattern Consistency

**What It Means**:
- Both use same color scheme (from StatusBadge)
- Both use same spacing (Tailwind utilities)
- Both follow same accessibility standards

**How to Ensure**:
- Review Issue #258 styling first
- Both follow MetricCard + ActivityTimeline patterns
- Pre-call on color/spacing if custom

**Result**: Visually cohesive, no style conflicts

---

## Part 5: Real-Time Update Coordination

### Apollo Cache Synchronization

**Challenge**:
- Both features read/write same Build data
- Mutations update Apollo cache
- Both need to see fresh data

**Solution**:
- Use Apollo's built-in cache invalidation
- Both subscribe to same mutations
- Hooks handle cache refetching

**Implementation**:

```typescript
// Both hooks use same cache strategy
export const useStatusHistory = (buildId: string) => {
  const { data, refetch, loading, error } = useQuery(BUILD_STATUS_HISTORY_QUERY, {
    variables: { buildId },
    pollInterval: 5000, // Refresh every 5s
  });

  // Refetch when any build mutation completes
  useEffect(() => {
    const handleBuildUpdate = () => refetch();
    client.cache.watch({
      query: BUILD_STATUS_HISTORY_QUERY,
      variables: { buildId },
      callback: handleBuildUpdate,
    });
  }, [buildId, refetch]);

  return { data, refetch, loading, error };
};
```

**Coordination**:
- #259 Hook (useStatusHistory) refetches on mutations
- #260 Hooks (useBuildTabs) refetch on mutations
- Both see same Apollo cache data
- No race conditions (Apollo serializes updates)

---

## Part 6: Testing Coordination

### Shared Test Patterns

**Global Setup** (from Phase 1, still applies):
- `frontend/__tests__/setup/vitest-setup.ts`
- `frontend/__tests__/setup/localStorage-mock.ts`
- Both issues use same setup

**Test Structure**:
```typescript
// Both follow same pattern
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

describe('MyComponent', () => {
  let mocks: MockedResponse[];
  
  beforeEach(() => {
    mocks = [/* ... */];
  });
  
  afterEach(() => {
    jest.clearAllMocks(); // Via global setup
  });

  it('should render', () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks}>
        <MyComponent />
      </MockedProvider>
    );
    expect(getByText(/text/)).toBeInTheDocument();
  });
});
```

### Coverage Targets

**Both Issues**: >80% coverage
- Unit tests: Component rendering, props, interactions
- Integration tests: Data flow, Apollo, real-time
- Accessibility: ARIA, keyboard nav, screen reader

**Coverage by Type**:
| Type | Coverage | Components |
|------|----------|-----------|
| Unit | >85% | Component logic, hooks, utils |
| Integration | >70% | Multi-component flows |
| E2E | >60% | Full user workflows (optional) |
| Accessibility | 100% | ARIA, keyboard, focus |

### Test Execution

**Individual Tests**:
```bash
# Issue #259
pnpm test -- status-progression.test
pnpm test -- activity-feed.test
pnpm test -- use-status-history.test

# Issue #260
pnpm test -- tabs.test
pnpm test -- build-modal-tabs.integration.test
```

**Combined Tests** (after both merge):
```bash
pnpm test                    # All tests
pnpm test -- --coverage      # With coverage report
pnpm test:frontend --run     # Sequential mode
```

### Conflict Detection

**How to Catch Issues Early**:
1. Both developers run full test suite daily
2. Both run `pnpm lint` before commit
3. Both test in isolation AND in combination
4. Code review catches test incompleteness

**CI/CD**:
- GitHub Actions runs all tests on PR
- Must pass before merge
- Requires >80% coverage

---

## Part 7: Daily Workflow Template

### Developer 1 (Issue #259) - Day 1

```
9:00 AM:  Start work
          - Switch to feat/issue-259-status-visualization
          - Implement StatusProgression component
          - Write unit tests
          
11:00 AM: Standupwith Developer 2
          - "Creating StatusProgression component"
          - "Need GraphQL query for status history"
          - "Any blockers? Timeline OK?"
          
1:00 PM:  Implement ActivityFeed
          - Integrate with StatusProgression
          - Add pagination
          - Write tests
          
4:00 PM:  Create PR #259
          - Detailed description
          - Link to Issue #259
          - Request review
          
End of Day: All tests passing locally
          - pnpm test -- status*.test (✅)
          - pnpm lint (✅)
          - TypeScript check (✅)
```

### Developer 2 (Issue #260) - Day 1

```
9:00 AM:  Start work
          - Switch to feat/issue-260-tab-organization
          - Implement Tabs component
          - Write unit tests
          
11:00 AM: Standup with Developer 1
          - "Creating Tabs component"
          - "What patterns from #259?"
          - "When will you merge?"
          
1:00 PM:  Implement tab content components
          - BuildOverviewTab
          - BuildPartsTab
          - BuildTestRunsTab
          - BuildHistoryTab (with ActivityFeed from #259)
          
4:00 PM:  Implement modal integration logic
          - useBuildTabs hook
          - State management
          
End of Day: All tests passing locally
          - pnpm test -- tabs*.test (✅)
          - pnpm lint (✅)
          - Ready to rebase on #259 merge
```

### Day 2

**Morning**:
- #259 PR merges (or in review)
- #260 developer rebases if needed
- Both finish tests

**Afternoon**:
- #259 merge → main
- #260 rebase + merge → main

**End of Day**:
- Both features working
- Full test suite passing
- No regressions

---

## Part 8: Escalation & Troubleshooting

### Common Issues & Solutions

**Issue**: "We both modified build-detail-modal.tsx"
- **Solution**: See "Strategy 5: Sequential Integration"
- **Prevention**: Communicate merge timing (1 hour stagger)

**Issue**: "Tests fail after merge"
- **Solution**: 
  1. Pull latest main
  2. Run full test suite: `pnpm test`
  3. Debug failures
  4. Update PR with fixes
- **Prevention**: Test after each rebase

**Issue**: "Apollo cache shows stale data"
- **Solution**:
  1. Check if queries match
  2. Verify cache invalidation in hooks
  3. Refetch manually if needed
- **Prevention**: Use same cache strategy (from Phase 1 pattern)

**Issue**: "Accessibility tests fail"
- **Solution**:
  1. Add missing aria-label
  2. Verify keyboard navigation
  3. Check contrast ratios
  4. Re-run accessibility tests
- **Prevention**: Review WCAG AA requirements before implementation

**Issue**: "Performance regression"
- **Solution**:
  1. Profile with DevTools
  2. Check lazy loading
  3. Optimize queries
  4. Measure before/after
- **Prevention**: Test on slow network, large datasets

### Escalation Path

**Blocker?** → Tell tech lead immediately
**Urgent conflict?** → Call sync meeting (both devs + reviewer)
**Unsure about approach?** → Review implementation plan + ask reviewer

---

## Part 9: Post-Merge Integration Testing

### Integration Test Plan (After Both Merge)

```
After #259 and #260 both merged to main:

1. Full Test Suite
   pnpm test                   # 100% pass rate
   pnpm test -- --coverage     # >80% coverage
   
2. Production Build
   pnpm build                  # Passes
   
3. Manual Integration Testing
   - Open modal with #259 ActivityFeed + #260 Tabs
   - Switch tabs (Escape key closes)
   - Real-time updates work
   - Search filters work
   - Mobile layout responsive
   
4. Accessibility Check
   - Tab keyboard navigation
   - Screen reader announcement
   - Focus management
   - Color contrast
   
5. Performance Check
   - Modal opens <500ms
   - Tab switch <200ms
   - No console errors/warnings
```

### Rollback Plan

**If Issues Found**:
1. Identify problem component
2. Revert specific PR (not entire block)
3. Fix in new PR, re-test
4. Merge again

**If Major Issue**:
1. Revert entire block (both PRs)
2. Fix issues separately
3. Re-implement and re-test

---

## Part 10: Success Criteria (Block 2)

### Block 2 Complete When:

- [ ] Issue #259 PR merged to main
- [ ] Issue #260 PR merged to main
- [ ] All tests passing (100%)
- [ ] Coverage >80% both issues
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Accessibility tests passing
- [ ] Performance acceptable
- [ ] Modal integration seamless
- [ ] Real-time updates working
- [ ] Mobile responsive verified
- [ ] Code review approved both PRs
- [ ] No regressions from Phase 1

### Timeline Summary

| Day | Phase | Activity | Duration |
|-----|-------|----------|----------|
| 1 | Implementation | #259 + #260 parallel work | 4-5 hours |
| 1 | PR Creation | Both create PRs | 1 hour |
| 2 | Review | Code review feedback | 2 hours |
| 2 | Fixes | Address feedback | 1 hour |
| 2 | Merge | #259 → main → #260 rebase → main | 1 hour |
| 2 | Integration | Full integration testing | 1 hour |
| **Total** | | | **5-7 hours** |

---

## Appendix: Quick Reference

### Git Commands

```bash
# Create branches
git branch feat/issue-259-status-visualization origin/main
git branch feat/issue-260-tab-organization origin/main

# Switch branches
git switch feat/issue-259-status-visualization
git switch feat/issue-260-tab-organization

# Push branches
git push -u origin feat/issue-259-status-visualization
git push -u origin feat/issue-260-tab-organization

# Rebase (after #259 merges)
git fetch origin main
git rebase origin/main

# Push after rebase
git push -f origin feat/issue-260-tab-organization
```

### Testing Commands

```bash
# Run specific issue tests
pnpm test -- status-progression.test
pnpm test -- activity-feed.test
pnpm test -- tabs.test

# Run all tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test -- --coverage
```

### Code Quality

```bash
# Lint
pnpm lint
pnpm lint:fix

# Type check
pnpm type-check

# Build
pnpm build
```

### Useful Links

- **Issue #259 Plan**: `docs/implementation-planning/ISSUE-259-IMPLEMENTATION-PLAN.md`
- **Issue #260 Plan**: `docs/implementation-planning/ISSUE-260-IMPLEMENTATION-PLAN.md`
- **Phase 2 Analysis**: `docs/implementation-planning/PHASE-2-ORCHESTRATION-ANALYSIS.md`
- **Component Registry**: `docs/implementation-planning/COMPONENT-REGISTRY.md`
- **Copilot Instructions**: `.copilot/copilot-instructions.md`

---

**Document Status**: Ready for Implementation  
**Approved for Parallel Execution**: Yes  
**Conflict Risk Level**: Low (different components, staggered modal integration)  
**Recommended Timeline**: 1-2 days with 2 developers  
**Next Steps**: Create feature branches and begin implementation  
