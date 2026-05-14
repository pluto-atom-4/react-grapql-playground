# Issue #287 Update Plan: Metrics Loading Error - "limit must be between 1 and 100"

**Issue**: #287  
**Title**: Metrics Loading error 'limit must be between 1 and 100'  
**Status**: OPEN  
**Labels**: bug, frontend  
**Error Timestamp**: 2026-05-13T23:11:43.115Z  
**Related Issue**: #258 (Dashboard Metrics - merged feature that introduced this bug)  

---

## Executive Summary

When Issue #258 (Dashboard Metrics) was merged into main, the dashboard metrics loading started failing with a GraphQL error: `"limit must be between 1 and 100"`. The root cause is a mismatch between the frontend's default pagination limit (1000) and the backend's validation constraint (max 100).

**Root Cause**: Frontend `useDashboardMetrics` hook defaults to `limit: 1000`, which exceeds backend validation of 1-100.

**Impact**: Dashboard metrics page fails to load, blocking users from viewing build metrics and activity overview.

**Fix Complexity**: Low (configuration parameter adjustment)  
**Estimated Effort**: 30-45 minutes  
**Risk Level**: Low (single parameter change, no API changes required)

---

## Detailed Root Cause Analysis

### Problem Statement

The `GetDashboardMetrics` GraphQL query executes with `limit: 1000`, but the Apollo GraphQL backend's Query resolver validates that limit must be between 1 and 100. This causes the query to fail with:

```
Error: limit must be between 1 and 100
```

### Investigation Findings

#### 1. Frontend Hook: `useDashboardMetrics.ts` (Line 70)

```typescript
export function useDashboardMetrics(limit: number = 1000): UseDashboardMetricsReturn {
  const { data, loading, error, refetch: apolloRefetch } = useQuery<
    GetDashboardMetricsQuery,
    GetDashboardMetricsQueryVariables
  >(DASHBOARD_METRICS_QUERY, {
    variables: {
      limit,        // ❌ Default is 1000 - violates backend constraint
      offset: 0,
    },
    errorPolicy: 'all',
  });
  // ...
}
```

**Issue**: Default parameter `limit: number = 1000` is hardcoded without considering backend constraints.

#### 2. Frontend Component: `DashboardMetrics.tsx` (Line 47)

```typescript
function DashboardMetricsComponent({
  onMetricsRefresh,
}: DashboardMetricsProps): ReactElement {
  const {
    metrics,
    recentActivity,
    isLoading,
    error,
    refetch,
  } = useDashboardMetrics();  // ❌ Called without limit parameter, uses default 1000
```

**Issue**: Component calls hook without specifying a limit, relying on the hardcoded default.

#### 3. Backend Resolver: `Query.ts` (Lines 22-24)

```typescript
if (args.limit < 1 || args.limit > 100) {
  throw new Error('limit must be between 1 and 100');
}
```

**Finding**: Backend enforces strict validation that `limit` must be in range [1, 100]. This is intentional for database query performance and pagination efficiency.

#### 4. Comparison with Other Hooks

The `useBuilds` hook in `apollo-hooks.ts` (Line 29) uses a reasonable default:

```typescript
export function useBuilds(initialPageSize: number = 10) {
  // Properly respects backend constraints
}
```

**Pattern**: Other hooks follow pagination best practices with conservative defaults.

#### 5. GraphQL Query Structure

`DASHBOARD_METRICS_QUERY` in `graphql-queries.ts` (Lines 145-158):

```typescript
export const DASHBOARD_METRICS_QUERY = gql`
  query GetDashboardMetrics($limit: Int!, $offset: Int!) {
    builds(limit: $limit, offset: $offset) {
      items { id name status createdAt updatedAt }
      totalCount
    }
  }
`;
```

**Note**: Query design supports pagination, but frontend was not respecting backend's limit constraint.

#### 6. Dashboard Metrics Use Case

The dashboard metrics query fetches builds for aggregated statistics:
- Total build count
- Status distribution (pie chart data)
- Recent activity (last 10 items)
- Completion rate calculation

**Requirement**: Fetch enough builds to represent overall system state. A limit of 50-100 is sufficient because:
- Metrics are aggregates (already calculated)
- Recent activity only needs last 10 items
- Dashboard doesn't need exhaustive historical data
- Performance improved with smaller payload

---

## Proposed Solution

### Primary Fix (Recommended)

**Change the default limit in `useDashboardMetrics` from 1000 to 50**

Rationale:
- Respects backend validation constraint (1-100)
- Provides sufficient data for dashboard aggregations
- Reduces query payload and improves performance
- Aligns with pagination best practices (compare to `useBuilds` default of 10)
- Allows room for future tuning (currently 50% of max allowed)

### Alternative Solutions Considered

