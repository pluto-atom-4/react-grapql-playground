# Issue #225: TypeScript Type Errors in build-detail-modal Tests (35+ errors)

**Status**: Ready for Implementation  
**Phase**: Phase 2 (Component & Test Type Safety)  
**Priority**: CRITICAL  
**Estimated Effort**: 2-3 hours  
**Complexity**: 🟡 Medium  
**Depends On**: Issue #214 (proper types defined)

---

## Issue Summary

**Files**: 
- `frontend/components/__tests__/build-detail-modal.test.tsx` (20+ errors)
- `frontend/components/__tests__/build-detail-modal.integration.test.tsx` (15+ errors)

**Category**: TypeScript Type Safety  
**Problem**: Mock objects don't match BuildDetail component prop types - 35+ type errors

### Impact
- **BLOCKS** TypeScript strict mode compilation
- **Depends on** Issue #214 for proper type definitions
- Component tests fail type check
- Cannot deploy until resolved

### Error Pattern

```
Type '{ id: string; status: string; result: ... }' is missing properties: 
  createdAt, updatedAt, parts, testRuns, ...
```

---

## Current Code

**File**: `frontend/components/__tests__/build-detail-modal.test.tsx`

```typescript
// BEFORE (PROBLEMATIC)
const mockBuild = {
  id: '1',
  status: 'PENDING',
  result: 'PENDING'
  // ❌ Missing: createdAt, updatedAt, parts, testRuns, etc.
};

it('should display build details', () => {
  render(
    <BuildDetailModal build={mockBuild} />  // ❌ Type mismatch
  );
});
```

### Root Causes

1. **Mock objects incomplete**: Missing required properties
2. **Type mismatch with GraphQL schema**: Properties don't align
3. **Missing timestamps**: createdAt, updatedAt not included
4. **Nested objects missing**: parts[], testRuns[]
5. **Type definitions unclear**: What's required vs optional?

---

## Solution Strategy

### Step 1: Understand Complete Build Type

**From Issue #214**, the Build type should be defined as:

```typescript
export interface Build {
  id: string;
  status: BuildStatus;  // 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED'
  parts: Part[];
  testRuns: TestRun[];
  metadata?: Record<string, any>;
  createdAt: string;    // ISO 8601 format or Date
  updatedAt: string;    // ISO 8601 format or Date
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
  completedAt?: string;
}
```

### Step 2: Create Mock Factory

**Create reusable mock factory** for consistent test data:

```typescript
// frontend/components/__tests__/mocks/build.ts
import type { Build, Part, TestRun } from '@/types/domain';

export function createMockBuild(overrides?: Partial<Build>): Build {
  const now = new Date().toISOString();
  return {
    id: '1',
    status: 'PENDING',
    parts: [],
    testRuns: [],
    metadata: undefined,
    createdAt: now,
    updatedAt: now,
    ...overrides  // Allow overriding specific properties
  };
}

export function createMockPart(overrides?: Partial<Part>): Part {
  return {
    id: '1',
    buildId: '1',
    name: 'Default Part',
    status: 'PENDING',
    ...overrides
  };
}

export function createMockTestRun(overrides?: Partial<TestRun>): TestRun {
  return {
    id: '1',
    buildId: '1',
    result: 'PASSED',
    fileUrl: '/uploads/test-report.pdf',
    completedAt: new Date().toISOString(),
    ...overrides
  };
}
```

### Step 3: Update Test Mocks

Replace inline mock objects with factory functions:

```typescript
// BEFORE
const mockBuild = {
  id: '1',
  status: 'PENDING'
};

// AFTER
const mockBuild = createMockBuild();
const mockBuild = createMockBuild({ status: 'COMPLETE' });  // With override
```

---

## Recommended Implementation

### Step 1: Verify Issue #214 Complete (5 min)

**Check status**:
```bash
# Confirm Issue #214 is merged and types defined
pnpm build 2>&1 | grep -c "apollo-hooks"

# Should show 0 errors in apollo-hooks
```

