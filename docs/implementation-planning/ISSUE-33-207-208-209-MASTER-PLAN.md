# Master Implementation Plan: Issues #33, #207, #208, #209
## FileUploader → SubmitTestRunForm → TestRunDetailsPanel → useTestRuns Integration

**Document Date:** April 2026  
**Target Release:** Week of April 21–25  
**Status:** Pre-Implementation Technical Specification  
**Audience:** Frontend Engineers, Tech Lead, Interview Candidates

---

## Executive Summary

This document outlines the production-ready implementation roadmap for four coordinated GitHub issues in the **Boltline manufacturing compliance testing workflow**. The feature enables technicians to:

1. **Upload test evidence files** (PDF/CSV/JSON, max 50MB) via drag-and-drop
2. **Submit test run records** with linked evidence files
3. **View test run details and download evidence** in a panel UI
4. **Poll for real-time updates** during test execution (2s interval)

The implementation follows **Apollo Client best practices** with optimistic updates, smart caching, and separation of concerns. Components are decoupled, fully typed, and thoroughly tested. This specification serves as a **complete blueprint** requiring minimal interpretation.

---

## Business Context & Domain

**Boltline** (Stoke Space manufacturing SaaS) tracks hardware **Builds**, their **Parts**, and test execution **TestRuns**. Each TestRun represents a compliance or quality check (e.g., pressure tests, material inspections) and MUST have an attached evidence file (audit trail requirement).

**Workflow:**
```
Technician views Build details
  → Clicks "Submit Test Run"
  → Opens modal with SubmitTestRunForm
  → Uploads evidence file via FileUploader
  → Fills test metadata (result, notes)
  → Submits mutation
  → Modal shows TestRuns list with polling
  → Clicks test run row → TestRunDetailsPanel opens
  → Downloads evidence file
```

**Compliance Impact:** Without fileUrl, TestRun is incomplete. Business logic enforces: `fileUrl` required for TestRun creation.

---

## Issue Dependencies & Sequencing

| Issue | Title | Type | Depends On | Status |
|-------|-------|------|-----------|--------|
| #33   | FileUploader Component | Feature | Backend upload API (exists) | Blocker for #207 |
| #207  | SubmitTestRunForm | Feature | #33 | Parent issue |
| #208  | TestRunDetailsPanel | Feature | #207 | Can parallelize with #209 |
| #209  | Polling in Modal | Enhancement | #207 | Can parallelize with #208 |

**Sequencing Strategy:**
- **Week 1:** Implement #33 (FileUploader) → test in isolation
- **Week 2:** Implement #207 (SubmitTestRunForm) → integrates FileUploader → full form flow
- **Weeks 2–3:** Parallelize #208 (TestRunDetailsPanel) and #209 (Polling logic)
- **Week 3:** Integration testing → all components wired in BuildDetailModal

---

## Architecture Overview

### Component Hierarchy

```
BuildDetailModal (container, opens modal)
├── SubmitTestRunForm (client, handles submission)
│   ├── FileUploader (#33, handles file upload)
│   └── Form fields (testResult, notes, etc.)
├── TestRuns table (displays list)
└── TestRunDetailsPanel (#208, opens on row click)
    └── File download link
```

### Data Flow

```
Frontend State (Apollo Client)
├── useTestRuns(buildId)
│   ├── Query: GetTestRuns
│   ├── Polling: refetch every 2s (if status = RUNNING)
│   └── Returns: { data, loading, error, startPolling, stopPolling }
│
├── useSubmitTestRun()
│   ├── Mutation: SubmitTestRun
│   ├── Optimistic response: { testRun: { id, status, fileUrl, ... } }
│   └── Returns: { mutate, loading, error }
│
├── useFileUpload()
│   ├── POST /upload (Express endpoint)
│   ├── Returns: { fileId, fileUrl, progress }
│   └── Error handling: validation, size, MIME type
│
└── Apollo Cache
    ├── Normalized: Build { id, testRuns: [...] }
    ├── On mutation: optimistic update + refetch
    └── Cache invalidation: automatic (Build query subscription)
```

### Apollo Client Strategy

**Query Normalization:**
- Build query embeds testRuns as nested field
- useTestRuns hook manages standalone query: `query GetTestRuns($buildId: ID!) { testRuns(buildId: $buildId) { ... } }`
- Apollo deduplicates identical queries (single cache entry)

**Optimistic Updates:**
```typescript
useMutation(SUBMIT_TEST_RUN, {
  optimisticResponse: {
    submitTestRun: {
      __typename: 'TestRun',
      id: generateId(),
      buildId,
      status: 'PENDING',
      fileUrl,
      result: formData.result,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    }
  },
  update(cache, { data }) {
    // Apollo updates normalized cache automatically
  }
});
```

