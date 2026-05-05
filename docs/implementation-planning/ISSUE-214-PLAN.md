# Issue #214: Resolve Unsafe TypeScript Errors in apollo-hooks.ts

**Status**: CRITICAL - Ready for Implementation  
**Phase**: Phase 1 (Foundational Type Safety)  
**Priority**: CRITICAL  
**Estimated Effort**: 2-3 hours  
**Complexity**: 🟡 Medium  
**Blocking**: Issues #225, #226 (Phase 2)

---

## Issue Summary

**File**: `frontend/lib/apollo-hooks.ts`  
**Lines**: 128, 183, 251, 321 (+ others)  
**Category**: TypeScript Type Safety  
**Problem**: 12 type safety violations preventing strict TypeScript mode compilation

### Impact
- **BLOCKS** TypeScript strict mode deployment
- **BLOCKS** Phase 2 work (depends on proper types)
- Prevents using generated GraphQL types correctly
- Hides runtime errors at compile time
- Violates type safety standards

### ESLint Errors Breakdown

```
Total Errors: 12 across 4 functions
├─ no-unsafe-return (3 errors)
├─ no-unsafe-call (2 errors)
├─ no-unsafe-member-access (4 errors)
└─ no-unsafe-assignment (3 errors)
```

---

## Current Code

**File**: `frontend/lib/apollo-hooks.ts`

### Error Location 1: Line 128 - Return Type `any[]`

```typescript
// BEFORE (PROBLEMATIC)
function buildMockDataWithRelations() {
  return [  // ❌ Error: no-unsafe-return
    {
      id: '1',
      status: 'PENDING',
      ...otherData  // ❌ Error: unsafe spread of any
    }
  ];  // Returns any[]
}
```

### Error Location 2: Line 183 - Return Type `any` with `.map()`

```typescript
// BEFORE (PROBLEMATIC)
function transformBuildResponse(response: any) {  // ❌ Parameter is any
  return response.map((build: any) => ({  // ❌ Error: no-unsafe-call
    ...build,  // ❌ Error: no-unsafe-member-access
  }));
}
```

### Error Location 3: Line 251 - Nested Object Spread

```typescript
// BEFORE (PROBLEMATIC)
function mergeBuildData(build: any) {
  const merged = {
    ...build,  // ❌ Error: no-unsafe-member-access
    parts: [
      ...build.parts,  // ❌ Error: no-unsafe-member-access
    ]
  };
  return merged;  // ❌ Error: no-unsafe-return
}
```

### Error Location 4: Line 321 - Member Access on `any`

```typescript
// BEFORE (PROBLEMATIC)
function getTestRuns(build: any) {
  return build.testRuns;  // ❌ Error: no-unsafe-member-access
}
```

---

## Root Cause Analysis

### Why This Happened

1. **Quick prototyping**: Used `any` to get things working quickly
2. **Missing type definitions**: Didn't import or define proper GraphQL types
3. **Legacy code**: Pre-dates TypeScript strict mode enforcement
4. **Type generation not complete**: GraphQL code generator types not integrated

### Why It Matters (Type Safety Perspective)

```typescript
// UNSAFE: any type loses all type information
function process(build: any) {
  return build.nonExistentField;  // ✅ No error at compile time
                                  // ❌ Runtime error: undefined
}

// SAFE: Proper types catch errors early
interface Build {
  id: string;
  status: BuildStatus;
  // nonExistentField doesn't exist
}

function process(build: Build) {
  return build.nonExistentField;  // ❌ TypeScript error at compile time
}
```

---

## Solution Strategy

### Step 1: Identify GraphQL Types Available

**Check what types exist** in GraphQL codegen output:

```bash
# Find GraphQL type definitions
find frontend -name "*.ts" -o -name "*.tsx" | xargs grep -l "export type Build\|export interface Build" | head -5

# Common locations:
# - frontend/lib/__generated__/graphql.ts
# - frontend/graphql/generated.ts
# - types/graphql-types.ts
```

**Expected types**:
```typescript
// From GraphQL codegen
export type Build = {
  id: string;
  status: BuildStatus;
  parts: Part[];
  testRuns: TestRun[];
  createdAt: string;
  updatedAt: string;
};

export type Part = {
  id: string;
  buildId: string;
  name: string;
};

export type TestRun = {
  id: string;
  buildId: string;
  result: TestResult;
  fileUrl: string;
};
```

