# Issue #40 WCAG AA Accessibility - Implementation Plan

**Status:** Ready to Execute | **Target Completion:** May 14, 2026

---

## Phase 2: ARIA Labels & Roles - Implementation Details

### Task: phase2-modal-dialog-role (15 min)

**Component:** `frontend/components/build-detail-modal.tsx`

**Changes:**
1. Line 190: Add `role="dialog" aria-modal="true" aria-labelledby="build-detail-title"` to modal container div
2. Line 192: Add `id="build-detail-title"` to the `<h2>` element to support aria-labelledby

**Before:**
```tsx
<div className="bg-white rounded-lg max-w-[700px] w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e): void => e.stopPropagation()}>
  <div className="flex justify-between items-center px-6 py-6 border-b border-gray-200">
    <h2 className="m-0 text-2xl text-gray-800">{buildData.name}</h2>
```

**After:**
```tsx
<div 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="build-detail-title"
  className="bg-white rounded-lg max-w-[700px] w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl" 
  onClick={(e): void => e.stopPropagation()}
>
  <div className="flex justify-between items-center px-6 py-6 border-b border-gray-200">
    <h2 id="build-detail-title" className="m-0 text-2xl text-gray-800">{buildData.name}</h2>
```

---

### Task: phase2-aria-buttons-modal (20 min)

**Component:** `frontend/components/build-detail-modal.tsx`

**Changes:**

#### 1. Close Button (Line 193)
- Add: `aria-label="Close build details modal"`
- Add: `focus:outline-none focus:ring-2 focus:ring-blue-500 rounded` classes

#### 2. Status Buttons (Lines 209-218)
- Add: `aria-label={`Change build status to ${status}`}` 
- Add: `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

#### 3. Add Part Button (Line 246)
- Add: `aria-label="Add new part to build"`
- Add: `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

#### 4. Submit Test Run Button (Line 320+)
- Add: `aria-label="Submit new test run"`
- Add: `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

#### 5. Retry Button (Line 267)
- Add: `aria-label="Retry fetching test run updates"`
- Add: `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

---

### Task: phase2-aria-buttons-dashboard (20 min)

**Component:** `frontend/components/build-dashboard.tsx`

**Changes:**

#### 1. Create Build Button (Line 105-112)
- Add: `aria-label="Create new build"`
- Add: `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

#### 2. View Details Button (Line 161-166)
- Add: `aria-label={`View details for build ${build.name}`}`
- Add: `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

---

### Task: phase2-aria-pagination (10 min)

**Component:** `frontend/components/Pagination.tsx`

**Status:** Already complete! Pagination already has:
- ✅ `role="navigation" aria-label="Pagination"`
- ✅ `aria-label` on Previous/Next buttons
- ✅ `aria-label` on page size select
- ✅ `aria-current="page"` on page indicator
- ✅ `aria-live="polite"` on item count

**Changes needed:**
- Line 101: Add `focus:outline-none focus:ring-2 focus:ring-blue-500` to select element
- Line 115-122: Add `focus:outline-none focus:ring-2 focus:ring-blue-500` to Previous button
- Line 125-132: Add `focus:outline-none focus:ring-2 focus:ring-blue-500` to Next button

---

### Task: phase2-semantic-html-tables (20 min)

**Component:** `frontend/components/build-detail-modal.tsx`

**Changes:**

#### 1. Parts Table (Lines 225-242)
- Add `scope="col"` to all `<th>` elements in thead

**Before:**
```tsx
<thead className="bg-gray-100">
  <tr>
    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Name</th>
    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">SKU</th>
    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Qty</th>
  </tr>
</thead>
```

**After:**
```tsx
<thead className="bg-gray-100">
  <tr>
    <th scope="col" className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Name</th>
    <th scope="col" className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">SKU</th>
    <th scope="col" className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Qty</th>
  </tr>
</thead>
```

#### 2. Test Runs Table (Lines 276-281)
- Add `scope="col"` to all `<th>` elements in thead

