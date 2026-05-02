# Issue #31: Enhanced Error UI (Toast Notifications) - Implementation Plan

**Date**: April 17, 2026  
**Status**: Planning  
**Effort**: 1.5 hours  
**Priority**: Medium  
**Related Issues**: #28 (Error Boundaries), #32 (Retry Logic)

---

## Problem Statement

Currently, the application uses browser `alert()` dialogs for error handling in mutation operations. This approach has significant UX and accessibility issues:

- **Blocks UI**: Modal dialogs prevent all user interaction until dismissed
- **Unprofessional**: Looks outdated compared to modern SPA patterns
- **Not Accessible**: Screen readers don't announce alerts properly
- **Poor Mobile UX**: Alerts take up 100% of viewport on small screens
- **No Retry**: Users can't easily retry failed operations
- **Limited Context**: Single-line error messages without formatting

**Current Locations**:
- `frontend/components/build-detail-modal.tsx` (lines 54, 71, 86, 100+)
- Any other components with `alert()` calls

**Impact**: Affects all mutation error handling in the dashboard

---

## Proposed Solution Architecture

### Toast Notification System

A **non-blocking, auto-dismissing notification system** built with:

1. **Global Toast Store**: Centralized toast queue (replaces browser alert)
   - Maintained in memory with React listeners
   - Can be replaced with Zustand/Context later
   - Supports multiple simultaneous toasts

2. **Toast Component**: Reusable, accessible toast display
   - Renders toast list in fixed position (bottom-right)
   - Supports 4 toast types: success, error, warning, info
   - Icons and color-coding by type
   - Manual close button + auto-dismiss timer
   - Slide-in/out animations

3. **Error Notifier Hook**: Simple `useToast()` interface
   - `toast.success(msg)` - Green, auto-dismiss 5s
   - `toast.error(msg)` - Red, auto-dismiss 7s
   - `toast.warning(msg)` - Yellow, auto-dismiss 5s
   - `toast.info(msg)` - Blue, auto-dismiss 5s

4. **Integration Points**:
   - Update all mutation error handlers
   - Display success feedback on mutation completion
   - Add ToastContainer to root layout

### Error Message Standardization

All error toasts should:
- Extract user-friendly message from error object
- Show operation context (e.g., "Failed to update status:")
- Provide actionable guidance
- Not expose internal stack traces

---

## Implementation Todos

### Phase 1: Core Components (0.5 hours)

#### Todo 1: Create Toast Component
- **File**: `frontend/components/toast-notification.tsx`
- **Scope**:
  - Define `Toast` interface (id, message, type, duration)
  - Define `ToastType = 'success' | 'error' | 'warning' | 'info'`
  - Implement global toast store (array + listeners)
  - Implement `createToast()` function with auto-dismiss
  - Implement `dismissToast()` function
  - Implement `ToastContainer` component (renders toast list)
  - Implement individual `Toast` component (with close button)
  - Export `useToast()` hook
- **Dependencies**: None
- **Testing**: Unit tests for all functions

#### Todo 2: Create Toast Styling
- **File**: `frontend/components/toast-notification.css`
- **Scope**:
  - `.toast-container` - Fixed position, bottom-right, z-index 9999
  - `.toast` - Base styles, padding, border-radius, shadow
  - `.toast-success`, `.toast-error`, `.toast-warning`, `.toast-info` - Color variants
  - `.toast-content` - Flex layout for icon + message
  - `.toast-icon` - Icon styling
  - `.toast-message` - Text styling
  - `.toast-close` - Close button (X)
  - `@keyframes slideIn` - Animation from right
- **Accessibility**: `role="alert"` for screen reader announcement
- **Dependencies**: None

#### Todo 3: Create Error Notifier Hook
- **File**: `frontend/lib/error-notifier.ts`
- **Scope**:
  - Export `useToast()` hook from toast component
  - Optional: Add error formatting helper function
  - Document usage patterns
- **Dependencies**: `toast-notification.tsx`

### Phase 2: Integration (0.5 hours)

#### Todo 4: Update Layout to Include ToastContainer
- **File**: `frontend/app/layout.tsx`
- **Changes**:
  - Import `ToastContainer` from `@/components/toast-notification`
  - Add `<ToastContainer />` to root layout JSX
  - Position before `{children}`