**If #214 not complete**: Wait before proceeding

---

### Step 2: Locate Mock Definitions (10 min)

**File 1**: `frontend/components/__tests__/build-detail-modal.test.tsx`

```bash
# Find mock objects
grep -n "const mock\|= {" frontend/components/__tests__/build-detail-modal.test.tsx | head -20
```

**File 2**: `frontend/components/__tests__/build-detail-modal.integration.test.tsx`

```bash
grep -n "const mock\|= {" frontend/components/__tests__/build-detail-modal.integration.test.tsx | head -20
```

---

### Step 3: Create Shared Mock Factory (20 min)

**Create new file**: `frontend/components/__tests__/mocks/build.ts`

```typescript
import type { Build, Part, TestRun, BuildStatus } from '@/types/domain';

/**
 * Factory function to create mock Build objects for testing
 * Ensures all required properties are present and typed correctly
 */
export function createMockBuild(overrides?: Partial<Build>): Build {
  const now = new Date().toISOString();
  return {
    id: '1',
    status: 'PENDING' as BuildStatus,
    parts: [],
    testRuns: [],
    metadata: {},
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

/**
 * Factory to create mock Part objects
 */
export function createMockPart(overrides?: Partial<Part>): Part {
  return {
    id: 'part-1',
    buildId: '1',
    name: 'Part A',
    status: 'PENDING',
    ...overrides
  };
}

/**
 * Factory to create mock TestRun objects
 */
export function createMockTestRun(overrides?: Partial<TestRun>): TestRun {
  return {
    id: 'run-1',
    buildId: '1',
    result: 'PASSED',
    fileUrl: '/uploads/test-report.pdf',
    completedAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create a complete mock Build with related objects
 */
export function createMockBuildWithRelations(overrides?: Partial<Build>): Build {
  return createMockBuild({
    parts: [createMockPart()],
    testRuns: [createMockTestRun()],
    ...overrides
  });
}
```

---

### Step 4: Update File 1: build-detail-modal.test.tsx (45 min)

**File**: `frontend/components/__tests__/build-detail-modal.test.tsx`

**Step 4a: Add import**

```typescript
// BEFORE
import { render, screen } from '@testing-library/react';
import BuildDetailModal from '../../build-detail-modal';

// AFTER (add mock imports)
import { render, screen } from '@testing-library/react';
import BuildDetailModal from '../../build-detail-modal';
import { createMockBuild, createMockBuildWithRelations } from './mocks/build';  // ✅ Add
```

**Step 4b: Replace mock objects in tests**

**Test 1 - Basic render**:
```typescript
// BEFORE
it('should render build details', () => {
  const build = { id: '1', status: 'PENDING' };
  render(<BuildDetailModal build={build} />);
});

// AFTER
it('should render build details', (): void => {  // ✅ Add return type
  const build = createMockBuild();  // ✅ Use factory
  render(<BuildDetailModal build={build} />);
});
```

**Test 2 - With status**:
```typescript
// BEFORE
it('should show complete status', () => {
  const build = { id: '1', status: 'COMPLETE' };
  render(<BuildDetailModal build={build} />);
});

// AFTER
it('should show complete status', (): void => {
  const build = createMockBuild({ status: 'COMPLETE' });  // ✅ Override status
  render(<BuildDetailModal build={build} />);
});
```

**Test 3 - With relations**:
```typescript
// BEFORE
it('should display parts and test runs', () => {
  const build = {
    id: '1',
    status: 'PENDING',
    parts: [{ id: 'p1' }],
    testRuns: [{ id: 'r1' }]
  };
  render(<BuildDetailModal build={build} />);
});

// AFTER
it('should display parts and test runs', (): void => {
  const build = createMockBuildWithRelations();  // ✅ Use relation factory
  render(<BuildDetailModal build={build} />);
});
```

**Pattern for all tests**:
1. Replace inline `{ id: '1', ... }` with `createMockBuild(...)`
2. Add missing return type `: void`
3. Use `Partial<Build>` override for customization

---