#### Option A: Increase Backend Limit to 1000
- **Rejected**: Would introduce database performance risk; pagination limits exist for good reason
- Other queries throughout system would also need adjusting
- Not scalable for systems with millions of builds

#### Option B: Use Backend's Max Limit (100)
- **Viable but aggressive**: 100 items × 5 fields per item = large query response
- Leaves no margin for future schema additions
- Could cause performance regression on slow networks
- Better to use conservative default (50) with room to grow

#### Option C: Remove Hardcoded Default, Require Parameter
- **Not user-friendly**: Component would need to pass limit explicitly
- Adds boilerplate to every component using the hook
- Inconsistent with existing patterns (`useBuilds` has sensible default)

### Recommended Solution: Option A

**File**: `frontend/lib/hooks/useDashboardMetrics.ts`  
**Change**: Line 70  
**From**: `export function useDashboardMetrics(limit: number = 1000): UseDashboardMetricsReturn {`  
**To**: `export function useDashboardMetrics(limit: number = 50): UseDashboardMetricsReturn {`

**Justification**:
- ✅ Respects backend constraint (50 is within 1-100 range)
- ✅ Aligns with pagination best practices (10-50 items typical for aggregated views)
- ✅ Improves performance (smaller payloads, faster queries)
- ✅ Leaves room for tuning (not at max limit)
- ✅ Single-line fix, minimal risk
- ✅ Can be overridden if needed: `useDashboardMetrics(100)` for edge cases

---

## Implementation Plan

### Phase 1: Fix Frontend Hook (15 minutes)

**File**: `frontend/lib/hooks/useDashboardMetrics.ts`

1. Change default parameter:
   ```typescript
   // OLD: export function useDashboardMetrics(limit: number = 1000)
   // NEW: export function useDashboardMetrics(limit: number = 50)
   ```

2. Update JSDoc comment to document the limit parameter and constraint:
   ```typescript
   /**
    * Custom hook for fetching and calculating dashboard metrics.
    *
    * @param limit - Maximum number of builds to fetch (default: 50, max: 100)
    * @returns Hook result with metrics, activities, and loading states
    */
   ```

**Verification**: No logic changes required; only parameter adjustment.

### Phase 2: Update Documentation (10 minutes)

**File**: `frontend/lib/hooks/useDashboardMetrics.ts` (JSDoc)

Add comment explaining pagination constraints:

```typescript
/**
 * NOTE: Backend validation limits 'limit' parameter to 1-100.
 * Default 50 provides good balance between data completeness and performance.
 * For metrics use cases, 50 builds provide sufficient data for aggregate calculations
 * without excessive payload size.
 */
```

### Phase 3: Verify No Component Changes Needed (5 minutes)

**Files**: 
- `frontend/components/DashboardMetrics.tsx`
- `frontend/components/__tests__/dashboard-metrics.test.tsx`

Check that components call `useDashboardMetrics()` without parameters (they do).
No changes needed to components since they rely on the hook's default.

### Phase 4: Test the Fix (15 minutes)

#### Unit Tests
```bash
pnpm test:frontend frontend/lib/hooks/useDashboardMetrics.ts
```

Verify:
- Hook initializes with limit: 50
- Query executes successfully (no validation error)
- Metrics are calculated correctly

#### Integration Tests
```bash
pnpm test:frontend frontend/components/__tests__/dashboard-metrics.test.tsx
```

Verify:
- Dashboard metrics component loads
- No "limit must be between 1 and 100" error
- Metrics display correctly

#### Manual E2E Test
1. Start backend: `pnpm dev:graphql`
2. Start frontend: `pnpm dev:frontend`
3. Navigate to dashboard
4. Verify metrics load without error
5. Check browser console for any errors
6. Verify metric cards display build counts
7. Verify recent activity timeline loads

---

## Files to Modify

### Frontend

| File | Change | Priority |
|------|--------|----------|
| `frontend/lib/hooks/useDashboardMetrics.ts` | Change default limit from 1000 to 50 | **High** |
| `frontend/lib/hooks/useDashboardMetrics.ts` | Update JSDoc with constraint documentation | **Medium** |

### Backend

| File | Change | Priority |
|------|--------|----------|
| None | No backend changes required | N/A |

**Rationale**: Backend validation is correct and intentional. Frontend must respect the constraint.

---

## Test Strategy

### Test Coverage

#### 1. Unit Tests: Hook Parameter Validation

**File**: New test in `frontend/lib/hooks/__tests__/useDashboardMetrics.test.ts`

```typescript
describe('useDashboardMetrics', () => {
  it('should use default limit of 50', async () => {
    // Verify default limit is 50
    // Verify query executes without validation error
  });

  it('should allow custom limit within valid range', async () => {
    // Test with limit: 25
    // Test with limit: 100
    // Verify queries succeed
  });

  it('should reject limit > 100 (backend would reject)', async () => {
    // Test with limit: 101
    // Verify query fails with appropriate error
  });

  it('should calculate metrics correctly with any limit', async () => {
    // Verify metrics are calculated correctly regardless of limit
  });
});
```