- **Scope**: Single edit
- **Dependencies**: Todo 1 (Toast Component)

#### Todo 5: Update build-detail-modal.tsx - Status Change
- **File**: `frontend/components/build-detail-modal.tsx`
- **Changes** (lines ~92-100):
  - Import `useToast` hook
  - Call `useToast()` in component
  - Replace `alert()` with `toast.error(message)`
  - Add `toast.success()` on successful update
- **Scope**: `handleStatusChange` function
- **Dependencies**: Todo 3 (Error Notifier Hook)

#### Todo 6: Update build-detail-modal.tsx - Add Part
- **File**: `frontend/components/build-detail-modal.tsx`
- **Changes** (lines ~120+):
  - Add `toast.success()` on successful add
  - Add `toast.error(message)` on error in catch block
- **Scope**: `handleAddPart` function
- **Dependencies**: Todo 3 (Error Notifier Hook)

#### Todo 7: Update build-detail-modal.tsx - Submit Test Run
- **File**: `frontend/components/build-detail-modal.tsx`
- **Changes** (lines ~150+):
  - Add `toast.success()` on successful submit
  - Add `toast.error(message)` on error in catch block
- **Scope**: `handleSubmitTestRun` function
- **Dependencies**: Todo 3 (Error Notifier Hook)

#### Todo 8: Audit for Additional alert() Calls
- **Files**: All frontend components
- **Scope**:
  - Search for all `alert(` calls in codebase
  - Document any found outside build-detail-modal.tsx
  - Update if found in other components
  - Include in final audit
- **Dependencies**: Todo 3 (Error Notifier Hook)

### Phase 3: Testing (0.3 hours)

#### Todo 9: Create Toast Component Tests
- **File**: `frontend/components/__tests__/toast-notification.test.tsx`
- **Test Cases**:
  - Render ToastContainer (should be empty initially)
  - Create toast with `createToast()` (should appear in container)
  - Dismiss toast with `dismissToast()` (should disappear)
  - Auto-dismiss timer fires after duration (toast disappears)
  - Multiple toasts render and stack
  - Toast with type variants render correct styling
  - Manual close button dismisses toast
  - `useToast()` hook returns correct interface
- **Dependencies**: Todo 1, 2

#### Todo 10: Create Integration Tests
- **File**: `frontend/components/__tests__/build-detail-modal.test.tsx` (update existing)
- **Test Cases**:
  - Mock `useToast()` hook
  - Verify mutation errors trigger `toast.error()`
  - Verify successful mutations trigger `toast.success()`
  - Verify toast message contains operation context
- **Dependencies**: Todo 1, 5, 6, 7

### Phase 4: Validation (0.2 hours)

#### Todo 11: TypeScript & Linting
- **Scope**:
  - Run `pnpm lint` (ESLint + Prettier)
  - Verify no type errors: `pnpm build`
  - Check for unused imports
- **Dependencies**: All todos

#### Todo 12: Final Verification
- **Scope**:
  - Run all tests: `pnpm test:frontend`
  - Manual testing: trigger mutations, verify toasts appear
  - Verify auto-dismiss timing
  - Verify mobile responsiveness
  - Verify accessibility (screen reader announces)
- **Dependencies**: Todo 9, 10, 11

---

## Component Design

### Toast Store Architecture

```
Global Toast Queue
├── toast1 { id: "abc", message: "...", type: "error", duration: 7000 }
├── toast2 { id: "def", message: "...", type: "success", duration: 5000 }
└── listeners: Set<(toasts) => void>

When toast changes:
1. Push/pop from array
2. Call all listeners with updated array
3. ToastContainer re-renders with new toasts
```

### Component Hierarchy

```
RootLayout
└── ToastContainer (fixed, bottom-right)
    ├── Toast (error)
    ├── Toast (success)
    └── Toast (info)

BuildDetailModal
├── useToast() hook
├── handleStatusChange()
│   └── toast.error() or toast.success()
├── handleAddPart()
│   └── toast.error() or toast.success()
└── handleSubmitTestRun()
    └── toast.error() or toast.success()
```

### Toast Types & Styling