**Before:**
```tsx
<thead className="bg-gray-100">
  <tr>
    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Status</th>
    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Result</th>
    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Completed</th>
  </tr>
</thead>
```

**After:**
```tsx
<thead className="bg-gray-100">
  <tr>
    <th scope="col" className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Status</th>
    <th scope="col" className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Result</th>
    <th scope="col" className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Completed</th>
  </tr>
</thead>
```

---

### Task: phase2-aria-file-uploader (15 min)

**Component:** `frontend/components/FileUploader/FileUploader.tsx`

**Changes:**

#### 1. Upload Area
- Add `role="region"` and `aria-label="File upload area"` to drag-drop container

#### 2. File Input (Line ~120)
- Add `aria-label="Select file to upload"`
- Add `aria-describedby` if error messages present

#### 3. Upload Button
- Add `aria-label="Upload selected file"`
- Add `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

#### 4. Retry Button
- Add `aria-label="Retry upload"`
- Add `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

#### 5. Progress Indicator
- Add `role="progressbar"` to progress bar
- Add `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`

---

### Task: phase2-aria-status-badges (10 min)

**Component:** `frontend/components/build-detail-modal.tsx`

**Changes:**

#### 1. Build Status Badge (Line 201-206)
- Add `role="status"` to the status badge `<p>` element
- Add `aria-label={`Current build status is ${buildData.status}`}` 

**Before:**
```tsx
<p className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${...}`}>
  {buildData.status}
</p>
```

**After:**
```tsx
<p 
  role="status" 
  aria-label={`Current build status is ${buildData.status}`}
  className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${...}`}
>
  {buildData.status}
</p>
```

---

### Task: phase2-aria-test-panel (15 min)

**Component:** `frontend/components/test-run-details-panel.tsx`

**Changes:**

#### 1. Back/Close Button
- Add: `aria-label="Back to test runs list"`
- Add: `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

#### 2. Download Button (if present)
- Add: `aria-label="Download test run report"`
- Add: `focus:outline-none focus:ring-2 focus:ring-blue-500` classes

#### 3. Status Icon SVG
- Confirm `aria-hidden="true"` is present (already done per analysis)

---

## Phase 3: Keyboard Navigation - Implementation Details

### Task: phase3-escape-modal (20 min)

**Component:** `frontend/components/build-detail-modal.tsx`

**Changes:**
1. Import: `import { useEffect, useRef, useState } from 'react';` (add if not present)
2. Add useEffect hook to handle Escape key:

```tsx
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

Place this in BuildDetailContent function, after the testRuns polling useEffect.

---

### Task: phase3-focus-trap-modal (25 min)

**Component:** `frontend/components/build-detail-modal.tsx`

**Changes:**
1. Add ref to modal: `const modalRef = useRef<HTMLDivElement>(null);`
2. Add focus trap effect:

```tsx
useEffect(() => {
  if (!modalRef.current) return;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    const focusableElements = modalRef.current!.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  window.addEventListener('keydown', handleTabKey);
  return () => window.removeEventListener('keydown', handleTabKey);
}, []);
```

3. Attach ref to modal container div: `ref={modalRef}`

---

### Task: phase3-tab-order-modal (15 min)

**Changes:**
- Review all buttons in modal - ensure no negative tabIndex
- All interactive elements should be naturally in tab order
- Verify: Close button → Status buttons → Add Part button → Submit Test Run button → Retry button

---

### Task: phase3-tab-order-dashboard (15 min)

**Changes:**
- Review all buttons in dashboard
- Ensure View Details buttons are in logical tab order
- No negative tabIndex on any elements

---

### Task: phase3-enter-space-buttons (20 min)

**Changes:**
- Build detail modal test row (role="button") already handles Enter/Space via onKeyPress
- Verify all `<button>` elements automatically handle Enter/Space
- Test rows in test-run-details-panel already have proper handlers

---

### Task: phase3-pagination-arrows (15 min - OPTIONAL)

**Component:** `frontend/components/Pagination.tsx`

**Changes (Optional):**
1. Add arrow key support to pagination:

