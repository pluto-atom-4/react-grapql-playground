# PR #281 Code Review: Accessibility Regression Fix Plan

**Status**: In Planning  
**Priority**: BLOCKING (Accessibility Compliance)  
**Estimated Timeline**: 1-2 hours  
**Target Date**: Before PR merge  

---

## Executive Summary

PR #281 consolidated button UI into a reusable `EmptyState` component to support loading states. However, the refactoring **accidentally removed `aria-label` attributes** from two buttons in `build-detail-modal.tsx`, creating an **accessibility regression** that violates WCAG AA compliance.

**Impact**: Screen reader users lose context for two critical actions (Add Part, Submit Test Run).

**Scope**: Two issues identified in code review:
1. **BLOCKING**: Missing ARIA labels (must fix before merge)
2. **Optional**: Loading text default fallback (nice-to-have UX improvement)

---

## Issue 1: Missing ARIA Labels (BLOCKING)

### Problem Statement

**What happened**: During the EmptyState consolidation, original `aria-label` attributes were lost:
- `"Add new part to build"` was removed from the Add Part button
- `"Submit new test run"` was removed from the Submit Test Run button

**Why it matters**:
- Screen reader users (WCAG AA requirement) now hear only generic "Add Part" or "Submit Test Run" without context
- Breaks accessibility compliance
- Regression from prior working implementation (commit 8ab97c2)

**Current state**:
```tsx
// ❌ Current: No aria-label
<button onClick={onCTA} disabled={isLoading || isDisabled} ...>
  {isLoading && loadingText ? loadingText : ctaText}
</button>
```

**Expected state**:
```tsx
// ✅ Fixed: aria-label preserved
<button 
  onClick={onCTA} 
  disabled={isLoading || isDisabled}
  aria-label="Add new part to build"  // Restored
  ...
>
  {isLoading && loadingText ? loadingText : ctaText}
</button>
```

### Root Cause

When buttons were consolidated from `build-detail-modal.tsx` into `EmptyState.tsx`:
- The props interface was extended with loading-related props (`isLoading`, `isDisabled`, `loadingText`)
- The button element was updated to support loading UI
- **Missing step**: Adding `ariaLabel` prop to interface and button element

### Acceptance Criteria

✅ `EmptyState.tsx` interface includes `ariaLabel?: string` prop  
✅ Button element renders with `aria-label={ariaLabel}` when provided  
✅ `build-detail-modal.tsx` passes restored aria-label values to both EmptyState instances  
✅ All tests pass (858 existing + new ARIA label tests)  
✅ No other props or behavior changed  
✅ Backward compatible (ariaLabel is optional)  

---

## Implementation Plan: Fix 1 - ARIA Labels

### Step 1: Update EmptyState.tsx Interface

**File**: `frontend/components/EmptyState.tsx`  
**Line**: 5-15  
**Change**: Add `ariaLabel` prop to interface

```tsx
interface EmptyStateProps {
  icon?: ReactElement;
  title: string;
  description: string;
  ctaText?: string;
  onCTA?: () => void;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  loadingText?: string;
  ariaLabel?: string;  // ← NEW: Optional aria-label for button
}
```

**Rationale**: Optional prop allows existing usages to work without changes, while new/updated usages can provide accessibility context.

---

### Step 2: Update EmptyState.tsx Function Parameters

**File**: `frontend/components/EmptyState.tsx`  
**Line**: 39-49  
**Change**: Add `ariaLabel` to destructured parameters

```tsx
export function EmptyState({
  icon,
  title,
  description,
  ctaText,
  onCTA,
  className = '',
  isLoading = false,
  isDisabled = false,
  loadingText,
  ariaLabel,  // ← NEW: Extract from props
}: EmptyStateProps): ReactElement {
```

---

### Step 3: Update EmptyState.tsx Button Rendering

**File**: `frontend/components/EmptyState.tsx`  
**Line**: 60-71  
**Change**: Add `aria-label` attribute to button element

```tsx
{ctaText && onCTA && (
  <button
    onClick={onCTA}
    disabled={isLoading || isDisabled}
    aria-label={ariaLabel}  // ← NEW: Apply aria-label if provided
    className={`bg-blue-600 hover:bg-blue-700 active:scale-95 focus:ring-2 focus:ring-blue-500 focus:outline-none text-white px-6 py-2 rounded-lg transition-all duration-150 ease-out font-medium ${
      (isLoading || isDisabled) ? 'opacity-60 cursor-not-allowed hover:bg-blue-600' : ''
    }`}
    type="button"
  >
    {isLoading && loadingText ? loadingText : ctaText}
  </button>
)}
```