| Type | Color | Icon | Auto-dismiss | Use Case |
|------|-------|------|--------------|----------|
| `success` | Green (#10b981) | ✓ | 5s | Operation succeeded |
| `error` | Red (#ef4444) | ✕ | 7s | Operation failed |
| `warning` | Yellow (#f59e0b) | ⚠ | 5s | Caution/confirm |
| `info` | Blue (#3b82f6) | ℹ | 5s | Informational |

### Error Message Format

```typescript
// Always include context + details
// ❌ Bad: "Error: Network error"
// ✅ Good: "Failed to update build status: Network error"

// Example patterns:
"Failed to update status: GraphQL error"
"Failed to add part: Part name is required"
"Failed to submit test run: Invalid status value"
```

---

## Testing Strategy

### Unit Tests (Toast Component)

```typescript
describe('Toast Notification System', () => {
  test('createToast adds toast to store', () => {
    const id = createToast('Hello', 'info')
    expect(toasts).toHaveLength(1)
    expect(toasts[0].id).toBe(id)
  })

  test('auto-dismiss removes toast after duration', async () => {
    createToast('Hello', 'info', 100) // 100ms
    expect(toasts).toHaveLength(1)
    await new Promise(r => setTimeout(r, 150))
    expect(toasts).toHaveLength(0)
  })

  test('dismissToast removes specific toast', () => {
    const id = createToast('Hello', 'info')
    dismissToast(id)
    expect(toasts).toHaveLength(0)
  })

  test('useToast hook returns all 4 methods', () => {
    const toast = useToast()
    expect(toast.success).toBeDefined()
    expect(toast.error).toBeDefined()
    expect(toast.warning).toBeDefined()
    expect(toast.info).toBeDefined()
  })
})
```

### Integration Tests (Build Detail Modal)

```typescript
describe('BuildDetailModal with Toasts', () => {
  test('shows error toast on mutation failure', async () => {
    const mockError = new Error('Network error')
    mocks[0].result = () => { throw mockError }
    
    render(<BuildDetailModal buildId="123" onClose={() => {}} />)
    await userEvent.click(screen.getByText('Update Status'))
    
    expect(screen.getByText(/Failed to update status/)).toBeInTheDocument()
  })

  test('shows success toast on mutation success', async () => {
    render(<BuildDetailModal buildId="123" onClose={() => {}} />)
    await userEvent.click(screen.getByText('Update Status'))
    
    expect(screen.getByText(/Build status updated/)).toBeInTheDocument()
  })
})
```

### Verification Tests (Manual)

1. **Error Flow**:
   - Stop GraphQL server
   - Try to update build status
   - Verify error toast appears (red, 7s duration)
   - Verify exact error message shown

2. **Success Flow**:
   - Start GraphQL server
   - Update build status
   - Verify success toast appears (green, 5s)

3. **Auto-dismiss**:
   - Verify toast disappears after timeout
   - Verify can close manually before auto-dismiss

4. **Multiple Toasts**:
   - Trigger 3 errors rapidly
   - Verify all 3 toasts stack vertically
   - Verify they disappear in order

5. **Mobile**:
   - DevTools → Device toolbar
   - Verify toasts fit on screen
   - Verify no layout shift

---

## Files to Create

### New Files (6)

1. `frontend/components/toast-notification.tsx` (200 lines)
   - Toast store, component, hooks

2. `frontend/components/toast-notification.css` (80 lines)
   - Styling, animations

3. `frontend/lib/error-notifier.ts` (30 lines)
   - Re-export hook, helpers

4. `frontend/components/__tests__/toast-notification.test.tsx` (150 lines)
   - Unit tests for toast system

5. `frontend/components/__tests__/build-detail-modal-toast.test.tsx` (120 lines)
   - Integration tests with mutations

6. `docs/dev-note/ISSUE-31-QUICK-REFERENCE.md` (100 lines)
   - Quick reference guide

### Modified Files (2)

1. `frontend/app/layout.tsx`
   - Add ToastContainer import and JSX

2. `frontend/components/build-detail-modal.tsx`
   - Replace 3 alert() calls with toast
   - Add success toasts

---

## Risk Assessment

### Low Risk
- Toast component is isolated, no breaking changes
- New CSS doesn't affect existing styles
- Optional: can delete component without breaking code

### Medium Risk
- Mutation error handling changes in build-detail-modal.tsx
- Mitigation: Comprehensive test coverage

### Testing Mitigation
- Unit tests for all toast functions
- Integration tests for mutation error scenarios
- Manual testing of all 3 mutation operations
- Mobile responsiveness testing

---

## Acceptance Criteria Verification

- [ ] **AC1**: All `alert()` calls in build-detail-modal.tsx replaced
  - Verify: Search for `alert(` in file
  
- [ ] **AC2**: Success messages show when operations complete
  - Verify: Update status → green toast appears
  
- [ ] **AC3**: Error messages show with error details
  - Verify: GraphQL error → red toast shows message
  
- [ ] **AC4**: Toast appears bottom-right, doesn't block UI
  - Verify: Manual inspection, DevTools
  
- [ ] **AC5**: Toast auto-dismisses after 5-7 seconds
  - Verify: Stopwatch test, timeout assertion
  
- [ ] **AC6**: Manual close button (×) available and works
  - Verify: Click close button → toast disappears
  
- [ ] **AC7**: Different colors for success/error/warning/info
  - Verify: Visual inspection in browser
  
- [ ] **AC8**: Animations are smooth (slide-in)
  - Verify: Visual inspection, no jank
  
- [ ] **AC9**: Multiple toasts stack vertically
  - Verify: Trigger 3 errors → all visible stacked
  
- [ ] **AC10**: Mobile-friendly (respects screen size)
  - Verify: DevTools → 375px width → fits screen
  
- [ ] **AC11**: Accessible (role="alert" for screen readers)
  - Verify: DevTools → Elements → check role="alert"
  
- [ ] **AC12**: TypeScript build passes
  - Verify: `pnpm build` succeeds
  
- [ ] **AC13**: Tests verify toast behavior
  - Verify: `pnpm test:frontend` passes all toast tests
  
- [ ] **AC14**: No ESLint errors
  - Verify: `pnpm lint` passes

---

## Interview Talking Points

> "I replaced browser `alert()` dialogs with a toast notification system. It's non-blocking, appears bottom-right, and auto-dismisses after 5-7 seconds depending on severity. When a mutation fails, the error message includes context (e.g., 'Failed to update status') and the actual error detail. When it succeeds, a green success toast confirms the action. The toasts use semantic color-coding (red for errors, green for success) and support multiple simultaneous notifications that stack vertically. This approach is much more professional, mobile-friendly, and accessible."

---

## Implementation Checklist

**Phase 1: Setup** (0.5h)
- [ ] Create toast-notification.tsx with all functions
- [ ] Create toast-notification.css with full styling
- [ ] Create error-notifier.ts
- [ ] Update layout.tsx to add ToastContainer

**Phase 2: Integration** (0.5h)
- [ ] Update build-detail-modal.tsx: handleStatusChange
- [ ] Update build-detail-modal.tsx: handleAddPart
- [ ] Update build-detail-modal.tsx: handleSubmitTestRun
- [ ] Audit for other alert() calls

**Phase 3: Testing** (0.3h)
- [ ] Create toast-notification.test.tsx
- [ ] Create build-detail-modal-toast.test.tsx
- [ ] Run `pnpm test:frontend --run` (all pass)

**Phase 4: Validation** (0.2h)
- [ ] Run `pnpm lint` (no errors)
- [ ] Run `pnpm build` (TypeScript passes)
- [ ] Manual testing all 3 operations
- [ ] Manual testing mobile (DevTools)
- [ ] Manual testing accessibility (DevTools → Accessibility)

**Phase 5: PR** (prep)
- [ ] Create feature branch: `feat/issue-31-impl`
- [ ] Commit with meaningful messages
- [ ] Push to remote
- [ ] Create PR with acceptance criteria

---

## Success Metrics

✅ **Complete when**:
1. All 6 new files created with comprehensive implementation
2. All 2 files updated with toast integration
3. All tests passing (pnpm test:frontend)
4. TypeScript build passing (pnpm build)
5. ESLint passing (pnpm lint)
6. Feature branch pushed to remote
7. PR created with acceptance criteria verified

**Estimated Time**: 1.5 hours  
**Status**: Ready to implement