### Step 2: Create Missing Type Definitions

If types don't exist, create them:

```typescript
// frontend/types/domain.ts
export interface Build {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
  parts: Part[];
  testRuns: TestRun[];
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Part {
  id: string;
  buildId: string;
  name: string;
  status: string;
}

export interface TestRun {
  id: string;
  buildId: string;
  result: 'PASSED' | 'FAILED';
  fileUrl: string;
  completedAt?: Date | string;
}
```

### Step 3: Replace `any` with Specific Types

Transform each problem area from `any` to proper types.

---

## Recommended Implementation

### Step 1: Audit Current Types (20 min)

```bash
# Find all `any` usages in apollo-hooks.ts
grep -n ": any\|: any)" frontend/lib/apollo-hooks.ts

# Expected output (locations to fix):
# Line 128: return type analysis
# Line 183: parameter types
# Line 251: nested spread
# Line 321: member access
```

**Document each location**:

| Line | Function | Type Issue | Current | Target |
|------|----------|-----------|---------|--------|
| 128 | buildMockData | Return type | `any[]` | `Build[]` |
| 183 | transformResponse | Param type | `any` | `Build[]` |
| 251 | mergeBuildData | Member access | `any` | `Build` |
| 321 | getTestRuns | Member access | `any` | `Build` |

### Step 2: Import GraphQL Types (10 min)

**File**: `frontend/lib/apollo-hooks.ts` (top of file)

**Before**:
```typescript
import { useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
```

**After**:
```typescript
import { useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import type {
  Build,
  Part,
  TestRun,
  BuildStatus,
  BuildDetailQuery,
  BuildDetailQueryVariables
} from '../__generated__/graphql';  // Adjust path as needed
```

### Step 3: Fix Line 128 - buildMockData Function (15 min)

**Before**:
```typescript
// Line 120-130 (PROBLEMATIC)
function buildMockDataWithRelations() {
  return [
    {
      id: '1',
      status: 'PENDING',
      parts: [],
      testRuns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];  // ❌ Return type is any[]
}
```

**After**:
```typescript
// Line 120-130 (FIXED)
function buildMockDataWithRelations(): Build[] {  // ✅ Explicit return type
  return [
    {
      id: '1',
      status: 'PENDING',  // ✅ Type matches BuildStatus
      parts: [],
      testRuns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
```

**Key changes**:
- Add explicit return type `: Build[]`
- Remove `any` inference
- Verify all properties match `Build` interface

### Step 4: Fix Line 183 - transformBuildResponse (15 min)

**Before**:
```typescript
// Line 175-190 (PROBLEMATIC)
function transformBuildResponse(response: any) {  // ❌ any parameter
  return response.map((build: any) => ({  // ❌ any in map callback
    ...build,  // ❌ unsafe spread
    id: build.id  // ❌ unsafe member access
  }));
}
```

**After**:
```typescript
// Line 175-190 (FIXED)
function transformBuildResponse(response: Build[]): Build[] {  // ✅ Proper types
  return response.map((build: Build) => ({  // ✅ Typed parameter
    ...build,  // ✅ Safe spread (Build type known)
    id: build.id  // ✅ Safe member access
  }));
}
```

**Key changes**:
- Change parameter: `response: any` → `response: Build[]`
- Change return type: (implicit) → `: Build[]`
- Change callback: `(build: any)` → `(build: Build)`

### Step 5: Fix Line 251 - mergeBuildData (15 min)

**Before**:
```typescript
// Line 245-260 (PROBLEMATIC)
function mergeBuildData(build: any) {  // ❌ any type
  const merged = {
    ...build,  // ❌ unsafe spread
    parts: [
      ...(build.parts || [])  // ❌ unsafe member access
    ]
  };
  return merged;  // ❌ returns any
}
```

**After**:
```typescript
// Line 245-260 (FIXED)
function mergeBuildData(build: Build): Build {  // ✅ Proper types
  const merged: Build = {  // ✅ Explicit variable type
    ...build,  // ✅ Safe spread
    parts: [
      ...(build.parts || [])  // ✅ Safe member access
    ] as Part[],  // ✅ Type assertion if needed
    testRuns: build.testRuns || []  // ✅ Typed default
  };
  return merged;
}
```

**Key changes**:
- Parameter: `build: any` → `build: Build`
- Return type: (implicit) → `: Build`
- Variable type: `const merged = ` → `const merged: Build = `