```tsx
useEffect(() => {
  const handleArrowKeys = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && !isPrevDisabled) {
      e.preventDefault();
      onPreviousPage();
    } else if (e.key === 'ArrowRight' && !isNextDisabled) {
      e.preventDefault();
      onNextPage();
    }
  };
  
  window.addEventListener('keydown', handleArrowKeys);
  return () => window.removeEventListener('keydown', handleArrowKeys);
}, [isPrevDisabled, isNextDisabled, onPreviousPage, onNextPage]);
```

---

## Phase 4: Focus Management - Implementation Details

### Task: phase4-focus-visible-outline (30 min)

**Changes:** Add `focus:outline-none focus:ring-2 focus:ring-blue-500` to all interactive elements:

**Buttons to Update:**
- BuildDetailModal: 5 buttons
- BuildDashboard: 2 buttons
- Pagination: 2 buttons + 1 select (already has, verify)
- FileUploader: 2-3 buttons
- TestRunDetailsPanel: 2-3 buttons

**Pattern:**
```tsx
className="... focus:outline-none focus:ring-2 focus:ring-blue-500 ..."
```

---

### Task: phase4-modal-focus-management (15 min)

**Component:** `frontend/components/build-detail-modal.tsx`

**Changes:**
1. Create ref for first focusable element
2. Add useEffect to focus first element when modal opens:

```tsx
useEffect(() => {
  // Focus first button when modal opens
  const firstButton = modalRef.current?.querySelector('button');
  if (firstButton) {
    setTimeout(() => firstButton.focus(), 0);
  }
}, []);
```

---

### Task: phase4-focus-restore-on-close (15 min)

**Component:** `frontend/components/build-detail-modal.tsx`

**Changes:**
1. In BuildDetailModal (parent component), store active element before opening modal
2. Restore focus after modal closes:

```tsx
const previousActiveElement = useRef<HTMLElement | null>(null);

const handleOpenModal = () => {
  previousActiveElement.current = document.activeElement as HTMLElement;
  setSelectedBuildId(buildId);
};

const handleCloseModal = () => {
  setSelectedBuildId(null);
  // Restore focus to button that opened modal
  setTimeout(() => {
    previousActiveElement.current?.focus();
  }, 0);
};
```

---

### Task: phase4-focus-visible-states (15 min)

**Changes:**
1. Verify polling indicator has `aria-live="polite"` and `role="status"` (add if missing)
2. Verify error messages have `role="alert"` (add if missing)

---

## Phase 5: Semantic HTML & Screen Reader - Implementation Details

### Task: phase5-semantic-sections (15 min)

**Component:** `frontend/components/build-detail-modal.tsx`

**Changes:** Already using `<section>` tags! Verify:
- Line 199: `<section>` for Build Status ✅
- Line 222: `<section>` for Parts ✅
- Line 251: `<section>` for Test Runs ✅

**Add main/nav landmarks if needed:**
- Consider wrapping in `<main>` if appropriate

---

### Task: phase5-form-labels-uploads (15 min)

**Component:** `frontend/components/FileUploader/FileUploader.tsx`

**Changes:**
1. If file input is visible, wrap with proper `<label>`
2. Add: `<label htmlFor="file-input">Select file to upload</label>`
3. Add: `id="file-input"` to input element
4. Add: `aria-describedby="file-input-help"` to input if help text present

---

### Task: phase5-error-messages-roles (20 min)

**Changes:**

#### BuildDetailModal (Lines 264-270 - polling error)
- Add: `role="alert"` and `aria-live="assertive"`

**Before:**
```tsx
<div className="flex justify-between items-center gap-4 mb-4 px-4 py-4 bg-yellow-100 border border-yellow-400 rounded" data-testid="polling-error">
```

**After:**
```tsx
<div 
  role="alert" 
  aria-live="assertive"
  className="flex justify-between items-center gap-4 mb-4 px-4 py-4 bg-yellow-100 border border-yellow-400 rounded" 
  data-testid="polling-error"
>
```

#### BuildDetailModal (Lines 84-91 - error message)
- Add: `role="alert"`

---

