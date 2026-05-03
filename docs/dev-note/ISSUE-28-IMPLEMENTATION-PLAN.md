# Issue #28 Implementation Plan: Error Boundaries - Frontend

**Issue**: #28 - Add Global Error Handling & Error Boundaries  
**Phase**: 2 (First error handling issue; #32 depends on this)  
**Status**: Planning  
**Timeline**: 2-2.5 hours  
**Created**: April 2026  

---

## Problem Statement

Currently, the application lacks comprehensive error handling at multiple levels:

1. **React Component Errors**: When a component throws during render, the entire app crashes with a blank screen or unfriendly browser error page.
2. **GraphQL Network Errors**: When Apollo fails to connect or receives an error response, no graceful handling occurs.
3. **GraphQL Errors**: Invalid queries or resolver errors are logged to console but don't reach the user.
4. **Server-Side Errors (500s)**: Cause crashes instead of displaying friendly error messages.

**Impact on User Experience**:
- Users see blank screens instead of actionable error messages
- No recovery mechanism (no "Try again" button)
- Technical error details exposed instead of user-friendly messages
- Entire app becomes unusable when a single component fails

**Interview Talking Point**:
*"I implement error boundaries at multiple levels: React ErrorBoundary catches component render crashes, Next.js error.tsx catches page-level errors, and Apollo errorLink provides defense-in-depth. This ensures users always see a friendly message—never a blank screen—and the app remains resilient."*

---

## Proposed Solution Architecture

### Three-Layer Error Handling Hierarchy

```
┌─────────────────────────────────────────────────┐
│  Top Level: React Error Boundary                │
│  • Catches component render errors              │
│  • Displays graceful fallback UI                │
│  • Provides reset/recovery button               │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│  Page Level: Next.js error.tsx                  │
│  • Catches page-level errors                    │
│  • Layout preserves error boundary wrapper      │
│  • Separate handling for server vs client       │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│  Network Level: Apollo Error Link               │
│  • Catches GraphQL errors                       │
│  • Catches network/connection errors            │
│  • Displays errors via Toast (Issue #31)        │
│  • Structured for RetryLink injection (#32)     │
└─────────────────────────────────────────────────┘
```

### Integration with Existing Code

- **Toast Notifications** (Issue #31): Already implemented with `createToast()`, `useToast()` hook
- **Error Handler Utilities**: `graphql-error-handler.ts` already provides:
  - `extractErrorMessage()` - User-friendly message extraction
  - `classifyError()` - Error type classification
  - Retry configuration foundations for Issue #32
- **Apollo Client** (apollo-client.ts): Currently has authLink; errorLink will be added

### Error Link Structure for Issue #32

The Apollo error link is designed to allow RetryLink injection in Issue #32:

```typescript
// Issue #28 (This)
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // Catch and log errors, display via toast
  // IMPORTANT: Must return forward(operation) to continue the chain
  return forward(operation);  // Chain continues to retryLink (added in #32)
});

// Issue #32 (Depends on this)
const retryLink = new RetryLink({
  delay: { initial: 100, max: 10000, jitter: true },
  attempts: { max: 3, retryIf: (error) => isRetryableError(error) }
});

// Final chain: errorLink → retryLink → httpLink
link: errorLink.concat(retryLink).concat(httpLink)
```

---

## Implementation Todos

### Phase 1: React Error Boundary (Components)

- [ ] **T1-ErrorBoundary**: Create `frontend/components/error-boundary.tsx`
  - Class component with getDerivedStateFromError
  - componentDidCatch for error logging
  - Reset button to recover
  - Fallback UI with graceful message
  - Support custom fallback prop
  - Dependencies: None (pure React)

- [ ] **T2-ErrorBoundaryTests**: Create `frontend/components/__tests__/error-boundary.test.tsx`
  - Test: Error caught and fallback displayed
  - Test: Reset button clears error state
  - Test: Error logged to console
  - Test: Custom fallback rendered
  - Test: Nested error boundaries
  - Dependencies: T1

### Phase 2: Next.js Error Pages

- [ ] **T3-ErrorPage**: Create `frontend/app/error.tsx`
  - Client component with reset callback
  - Display error message and digest
  - Styled similar to login page
  - Show error ID for debugging
  - Dependencies: None

- [ ] **T4-LayoutWrap**: Update `frontend/app/layout.tsx`
  - Wrap children with ErrorBoundary component
  - Import ErrorBoundary from @/components
  - Maintain existing providers (Auth, Apollo, Toast)
  - Dependencies: T1, T3

### Phase 3: Apollo Error Link (Network Level)

- [ ] **T5-ErrorLink**: Create error handling in `frontend/lib/apollo-client.ts`
  - Import `onError` from @apollo/client/link/error
  - Create errorLink handler:
    - Handle graphQLErrors array
    - Handle networkError
    - Display errors via toast using `createToast()`
    - Log errors with operation name
    - Return `forward(operation)` for chain continuation
  - Reorder link chain: `errorLink.concat(authLink).concat(httpLink)`
  - Dependencies: Existing apollo-client.ts, toast-notification.ts

- [ ] **T6-ErrorLinkTests**: Create `frontend/lib/__tests__/error-link.test.ts`
  - Test: GraphQL errors trigger toast
  - Test: Network errors trigger toast
  - Test: Error messages properly extracted
  - Test: Operation forwarding works
  - Test: Toast called with correct type ('error')
  - Dependencies: T5

### Phase 4: Error Message Handling

- [ ] **T7-ErrorFormatter**: Enhance error message extraction (if needed)
  - Use existing `extractErrorMessage()` from graphql-error-handler.ts
  - Verify user-friendly messages (no raw GraphQL errors)
  - Test with various error types
  - Dependencies: graphql-error-handler.ts (already exists)

- [ ] **T8-ErrorLogs**: Add console error logging
  - Log full error details (for debugging)
  - Include operation name for context
  - Include error classification type
  - Don't expose internal details to user
  - Dependencies: graphql-error-handler.ts

### Phase 5: Testing & Validation

- [ ] **T9-ManualTesting**: Manual integration testing
  - Start app with `pnpm dev`
  - Trigger component error and verify error boundary catches it
  - Trigger GraphQL error and verify toast displays
  - Stop GraphQL server and verify network error handling
  - Test error boundary reset button
  - Dependencies: T1-T8

- [ ] **T10-BuildTest**: Run full build and test suite
  - `pnpm build` - TypeScript check passes
  - `pnpm lint` - No linting errors
  - `pnpm test:frontend` - All tests pass (target > 500)
  - No regressions in existing tests
  - Dependencies: T1-T8

- [ ] **T11-Documentation**: Update or create documentation
  - Add error handling patterns to CLAUDE.md if needed
  - Document error link structure for #32 integration
  - Include examples of error boundary usage
  - Dependencies: T1-T10

### Phase 6: Git & Code Review

- [ ] **T12-CommitPush**: Create feature branch and push
  - Branch name: `feat/issue-28-error-boundaries`
  - Commits:
    1. Add React ErrorBoundary component + tests
    2. Add Next.js error page + layout update
    3. Add Apollo error link + tests
  - Push to remote
  - Dependencies: T1-T11

---

## Component Design

### ErrorBoundary Component

**Location**: `frontend/components/error-boundary.tsx`  
**Type**: Class component (required for error boundaries)  
**Props**:
- `children: ReactNode` - Components to wrap
- `fallback?: (error: Error) => ReactNode` - Custom fallback UI (optional)

**Features**:
- Catches render errors in child components
- Displays default fallback or custom fallback
- Includes "Try Again" reset button
- Logs error details to console
- Prevents further error propagation up the tree

**Code Structure**:
```typescript
'use client'
export class ErrorBoundary extends Component<Props, State> {
  // Constructor, getDerivedStateFromError, componentDidCatch, render
}
```

### Next.js error.tsx Page

**Location**: `frontend/app/error.tsx`  
**Type**: Client component
**Props**:
- `error: Error & { digest?: string }` - Error object with digest
- `reset: () => void` - Callback to reset error state

**Features**:
- Displays error message in styled container
- Shows error digest for debugging
- "Try Again" button calls reset()
- Styled consistently with app theme

### Apollo Error Link

**Location**: `frontend/lib/apollo-client.ts` (update)  
**Implementation**:
- Import `onError` from @apollo/client/link/error
- Create error handler with signature:
  ```typescript
  onError(({ graphQLErrors, networkError, operation, forward }) => {...})
  ```
- Extract user-friendly messages using `extractErrorMessage()`
- Display via `createToast(message, 'error')`
- Log full errors to console
- Return `forward(operation)` for chain continuation

**Link Chain Order**:
```typescript
link: errorLink.concat(authLink).concat(httpLink)
```
This ensures errorLink catches errors first, before authLink modifies headers.

---

## Apollo Error Link Integration Strategy

### Design for Issue #32 (RetryLink)

The error link must be structured to allow RetryLink injection without refactoring:

**Current (Issue #28)**:
```typescript
errorLink → authLink → httpLink
```

**After Issue #32**:
```typescript
errorLink → retryLink (NEW) → authLink → httpLink
```

**Implementation Requirements**:
1. Error link must use composition (not monolithic handler)
2. Must call `forward(operation)` to continue the chain
3. Must not consume the operation (let retryLink see it)
4. Error classification must be available to retryLink

**Example Structure**:
```typescript
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // Handle/log errors
  createToast(extractErrorMessage(error), 'error');
  
  // CRITICAL: Continue chain (retryLink will intercept before httpLink)
  return forward(operation);
});

// Issue #32 will add:
const retryLink = new RetryLink({...});
link: errorLink.concat(retryLink).concat(authLink).concat(httpLink)
```

---

## Error Message Display Strategy

### User-Friendly Messages

- Use existing `extractErrorMessage()` from `graphql-error-handler.ts`
- Display via Toast (from Issue #31) with type='error'
- Duration: 7 seconds (longer for errors than success messages)
- Non-technical language (no raw GraphQL errors)

### Error Console Logging

- Log full error details with `console.error()`
- Include:
  - Operation name (query/mutation being executed)
  - Error type (network, graphql, timeout, etc.)
  - Timestamp (for correlation)
  - Raw GraphQL/network error details
- Format for clarity:
  ```
  [GraphQL Error] (operationName):
  Message: "User not found"
  Type: graphql
  Timestamp: 2026-04-18T12:34:56.789Z
  ```

---

## Testing Strategy

### Unit Tests: Error Boundary (`error-boundary.test.tsx`)

**Tests**:
1. Renders fallback when child throws
2. Reset button clears error state
3. Error logged to console
4. Custom fallback is used if provided
5. Nested boundaries work correctly
6. Error not passed up to parent

**Tools**: Vitest + React Testing Library + jest-mock-console

### Unit Tests: Error Link (`error-link.test.ts`)

**Tests**:
1. GraphQL errors trigger toast with error message
2. Network errors trigger toast
3. Multiple GraphQL errors show first one
4. Error message extraction works
5. Operation forwarding continues chain
6. Console.error called for logging
7. Toast type is 'error'
8. Toast duration is 7000ms

**Tools**: Vitest + mock apollo functions + mock toast

### Integration Tests: Manual Verification

1. **Component Error**: Add `throw new Error("test")` in component render
   - Verify error boundary catches
   - Verify fallback UI displays
   - Verify reset button works

2. **GraphQL Error**: Query invalid field
   - Verify toast appears with error message
   - Verify console has error log
   - Verify app continues working

3. **Network Error**: Stop GraphQL server
   - Verify network error toast displays
   - Verify app doesn't crash
   - Verify retry logic ready (for #32)

4. **Error Recovery**: Trigger error, reset, verify app works
   - Verify no memory leaks (Issue #31 pattern)
   - Verify cache not corrupted

---

## File List

### Files to Create
- `frontend/components/error-boundary.tsx` (150+ lines)
- `frontend/app/error.tsx` (80-100 lines)
- `frontend/components/__tests__/error-boundary.test.tsx` (15-20 tests)
- `frontend/lib/__tests__/error-link.test.ts` (15-20 tests)
- `docs/dev-note/ISSUE-28-QUICK-REFERENCE.md` (100-150 lines)

### Files to Modify
- `frontend/app/layout.tsx` (add ErrorBoundary wrapper)
- `frontend/lib/apollo-client.ts` (add error link)

### Files Not Changed
- `frontend/lib/graphql-error-handler.ts` (already has utilities)
- `frontend/components/toast-notification.tsx` (already has toast)

---

## Risk Assessment

### Low Risk (Expected to Complete Successfully)

1. **React Error Boundary Implementation**: React documentation is clear; pattern is well-established
2. **Toast Integration**: `createToast()` already exists and works
3. **Error Message Extraction**: `extractErrorMessage()` already exists and tested
4. **TypeScript Type Safety**: All types can be strictly defined

### Medium Risk (Known Mitigation Strategies)

1. **Error Link Ordering**: If error link is placed incorrectly, it won't catch errors
   - **Mitigation**: Place errorLink first in chain before authLink
   - **Test**: Manual test with GraphQL error

2. **Memory Leaks in Error Boundary**: If error state not cleared, could cause leaks
   - **Mitigation**: Follow Issue #31 pattern (proper cleanup in useEffect)
   - **Test**: Long-running session with repeated errors

3. **Toast Spam**: If multiple errors fire, toast queue could overflow
   - **Mitigation**: Toast has built-in duration and dismissal; test with multiple errors
   - **Test**: Trigger multiple errors simultaneously

### Low Risk of #32 Regression

- Error link structure explicitly supports RetryLink chaining
- No breaking changes to existing API
- Forward() call ensures proper link ordering

---

## Success Criteria Checklist

### Functionality
- ✅ ErrorBoundary catches React render errors
- ✅ ErrorBoundary reset button works
- ✅ error.tsx catches page-level errors
- ✅ Apollo error link catches GraphQL errors
- ✅ Apollo error link catches network errors
- ✅ Errors display via Toast (Issue #31 integration)
- ✅ Error messages are user-friendly
- ✅ Error link structured for RetryLink (#32 readiness)

### Code Quality
- ✅ TypeScript build passes (`pnpm build`)
- ✅ Linting passes (`pnpm lint`)
- ✅ All tests pass (`pnpm test:frontend` > 500 tests)
- ✅ No regressions in existing functionality

### Documentation
- ✅ Implementation plan completed (this file)
- ✅ Quick reference created (separate file)
- ✅ Code comments explain error link structure

### Git/Process
- ✅ Feature branch created: `feat/issue-28-error-boundaries`
- ✅ Meaningful commits with proper messages
- ✅ PR created with acceptance criteria verification

---

## Related Documentation

- **Issue #28**: https://github.com/pluto-atom-4/react-grapql-playground/issues/28
- **Issue #31** (Toast): Must complete before #28 integration tests
- **Issue #32** (Retry Logic): Depends on #28 error link structure
- **ISSUE-28-QUICK-REFERENCE.md**: Implementation code snippets
- **graphql-error-handler.ts**: Existing error utilities
- **apollo-hooks.ts**: Example of Apollo integration patterns

---

## Estimated Time Breakdown

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Create ErrorBoundary + tests | 30 min |
| 2 | Create error.tsx + layout update | 15 min |
| 3 | Add Apollo error link + tests | 25 min |
| 4 | Manual testing & validation | 20 min |
| 5 | Build, lint, full test run | 15 min |
| 6 | Documentation & git | 10 min |
| **Total** | | **~2 hours** |

---

## Notes for Implementation

1. **Use 'use client' directive**: Error boundaries and error.tsx are client components
2. **Follow Issue #31 patterns**: Use same toast integration, cleanup patterns
3. **Reuse existing utilities**: Use `extractErrorMessage()`, don't duplicate
4. **Comment error link**: Add inline comments explaining RetryLink setup for #32
5. **Test memory**: Run tests multiple times to detect leaks (Issue #31 showed this matters)
6. **Git commits**: Create 3 commits: ErrorBoundary, error.tsx, ErrorLink

---

**Last Updated**: April 2026  
**Status**: Ready for Implementation  
**Next Phase**: Begin with T1 (ErrorBoundary component)