**Polling Strategy:**
- useTestRuns returns `startPolling(interval)` / `stopPolling()` functions
- Modal mounts → start 2s polling if any testRun status = RUNNING
- Modal unmounts → stop polling
- Mutation completes → refetch once, restart polling loop

---

## Detailed Component Specifications

### 1. FileUploader Component (#33)

**File:** `frontend/components/file-uploader.tsx`

**Props:**
```typescript
interface FileUploaderProps {
  onUploadSuccess: (fileUrl: string, fileName: string) => void;
  onUploadError: (error: string) => void;
  onUploadProgress?: (progress: number) => void;
  disabled?: boolean;
  accept?: string; // default: '.pdf,.csv,.json'
  maxSizeMB?: number; // default: 50
}
```

**Features:**
- Drag-and-drop zone with visual feedback
- Click to browse file picker
- File validation: MIME type, size, extension
- Upload progress indicator (0–100%)
- Error display with retry button
- Loading state during upload
- Success message with file name

**State:**
```typescript
const [file, setFile] = useState<File | null>(null);
const [uploading, setUploading] = useState(false);
const [progress, setProgress] = useState(0);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
```

**Implementation Notes:**
- Use FormData to POST file to `http://localhost:5000/upload`
- Validate file type before upload (MIME type check)
- Use XMLHttpRequest to track upload progress (Fetch API doesn't natively support progress)
- Handle network errors gracefully
- Clear state on successful upload for next file

**Error Handling:**
- Invalid MIME type: "Only PDF, CSV, and JSON files are supported"
- File too large: "File exceeds 50MB limit"
- Network error: "Upload failed. Click to retry"
- Server error (5xx): "Upload service unavailable"

**Testing:**
- Unit test: render, drag file, validate error messages
- Integration test: upload real file via mock Express API
- Edge cases: multiple file drops, rapid clicks, network timeout

---

### 2. SubmitTestRunForm Component (#207)

**File:** `frontend/components/submit-test-run-form.tsx`

**Props:**
```typescript
interface SubmitTestRunFormProps {
  buildId: string;
  onSuccess?: (testRun: TestRun) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}
```

**Features:**
- Form fields:
  - TestResult dropdown: PASSED, FAILED, PENDING, SKIPPED
  - Notes textarea (optional, max 500 chars)
  - File upload via FileUploader (required)
- Submit button disabled until file uploaded + testResult selected
- Loading state during mutation
- Success toast/message
- Error alert with retry option

**State:**
```typescript
const [testResult, setTestResult] = useState<BuildStatus>('PENDING');
const [notes, setNotes] = useState('');
const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
```

**GraphQL Mutation:**
```graphql
mutation SubmitTestRun($input: SubmitTestRunInput!) {
  submitTestRun(input: $input) {
    id
    buildId
    status
    result
    fileUrl
    notes
    createdAt
    updatedAt
  }
}
```

**Input Type:**
```typescript
interface SubmitTestRunInput {
  buildId: string;
  result: BuildStatus;
  fileUrl: string;
  notes?: string;
}
```

**Implementation Flow:**
1. User fills testResult, notes
2. User uploads file via FileUploader (onUploadSuccess callback)
3. FileUploader calls onUploadSuccess → form stores fileUrl
4. Submit button enables (testResult + fileUrl present)
5. User clicks Submit
6. Mutation sent with optimistic response
7. On success: toast, call onSuccess callback (parent closes modal)
8. On error: show error alert, allow retry

**Mutation Hook Usage:**
```typescript
const [submitTestRun, { loading }] = useSubmitTestRun();

const handleSubmit = async () => {
  try {
    const result = await submitTestRun({
      variables: {
        input: {
          buildId,
          result: testResult,
          fileUrl: uploadedFileUrl!,
          notes: notes.trim() || undefined,
        }
      }
    });
    onSuccess?.(result.data.submitTestRun);
  } catch (err) {
    onError?.(err.message);
  }
};
```

**Testing:**
- Unit test: form rendering, field updates, validation
- Integration test: upload file, submit mutation, verify optimistic update
- Error test: network failure, GraphQL error, retry flow

---

### 3. TestRunDetailsPanel Component (#208)

**File:** `frontend/components/test-run-details-panel.tsx`

**Props:**
```typescript
interface TestRunDetailsPanelProps {
  testRun: TestRun;
  onClose?: () => void;
  onDelete?: (id: string) => void;
}

interface TestRun {
  id: string;
  buildId: string;
  status: BuildStatus;
  result: BuildStatus;
  fileUrl: string;
  fileName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Features:**
- Side panel or modal overlay
- Displays test run metadata:
  - Status badge (PENDING, RUNNING, COMPLETE, FAILED)
  - Result badge (color-coded)
  - Created date (formatted)
  - Notes (if present)
- File section:
  - File name with icon
  - Download button → opens fileUrl in new tab
  - File size (if available)
- Actions:
  - Close button
  - Delete button (optional, with confirmation)
- Responsive layout (desktop: right panel, mobile: full-width modal)

**Implementation Notes:**
- Fetch file metadata from backend if fileName/fileSize not in TestRun type
- Use Apollo query to fetch TestRun details if only ID provided
- Download link: `<a href={testRun.fileUrl} download>`
- Delete mutation (future enhancement): call to backend, refetch testRuns

**Styling:**
- Badge colors: PENDING → gray, RUNNING → blue, COMPLETE → green, FAILED → red
- Result colors: PASSED → green, FAILED → red, PENDING → yellow, SKIPPED → gray
- Panel width: 400px (desktop), full-width with top margin (mobile)
- Smooth slide-in animation from right

**Testing:**
- Unit test: render panel, verify all fields displayed
- Integration test: fetch TestRun query, verify data populated
- Download test: verify download link correct URL

---

### 4. useTestRuns Hook (#209)

**File:** `frontend/lib/hooks/use-test-runs.ts`

**Function Signature:**
```typescript
interface UseTestRunsResult {
  data: TestRun[] | undefined;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: (variables?: any) => Promise<ApolloQueryResult<{ testRuns: TestRun[] }>>;
  startPolling: (interval: number) => void;
  stopPolling: () => void;
  networkStatus: NetworkStatus;
}

function useTestRuns(buildId: string): UseTestRunsResult {
  // Implementation
}
```

**GraphQL Query:**
```graphql
query GetTestRuns($buildId: ID!) {
  testRuns(buildId: $buildId) {
    id
    buildId
    status
    result
    fileUrl
    notes
    createdAt
    updatedAt
  }
}
```

**Features:**
- Fetch testRuns for a given buildId
- Support polling: detect RUNNING status → auto-poll every 2s
- Expose refetch() for manual refresh (on form submission)
- Expose startPolling() / stopPolling() for caller control
- Network status indicator (loading, refetching, error)

**Implementation Strategy:**
```typescript
export function useTestRuns(buildId: string): UseTestRunsResult {
  const { data, loading, error, refetch, networkStatus, startPolling, stopPolling } =
    useQuery(GET_TEST_RUNS, {
      variables: { buildId },
      pollInterval: 0, // Manual polling control
      notifyOnNetworkStatusChange: true,
    });

  // Auto-poll if any testRun has status = RUNNING
  useEffect(() => {
    const hasRunning = data?.testRuns?.some(t => t.status === 'RUNNING');
    if (hasRunning) {
      startPolling(2000); // Poll every 2s
    } else {
      stopPolling();
    }
  }, [data?.testRuns, startPolling, stopPolling]);

  return {
    data: data?.testRuns,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
    networkStatus,
  };
}
```

**Caller Usage:**
```typescript
function BuildDetailModal({ buildId }) {
  const { data: testRuns, loading, startPolling, stopPolling, refetch } =
    useTestRuns(buildId);

  useEffect(() => {
    startPolling(2000);
    return () => stopPolling(); // Cleanup on unmount
  }, [startPolling, stopPolling]);

  const handleTestRunSubmitted = () => {
    refetch(); // Refresh list after form submission
  };

  return (
    <>
      {loading && <Spinner />}
      {testRuns?.map(tr => (
        <TestRunRow key={tr.id} testRun={tr} />
      ))}
    </>
  );
}
```

**Testing:**
- Unit test: verify query variables, return structure
- Polling test: mock data with RUNNING status, verify startPolling called
- Refetch test: verify manual refetch works

---

## Testing Strategy

### Unit Test Fixtures

**Mock Apollo Setup:**
```typescript
import { MockedProvider } from '@apollo/client/testing';

const mocks = [
  {
    request: {
      query: GET_TEST_RUNS,
      variables: { buildId: 'build-123' }
    },
    result: {
      data: {
        testRuns: [
          {
            id: 'tr-1',
            buildId: 'build-123',
            status: 'COMPLETE',
            result: 'PASSED',
            fileUrl: 'http://localhost:5000/files/file-1.pdf',
            notes: 'Test passed',
            createdAt: '2026-04-17T00:00:00Z',
            updatedAt: '2026-04-17T00:00:00Z',
          }
        ]
      }
    }
  }
];

render(
  <MockedProvider mocks={mocks}>
    <TestComponent />
  </MockedProvider>
);
```

**File Upload Mock:**
```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ fileId: 'file-1', fileUrl: 'http://localhost:5000/files/file-1.pdf' })
  })
);
```

### Test Coverage

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|-----------|------------------|-----------|
| FileUploader | ✓ Render, drag, error | ✓ Upload mock | - |
| SubmitTestRunForm | ✓ Form fields, validation | ✓ Mutation with mock | ✓ Full flow in modal |
| TestRunDetailsPanel | ✓ Display fields | ✓ Query fetching | ✓ Download link |
| useTestRuns | ✓ Hook logic | ✓ Polling behavior | ✓ Real API |

### Test Files

- `frontend/components/__tests__/file-uploader.test.tsx`
- `frontend/components/__tests__/submit-test-run-form.test.tsx`
- `frontend/components/__tests__/test-run-details-panel.test.tsx`
- `frontend/lib/hooks/__tests__/use-test-runs.test.ts`

---

## Apollo Cache Strategy

### Cache Normalization

Apollo Client normalizes nested data by ID. When SubmitTestRun mutation completes:

1. **Server returns:** `{ testRun: { id, buildId, status, fileUrl, ... } }`
2. **Apollo normalizes:**
   ```
   ROOT_QUERY: { builds: [{ id: 'build-123', ... }], testRuns: [{ id: 'tr-1', ... }] }
   TestRun:tr-1: { id: 'tr-1', status, fileUrl, ... }
   ```
3. **Automatic updates:** Any component querying testRuns receives updated data

### Optimistic Updates & Rollback

If mutation fails (network error, GraphQL error):
1. Optimistic response applied to cache immediately
2. Mutation sends to server
3. Server fails → Apollo removes optimistic data, restores previous state
4. Error callback fires → display error toast

### Cache Invalidation

After SubmitTestRun mutation:
- **Option 1 (automatic):** Apollo updates Build query's testRuns field
- **Option 2 (manual):** Call `refetch()` on useTestRuns hook
- **Option 3 (cache.modify):** Manually update cache in mutation options

**Recommendation:** Use automatic + refetch after form submission for reliability.

---

## Backend Integration Points

### Express File Upload Endpoint

**Endpoint:** `POST /upload`  
**Request:** FormData with `file` field  
**Response:**
```json
{
  "fileId": "file-12345",
  "fileUrl": "http://localhost:5000/files/file-12345.pdf",
  "fileName": "test-report.pdf",
  "fileSize": 1024000
}
```

### Apollo GraphQL Endpoints

**Query: GetTestRuns**
```graphql
query GetTestRuns($buildId: ID!) {
  testRuns(buildId: $buildId) {
    id buildId status result fileUrl notes createdAt updatedAt
  }
}
```

**Mutation: SubmitTestRun**
```graphql
mutation SubmitTestRun($input: SubmitTestRunInput!) {
  submitTestRun(input: $input) {
    id buildId status result fileUrl notes createdAt updatedAt
  }
}
```

### DataLoader Backend Pattern (N+1 Prevention)

When BuildDetailModal queries Build + nested testRuns:
- Resolver: `Build.testRuns → dataloader.load(buildId)`
- DataLoader batches: 50 builds → single DB query for all testRuns
- Without DataLoader: 1 query for builds + 50 queries for testRuns = 51 total

---

## Implementation Sequence & Milestones

### Milestone 1: FileUploader (#33) – Week 1
1. Create component skeleton: `frontend/components/file-uploader.tsx`
2. Implement drag-and-drop zone with Tailwind
3. Add file validation (MIME type, size)
4. Integrate FormData + fetch to Express upload endpoint
5. Add progress tracking with XMLHttpRequest
6. Write unit + integration tests
7. **Deliverable:** FileUploader exported, documented, tested

### Milestone 2: SubmitTestRunForm (#207) – Week 2
1. Create component skeleton: `frontend/components/submit-test-run-form.tsx`
2. Integrate FileUploader component
3. Add form fields (testResult, notes)
4. Wire mutation: useSubmitTestRun()
5. Implement optimistic response
6. Add error handling + retry UI
7. Write tests with MockedProvider
8. **Deliverable:** Form fully functional, integrates FileUploader

### Milestone 3: TestRunDetailsPanel (#208) – Week 2–3
1. Create component: `frontend/components/test-run-details-panel.tsx`
2. Display TestRun fields, file info
3. Add download link for file
4. Style as right-side panel (responsive)
5. Write tests
6. **Deliverable:** Panel displays details, download functional

### Milestone 4: useTestRuns Polling (#209) – Week 2–3
1. Implement hook in: `frontend/lib/hooks/use-test-runs.ts`
2. Detect RUNNING status → enable 2s polling
3. Expose startPolling / stopPolling / refetch
4. Write tests: polling behavior, cleanup
5. Integrate into BuildDetailModal
6. **Deliverable:** Hook exported, polling works, no memory leaks

### Milestone 5: Integration & E2E – Week 3
1. Wire all components in BuildDetailModal
2. Test full flow: open modal → submit test → see polling → view details
3. Verify cache updates, optimistic UX
4. Manual testing in browser
5. Load testing: 100+ testRuns per build
6. **Deliverable:** Full feature working end-to-end

---

## Error Handling & Edge Cases

### FileUploader
- **Network timeout:** Retry button, timeout after 30s
- **Server 500:** Show "Upload service unavailable"
- **Invalid MIME:** Reject before upload with clear message
- **Drag leave hover state:** Clear hover state on drag leave

### SubmitTestRunForm
- **Mutation timeout:** Retry button, show optimistic update reversal
- **Field validation:** testResult required, fileUrl required
- **Concurrent submissions:** Disable submit button while loading

### useTestRuns Polling
- **Polling interval mismatch:** Stop polling on error, resume on manual refetch
- **Component unmount during polling:** Cleanup with stopPolling()
- **Memory leak prevention:** useEffect cleanup function

---

## Performance Considerations

1. **Apollo Caching:** Repeated queries hit cache, no network round-trip
2. **Polling Efficiency:** Only refetch if RUNNING status present (smart conditional)
3. **Component Optimization:** Memoize FileUploader to prevent re-renders
4. **Bundle Size:** Tree-shake unused Apollo fragments
5. **File Size Limits:** 50MB max enforced client-side + server-side

---

## Future Enhancements (Out of Scope)

1. **WebSocket for Real-Time:** Replace polling with GraphQL subscriptions
2. **Batch File Upload:** Upload multiple files per TestRun
3. **File Versioning:** Upload new file for existing TestRun, maintain history
4. **Background Job Queue:** Async file processing (extract metadata, virus scan)
5. **S3 Integration:** Migrate from disk storage to cloud

---

## Acceptance Criteria

### Feature Complete (Definition of Done)
- [ ] All 4 components implemented with full TypeScript types
- [ ] All mutations optimistic updates working
- [ ] Polling detects RUNNING status and auto-starts 2s interval
- [ ] File upload validates MIME type, size, with error messages
- [ ] TestRunDetailsPanel displays all fields correctly
- [ ] Download link works for evidence files
- [ ] All unit + integration tests passing
- [ ] No console errors or warnings
- [ ] ESLint + Prettier passing
- [ ] Manual E2E test in browser: full flow working

### Code Quality
- [ ] TypeScript strict mode: zero errors
- [ ] Test coverage: >80% for components
- [ ] No N+1 queries in resolvers (DataLoader in place)
- [ ] No memory leaks (polling cleanup verified)
- [ ] Apollo cache strategy documented in code

---

## References & Appendices

### GraphQL Schema Excerpt
```graphql
type TestRun {
  id: ID!
  buildId: ID!
  status: BuildStatus!
  result: BuildStatus!
  fileUrl: String!
  notes: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum BuildStatus {
  PENDING
  RUNNING
  COMPLETE
  FAILED
}

type Query {
  testRuns(buildId: ID!): [TestRun!]!
}

type Mutation {
  submitTestRun(input: SubmitTestRunInput!): TestRun!
}

input SubmitTestRunInput {
  buildId: ID!
  result: BuildStatus!
  fileUrl: String!
  notes: String
}
```

### Environment Setup
```bash
pnpm install          # Install deps
docker-compose up -d  # Start PostgreSQL
pnpm dev              # Start all services
pnpm test             # Run tests
pnpm lint:fix         # Fix linting
```

### Key Files to Reference
- `frontend/lib/apollo-hooks.ts` — useSubmitTestRun hook signature
- `backend-graphql/src/schema.graphql` — GraphQL schema
- `backend-express/src/routes/upload.ts` — File upload endpoint
- `frontend/components/build-detail-modal.tsx` — Container component

---

**Document Status:** Ready for Implementation  
**Last Updated:** April 2026  
**Author:** GitHub Copilot CLI  
**Reviewer:** [Tech Lead Name]