### Step 6: Fix Line 321 - getTestRuns (10 min)

**Before**:
```typescript
// Line 315-325 (PROBLEMATIC)
function getTestRuns(build: any) {  // ❌ any type
  return build.testRuns;  // ❌ unsafe member access
}
```

**After**:
```typescript
// Line 315-325 (FIXED)
function getTestRuns(build: Build): TestRun[] {  // ✅ Proper types
  return build.testRuns || [];  // ✅ Safe member access + default
}
```

**Key changes**:
- Parameter: `build: any` → `build: Build`
- Return type: (implicit) → `: TestRun[]`
- Add default: `build.testRuns || []`

### Step 7: Search for Other `any` Usages (10 min)

```bash
# Find all remaining `any` in file
grep -n ": any" frontend/lib/apollo-hooks.ts

# Fix any others found
```

**Handle each**:
- Replace with specific type
- Or use `unknown` if truly unknown
- Or add `// eslint-disable-line` with comment explaining why

### Step 8: Validate with TypeScript (10 min)

```bash
# Run TypeScript compiler on file
pnpm tsc frontend/lib/apollo-hooks.ts --noEmit

# Or run full build
pnpm build 2>&1 | grep apollo-hooks

# Should show 0 errors
```

**Expected output**:
```
✅ No TypeScript errors
✅ apollo-hooks.ts compiles successfully
```

### Step 9: Run ESLint (5 min)

```bash
# Check file for remaining issues
pnpm lint frontend/lib/apollo-hooks.ts

# Should show 0 errors
```

**Expected**:
```
✅ No ESLint errors
✅ 0 @typescript-eslint/no-unsafe-* errors
```

### Step 10: Test All Dependent Code (15 min)

```bash
# Run tests for any components using these hooks
pnpm test:frontend lib/__tests__ --watch

# Check for breakage
```

---

## Code Changes Summary

| Location | Change | Before | After | Impact |
|----------|--------|--------|-------|--------|
| Line 128 | Add return type | `return [...]` | `): Build[]` | Return type explicit |
| Line 183 | Fix parameter | `response: any` | `response: Build[]` | Type safe |
| Line 183 | Fix return | (implicit) | `: Build[]` | Type safe |
| Line 251 | Fix parameter | `build: any` | `build: Build` | Type safe |
| Line 251 | Fix return | (implicit) | `: Build` | Type safe |
| Line 321 | Fix parameter | `build: any` | `build: Build` | Type safe |
| Line 321 | Fix return | (implicit) | `: TestRun[]` | Type safe |
| File top | Add imports | (none) | Import types | Dependencies |

**Total changes**: ~7 edits (type annotations + imports)

---

## Testing Strategy

### ESLint Type Checks

```bash
# Run ESLint on specific file
pnpm lint frontend/lib/apollo-hooks.ts --format=pretty

# Expected: 0 errors
```

### TypeScript Compilation

```bash
# Check TypeScript without emitting
pnpm tsc frontend/lib/apollo-hooks.ts --noEmit

# Or full build
pnpm build

# Expected: 0 errors in apollo-hooks.ts
```

### Unit Tests

```bash
# Run tests for apollo-hooks
pnpm test:frontend lib/__tests__/apollo-hooks.test.ts --watch

# Expected: All tests pass
```

### Dependent Component Tests

```bash
# Run tests for components using these hooks
pnpm test:frontend components/__tests__

# Expected: No regressions
```

---

## Success Criteria

✅ **Acceptance Tests**:

- [ ] All `any` types replaced with specific types (Build, Part, TestRun, etc.)
- [ ] Return types explicit on all functions
- [ ] Parameters typed correctly
- [ ] `pnpm lint` shows 0 errors in apollo-hooks.ts
- [ ] `pnpm build` completes with 0 TypeScript errors
- [ ] `pnpm test:frontend` passes all tests
- [ ] No unrelated changes included
- [ ] Types properly exported for Phase 2

---

## Potential Pitfalls

### Pitfall 1: Missing GraphQL Type Imports

**Risk**: Types don't exist or wrong import path  
**How to avoid**:
- Verify types exist: `grep -r "export type Build" frontend`
- Check correct import path: look at other files using types
- If types missing, create `frontend/types/domain.ts`

### Pitfall 2: Incorrect Type Spreads