### Task: phase5-loading-spinners (15 min)

**Changes:**

#### BuildDetailModal Polling Indicator (Line 256)
- Add: `role="status"` and `aria-live="polite"` (already has aria-live in TestRunDetailsPanel)

---

### Task: phase5-link-text (10 min)

**Changes:**
1. Review any download links in TestRunDetailsPanel
2. Ensure link text is meaningful (not "Download" or "Click here")
3. Add `aria-label` if needed for context

---

### Task: phase5-image-alt-text (15 min)

**Changes:**
1. SVGs already have `aria-hidden="true"` ✅
2. Verify decorative SVGs have: `aria-hidden="true"`
3. If any SVGs are not decorative, add: `<title>icon description</title>` inside SVG

---

## Phase 6: Testing & Validation - Manual Checklist

### Task: phase6-verify-contrast-main (20 min)

**Use:** https://webaim.org/resources/contrastchecker/

**Test:**
- Blue buttons (Blue-600 bg, white text) - should be 7+:1 ✅
- Gray buttons (Gray-600 bg, white text) - should be 7+:1 ✅
- Status badges (color-600 bg, white text) - should be 7+:1 ✅

---

### Task: phase6-verify-contrast-secondary (20 min)

**Test:**
- Gray text on white (Gray-700) - should be 4.5+:1 ✅
- Gray-600 on white - should be 4.5+:1 ✅
- Disabled text (Gray-600 opacity-60) - might fail ⚠️

---

### Task: phase6-axe-audit (20 min)

**Steps:**
1. Install axe DevTools browser extension
2. Open app at http://localhost:3000
3. Run axe scan
4. Fix any violations found
5. Target: 0 violations

---

### Task: phase6-wave-audit (20 min)

**Steps:**
1. Install WAVE browser extension
2. Open app
3. Run WAVE scan
4. Target: 0 errors

---

### Task: phase6-lighthouse-a11y (15 min)

**Steps:**
1. Open Chrome DevTools
2. Click Lighthouse tab
3. Select Accessibility category
4. Run audit
5. Target: ≥ 90 score

---

### Task: phase6-keyboard-only-test (25 min)

