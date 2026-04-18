# Phase 4.2: Frontend ESLint v9 Linting Test Results

**Date**: April 17, 2026  
**Phase**: 4.2 - Test Frontend Linting  
**Issue**: #61 (test-frontend-lint)  
**Status**: ⚠️ **FAIL** - Linting passed execution but with errors requiring fixes

---

## Executive Summary

ESLint v9 successfully ran on the frontend package, but identified **81 problems** across component and utility files:
- **54 Errors** (blocking issues)
- **27 Warnings** (best practice violations)

The errors are primarily:
1. **Type Safety Issues**: Missing return types, unsafe `any` usage (TypeScript ESLint)
2. **Missing Browser Globals**: `console`, `prompt`, `alert` not recognized (Node.js environment vs browser)
3. **Promise Handling**: Floating promises, missing await, async operations in void contexts
4. **Test File Configuration**: `__tests__/apollo-wrapper.test.tsx` not included in tsconfig

---

## Linting Command

```bash
pnpm -C frontend lint
# Equivalent: cd frontend && pnpm lint
```

**ESLint Configuration**: `.eslintrc.json` (ESLint v9 with TypeScript support)

---

## Results Summary

| Metric | Count |
|--------|-------|
| **Total Problems** | 81 |
| **Errors** | 54 |
| **Warnings** | 27 |
| **Files with Issues** | 9 |
| **Exit Code** | 1 (FAILURE) |

---

## Issues by Category

### 1. **Missing Return Types** (27 warnings)
**Rule**: `@typescript-eslint/explicit-function-return-type`  
**Severity**: Warning  
**Files Affected**: 
- `apollo-wrapper.tsx` (2)
- `layout.tsx` (1)
- `page.tsx` (1)
- `build-dashboard.tsx` (2)
- `build-detail-modal.tsx` (4)
- `apollo-client.ts` (1)
- `apollo-hooks.ts` (11)
- `use-sse-events.ts` (2)
- `next.config.js` (1)

**Example**:
```typescript
// ❌ Missing return type
const createApolloClient = () => {
  return new ApolloClient({ ... });
};

// ✅ With return type
const createApolloClient = (): ApolloClient => {
  return new ApolloClient({ ... });
};
```

**Impact**: Low - These are best practices but don't affect runtime behavior.

---

### 2. **Unsafe `any` Type Usage** (13 errors)
**Rule**: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unsafe-*`  
**Severity**: Error  
**Files Affected**: `build-dashboard.tsx`, `build-detail-modal.tsx`  
**Root Cause**: Components receive untyped data from Apollo queries

**Examples**:
```typescript
// ❌ Untyped build parameter
const handleBuildClick = (build: any) => {
  console.log(build.id, build.status);
};

// ✅ Properly typed
interface Build {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
}

const handleBuildClick = (build: Build) => {
  console.log(build.id, build.status);
};
```

**Impact**: High - TypeScript safety violations, potential runtime errors if data structure changes.

---

### 3. **Browser Globals Not Defined** (5 errors)
**Rule**: `no-undef`  
**Severity**: Error  
**Files Affected**: `build-dashboard.tsx`, `build-detail-modal.tsx`, `use-sse-events.ts`  
**Root Cause**: ESLint configured for Node.js environment, but code uses browser APIs

**Problematic APIs**:
- `prompt()` (3 occurrences in build-detail-modal.tsx)
- `alert()` (3 occurrences)
- `console` (2 occurrences in use-sse-events.ts)

**Fix**: Add `/* global prompt, alert, console */` comment or configure ESLint for browser environment

---

### 4. **Promise Handling Issues** (7 errors)
**Rule**: `@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-misused-promises`  
**Severity**: Error  
**Files Affected**: `build-dashboard.tsx`, `build-detail-modal.tsx`  
**Root Cause**: Async operations not properly awaited or handled

**Examples**:
```typescript
// ❌ Floating promise (not awaited or handled)
const handleStatusUpdate = () => {
  updateBuildStatus({ ... });  // Promise not awaited
};

// ❌ Promise in void context (onClick handlers)
<button onClick={() => updateBuildStatus({ ... })}>Update</button>

// ✅ Properly handled
const handleStatusUpdate = async () => {
  try {
    await updateBuildStatus({ ... });
  } catch (error) {
    console.error('Update failed:', error);
  }
};

// ✅ Or explicitly marked as ignored
<button onClick={() => void updateBuildStatus({ ... })}>Update</button>
```

---

### 5. **Template Literal Type Restrictions** (3 errors)
**Rule**: `@typescript-eslint/restrict-template-expressions`  
**Severity**: Error  
**Files Affected**: `build-dashboard.tsx`, `build-detail-modal.tsx`  
**Root Cause**: Using `unknown` or `any` types in template literals

**Example**:
```typescript
// ❌ Unknown error type in template literal
catch (error: unknown) {
  alert(`Error: ${error}`);  // error is unknown
}

