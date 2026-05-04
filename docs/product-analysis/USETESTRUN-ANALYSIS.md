# Product Analysis: `useTestRun` Hook Usage in Phase 2 Issues

**Analysis Date**: April 18, 2026  
**Repository**: pluto-atom-4/react-grapql-playground  
**Scope**: GitHub Issues #32–#37 (Phase 2 Frontend Features)  
**Status**: Strategic Analysis for Interview Preparation

---

## Executive Summary

The `useTestRun` hook exists in `frontend/lib/apollo-hooks.ts` but is **not actively consumed by any frontend components**. However, issues #32–#37 define a clear path for integrating TestRun workflows into the UI. This analysis identifies:

- **3 issues directly impacting TestRun functionality** (#32, #33, #37)
- **Missing component architecture** for test run management
- **Business logic gaps** in the manufacturing workflow
- **Recommended integration pattern** for FileUploader + TestRun submission

---

## Phase 2 Issue Summary

### Issue #32: Add Timeouts & Retry Logic ✅ FOUNDATIONAL
**Impact**: Medium-to-High (affects all mutations, including test run submission)

**Details**:
- Adds 10-second timeout + exponential backoff retry logic to Apollo Client
- Enables resilient test run submission on unreliable shop floor networks
- **Applies to**: `useSubmitTestRun()`, all mutations that could hang

**Current Gap**: No specific test run handling—applies globally to all GraphQL requests.

---

### Issue #33: Add FileUploader Component ✅ CRITICAL FOR TEST RUNS
**Impact**: High (enables test result file attachment)

**Details**:
- Creates `frontend/components/file-uploader.tsx` (drag-and-drop UI)
- Integrates with `backend-express/src/routes/upload.ts` (already exists)
- File size validation (50MB), MIME type validation (PDF, CSV, JSON)
- Upload progress bar, success/error toasts
- **Integration point**: `BuildDetailModal` (where test runs are submitted)

**Current Gap**: No file upload UI—test runs can't attach test result files.

---

### Issue #34: Implement Pagination UI
**Impact**: Low-to-Medium (improves dashboard UX, not directly test run specific)

**Details**:
- Pagination for builds list (10 per page)
- Prev/next buttons, page indicator

---

### Issue #35: Add Loading Skeletons
**Impact**: Low (UX polish)

**Details**:
- Skeleton placeholders for tables during loading
- Applies to test runs table in BuildDetailModal

---

### Issue #36: Add GraphQL Code Generation Tests ✅ TYPE SAFETY
**Impact**: Medium (ensures query/mutation types match GraphQL schema)

**Details**:
- Integration tests for `useBuilds()`, `useCreateBuild()`, mutations
- **Includes**: Tests for `useSubmitTestRun()` type safety

---

### Issue #37: Add Integration Tests (Vitest + RTL) 🧪 WORKFLOW VALIDATION
**Impact**: High (validates end-to-end workflows)

**Details**:
- Integration test: Create Build → Add Parts → Submit TestRun → Update Status
- Explicitly includes test run submission in workflow test

---

## Current Implementation: `useTestRun` Hook

### Location
`frontend/lib/apollo-hooks.ts:69–86`

### Hook Signature
```typescript
export function useTestRuns(buildId: string): {
  testRuns: TestRun[];
  loading: boolean;
  error: unknown;
  refetch: () => void;
}
```

### What It Does
1. Queries GraphQL for test runs filtered by buildId
2. Returns typed TestRun array
3. Provides loading/error states and refetch function
4. Manages Apollo cache automatically

### What It DOESN'T Do (Current Gap)
- ❌ No file upload integration
- ❌ No polling/subscription for real-time updates
- ❌ No optimistic updates specific to test runs
- ❌ Not used by any components (orphaned)

---

## GraphQL Schema: TestRun Type

### TestRun Definition
```graphql
type TestRun {
  id: ID!
  buildId: ID!
  status: TestStatus!           # PENDING, RUNNING, PASSED, FAILED
  result: String                # Summary of test
  fileUrl: String               # URL to uploaded test result file
  completedAt: DateTime         # When test finished
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Related Mutations
```graphql
submitTestRun(
  buildId: ID!,
  status: TestStatus!,
  result: String,
  fileUrl: String
): TestRun!
```

---

## Boltline Manufacturing Workflow

### Real-World Context
Stoke Space manufactures rocket hardware. Manufacturing workflow:

1. **Plan**: Create a Build
2. **Assemble**: Add Parts to Build
3. **Test**: Run tests (pressure, vibration, etc.)
4. **Evidence**: Upload test result files (PDFs, CSVs)
5. **Track**: View test results and adjust Build status

### TestRun Lifecycle
```
Technician creates Build
    ↓
Technician adds Parts
    ↓
Technician triggers Test
    ↓
Test harness uploads results → Express /upload
    ↓
Frontend submits TestRun with fileUrl
    ↓
GraphQL resolver stores TestRun
    ↓
UI updates to show test result
    ↓
Technician views/downloads test evidence
```

### Why FileUploader Matters
- **Compliance**: Manufacturing requires audit trail with evidence
- **Analysis**: Engineers download test reports (PDFs, logs)
- **Diagnostics**: Failed tests need detailed logs
- **Traceability**: Link each Build to test evidence permanently

---

## Current Architecture: BuildDetailModal

### File
`frontend/components/build-detail-modal.tsx`

### Current TestRun UI (lines 222–257)
```typescript
<section className="test-runs-section">
  <h3>Test Runs ({buildData.testRuns?.length || 0})</h3>
  {buildData.testRuns && buildData.testRuns.length > 0 ? (
    <table className="test-runs-table">
      {buildData.testRuns.map((run: TestRun) => (...))}
    </table>
  ) : (
    <p className="empty-state">No test runs yet</p>
  )}
  <button onClick={handleSubmitTestRun}>Submit Test Run</button>
</section>
```

### Current Flow
1. Technician opens Build details modal
2. Sees existing test runs (from `useBuildDetail().testRuns`)
3. Clicks "Submit Test Run"
4. Prompted for test status (via `prompt()` - placeholder)
5. `useSubmitTestRun()` mutation executes
6. Apollo cache updates optimistically
7. New test run appears in table

### Current Limitations
- ❌ No file upload UI (can't attach test results)
- ❌ Primitive `prompt()` for user input
- ❌ No test result details visible (only status/result/completedAt)
- ❌ No real-time polling for in-progress tests
- ❌ No filtering/sorting of test runs

---

## Where Should `useTestRun` Be Used?

### Current Usage
**0 components** actively use `useTestRun`

### Recommended Usage: BuildDetailModal Enhancement

```typescript
import { useBuildDetail, useTestRuns, useSubmitTestRun } from '@/lib/apollo-hooks';

function BuildDetailContent({ buildId, onClose }) {
  const { build } = useBuildDetail(buildId);
  
  // Option 1: Fetch via useBuildDetail (simpler)
  // const testRuns = build.testRuns;
  
  // Option 2: Use standalone hook for polling
  const { testRuns, refetch: refetchTestRuns } = useTestRuns(buildId);
  
  // Polling for in-progress tests
  useEffect(() => {
    if (!testRuns.some(t => t.status === 'RUNNING')) return;
    
    const interval = setInterval(() => {
      refetchTestRuns();
    }, 2000);  // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [testRuns, refetchTestRuns]);
  
  return (
    <section>
      {/* Render testRuns with details */}
    </section>
  );
}
```

---

### Recommended New Components

#### 1. TestRunDetailsPanel
**Purpose**: Detailed view of single test run with file download

```typescript
import { useTestRuns } from '@/lib/apollo-hooks';
import { FileIcon, CheckIcon, XIcon } from 'lucide-react';

export function TestRunDetailsPanel({ buildId, testRunId, onClose }) {
  const { testRuns } = useTestRuns(buildId);
  const testRun = testRuns.find(t => t.id === testRunId);
  
  if (!testRun) return <p>Not found</p>;
  
  return (
    <div className="panel">
      <h3>Test Run Details</h3>
      
      <div className="status-badge">
        {testRun.status === 'PASSED' && <CheckIcon />}
        {testRun.status === 'FAILED' && <XIcon />}
        {testRun.status}
      </div>
      
      {testRun.result && <p>{testRun.result}</p>}
      
      {testRun.fileUrl && (
        <a href={testRun.fileUrl} download className="btn">
          <FileIcon /> Download Report
        </a>
      )}
      
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

#### 2. TestRunHistory
**Purpose**: Filtered history with sorting/search

```typescript
import { useTestRuns } from '@/lib/apollo-hooks';
import { useState, useMemo } from 'react';

export function TestRunHistory({ buildId }) {
  const { testRuns, loading } = useTestRuns(buildId);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
  const filtered = useMemo(() => {
    let result = testRuns;
    
    if (filter === 'passed') {
      result = result.filter(t => t.status === 'PASSED');
    } else if (filter === 'failed') {
      result = result.filter(t => t.status === 'FAILED');
    }
    
    if (sortBy === 'date') {
      result = result.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    return result;
  }, [testRuns, filter, sortBy]);
  
  return (
    <div>
      <div className="controls">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Result</th>
            <th>Date</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(run => (
            <tr key={run.id}>
              <td>{run.status}</td>
              <td>{run.result || '-'}</td>
              <td>{new Date(run.createdAt).toLocaleDateString()}</td>
              <td>
                {run.fileUrl && (
                  <a href={run.fileUrl} download>Download</a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Gap Analysis

### Gap 1: No File Upload Integration
**Current**: Hook returns test runs but doesn't handle file upload  
**Missing**: FileUploader component not integrated  
**Solution** (Issue #33): Integrate FileUploader with test run submission

---

### Gap 2: No Real-Time Updates
**Current**: No polling for in-progress tests  
**Missing**: SSE listener for `testRunCompleted` events  
**Solution**: Add polling + SSE subscription

```typescript
useEffect(() => {
  const eventSource = new EventSource('http://localhost:5000/events');
  
  eventSource.addEventListener('testRunCompleted', (e) => {
    const data = JSON.parse(e.data);
    if (data.buildId === buildId) {
      refetchTestRuns();
    }
  });
  
  return () => eventSource.close();
}, [buildId]);
```

---

### Gap 3: No Detailed Test Run UI
**Current**: Only shows status, result, completedAt in table  
**Missing**: Expandable rows, file downloads, detailed view  
**Solution**: Create TestRunDetailsPanel component

---

## Issues & Component Mapping

| Issue | Component(s) | Business Logic |
|-------|--------------|-----------------|
| #32 | All mutations | Reliable submission on unreliable networks |
| #33 | FileUploader | Attach test result evidence (compliance) |
| #34 | BuildDashboard | Handle scale (100s of test runs) |
| #35 | BuildDetailModal | Smooth loading UX |
| #36 | apollo-hooks tests | Type safety for test run queries/mutations |
| #37 | BuildDetailModal + workflow | End-to-end: create → add parts → submit test |

---

## Recommended Architecture

### Revised BuildDetailModal
```
BuildDetailModal
  ├─ BuildInfo
  ├─ PartsSection
  └─ TestRunsSection (ENHANCED)
      ├─ TestRunsList
      │   └─ TestRunRow → TestRunDetailsPanel (on click)
      ├─ SubmitTestRunForm (NEW)
      │   ├─ FileUploader (issue #33)
      │   ├─ StatusDropdown
      │   └─ ResultTextarea
      └─ TestRunHistory (NEW)
```

---

## Interview Talking Points

### Why This Hook Exists
"The `useTestRuns` hook separates concerns. A Build can have many test runs. Querying all related data in one shot causes N+1 problems. The hook lets us:

1. **Fetch test runs independently** if needed (polling)
2. **Lazy-load details** without re-querying entire Build
3. **Refetch just test runs** when tests complete (SSE)
4. **Implement different caching strategies** per use case

On the backend, DataLoader batch-loads TestRuns per build in one query."

---

### Why FileUploader Matters
"In manufacturing, test evidence is not optional. When a rocket engine passes a pressure test, we need proof—the actual PDF report.

The FileUploader + TestRun integration means:
1. Test harness exports result file
2. Technician uploads via drag-and-drop
3. File stored on Express backend
4. GraphQL mutation links fileUrl to TestRun
5. Audit trail complete—Build → TestRun → Evidence

Without this, we have status (PASSED/FAILED) but no proof."

---

### Why This Is Phase 2
"Phase 1 built foundation: Create, Add, Read. Phase 2 adds the real workflow:

- **Issue #32**: Make mutations reliable on unreliable networks
- **Issue #33**: Add file upload (manufacturing evidence)
- **Issue #34**: Handle scale (pagination)
- **Issue #35**: Improve UX (skeletons)
- **Issue #36**: Ensure type safety
- **Issue #37**: Validate end-to-end workflow

These 6 issues move the app from proof-of-concept to usable for real technicians."

---

## Summary: Current vs. Ideal

| Aspect | Current | Phase 2 Complete |
|--------|---------|------------------|
| **Test Run UI** | Basic table | Rich details + expandable + downloads |
| **File Upload** | None | FileUploader with drag-and-drop |
| **Real-Time** | Manual refresh | SSE polling for in-progress |
| **Errors** | Generic | Specific timeout + retry toasts |
| **Loading** | "Loading..." text | Skeleton placeholders |
| **Hook Usage** | 0 components | 3+ components |
| **Type Safety** | No tests | Comprehensive tests |
| **Workflows** | None | End-to-end integration test |

---

## Conclusion

The `useTestRun` hook is well-designed but **orphaned**—created but not integrated. Phase 2 provides context and components:

1. **FileUploader** enables attaching test evidence
2. **Timeouts + Retry** ensures reliable submission
3. **Integration Tests** validate the workflow
4. **Type Safety** catches bugs early
5. **Pagination + Skeletons** improve at scale

**For the interview**, demonstrate mastery by:
- Explaining manufacturing context
- Showing how hook fits into workflow
- Discussing tradeoffs (fetch via `useBuildDetail` vs standalone)
- Proposing real-time updates via SSE
- Justifying file upload for compliance

This is **realistic, end-to-end system design** mirroring production SaaS architecture.

---

**Analysis Complete**  
**Next Steps**: Implement FileUploader (issue #33) → Integrate with BuildDetailModal → Add TestRunDetailsPanel → Implement polling/SSE