**Risk**: TypeScript errors after fix  
```typescript
// WRONG: Can't spread any into Build
const merged: Build = { ...anyValue };

// RIGHT: Type the value first or use assertion
const merged: Build = { ...(anyValue as Build) };
```

**How to avoid**:
- Always ensure spread source has compatible type
- Use type assertions sparingly with explanation
- Test each fix with TypeScript compiler

### Pitfall 3: Breaking Existing Functionality

**Risk**: Typing changes break mock data or hook usage  
**How to avoid**:
- Run tests after each fix
- Test mocked data matches new types
- Keep default/fallback values for optional fields

### Pitfall 4: Cascading Errors

**Risk**: Fixing one error reveals 5 more  
**How to avoid**:
- Fix incrementally (one function at a time)
- Run TypeScript check after each fix
- Don't try to fix all at once

### Pitfall 5: Creating Circular Dependencies

**Risk**: Importing types that import from apollo-hooks  
**How to avoid**:
- Be careful with type imports
- Verify import order: no circular dependencies
- Use `import type` for type-only imports

---

## Verification Checklist

### Pre-Implementation

- [ ] Locate `frontend/lib/apollo-hooks.ts`
- [ ] Identify GraphQL type definitions (location)
- [ ] Understand current mock data structure
- [ ] Backup current file (git will handle it)
- [ ] Review all uses of these hooks

### Implementation

- [ ] Add type imports at top of file
- [ ] Fix line 128 function return type
- [ ] Fix line 183 function parameters
- [ ] Fix line 251 function types
- [ ] Fix line 321 function types
- [ ] Search for other `any` usages
- [ ] Save file

### Validation

- [ ] TypeScript check: `pnpm tsc apollo-hooks.ts --noEmit`
- [ ] ESLint check: `pnpm lint frontend/lib/apollo-hooks.ts`
- [ ] Run tests: `pnpm test:frontend lib/__tests__`
- [ ] Full build: `pnpm build` (should complete, 0 errors)
- [ ] Check dependent code still works

### Code Review

- [ ] All `any` types replaced ✅
- [ ] Return types explicit ✅
- [ ] Parameters typed ✅
- [ ] No circular imports ✅
- [ ] Tests still pass ✅
- [ ] Type definitions correct ✅

---

## Review Checklist for Approver

- [ ] All ESLint type errors fixed ✅
- [ ] Proper types imported or defined ✅
- [ ] No `any` types remaining (except where necessary) ✅
- [ ] Return type annotations added ✅
- [ ] Tests passing with new types ✅
- [ ] No unintended side effects ✅
- [ ] Unblocks Phase 2 work ✅

---

## Phase 2 Unblocking

After this issue completes, Phase 2 can begin:

- **Issue #225**: build-detail-modal tests (depends on Build type)
- **Issue #226**: error-link.test.ts (depends on type definitions)
- **Issue #227**: build-detail-modal.tsx (depends on return types)

---

## Additional Resources

- [TypeScript Handbook: Type Annotations](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [ESLint @typescript-eslint no-unsafe-* rules](https://typescript-eslint.io/rules/no-unsafe-return/)
- [GraphQL Code Generator Types](https://www.graphql-code-generator.com/docs/plugins/typescript)
- [React Apollo Hooks](https://www.apollographql.com/docs/react/api/react/hooks/)

---

## Related Issues

- **Depends on**: None (Phase 1 - no dependencies)
- **Blocks**: #225 (build-detail-modal tests)
- **Blocks**: #226 (error-link tests)
- **Coordinates with**: #216 (return type cleanup)

---

## Timeline

| Task | Est. Time |
|------|-----------|
| Step 1: Audit types | 20 min |
| Step 2: Import types | 10 min |
| Step 3: Fix line 128 | 15 min |
| Step 4: Fix line 183 | 15 min |
| Step 5: Fix line 251 | 15 min |
| Step 6: Fix line 321 | 10 min |
| Step 7: Find other `any` | 10 min |
| Step 8: TypeScript validation | 10 min |
| Step 9: ESLint check | 5 min |
| Step 10: Test all code | 15 min |
| **Total** | **125 min (~2h)** |

---

**Status**: CRITICAL - Ready to implement immediately  
**Assigned to**: [Developer Name - Phase 1 Lead]  
**Start Date**: [Date]  
**Target Completion**: [Date + 2 hours]  
**Blocks**: Phase 2 work (do not start #225, #226, #227 until this completes)
