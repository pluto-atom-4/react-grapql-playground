# Quick Reference: useTestRun Hook & Phase 2 Issues

## Hook At a Glance

```
Hook Name: useTestRuns(buildId: string)
Location:  frontend/lib/apollo-hooks.ts:69-86
Query:     TEST_RUNS_QUERY
Returns:   { testRuns: TestRun[], loading, error, refetch }
Cache:     Automatic Apollo management
Status:    ORPHANED (not used by any components)
```

## Issue Dependencies

```
#32 (Timeout + Retry)
  ↓ (Needed for reliability)
#33 (FileUploader)
  ↓ (Enables evidence attachment)
BuildDetailModal Enhancement
  ↓ (Integrates hook)
#37 (Integration Tests)
  ↓ (Validates workflow)
Production Ready
```

## Three-Layer Integration

```
Layer 1: GraphQL Schema (backend-graphql/src/schema.graphql:99-139)
  └─ TestRun type with fileUrl, status, result fields

Layer 2: Hook (frontend/lib/apollo-hooks.ts:69-86)  
  └─ useTestRuns(buildId) fetches from backend

Layer 3: Components (frontend/components)
  ├─ BuildDetailModal (currently uses useBuildDetail)
  ├─ TestRunDetailsPanel (NEW)
  └─ TestRunHistory (NEW)
```

## Manufacturing Workflow Loop

```
Create Build → Add Parts → Run Test → Upload Evidence → Submit TestRun
                                ↓              ↓              ↓
                          Test harness    Express /upload   useSubmitTestRun()
                          generates PDF                      stores fileUrl
                          
See Test Run → Review Result → Download File → Analyze
       ↑
   useTestRuns() polls for updates
```

## Issue Impact Summary

| Issue | Priority | Component Impact | useTestRun Role |
|-------|----------|------------------|-----------------|
| #32 | CRITICAL | Global mutations | Makes submitTestRun() reliable |
| #33 | CRITICAL | BuildDetailModal | Enables fileUrl population |
| #34 | MODERATE | BuildDashboard | Scales to many test runs |
| #35 | LOW | BuildDetailModal | Better loading UX |
| #36 | MODERATE | apollo-hooks tests | Type safety for hook |
| #37 | HIGH | Full workflow | Validates useTestRun integration |

## Current vs. Phase 2

### Current State
- 🔴 Hook exists but is unused (0 consumers)
- 🔴 No file upload capability
- 🔴 No real-time updates for in-progress tests
- 🔴 Primitive prompt() UI for submission
- 🔴 No type safety tests

### Phase 2 Ideal State
- 🟢 Hook used by 3+ components
- 🟢 FileUploader integrated (drag-and-drop)
- 🟢 SSE polling for RUNNING → PASSED/FAILED
- 🟢 Rich UI for test run management
- 🟢 Comprehensive type safety tests

## Recommended Component Usage

### BuildDetailModal (Primary Consumer)
```typescript
// Current: Fetches testRuns via useBuildDetail
const { build } = useBuildDetail(buildId);
const testRuns = build.testRuns;

// Enhanced: Use standalone hook for polling
const { testRuns, refetch } = useTestRuns(buildId);
```

**Why**: Enables polling for in-progress tests without re-fetching entire Build

### New: TestRunDetailsPanel
```typescript
// Show single test run with file download
const { testRuns } = useTestRuns(buildId);
const testRun = testRuns.find(t => t.id === testRunId);
```

### New: TestRunHistory
```typescript
// Show filtered/sorted history
const { testRuns } = useTestRuns(buildId);
const filtered = testRuns.filter(t => t.status === 'PASSED');
```

## Business Logic: Why This Matters

### For Manufacturing (Boltline Domain)
- **Evidence**: Test PDFs are proof of compliance
- **Diagnostics**: Failed tests need detailed logs
- **Traceability**: Permanent Build → TestRun → Evidence link
- **Scale**: Handle 100s of test runs per build

### For Users (Technicians)
- Reliable submission on spotty shop floor WiFi (issue #32)
- Easy file upload (drag-and-drop, issue #33)
- Real-time progress (polling, SSE)
- Quick analysis (filtered history, download links)

## Real Interview Question Answers

**Q: "Why does useTestRun exist when testRuns are already in useBuildDetail?"**

A: "Separation of concerns. In production, a Build might have nested Parts, TestRuns, Metadata, and Logs. Querying all at once causes N+1 database issues. The hook lets us:
- Fetch test runs independently for polling
- Lazy-load without re-querying entire Build
- Implement per-feature caching strategies
The backend uses DataLoader to batch-load TestRuns efficiently."

**Q: "How does FileUploader (issue #33) connect to useTestRun?"**

A: "FileUploader populates the fileUrl field. Current flow: TestRun submitted with status + result. Enhanced flow: User uploads PDF → FileUploader → fileUrl → GraphQL mutation includes fileUrl → TestRun stored with evidence link. Compliance requires this."

**Q: "Why polling instead of subscriptions?"**

A: "We're using SSE (Server-Sent Events) from Express, not WebSocket subscriptions. SSE is simpler, sufficient for one-way notifications (test completed), and scales well for read-heavy dashboards. WebSocket would be overkill for this use case."

**Q: "How do you handle real-time updates?"**

A: "When a test completes on hardware, the test harness emits an SSE event to Express. Frontend listens for 'testRunCompleted' event, then refetches testRuns via useTestRuns(). Apollo cache updates, component re-renders. No polling needed after initial implementation."

## Files to Review

- **Hook**: `frontend/lib/apollo-hooks.ts:69-86`
- **Query**: `frontend/lib/graphql-queries.ts:90-97`
- **Schema**: `backend-graphql/src/schema.graphql:99-139` (TestRun type)
- **Consumer**: `frontend/components/build-detail-modal.tsx:222-257` (TestRuns section)
- **Analysis**: `docs/product-analysis/USETESTRUN-ANALYSIS.md`

## Action Items

1. [ ] Read issues #32-#37 in detail
2. [ ] Implement FileUploader (issue #33)
3. [ ] Integrate FileUploader with BuildDetailModal
4. [ ] Add useTestRuns polling for RUNNING tests
5. [ ] Create TestRunDetailsPanel component
6. [ ] Create TestRunHistory component
7. [ ] Add SSE listener for testRunCompleted event
8. [ ] Write integration tests (issue #37)

---

**Status**: Analysis Complete  
**Last Updated**: April 18, 2026  
**Audience**: Senior Full Stack Developer Interview