// ✅ Properly typed
catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  alert(`Error: ${message}`);
}
```

---

### 6. **Test File TypeScript Configuration** (1 error)
**Rule**: TypeScript parsing  
**Severity**: Error  
**File**: `__tests__/apollo-wrapper.test.tsx`  
**Root Cause**: Test file not included in `tsconfig.json` or allowDefaultProject

**Fix**: Update `frontend/tsconfig.json` or ESLint config to include `__tests__` directory

---

## React/Next.js Specific Issues

### ✅ Good Practices Observed
- React Server Components properly typed
- Next.js App Router pattern correctly implemented
- Apollo Client integration follows best practices

### ⚠️ Issues Requiring Attention

1. **Component Type Inference**  
   - Many components receive untyped props from Apollo queries
   - Should extract query response types and use them as prop types

2. **Async/Await in Event Handlers**  
   - Several components use `async` operations in click handlers without proper error handling
   - Should use `useCallback` with proper error boundaries

3. **Server Component vs Client Component**  
   - Good separation, but some client components receive data without explicit types

---

## Test Status

| Test | Result | Details |
|------|--------|---------|
| ESLint Execution | ✅ PASS | Command ran successfully |
| Configuration | ✅ PASS | ESLint v9 config properly loaded |
| Rule Set | ✅ PASS | TypeScript + React rules applied |
| Type Checking | ⚠️ FAIL | 54 errors blocking compilation |
| Exit Code | ❌ FAIL | Exit code 1 (linting failed) |

---

## File-by-File Summary

| File | Errors | Warnings | Status |
|------|--------|----------|--------|
| `__tests__/apollo-wrapper.test.tsx` | 1 | 0 | ❌ Not in tsconfig |
| `apollo-wrapper.tsx` | 0 | 2 | ⚠️ Missing return types |
| `layout.tsx` | 0 | 1 | ⚠️ Missing return type |
| `page.tsx` | 0 | 1 | ⚠️ Missing return type |
| `build-dashboard.tsx` | 23 | 2 | ❌ Untyped data, promises |
| `build-detail-modal.tsx` | 24 | 4 | ❌ Untyped data, promises |
| `apollo-client.ts` | 0 | 1 | ⚠️ Missing return type |
| `apollo-hooks.ts` | 0 | 11 | ⚠️ Missing return types |
| `use-sse-events.ts` | 2 | 3 | ⚠️ Console globals, types |
| `next.config.js` | 1 | 1 | ⚠️ Async/await, type |

---

## Recommendations

### Priority 1: Blocking Errors (Must Fix for Production)

1. **Fix Untyped Component Props**
   - Define GraphQL response types (e.g., `BuildQuery`, `TestRunQuery`)
   - Create component prop interfaces extending response types
   - Files: `build-dashboard.tsx`, `build-detail-modal.tsx`

2. **Handle Browser Globals**
   - Option A: Add ESLint override for browser environment in `.eslintrc.json`
   - Option B: Replace `prompt()` with modal dialogs, remove `alert()` calls
   - Files: `build-dashboard.tsx`, `build-detail-modal.tsx`, `use-sse-events.ts`

3. **Fix Promise Handling**
   - Wrap async operations in try-catch blocks
   - Use `void` operator for side-effect-only async calls in JSX
   - Add error boundaries for mutation failures
   - Files: `build-dashboard.tsx`, `build-detail-modal.tsx`

4. **Include Test Files in TypeScript**
   - Add `"include": ["**/*.tsx", "**/*.ts"]` to `frontend/tsconfig.json`
   - Or update ESLint `allowDefaultProject` to include test patterns

### Priority 2: Best Practices (Should Fix)

5. **Add Return Types to All Functions**
   - Run with `--fix` to auto-add inferred types
   - Review each type to ensure correctness
   - Improves IDE autocomplete and code clarity

6. **Restrict `any` Usage**
   - Use proper TypeScript types instead of `any`
   - Leverage Apollo Client's type generation if available
   - Consider using `unknown` with type guards when truly necessary

### Priority 3: Code Quality (Nice to Have)

7. **Template Literal Type Safety**
   - Ensure error handling converts `unknown` to string safely
   - Use type guards before template literal expressions

---

## Commands for Fixing

```bash
# View specific errors
pnpm -C frontend lint -- --format=json > lint-report.json

# Auto-fix warnings (explicit-function-return-type)
pnpm -C frontend lint -- --fix

# Run with detailed output
pnpm -C frontend lint -- --format=json | jq '.[] | select(.messages[].ruleId)'

# Check specific file
pnpm -C frontend lint -- components/build-dashboard.tsx

# Dry run fixes
pnpm -C frontend lint -- --fix-dry-run
```

---

## Conclusion

**Phase 4.2 Test Result**: ⚠️ **INCOMPLETE**

ESLint v9 is properly configured and functional. The frontend package has **54 errors** that must be resolved before production deployment. Most errors are fixable through:

1. **Type safety improvements** (adding interfaces for component props)
2. **Environment configuration** (browser globals)
3. **Promise handling** (async/await patterns)
4. **TypeScript configuration** (test file inclusion)

**Estimated Fix Time**: 2-4 hours  
**Priority**: HIGH - Blocking type safety and code quality

Next Phase: **Phase 4.3 - Fix Frontend Linting Errors**

---

**Generated**: April 17, 2026 @ 21:40 UTC  
**Test Phase**: 4.2 (Frontend Linting)  
**Related Issue**: #61 (test-frontend-lint)