### Step 5: Update File 2: build-detail-modal.integration.test.tsx (45 min)

**File**: `frontend/components/__tests__/build-detail-modal.integration.test.tsx`

**Same approach as Step 4**:

1. Import mock factories
2. Replace all mock objects with factory calls
3. Add return type annotations
4. Ensure types match

```typescript
// BEFORE
import BuildDetailModal from '../../build-detail-modal';

const mockBuild = {
  id: '1',
  status: 'PENDING',
  parts: []
};

// AFTER
import BuildDetailModal from '../../build-detail-modal';
import { createMockBuild, createMockBuildWithRelations } from './mocks/build';

const mockBuild = createMockBuild();  // ✅ Factory call
```

---

### Step 6: Add Return Types to Test Functions (15 min)

**Pattern to find and fix**:

```bash
# Find test functions without return types
grep -n "it(.*() => \|describe(.*() => " \
  frontend/components/__tests__/build-detail-modal.test.tsx | \
  grep -v ": void\|: Promise"
```

**Update each found**:

```typescript
// BEFORE
it('test name', () => {

// AFTER
it('test name', (): void => {
```

---

### Step 7: Verify Mock Completeness (10 min)

**Check that all Build properties are covered**:

```bash
# Get Build type definition (from Issue #214)
grep -A 20 "export interface Build" frontend/types/domain.ts

# Compare with mock factory
cat frontend/components/__tests__/mocks/build.ts
```

**Ensure mock factory has**:
- ✅ id
- ✅ status
- ✅ parts
- ✅ testRuns
- ✅ createdAt
- ✅ updatedAt
- ✅ metadata (optional)

---

### Step 8: Run Type Check (10 min)

```bash
# Check TypeScript on both test files
pnpm tsc frontend/components/__tests__/build-detail-modal.test.tsx --noEmit
pnpm tsc frontend/components/__tests__/build-detail-modal.integration.test.tsx --noEmit

# Should show 0 errors
```

**If errors persist**:
1. Check error details: `pnpm build 2>&1 | grep "build-detail-modal"`
2. Add missing properties to mock factory
3. Recheck

---

### Step 9: Run Tests (10 min)

```bash
# Run both test files
pnpm test:frontend components/__tests__/build-detail-modal.test.tsx
pnpm test:frontend components/__tests__/build-detail-modal.integration.test.tsx

# Expected: All tests pass
```

---

### Step 10: ESLint Validation (5 min)

```bash
# Check both files
pnpm lint frontend/components/__tests__/build-detail-modal.test.tsx
pnpm lint frontend/components/__tests__/build-detail-modal.integration.test.tsx

# Should show 0 errors
```

---

## Code Changes Summary

| File | Changes | Count |
|------|---------|-------|
| `frontend/components/__tests__/mocks/build.ts` | Create new file with factories | 1 new file |
| `frontend/components/__tests__/build-detail-modal.test.tsx` | Replace mocks + add return types | 20+ |
| `frontend/components/__tests__/build-detail-modal.integration.test.tsx` | Replace mocks + add return types | 15+ |

**Total changes**: ~40 individual mock replacements

---

## Testing Strategy

### Type Checking

```bash
# TypeScript compilation
pnpm tsc --noEmit 2>&1 | grep "build-detail-modal"

# Should show 0 errors (35+ errors before, 0 after)
```

### Test Execution

```bash
# Both test files
pnpm test:frontend components/__tests__/build-detail-modal.test.tsx
pnpm test:frontend components/__tests__/build-detail-modal.integration.test.tsx

# Or all component tests
pnpm test:frontend components/__tests__

# Expected: All pass
```

### ESLint Validation

```bash
pnpm lint frontend/components/__tests__/build-detail-modal.*

# Expected: 0 errors
```

---

## Success Criteria

✅ **Acceptance Tests**:

- [ ] Mock factory created with all required Build properties
- [ ] All mock objects in both files replaced with factory calls
- [ ] All test callbacks have return type annotations
- [ ] TypeScript: `pnpm tsc` shows 0 errors (was 35+, now 0)
- [ ] Tests passing: `pnpm test:frontend` passes both files
- [ ] ESLint: `pnpm lint` shows 0 errors
- [ ] No unrelated changes

---

## Potential Pitfalls

### Pitfall 1: Incomplete Mock Factory

**Risk**: Mock object still missing properties  
**How to avoid**:
- Verify all Build interface properties in factory
- Run TypeScript check after adding factory
- Check error messages for missing properties

### Pitfall 2: Type Mismatches in Overrides

**Risk**: Overriding with wrong type  
```typescript
// WRONG: status is wrong type
createMockBuild({ status: 'INVALID' })

// RIGHT: Use correct BuildStatus value
createMockBuild({ status: 'COMPLETE' })
```

**How to avoid**:
- Check BuildStatus enum/type values
- Use TypeScript checking in IDE
- Run type check after changes

### Pitfall 3: Breaking Existing Tests

**Risk**: Changing mock data breaks test expectations  
**How to avoid**:
- Run tests immediately after changes
- Review what each test expects from mock
- Keep mock data consistent with original intent

### Pitfall 4: Forgetting Return Type Annotations

**Risk**: Tests pass but linting fails  
**How to avoid**:
- Systematically add `: void` to all test callbacks
- Search for pattern: `() => {` and check each
- Run linter to verify

### Pitfall 5: Import Path Issues

**Risk**: Mock factory import fails  
**How to avoid**:
- Verify file path: `./mocks/build`
- Check file exists: `ls frontend/components/__tests__/mocks/build.ts`
- Use TypeScript path checking in IDE

---

## Verification Checklist

### Pre-Implementation

- [ ] Issue #214 is complete (types defined)
- [ ] Locate both test files
- [ ] Understand current mock objects
- [ ] Backup current state (git)

### Implementation

- [ ] Create mock factory file
- [ ] Add factory functions for Build, Part, TestRun
- [ ] File 1: Replace all mocks + add return types
- [ ] File 2: Replace all mocks + add return types
- [ ] Review all changes (git diff)

### Validation

- [ ] TypeScript check: `pnpm tsc --noEmit`
- [ ] Tests pass: `pnpm test:frontend`
- [ ] ESLint: `pnpm lint`
- [ ] Full build: `pnpm build`
- [ ] Manual code review

### Code Review

- [ ] All mock objects replaced ✅
- [ ] Factory function complete ✅
- [ ] Return types added ✅
- [ ] No type mismatches ✅
- [ ] Tests passing ✅

---

## Review Checklist for Approver

- [ ] Mock factory properly typed ✅
- [ ] All 35+ type errors resolved ✅
- [ ] All tests passing ✅
- [ ] Return types added ✅
- [ ] Factory is reusable ✅
- [ ] Linting clean ✅

---

## Related Issues

- **Depends on**: Issue #214 (type definitions)
- **Coordinates with**: Issue #216 (return type cleanup)
- **Coordinates with**: Issue #225 (same file fixes)

---

## Additional Resources

- [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [Jest/Vitest Testing Patterns](https://vitest.dev/)
- [Factory Pattern in Testing](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Timeline

| Task | Est. Time |
|------|-----------|
| Step 1: Verify #214 complete | 5 min |
| Step 2: Locate mock definitions | 10 min |
| Step 3: Create mock factory | 20 min |
| Step 4: Update test file 1 | 45 min |
| Step 5: Update test file 2 | 45 min |
| Step 6: Add return types | 15 min |
| Step 7: Verify completeness | 10 min |
| Step 8: Type check | 10 min |
| Step 9: Run tests | 10 min |
| Step 10: ESLint validation | 5 min |
| **Total** | **175 min (~3h)** |

---

**Status**: Ready to implement (after #214)  
**Assigned to**: [Developer Name - Phase 2 Stream A]  
**Start Date**: [After Phase 1 completes]  
**Target Completion**: [Date + 3 hours]  
**Blocks**: None (parallel with #226, #227)