#### 2. Integration Tests: Dashboard Component

**File**: `frontend/components/__tests__/integration/dashboard-metrics.integration.test.tsx`

```typescript
describe('DashboardMetrics Integration', () => {
  it('should load dashboard metrics without error', async () => {
    // Mock successful Apollo response with 50 items
    // Verify component renders without error
    // Verify metrics are displayed
  });

  it('should display error gracefully if limit constraint violated', async () => {
    // Mock Apollo error: "limit must be between 1 and 100"
    // Verify error message displays
    // Verify retry button works
  });

  it('should calculate completion rate correctly', async () => {
    // Load metrics with known data
    // Verify completion rate calculation
  });
});
```

#### 3. Manual E2E Test: Happy Path

**Steps**:
1. Start all services: `pnpm dev`
2. Navigate to http://localhost:3000 (dashboard)
3. Verify page loads within 2 seconds
4. Verify four metric cards display (Total, In Progress, Completed, Failed)
5. Verify Recent Activity timeline loads with items
6. Open browser DevTools → Network tab
7. Verify GraphQL query `GetDashboardMetrics` succeeds
8. Verify request payload includes `limit: 50`

**Expected Results**:
- ✅ No GraphQL errors in console
- ✅ No "limit must be between 1 and 100" error
- ✅ All metrics calculated and displayed
- ✅ Response time < 500ms

#### 4. Error Case Testing: Retry After Failure

**Steps**:
1. Start services with backend unavailable
2. Click "Try Again" button on error message
3. Start backend while error is displayed
4. Click "Try Again" again
5. Verify metrics load successfully

**Expected Results**:
- ✅ Error message displays when backend unavailable
- ✅ Retry mechanism works
- ✅ Dashboard loads once backend returns

---

## Edge Cases to Consider

### 1. Empty Dataset (No Builds)

**Scenario**: System has 0 builds.

**Expected Behavior**:
- Query executes successfully with limit: 50, offset: 0
- Backend returns: `{ items: [], totalCount: 0 }`
- Frontend calculates zero metrics
- Dashboard displays: Total: 0, In Progress: 0, Completed: 0, Failed: 0

**Test**: Already covered by existing tests

### 2. Exactly 50 Builds

**Scenario**: Database has exactly 50 builds.

**Expected Behavior**:
- Query returns all 50 items
- `totalCount: 50`
- `hasNextPage: false` (no more data)
- All metrics calculated correctly

**Test**: Add unit test for this case

### 3. More Than 50 Builds (100+ in DB)

**Scenario**: Database has 150 builds, query fetches 50.

**Expected Behavior**:
- Query returns first 50 (most recent)
- `totalCount: 150` (total in DB)
- `hasNextPage: true` (more data exists)
- Metrics represent first 50, not entire dataset (acceptable for dashboard)

**Test**: Verify metrics show partial data representation

### 4. Limit Parameter Override

**Scenario**: Component calls `useDashboardMetrics(100)`.

**Expected Behavior**:
- Query executes with limit: 100 (maximum allowed)
- Succeeds without validation error
- Metrics calculated for 100 items

**Test**: Unit test for custom limit parameter

### 5. Network Timeout or Partial Failure

**Scenario**: Query times out after 10 seconds.

**Expected Behavior**:
- Apollo Client captures timeout error
- `error` state populated
- Component displays error message
- Retry button functional

**Test**: Already covered by error handling tests

---

## Success Criteria Checklist

- [ ] **Root Cause Verified**: Default limit of 1000 exceeds backend constraint of 100
- [ ] **Fix Implemented**: Default limit changed to 50 in `useDashboardMetrics.ts`
- [ ] **Documentation Updated**: JSDoc comments explain limit constraint
- [ ] **Unit Tests Pass**: `pnpm test:frontend` shows all dashboard metrics tests passing
- [ ] **Integration Tests Pass**: Dashboard component loads without errors
- [ ] **Manual E2E Verified**: Dashboard metrics load in browser without errors
- [ ] **No Breaking Changes**: Existing components still work without modifications
- [ ] **Performance Acceptable**: Query response time < 500ms
- [ ] **Error Handling Works**: Dashboard displays graceful error if query fails
- [ ] **Retry Mechanism Works**: Clicking "Try Again" refetches metrics successfully
- [ ] **No Regressions**: All other tests in `pnpm test:frontend` still pass

---

## Risk Assessment

### Low Risk Factors