**Note**: `aria-label` will be `undefined` for existing usages; this is valid HTML and will simply not render the attribute.

---

### Step 4: Update build-detail-modal.tsx - Parts Section

**File**: `frontend/components/build-detail-modal.tsx`  
**Location**: Around line 320-327 (EmptyState for Parts)  
**Change**: Add `ariaLabel` prop with restored original value

```tsx
} else (
  <EmptyState
    title="No parts yet"
    description="Add parts to your build to get started"
    ctaText="Add Part"
    onCTA={handleAddPart}
    isLoading={isAddingPart}
    loadingText="Adding Part..."
    ariaLabel="Add new part to build"  // ← RESTORED: Original aria-label value
  />
)}
```

---

### Step 5: Update build-detail-modal.tsx - Test Runs Section

**File**: `frontend/components/build-detail-modal.tsx`  
**Location**: Around line 411-419 (EmptyState for Test Runs)  
**Change**: Add `ariaLabel` prop with restored original value

```tsx
} else (
  <EmptyState
    title="No test runs yet"
    description="Submit your first test run to track results"
    ctaText="Submit Test Run"
    onCTA={handleSubmitTestRun}
    isLoading={isSubmittingTestRun}
    loadingText="Submitting Test Run..."
    ariaLabel="Submit new test run"  // ← RESTORED: Original aria-label value
  />
)}
```

---

### Change Summary Table

| File | Location | Change | Type |
|------|----------|--------|------|
| `EmptyState.tsx` | Lines 5-15 | Add `ariaLabel?: string` to interface | Interface |
| `EmptyState.tsx` | Line 48 | Add `ariaLabel` to destructured params | Parameter |
| `EmptyState.tsx` | Line 63 | Add `aria-label={ariaLabel}` to button | Rendering |
| `build-detail-modal.tsx` | Line ~326 | Add `ariaLabel="Add new part to build"` | Props |
| `build-detail-modal.tsx` | Line ~418 | Add `ariaLabel="Submit new test run"` | Props |

---

## Issue 2: Loading Text Default (Optional Enhancement)

### Problem Statement

**Current behavior**: If `isLoading={true}` but `loadingText` is undefined, button shows original `ctaText` while disabled.

**Current logic** (Line 69):
```tsx
{isLoading && loadingText ? loadingText : ctaText}
```