**Manual test:**
1. Unplug mouse (or disable trackpad)
2. Use Tab to navigate all elements
3. Verify:
   - Tab goes through all elements in logical order
   - Tab wraps in modal (doesn't escape to background)
   - Escape closes modal
   - Enter/Space activates buttons
   - Arrow keys work for pagination (if implemented)

---

### Task: phase6-screen-reader-nvda (30 min)

**Manual test (Windows with NVDA):**
1. Download NVDA: https://www.nvaccess.org/
2. Start NVDA
3. Navigate app with:
   - H for headings
   - B for buttons
   - T for tables
   - L for landmarks
4. Verify:
   - All buttons announced with proper labels
   - Modal announced with role and title
   - Tables announced with headers
   - Errors announced as alerts

---

### Task: phase6-contrast-report (10 min)

**Create summary:**
- Document all color combinations tested
- Document contrast ratios
- List any failures and remediation

---

## Phase 7: Automated Testing - Implementation Details

### Test Files to Create/Update

1. `frontend/components/__tests__/build-detail-modal.accessibility.test.tsx` - NEW
2. `frontend/components/__tests__/build-dashboard.accessibility.test.tsx` - NEW
3. Update existing test files with a11y checks

### Test Cases

#### Keyboard Navigation Tests
```typescript
describe('BuildDetailModal - Keyboard Navigation', () => {
  test('Escape key closes modal', () => { ... });
  test('Tab navigates through focusable elements', () => { ... });
  test('Focus trap prevents Tab from escaping modal', () => { ... });
  test('Shift+Tab navigates backwards', () => { ... });
});
```

#### ARIA Attribute Tests
```typescript
describe('BuildDetailModal - ARIA Attributes', () => {
  test('modal has role="dialog" and aria-modal="true"', () => { ... });
  test('all buttons have aria-label or text content', () => { ... });
  test('modal title is linked via aria-labelledby', () => { ... });
});
```

#### Focus Management Tests
```typescript
describe('BuildDetailModal - Focus Management', () => {
  test('first button is focused when modal opens', () => { ... });
  test('focus is restored when modal closes', () => { ... });
  test('all interactive elements have focus ring', () => { ... });
});
```

#### Semantic HTML Tests
```typescript
describe('BuildDetailModal - Semantic HTML', () => {
  test('table headers have scope="col"', () => { ... });
  test('sections are used correctly', () => { ... });
});
```

---

## Phase 8: Documentation & Rollout - Deliverables

### Task: phase8-accessibility-doc (20 min)

**Create:** `ACCESSIBILITY.md`

**Contents:**
- WCAG 2.1 Level AA compliance statement
- Keyboard shortcuts
- Screen reader support
- Testing procedures
- Known issues (if any)
- How to report accessibility issues

---

### Task: phase8-update-readme (10 min)

**Update:** `README.md`

**Changes:**
- Add "Accessibility" section
- Link to ACCESSIBILITY.md
- Mention WCAG AA compliance

---

### Task: phase8-pr-checklist (20 min)

**Create:** PR description checklist

```
## Accessibility Implementation Checklist

- [ ] All 12 acceptance criteria verified
- [ ] Phase 1: Codebase analysis complete ✅
- [ ] Phase 2: ARIA labels & roles complete ✅
- [ ] Phase 3: Keyboard navigation working ✅
- [ ] Phase 4: Focus management complete ✅
- [ ] Phase 5: Semantic HTML complete ✅
- [ ] Phase 6: Testing & validation complete ✅
  - [ ] axe DevTools: 0 violations ✅
  - [ ] WAVE: 0 errors ✅
  - [ ] Lighthouse a11y: ≥ 90 ✅
  - [ ] Keyboard-only: tested ✅
  - [ ] Screen reader: tested ✅
  - [ ] Color contrast: verified ✅
- [ ] Phase 7: Automated tests added ✅
- [ ] Phase 8: Documentation complete ✅

## Test Results
- All 172 frontend tests passing ✅
- No accessibility violations in axe audit ✅
- Lighthouse accessibility score: [score] ✅
```

---

### Task: phase8-final-qa (15 min)

**Final verification:**
1. All 12 acceptance criteria met ✅
2. All 45 SQL tasks marked 'done' ✅
3. All existing tests still passing ✅
4. Code follows project conventions ✅
5. PR ready for review ✅

---

## Summary of Changes

### Files Modified
1. `frontend/components/build-detail-modal.tsx` - ARIA, keyboard, focus, semantic HTML
2. `frontend/components/build-dashboard.tsx` - ARIA, keyboard, focus
3. `frontend/components/Pagination.tsx` - Focus rings
4. `frontend/components/FileUploader/FileUploader.tsx` - ARIA, semantic HTML
5. `frontend/components/test-run-details-panel.tsx` - ARIA
6. `frontend/components/toast-notification.tsx` - ARIA (verify existing)
7. `frontend/components/create-build-modal.tsx` - ARIA, keyboard, focus
8. `frontend/components/SkeletonLoader/*.tsx` - ARIA verification

### Files Created
1. `ACCESSIBILITY.md` - Documentation
2. `frontend/components/__tests__/build-detail-modal.accessibility.test.tsx`
3. `frontend/components/__tests__/build-dashboard.accessibility.test.tsx`

### Pattern Summary

**Every button should have:**
```tsx
<button
  aria-label="[descriptive label]"
  className="... focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  {text}
</button>
```

**Every modal should have:**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  ref={modalRef}
>
  <h2 id="modal-title">Title</h2>
  {/* modal content */}
</div>
```

**Every error/alert should have:**
```tsx
<div role="alert" aria-live="assertive">
  Error message
</div>
```

**Every loading/status should have:**
```tsx
<div role="status" aria-live="polite">
  Loading...
</div>
```

---

**Next Step:** Begin Phase 2 implementation with build-detail-modal.tsx (15 min for ARIA, 20 min for keyboard, 15 min for focus management)