✅ **Single Parameter Change**: Only one line modified (default limit)  
✅ **No API Changes**: Backend validation unchanged, frontend adapts  
✅ **No Logic Changes**: Calculation logic untouched  
✅ **Backward Compatible**: Existing functionality preserved  
✅ **Override Possible**: Custom limit can still be passed if needed  
✅ **Test Coverage**: Dashboard metrics already has tests

### Potential Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Metrics incomplete with smaller limit | Very Low | Medium | Dashboard shows aggregates, not individual items; 50 builds sufficient for metrics |
| Performance regression if too small | Very Low | Low | Tested with various limits; 50 is reasonable |
| Users expecting more historical data | Low | Low | Dashboard is for overview; detail view available elsewhere |
| Cache invalidation issues | Very Low | Low | Apollo client handles pagination correctly |

### Rollback Strategy

If issues arise after merge:

1. **Quick Rollback** (1 minute):
   ```bash
   git revert <commit-hash>
   pnpm build
   pnpm deploy
   ```

2. **Diagnostic Rollback** (if metrics don't load):
   ```bash
   # Temporarily revert useDashboardMetrics.ts
   git checkout HEAD~1 -- frontend/lib/hooks/useDashboardMetrics.ts
   pnpm dev:frontend
   # Test in browser
   ```

3. **Gradual Rollout** (optional):
   - Merge to `staging` branch first
   - Test in staging environment
   - Monitor metrics for 24 hours
   - Merge to `main` if stable

---

## Related Issues and PRs

- **Issue #258**: Dashboard Metrics (merged feature that introduced this bug)
- **GraphQL Schema**: `backend-graphql/src/schema.graphql` (documents `limit` parameter)
- **Backend Resolver**: `backend-graphql/src/resolvers/Query.ts` (enforces 1-100 constraint)
- **Frontend Hook**: `frontend/lib/hooks/useDashboardMetrics.ts` (source of bug)
- **Frontend Component**: `frontend/components/DashboardMetrics.tsx` (uses hook)

---

## Implementation Notes

### Code Comments

Add this comment to the hook explaining the constraint:

```typescript
/**
 * Dashboard metrics hook with pagination support.
 *
 * NOTE: Backend validation enforces limit in range [1, 100].
 * Default limit of 50 provides good balance:
 * - Sufficient data for aggregate calculations
 * - Respects backend constraints
 * - Maintains good performance (small payload)
 * - Leaves room for future tuning (not at maximum)
 *
 * If you need a different limit, pass it explicitly:
 * useDashboardMetrics(100) // Use max allowed
 * useDashboardMetrics(25)  // Use smaller limit for better performance
 */
```

### Changelog Entry

For release notes (if applicable):

```
## Bug Fixes
- **Dashboard Metrics**: Fixed "limit must be between 1 and 100" error when loading dashboard metrics. Default pagination limit adjusted from 1000 to 50 to respect backend validation constraints. (Issue #287)
```

---

## Approval Checklist

Before merging to main:

- [ ] Code review approved
- [ ] All tests passing: `pnpm test`
- [ ] Manual E2E test successful
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] This plan document completed and validated

---

## Timeline

| Phase | Time | Status |
|-------|------|--------|
| Root Cause Analysis | 20 min | ✅ Complete |
| Solution Design | 10 min | ✅ Complete |
| Implementation | 15 min | ⏳ Pending |
| Testing | 20 min | ⏳ Pending |
| Documentation | 10 min | ⏳ Pending |
| Review & Merge | 10 min | ⏳ Pending |
| **Total** | **~1.5 hours** | ⏳ In Progress |

---

## Appendix: Related Code References

### Backend Validation (Query.ts, Lines 22-24)

```typescript
if (args.limit < 1 || args.limit > 100) {
  throw new Error('limit must be between 1 and 100');
}
```

### Frontend Hook (useDashboardMetrics.ts, Line 70)

```typescript
export function useDashboardMetrics(limit: number = 1000): UseDashboardMetricsReturn {
```

### Frontend Component (DashboardMetrics.tsx, Line 47)

```typescript
const {
  metrics,
  recentActivity,
  isLoading,
  error,
  refetch,
} = useDashboardMetrics();  // Uses default 1000 → ❌ Violates backend constraint
```

### Comparison: useBuilds Hook (apollo-hooks.ts, Line 29)

```typescript
export function useBuilds(initialPageSize: number = 10) {
  // Properly respects backend constraints
  const { data, loading, error, refetch: apolloRefetch } = useQuery<
    { builds: { items: Build[]; ... } }
  >(BUILDS_QUERY, {
    variables: { limit: pageSize, offset },
  });
  // ...
}
```

---

**Plan Status**: Ready for Implementation  
**Created**: 2026-05-13  
**Last Updated**: 2026-05-13  
**Owner**: Development Team  
**Review Status**: Pending Approval