**Issue**: When only `isLoading={true}` is set without `loadingText`, the button displays confusing UX:
- Button is disabled (user can't click)
- Text is original action (user thinks action is still available)
- Result: Confused user wondering why button is greyed out

**Suggested fix**: Auto-generate loading text by appending "..." to `ctaText`:
```tsx
{isLoading ? (loadingText || `${ctaText}...`) : ctaText}
```

### Decision: Implement as Optional Enhancement

**Recommendation**: ✅ **IMPLEMENT** (small change, improves UX, low risk)

**Rationale**:
- Improves UX when `loadingText` prop is forgotten/omitted
- Minimal code change (1 line)
- Backward compatible (loading text behavior unchanged when `loadingText` is provided)
- Prevents confusing UX states
- Follows common UI patterns (see Material-UI, Bootstrap)

---

## Implementation Plan: Fix 2 - Loading Text Default

### Step 1: Update EmptyState.tsx Loading Text Logic

**File**: `frontend/components/EmptyState.tsx`  
**Line**: 69  
**Change**: Add fallback to auto-generate loading text

**Before**:
```tsx
{isLoading && loadingText ? loadingText : ctaText}
```

**After**:
```tsx
{isLoading ? (loadingText || `${ctaText}...`) : ctaText}
```

**Explanation**:
- If `isLoading` is true AND `loadingText` is provided → show `loadingText`
- If `isLoading` is true BUT `loadingText` is omitted → show `ctaText + "..."`
- If `isLoading` is false → show `ctaText`

### Updated JSDoc

Add note about automatic loading text fallback:

```tsx
/**
 * Empty State Component
 *
 * Reusable component for displaying empty states across the application.
 * Shows a centered placeholder with icon, title, description, and optional CTA button.
 *
 * Features:
 * - Responsive design (works on mobile, tablet, desktop)
 * - Optional icon element (pass JSX)
 * - Customizable title and description
 * - Optional call-to-action button
 * - Loading state with optional loading text (auto-generates "..." if omitted)
 * - Accessible markup with proper semantic HTML and aria-label support
 *
 * @example
 * <EmptyState
 *   icon={<DocumentIcon />}
 *   title="No builds yet"
 *   description="Create your first build to get started"
 *   ctaText="Create Build"
 *   onCTA={handleCreateBuild}
 *   ariaLabel="Create new build"
 * />
 *
 * @example
 * // With loading state (explicit loading text)
 * <EmptyState
 *   title="Loading..."
 *   ctaText="Submit"
 *   onCTA={handleSubmit}
 *   isLoading={true}
 *   loadingText="Submitting..."  // Shows "Submitting..."
 *   ariaLabel="Submit form"
 * />
 *
 * @example
 * // With loading state (auto-generated loading text)
 * <EmptyState
 *   title="Ready"
 *   ctaText="Submit"
 *   onCTA={handleSubmit}
 *   isLoading={true}
 *   // Auto-generates "Submit..." during loading
 *   ariaLabel="Submit form"
 * />
 */
```

---

## Pre-Implementation Checklist

### Files to Read
- ✅ `frontend/components/EmptyState.tsx` (current implementation)
- ✅ `frontend/components/build-detail-modal.tsx` (usages to update)
- ✅ `frontend/components/__tests__/EmptyState.test.tsx` (existing tests)
- ✅ `frontend/components/__tests__/build-detail-modal.test.tsx` (integration tests)
- ✅ `frontend/vitest.config.ts` (test configuration)

### Current Test Baseline
```
✅ Test Files: 44 passed
✅ Tests: 858 passed
✅ Errors: 1 unhandled (unrelated to EmptyState)
```

### Current Implementation Details

**EmptyState.tsx**:
- Lines 5-15: Props interface
- Lines 39-49: Function signature
- Lines 60-71: Button rendering with loading logic
- JSDoc documentation: Lines 17-38

**build-detail-modal.tsx**:
- Lines 320-327: EmptyState for Parts (add ariaLabel)
- Lines 411-419: EmptyState for Test Runs (add ariaLabel)

### Existing Test Coverage
EmptyState has comprehensive test coverage in `EmptyState.test.tsx`:
- ✅ Basic rendering (title, description, icon)
- ✅ Button rendering and callbacks
- ✅ Loading state (5 dedicated tests)
- ✅ Disabled state
- ✅ Styling and classes
- ✅ Semantic HTML
- Total: 20 existing tests

---

## Testing Strategy

### 1. Unit Tests for ARIA Labels

**File**: `frontend/components/__tests__/EmptyState.test.tsx`  
**Add**: 3 new tests in new `describe('ARIA label accessibility')` block

```typescript
describe('ARIA label accessibility', () => {
  it('renders button without aria-label when ariaLabel prop is not provided', () => {
    render(
      <EmptyState
        title="Test"
        description="Test"
        ctaText="Action"
        onCTA={() => {}}
      />
    );
    const button = screen.getByRole('button', { name: /action/i });
    expect(button).not.toHaveAttribute('aria-label');
  });

  it('renders button with aria-label when ariaLabel prop is provided', () => {
    render(
      <EmptyState
        title="Test"
        description="Test"
        ctaText="Add Part"
        onCTA={() => {}}
        ariaLabel="Add new part to build"
      />
    );
    const button = screen.getByRole('button', { name: /add part/i });
    expect(button).toHaveAttribute('aria-label', 'Add new part to build');
  });

  it('preserves aria-label when loading state is active', () => {
    render(
      <EmptyState
        title="Test"
        description="Test"
        ctaText="Add Part"
        onCTA={() => {}}
        isLoading={true}
        loadingText="Adding Part..."
        ariaLabel="Add new part to build"
      />
    );
    const button = screen.getByRole('button', { name: /adding part/i });
    expect(button).toHaveAttribute('aria-label', 'Add new part to build');
  });
});
```

**Rationale**: Tests verify ARIA attributes are correctly rendered and preserved.

---

### 2. Unit Tests for Loading Text Default

**File**: `frontend/components/__tests__/EmptyState.test.tsx`  
**Add**: 2 new tests in `describe('loading state behavior')` block

```typescript
it('auto-generates loading text with "..." when loadingText is not provided', () => {
  render(
    <EmptyState
      title="Test"
      description="Test"
      ctaText="Submit"
      onCTA={() => {}}
      isLoading={true}
      // loadingText intentionally omitted
    />
  );
  expect(screen.getByRole('button', { name: /Submit\.\.\./i })).toBeInTheDocument();
});

it('uses explicit loadingText when both loadingText and isLoading are provided', () => {
  render(
    <EmptyState
      title="Test"
      description="Test"
      ctaText="Submit"
      onCTA={() => {}}
      isLoading={true}
      loadingText="Processing..."
    />
  );
  expect(screen.getByRole('button', { name: /Processing\.\.\./i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Submit\.\.\./i })).not.toBeInTheDocument();
});
```

**Rationale**: Tests confirm loading text fallback works correctly and doesn't interfere with explicit loading text.

---

### 3. Integration Tests for build-detail-modal

**File**: `frontend/components/__tests__/build-detail-modal.integration.test.tsx`  
**Add**: 2 new integration tests

```typescript
it('EmptyState for Parts has correct aria-label for accessibility', async () => {
  // Mock dependencies...
  const mockBuild = createMockBuild({
    id: 'build-123',
    parts: [], // Empty parts to show EmptyState
  });
  
  // Setup mocks and render...
  render(<BuildDetailModal buildId="build-123" onClose={() => {}} />);
  
  await waitFor(() => {
    const addPartButton = screen.getByRole('button', { name: /add part/i });
    expect(addPartButton).toHaveAttribute('aria-label', 'Add new part to build');
  });
});

it('EmptyState for Test Runs has correct aria-label for accessibility', async () => {
  // Mock dependencies...
  const mockBuild = createMockBuild({
    id: 'build-123',
    testRuns: [], // Empty test runs to show EmptyState
  });
  
  // Setup mocks and render...
  render(<BuildDetailModal buildId="build-123" onClose={() => {}} />);
  
  await waitFor(() => {
    const submitTestButton = screen.getByRole('button', { name: /submit test run/i });
    expect(submitTestButton).toHaveAttribute('aria-label', 'Submit new test run');
  });
});
```

**Rationale**: Integration tests verify aria-labels are correctly passed through from build-detail-modal to EmptyState.

---

### 4. Manual Testing Verification

**Tool**: Screen reader (NVDA, JAWS on Windows; VoiceOver on macOS)

**Steps**:
1. Open `http://localhost:3000` and navigate to build detail modal
2. Tab to "Add Part" button
3. **Verify screen reader announces**: "Add new part to build, button" (not just "Add Part, button")
4. Tab to "Submit Test Run" button
5. **Verify screen reader announces**: "Submit new test run, button" (not just "Submit Test Run, button")

**Expected outcome**: Screen reader provides full context for both buttons.

---

### 5. Edge Cases to Test

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| Loading without text | `isLoading={true}` (no `loadingText`) | Button shows `ctaText + "..."` |
| Loading with text | `isLoading={true} loadingText="Custom"` | Button shows `"Custom"` |
| No aria-label | Default EmptyState usage | Button has no aria-label attribute |
| With aria-label | `ariaLabel="Custom label"` | Button has `aria-label="Custom label"` |
| Loading + aria-label | `isLoading={true} ariaLabel="Label"` | Button is disabled, has aria-label |
| Disabled + aria-label | `isDisabled={true} ariaLabel="Label"` | Button is disabled, has aria-label |

---

## Code Review Checklist

### Before Merging, Verify:

#### Accessibility Compliance
- ✅ `aria-label` attribute added to button only when `ariaLabel` prop is provided
- ✅ `aria-label` values match original implementation exactly:
  - `"Add new part to build"` for Parts EmptyState
  - `"Submit new test run"` for Test Runs EmptyState
- ✅ No `aria-label` on button when prop is not provided (clean HTML)
- ✅ Screen reader test passes with both buttons announcing full context
- ✅ WCAG AA compliance verified (AA level requires ARIA labels for images/icons in buttons)

#### Code Quality
- ✅ No breaking changes to existing EmptyState usages
- ✅ `ariaLabel` prop is optional (backward compatible)
- ✅ Loading text default fallback works correctly
- ✅ JSDoc updated with new props and examples
- ✅ All 5 changed files are necessary and sufficient
- ✅ No unrelated changes introduced

#### Test Coverage
- ✅ All 858 existing tests pass
- ✅ 5 new tests added for ARIA label handling
- ✅ 2 new tests added for loading text default
- ✅ 2 integration tests added for build-detail-modal
- ✅ Total: +9 new tests (867 tests passing)

#### Build & Lint
- ✅ `pnpm lint:fix` passes (no formatting issues)
- ✅ `pnpm build` succeeds
- ✅ TypeScript strict mode: no errors
- ✅ All linting rules pass
- ✅ No console warnings or errors during tests

#### Git & Commit
- ✅ Commit message follows template:
  ```
  fix: restore aria-label accessibility in EmptyState (PR #281)
  
  - Add optional ariaLabel prop to EmptyState interface
  - Pass ariaLabel to button element when provided
  - Restore aria-labels in build-detail-modal.tsx:
    * "Add new part to build" for Parts section
    * "Submit new test run" for Test Runs section
  - Implement loading text fallback (auto-append "..." when loadingText omitted)
  - Add 9 unit/integration tests for ARIA label and loading text
  - Fixes accessibility regression from #276 consolidation
  
  Fixes #281
  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  ```
- ✅ No secrets or sensitive data in code
- ✅ No unrelated files modified

#### Documentation
- ✅ JSDoc comments updated in EmptyState.tsx
- ✅ Examples added showing ariaLabel usage
- ✅ Loading text default behavior documented
- ✅ CHANGELOG entry added (if applicable)

---

## Rollback Plan

If issues are discovered post-merge:

### Quick Rollback (Git)
```bash
# Revert the commit
git revert <commit-sha> --no-edit

# Force push to remote (if needed)
git push origin <branch> -f
```

### Files Affected by Rollback
- `frontend/components/EmptyState.tsx` (removed ariaLabel prop, reverted loading text logic)
- `frontend/components/build-detail-modal.tsx` (removed ariaLabel props from both EmptyState usages)
- `frontend/components/__tests__/EmptyState.test.tsx` (removed 9 new tests)

### Verification After Rollback
```bash
# Verify all 858 tests pass (minus new tests)
pnpm test:frontend --run

# Verify original code is restored
git diff main..HEAD -- frontend/components/EmptyState.tsx

# Verify no regression in build
pnpm build
```

### Why This is Low Risk
1. **Reversible**: Single commit, can be reverted easily
2. **Contained**: Only 3 files modified
3. **No database changes**: No migrations required
4. **Backward compatible**: New prop is optional, doesn't break existing usages
5. **Test coverage**: 9 new tests ensure behavior doesn't regress

---

## Timeline & Effort Estimate

### Task Breakdown

| Task | File | LOC | Estimate | Notes |
|------|------|-----|----------|-------|
| Update interface | EmptyState.tsx | 1 | 2 min | Add ariaLabel prop |
| Update params | EmptyState.tsx | 1 | 2 min | Destructure ariaLabel |
| Update button | EmptyState.tsx | 1 | 2 min | Add aria-label attribute |
| Update Parts use | build-detail-modal.tsx | 1 | 2 min | Add ariaLabel prop |
| Update Test Runs use | build-detail-modal.tsx | 1 | 2 min | Add ariaLabel prop |
| Update loading text | EmptyState.tsx | 1 | 5 min | Implement fallback |
| Update JSDoc | EmptyState.tsx | ~20 | 10 min | Add examples |
| Write tests | EmptyState.test.tsx | ~50 | 15 min | 5 new tests |
| Write integration tests | build-detail-modal.integration.test.tsx | ~40 | 15 min | 2 new tests |
| Manual testing | Browser + screen reader | - | 10 min | Verify accessibility |
| **Total** | | **~115** | **~1 hour** | |

### Execution Steps
1. **Implementation** (25 min): Make all code changes
2. **Testing** (25 min): Run tests, verify no regressions
3. **Review** (10 min): Self-review all changes
4. **Commit & Push** (10 min): Clean up, commit, push to remote

**Total: ~1 hour end-to-end**

---

## Success Criteria

✅ **All criteria must be met before considering fix complete:**

1. **Code Quality**
   - [ ] No TypeScript errors or warnings
   - [ ] ESLint passes without modifications
   - [ ] Prettier formatting correct
   - [ ] No console errors or warnings during tests

2. **Functionality**
   - [ ] EmptyState renders without errors
   - [ ] aria-label attribute present when ariaLabel prop provided
   - [ ] aria-label absent when ariaLabel prop omitted
   - [ ] Loading text default fallback works ("Add Part..." when isLoading=true, no loadingText)
   - [ ] All existing EmptyState usages unaffected

3. **Accessibility**
   - [ ] Screen reader announces "Add new part to build, button"
   - [ ] Screen reader announces "Submit new test run, button"
   - [ ] WCAG AA compliance verified
   - [ ] No accessibility violations in automated scan

4. **Tests**
   - [ ] All 858 existing tests pass
   - [ ] 9 new tests pass (5 ARIA label + 2 loading text + 2 integration)
   - [ ] No flaky tests
   - [ ] Test coverage for EmptyState ≥ 95%

5. **Build & Deploy**
   - [ ] `pnpm build` succeeds
   - [ ] `pnpm dev` starts without errors
   - [ ] No bundle size regression
   - [ ] Production build works correctly

6. **Documentation**
   - [ ] JSDoc updated with ariaLabel prop
   - [ ] Examples added showing ariaLabel usage
   - [ ] Loading text behavior documented
   - [ ] Commit message is clear and descriptive

---

## References

### Original Issue
- **PR**: #281 (EmptyState loading support)
- **Regression**: Commit 8ab97c2 removed aria-labels during EmptyState consolidation
- **Original aria-labels**:
  - `"Add new part to build"` (from build-detail-modal.tsx line ~331)
  - `"Submit new test run"` (from build-detail-modal.tsx line ~428)

### WCAG Standards
- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Best Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Button Accessibility](https://www.w3.org/WAI/ARIA/apg/patterns/button/)

### Related Code
- EmptyState component: `/frontend/components/EmptyState.tsx`
- Usage in build-detail-modal: `/frontend/components/build-detail-modal.tsx` (lines 320-327, 411-419)
- Existing tests: `/frontend/components/__tests__/EmptyState.test.tsx`

### Configuration Files
- Test configuration: `/frontend/vitest.config.ts`
- TypeScript config: `/frontend/tsconfig.json`
- ESLint config: `/eslint.config.js`
- Tailwind config: `/frontend/tailwind.config.js`

---

## Appendix: Implementation Checklist Template

Use this checklist during implementation:

### Pre-Implementation
- [ ] Read all referenced files (EmptyState.tsx, build-detail-modal.tsx, tests)
- [ ] Run baseline tests: `pnpm test:frontend --run` (should be 858 passing)
- [ ] Create feature branch: `git checkout -b fix/accessibility-aria-labels`

### Implementation - EmptyState.tsx
- [ ] Add `ariaLabel?: string` to EmptyState interface (line 15)
- [ ] Add `ariaLabel` parameter to destructuring (line 48)
- [ ] Add `aria-label={ariaLabel}` to button element (line 63)
- [ ] Update loading text logic (line 69): `{isLoading ? (loadingText || \`${ctaText}...\`) : ctaText}`
- [ ] Update JSDoc with new examples (lines 17-38)

### Implementation - build-detail-modal.tsx
- [ ] Add `ariaLabel="Add new part to build"` to Parts EmptyState (line ~326)
- [ ] Add `ariaLabel="Submit new test run"` to Test Runs EmptyState (line ~418)

### Testing
- [ ] Run tests: `pnpm test:frontend --run`
- [ ] Verify 867 tests pass (858 existing + 9 new)
- [ ] Run linter: `pnpm lint`
- [ ] Manual accessibility test with screen reader

### Verification
- [ ] `pnpm build` succeeds
- [ ] `pnpm dev` starts without errors
- [ ] Navigate to build modal, verify aria-labels with DevTools
- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)

### Commit & Push
- [ ] `git status` shows only 3 files changed
- [ ] `git diff` looks correct
- [ ] Write commit message following template
- [ ] `git commit -m "..."`
- [ ] `git push origin fix/accessibility-aria-labels`

---

**Document Version**: 1.0  
**Last Updated**: April 17, 2026  
**Status**: Ready for Implementation  
