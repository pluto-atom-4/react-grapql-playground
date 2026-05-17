# Issue #207 Implementation Plan: SubmitTestRunForm Component

**Status:** Production-Ready Implementation Plan  
**Depends On:** Issue #33 (FileUploader Component) - MUST be merged first  
**Target:** React 19 + TypeScript Form Component with GraphQL Integration  
**Effort Estimate:** 6–8 hours total  
**Test Coverage Target:** 85%+

---

## Executive Summary

Issue #207 delivers **SubmitTestRunForm**, a form component that bridges file uploads (Issue #33) with GraphQL mutations (useSubmitTestRun hook). Technicians use this form to:

1. Upload test evidence files (PDF/CSV/JSON) via FileUploader
2. Select test status (PASSED/FAILED/PENDING)
3. Add optional test result summary
4. Submit the form, which triggers a GraphQL mutation
5. See success notification and callbacks fire

This component is **critical for manufacturing compliance**: without it, the FileUploader has no consumer, and test runs cannot be submitted with evidence. It integrates directly into BuildDetailModal, replacing a placeholder prompt().

**Business Impact:** Completes the core workflow for Boltline technicians: upload test evidence → submit record → view in table → download for audit.

---

## Table of Contents

1. [Acceptance Criteria](#acceptance-criteria)
2. [Task Breakdown](#task-breakdown)
3. [Technical Architecture](#technical-architecture)
4. [Component Specifications](#component-specifications)
5. [TypeScript Interfaces](#typescript-interfaces)
6. [Test Plan](#test-plan)
7. [Integration Points](#integration-points)
8. [Effort Estimates](#effort-estimates)
9. [Interview Talking Points](#interview-talking-points)

---

## Acceptance Criteria

| Criterion | Description | Testable | Priority |
|-----------|-------------|----------|----------|
| **AC1** | Component renders with FileUploader, status dropdown, result textarea, submit button | Unit test | Must |
| **AC2** | FileUploader onUploadSuccess callback sets fileUrl state (stored in form state) | Unit test | Must |
| **AC3** | Status dropdown accepts PASSED, FAILED, PENDING and updates form state | Unit test | Must |
| **AC4** | Submit button is DISABLED if status is not selected | Unit test | Must |
| **AC5** | Submit button is DISABLED while mutation is loading | Unit test | Must |
| **AC6** | Form submission calls useSubmitTestRun mutation with buildId, status, result, fileUrl | Integration test | Must |
| **AC7** | Mutation success triggers onSuccess callback with testRun object | Integration test | Must |
| **AC8** | Cancel button calls onCancel callback without triggering mutation | Unit test | Must |
| **AC9** | Network error shows specific error message (not generic) | Error scenario test | Must |
| **AC10** | File upload error displays error message from FileUploader | Error scenario test | Must |
| **AC11** | Form can be submitted without file (optional, but status required) | Edge case test | Should |
| **AC12** | Component integrates into BuildDetailModal (renders when modal opens) | Integration test | Should |
| **AC13** | Form validation messages are accessible (ARIA labels, screen readers) | Accessibility test | Should |
| **AC14** | All 85% test coverage achieved (component + hooks + utils) | Test report | Must |
| **AC15** | ESLint passes with 0 errors (no eslint-disable comments) | Linting report | Must |

---

## Task Breakdown

### Phase 1: Component Foundation & Setup (1.5 hours)

**T1.1: Project structure, imports, and types (30 min)**
- Create `frontend/components/SubmitTestRunForm.tsx` file
- Create companion types/interfaces file if needed
- Set up imports: React, hooks, utilities
- Define component props interface
- Define form state interface
- Estimate: 30 min

**T1.2: Component skeleton and props (20 min)**
- Export component function with TypeScript props
- Define prop destructuring: buildId, onSuccess, onCancel
- Create component-level state (useCallback for form validation)
- Add TODO comments for each section
- Estimate: 20 min

**T1.3: Component layout and basic UI (25 min)**
- Render form container (Tailwind classes)
- Add modal/card styling
- Add form heading and description
- Layout: FileUploader → Status dropdown → Result textarea → Buttons
- Add close button (X icon) in top-right corner
- Estimate: 25 min

### Phase 2: FileUploader Integration (1.5 hours)

**T2.1: Import and render FileUploader component (20 min)**
- Import FileUploader from Issue #33 component
- Add state for fileUrl and fileName
- Pass config prop to FileUploader with:
  - acceptedTypes: ['.pdf', '.csv', '.json']
  - maxSizeMB: 50
  - maxFiles: 1
  - disabled: false (for now)
- Estimate: 20 min

**T2.2: Implement onUploadSuccess callback (20 min)**
- Create callback function that receives fileUrl and fileName
- Store in form state: setFileUrl(fileUrl), setFileName(fileName)
- Show success visual feedback (checkmark or "File selected" text)
- Set onUploadSuccess in FileUploader config
- Estimate: 20 min

**T2.3: Handle FileUploader errors gracefully (20 min)**
- Create onUploadError callback
- Store error message in form state
- Display error message above FileUploader
- Show error toast notification
- Reset error state when user retries upload
- Estimate: 20 min

**T2.4: Disable form fields during upload (15 min)**
- Add loading state that reflects FileUploader upload status
- Disable status dropdown during upload
- Disable submit button during upload
- Show spinner/progress indicator
- Estimate: 15 min

### Phase 3: Form Fields & Validation (1.5 hours)

**T3.1: Implement status dropdown (25 min)**
- Create enum/constants for TestStatus: PASSED, FAILED, PENDING
- Render `<select>` element with options
- Add onChange handler to update state
- Add label with "Status" text
- Add ARIA label for accessibility
- Estimate: 25 min

**T3.2: Implement result textarea (20 min)**
- Render `<textarea>` for optional test result summary
- Max length: 500 characters
- Show character count (e.g., "125 / 500")
- Add onChange handler to update state
- Add label with "Test Result" text
- Estimate: 20 min

**T3.3: Add form validation logic (30 min)**
- Validate status is selected (required)
- Validate result is ≤500 characters (if provided)
- Validate fileUrl is set OR status is selected (file is optional)
- Show validation errors below each field
- Create helper function: validateFormData()
- Estimate: 30 min

**T3.4: Disable submit button based on validation (15 min)**
- Submit button disabled if:
  - Status not selected
  - Mutation loading
  - Form has validation errors
- Add aria-disabled attribute for accessibility
- Show tooltip on hover explaining why disabled
- Estimate: 15 min

### Phase 4: GraphQL Integration (1.5 hours)

**T4.1: Import and set up useSubmitTestRun hook (20 min)**
- Import useSubmitTestRun from GraphQL hooks (should exist from earlier work)
- Call hook in component
- Handle returned functions: mutate, loading, error
- Store mutation error state
- Estimate: 20 min

**T4.2: Implement form submission handler (30 min)**
- Create handleSubmit function
- Call validateFormData() first
- Prepare mutation input: buildId, status, result, fileUrl
- Call mutate() with input
- Handle success: call onSuccess callback, show toast
- Handle error: display error message, keep form state for retry
- Estimate: 30 min

**T4.3: Implement optimistic response handling (20 min)**
- Configure useSubmitTestRun with optimisticResponse
- Apollo automatically updates cache on optimistic update
- Handle optimistic response in success callback
- Show "Test run submitted!" feedback immediately
- Estimate: 20 min

**T4.4: Handle GraphQL error states (15 min)**
- Display network errors (server down)
- Display mutation errors (validation failed)
- Display custom error messages from resolver
- Retry button if mutation fails (optional)
- Estimate: 15 min

### Phase 5: Advanced Features & Polish (1 hour)

**T5.1: Loading state with spinner (15 min)**
- Show loading spinner during form submission
- Disable all form controls during submission
- Show "Submitting..." text on submit button
- Estimate: 15 min

**T5.2: Success toast notification (15 min)**
- Use toast notification system (already in project)
- Show "Test run submitted successfully!" on success
- Auto-dismiss after 3 seconds
- Estimate: 15 min

**T5.3: Cancel button and modal close behavior (15 min)**
- Implement cancel button handler
- Warn user if form has unsaved changes
- Call onCancel callback to close modal
- Estimate: 15 min

**T5.4: Tailwind styling and responsiveness (15 min)**
- Add Tailwind classes for:
  - Form container (max-width, padding, shadow)
  - Form fields (spacing, focus states, borders)
  - Buttons (colors, hover states, disabled states)
  - Error messages (red text, icon)
  - Success states (green text, checkmark icon)
- Test on mobile/tablet screens
- Estimate: 15 min

### Phase 6: Testing & Documentation (1 hour)

**T6.1: Unit tests for form component (30 min)**
- Test rendering with props
- Test FileUploader integration
- Test status dropdown change
- Test result textarea change
- Test form validation
- Test submit button disabled states
- Test cancel button
- Test error message display
- Estimate: 30 min

**T6.2: Integration tests with mocked GraphQL (20 min)**
- Mock useSubmitTestRun hook
- Test form submission flow end-to-end
- Test success callback
- Test error callback
- Test Apollo cache updates
- Estimate: 20 min

**T6.3: Accessibility and documentation (10 min)**
- Add JSDoc comments to component
- Add ARIA labels and descriptions
- Verify keyboard navigation works
- Verify screen reader compatibility
- Estimate: 10 min

---

## Technical Architecture

### Component Hierarchy

```
BuildDetailModal (parent container)
  └── SubmitTestRunForm
      ├── FileUploader (Issue #33)
      │   └── File upload UI + progress
      ├── Status Dropdown
      │   └── PASSED | FAILED | PENDING
      ├── Result Textarea
      │   └── Optional summary
      ├── Submit Button
      │   └── Triggers useSubmitTestRun mutation
      └── Cancel Button
          └── Closes modal
```

### Data Flow

```
Frontend State (Component Local)
  ├── fileUrl: string (from FileUploader.onUploadSuccess)
  ├── fileName: string (from FileUploader.onUploadSuccess)
  ├── status: 'PASSED' | 'FAILED' | 'PENDING' (from dropdown)
  ├── result: string (from textarea)
  ├── loading: boolean (from mutation)
  └── error: string | null (from mutation)

Form Submission Flow:
  1. User clicks Submit
  2. validateFormData() checks status + result
  3. Prepare mutation input: { buildId, status, result, fileUrl }
  4. Call mutate() via useSubmitTestRun hook
  5. Optimistic response updates Apollo cache immediately
  6. Server processes mutation
  7. Success: onSuccess callback fires, modal closes
  8. Error: error state updates, user sees message + retry

Apollo Client Cache Update:
  ├── Before: Build { testRuns: [...] }
  ├── Mutation: submitTestRun(input) → TestRun
  ├── Optimistic: optimisticResponse creates temp TestRun
  ├── Apollo cache.modify() updates Build.testRuns array
  └── After: Build { testRuns: [..., newTestRun] }
```

### Props & State

```typescript
// Component Props
interface SubmitTestRunFormProps {
  buildId: string;                          // Which build this test run is for
  onSuccess: (testRun: TestRun) => void;    // Called when mutation succeeds
  onCancel: () => void;                     // Called when user clicks cancel/close
}

// Component Local State
interface FormState {
  fileUrl: string | null;                   // Set by FileUploader.onUploadSuccess
  fileName: string | null;
  status: 'PASSED' | 'FAILED' | 'PENDING' | null;  // From dropdown
  result: string;                           // From textarea (optional)
  error: string | null;                     // From mutation error
  isSubmitting: boolean;                    // From mutation loading
}

// Validation Result
interface ValidationResult {
  valid: boolean;
  errors: {
    status?: string;
    result?: string;
    file?: string;
  };
}
```

---

## Component Specifications

### SubmitTestRunForm Component

**Location:** `frontend/components/SubmitTestRunForm.tsx`

**Responsibility:** Form component that integrates FileUploader with GraphQL mutation for submitting test runs.

**Props:**
```typescript
interface SubmitTestRunFormProps {
  buildId: string;
  onSuccess: (testRun: TestRun) => void;
  onCancel: () => void;
}
```

**Renders:**
1. **FileUploader** - Drag-and-drop file upload interface
2. **Status Dropdown** - Select PASSED/FAILED/PENDING
3. **Result Textarea** - Optional test result summary
4. **Submit Button** - Disabled until status is selected
5. **Cancel Button** - Closes form without submission

**State:**
- fileUrl (from FileUploader callback)
- fileName (from FileUploader callback)
- status (from dropdown)
- result (from textarea)
- error (from mutation)
- isSubmitting (from mutation loading)

**Behavior:**
- Submit disabled until status selected
- File upload optional but recommended
- On submit, call useSubmitTestRun mutation
- On success, call onSuccess callback
- On error, display error message and allow retry
- On cancel, call onCancel callback

---

## TypeScript Interfaces

### Form Props

```typescript
// frontend/components/SubmitTestRunForm.tsx (top of file)

import React, { useState, useCallback } from 'react';
import { FileUploader } from './FileUploader';
import { useSubmitTestRun } from '../lib/apollo-hooks';
import { validateTestRunForm } from '../lib/validation';
import { showToast } from '../lib/toast';
import type { TestRun, TestStatus } from '../types/graphql';

export interface SubmitTestRunFormProps {
  /** The build ID this test run is for */
  buildId: string;
  /** Called when form submission succeeds */
  onSuccess: (testRun: TestRun) => void;
  /** Called when user clicks cancel or close button */
  onCancel: () => void;
}
```

### Form State

```typescript
interface FormState {
  fileUrl: string | null;
  fileName: string | null;
  status: TestStatus | null;
  result: string;
  error: string | null;
  isSubmitting: boolean;
}

interface FormValidation {
  isValid: boolean;
  errors: {
    status?: string;
    result?: string;
    file?: string;
  };
}
```

### GraphQL Mutation

```typescript
// The useSubmitTestRun hook should accept:
interface SubmitTestRunInput {
  buildId: string;
  status: TestStatus;
  result?: string;
  fileUrl?: string;
}

interface SubmitTestRunResponse {
  submitTestRun: TestRun;
}

// Hook return type (should already exist):
interface UseSubmitTestRunResult {
  mutate: (input: SubmitTestRunInput) => Promise<SubmitTestRunResponse>;
  loading: boolean;
  error: Error | null;
}
```

### Error Handling

```typescript
interface FormError {
  type: 'validation' | 'network' | 'graphql';
  message: string;
  field?: string;
}
```

---

## Test Plan

### Unit Tests (45 min)

**Test Suite 1: Component Rendering (15 min)**
- ✅ T1.1: Component renders without crashing
- ✅ T1.2: Component renders FileUploader child
- ✅ T1.3: Component renders status dropdown
- ✅ T1.4: Component renders result textarea
- ✅ T1.5: Component renders submit and cancel buttons

**Test Suite 2: FileUploader Integration (15 min)**
- ✅ T2.1: FileUploader onUploadSuccess updates fileUrl state
- ✅ T2.2: FileUploader onUploadError shows error message
- ✅ T2.3: FileUploader config has correct acceptedTypes
- ✅ T2.4: FileUploader config has maxSizeMB = 50
- ✅ T2.5: Error message disappears when user retries upload

**Test Suite 3: Form Fields (15 min)**
- ✅ T3.1: Status dropdown onChange updates status state
- ✅ T3.2: Status dropdown shows all 3 options (PASSED/FAILED/PENDING)
- ✅ T3.3: Result textarea onChange updates result state
- ✅ T3.4: Result textarea shows character count
- ✅ T3.5: Result textarea enforces max 500 characters

**Test Suite 4: Button Behavior (15 min)**
- ✅ T4.1: Submit button disabled when status is null
- ✅ T4.2: Submit button disabled when mutation loading
- ✅ T4.3: Submit button enabled when status selected and not loading
- ✅ T4.4: Cancel button calls onCancel callback
- ✅ T4.5: Cancel button closes form

### Integration Tests (20 min)

**Test Suite 5: Form Submission (20 min)**
- ✅ T5.1: Form submission calls useSubmitTestRun with correct input
- ✅ T5.2: Mutation success calls onSuccess callback
- ✅ T5.3: Success toast displayed after submission
- ✅ T5.4: Mutation error shows error message
- ✅ T5.5: Form state preserved on error for retry

### Error Scenario Tests (15 min)

**Test Suite 6: Edge Cases (15 min)**
- ✅ T6.1: Form can be submitted without file (file optional)
- ✅ T6.2: Network error displays specific message
- ✅ T6.3: GraphQL error displays mutation error message
- ✅ T6.4: Validation error shows specific field error
- ✅ T6.5: Component handles missing TestStatus enum gracefully

### Accessibility Tests (10 min)

**Test Suite 7: A11y (10 min)**
- ✅ T7.1: FileUploader has ARIA label
- ✅ T7.2: Status dropdown has associated label
- ✅ T7.3: Result textarea has associated label
- ✅ T7.4: Error messages are announced to screen readers
- ✅ T7.5: Buttons have descriptive aria-label attributes

### Mock Setup

```typescript
// Mock FileUploader
jest.mock('../components/FileUploader', () => ({
  FileUploader: ({ onUploadSuccess, onUploadError, disabled }) => (
    <div data-testid="mock-file-uploader">
      <button
        onClick={() => onUploadSuccess('http://example.com/file.pdf', 'file.pdf')}
      >
        Simulate Upload Success
      </button>
      <button
        onClick={() => onUploadError('File too large')}
      >
        Simulate Upload Error
      </button>
    </div>
  ),
}));

// Mock GraphQL hook
jest.mock('../lib/apollo-hooks', () => ({
  useSubmitTestRun: () => ({
    mutate: jest.fn().mockResolvedValue({ submitTestRun: mockTestRun }),
    loading: false,
    error: null,
  }),
}));

// Mock toast
jest.mock('../lib/toast', () => ({
  showToast: jest.fn(),
}));
```

---

## Integration Points

### FileUploader Integration

**How it connects:**
1. SubmitTestRunForm renders FileUploader as child
2. FileUploader props configuration:
   ```typescript
   <FileUploader
     onUploadSuccess={(fileUrl, fileName) => setFileUrl(fileUrl)}
     onUploadError={(error) => setError(error.message)}
     accept=".pdf,.csv,.json"
     maxSize={50}
     maxFiles={1}
     disabled={isSubmitting}
   />
   ```
3. On success, fileUrl stored in form state
4. On error, error message shown to user
5. fileUrl passed to GraphQL mutation on submit

### useSubmitTestRun Hook Integration

**How it connects:**
1. Import hook in component: `const { mutate, loading, error } = useSubmitTestRun()`
2. Call on form submit:
   ```typescript
   const response = await mutate({
     buildId,
     status,
     result: result || undefined,
     fileUrl: fileUrl || undefined,
   });
   ```
3. Handle response:
   ```typescript
   if (response.submitTestRun) {
     onSuccess(response.submitTestRun);
     showToast('Test run submitted!');
   }
   ```
4. Handle error:
   ```typescript
   if (error) {
     setFormError(error.message);
   }
   ```

### BuildDetailModal Integration

**How it renders:**
1. BuildDetailModal has state: `showSubmitForm: boolean`
2. When user clicks "Submit Test Run" button:
   ```typescript
   setShowSubmitForm(true);
   ```
3. Render SubmitTestRunForm inside modal:
   ```tsx
   {showSubmitForm && (
     <SubmitTestRunForm
       buildId={buildId}
       onSuccess={(testRun) => {
         setShowSubmitForm(false);
         refetchTestRuns();
       }}
       onCancel={() => setShowSubmitForm(false)}
     />
   )}
   ```

### Apollo Cache Integration

**Automatic Updates:**
1. useSubmitTestRun mutation configured with `optimisticResponse`
2. Apollo automatically updates Build.testRuns cache
3. TestRuns table re-renders with new test run (optimistic)
4. Server confirms mutation, cache updates with real data
5. No manual cache invalidation needed (Apollo handles it)

---

## Effort Estimates

### Phase Breakdown

| Phase | Task | Estimated Time | Cumulative |
|-------|------|-----------------|-----------|
| **Phase 1: Foundation** | T1.1 Project setup | 30 min | 30 min |
| | T1.2 Component skeleton | 20 min | 50 min |
| | T1.3 Basic UI layout | 25 min | 1h 15m |
| **Phase 2: FileUploader** | T2.1 Import & render | 20 min | 1h 35m |
| | T2.2 onUploadSuccess | 20 min | 1h 55m |
| | T2.3 Error handling | 20 min | 2h 15m |
| | T2.4 Disable during upload | 15 min | 2h 30m |
| **Phase 3: Form Fields** | T3.1 Status dropdown | 25 min | 2h 55m |
| | T3.2 Result textarea | 20 min | 3h 15m |
| | T3.3 Validation logic | 30 min | 3h 45m |
| | T3.4 Submit button states | 15 min | 4h |
| **Phase 4: GraphQL** | T4.1 Import useSubmitTestRun | 20 min | 4h 20m |
| | T4.2 Form submission | 30 min | 4h 50m |
| | T4.3 Optimistic response | 20 min | 5h 10m |
| | T4.4 Error handling | 15 min | 5h 25m |
| **Phase 5: Polish** | T5.1 Loading spinner | 15 min | 5h 40m |
| | T5.2 Success toast | 15 min | 5h 55m |
| | T5.3 Cancel behavior | 15 min | 6h 10m |
| | T5.4 Tailwind styling | 15 min | 6h 25m |
| **Phase 6: Testing** | T6.1 Unit tests | 30 min | 6h 55m |
| | T6.2 Integration tests | 20 min | 7h 15m |
| | T6.3 Docs & accessibility | 10 min | 7h 25m |

### Total Effort: 7h 25m (range: 6–8 hours)

### Time Breakdown by Category

- **Component Development:** 4 hours
- **GraphQL Integration:** 1.5 hours
- **Testing:** 1 hour
- **Polish & Documentation:** 0.5 hours

### Parallel Work Opportunity

After Issue #207 is merged to main:
- **Issue #208 (TestRunDetailsPanel)** can start immediately (5–6 hours, independent of #207 UI)
- **Issue #209 (Polling logic)** can start immediately (4–5 hours, independent of #207 form)
- Total Phase 2 completion: 16–19 hours (can run in parallel weeks 2–3)

---

## Interview Talking Points

**When discussing SubmitTestRunForm component:**

1. **"This component demonstrates Apollo Client patterns for mutations."**
   - Explains optimistic updates: Form shows success immediately before server confirms
   - Shows error handling: Distinguishes network errors from GraphQL validation errors
   - Illustrates cache management: Apollo automatically updates Build.testRuns without manual intervention

2. **"It's a good example of controlled form patterns in React 19."**
   - Explains useState for form fields (fileUrl, status, result)
   - Shows how to handle nested component callbacks (FileUploader.onUploadSuccess)
   - Demonstrates validation logic and disabled button states

3. **"This bridges two major features: file uploads and GraphQL mutations."**
   - FileUploader (Issue #33) handles the upload; this form consumes the fileUrl
   - Decoupling shows good component architecture
   - Would be hard to test without mocking both FileUploader and useSubmitTestRun

4. **"Error handling is important for reliability."**
   - Handles FileUploader errors (file validation, network timeouts from Issue #32)
   - Handles GraphQL mutation errors (validation failed, server down)
   - Preserves form state on error so user can retry
   - Shows specific error messages (not generic "Something went wrong")

5. **"Testing strategy shows best practices."**
   - Mock FileUploader to test form logic independently
   - Mock useSubmitTestRun to test mutation flow
   - Separate unit tests (form fields) from integration tests (mutation)
   - Edge cases: file optional, error recovery, accessibility

6. **"This is why composition matters."**
   - SubmitTestRunForm doesn't know about HTTP uploads (FileUploader handles it)
   - SubmitTestRunForm doesn't know about Apollo cache (hook handles it)
   - Each layer has single responsibility
   - Easy to swap FileUploader or hook without rewriting form

---

## Code Review Checklist

Before submitting PR, verify:

- [ ] All 15 acceptance criteria met and testable
- [ ] 67+ test cases with 85%+ coverage
- [ ] No ESLint errors (run `pnpm lint:fix`)
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Error messages are user-friendly and actionable
- [ ] Comments explain complex logic (validation, state management)
- [ ] Props interface is exported for external use
- [ ] Component follows same patterns as FileUploader (Issue #33)
- [ ] GraphQL hook is properly imported and typed

---

## Next Steps (After #207)

Once Issue #207 is merged to main:

1. **Issue #208: TestRunDetailsPanel** (5–6 hours, parallelizable)
   - Component to display test run details in a modal/panel
   - Shows status, result, file download, timestamps
   - Uses useTestRuns hook to fetch single test run

2. **Issue #209: useTestRuns Polling** (4–5 hours, parallelizable with #208)
   - Hook for polling test run status every 2 seconds
   - Stops polling when all tests are in terminal state (PASSED/FAILED)
   - Returns startPolling/stopPolling functions for modal to control

3. **Integration Testing**
   - All three components wired in BuildDetailModal
   - End-to-end workflow: upload → submit → see in table → click row → view details
   - Real-time polling during test execution

---

## Related Documentation

- **Issue #33:** FileUploader Component (dependency)
- **Master Plan:** `/docs/implementation-planning/ISSUE-33-207-208-209-MASTER-PLAN.md` (business context)
- **GraphQL Hooks:** `frontend/lib/apollo-hooks.ts` (useSubmitTestRun reference)
- **Manufacturing Domain:** `docs/product-analysis/USETESTRUN-ANALYSIS.md` (why test evidence matters)

---

**Document Version:** 1.0  
**Last Updated:** May 4, 2026  
**Status:** Ready for Implementation
