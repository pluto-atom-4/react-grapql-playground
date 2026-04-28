# How to Apply Type-Conscious Patterns to Other Tests

This guide shows how to apply the refactoring patterns from `sse-cache-updates.test.ts` to other test files in your project.

## Quick Checklist

Use this checklist for refactoring any test file that uses Apollo Cache operations:

- [ ] Identify all GraphQL query shapes in your test
- [ ] Create TypeScript interfaces for each query result
- [ ] Create type guard functions for runtime verification
- [ ] Extract cache helper functions (read/write patterns)
- [ ] Replace all `cache.readQuery()` calls with typed generics
- [ ] Add type guards before property access
- [ ] Remove `@typescript-eslint/no-unsafe-member-access` eslint-disable
- [ ] Run tests to ensure they pass
- [ ] Review type checking with `tsc --noEmit`

---

## Step-by-Step Migration Guide

### Step 1: Identify Query Types

Look for all distinct GraphQL query shapes in your test:

```typescript
// In your test file, find these patterns:
const result = cache.readQuery({ query: GET_BUILDS });
const result = cache.readQuery({ query: BUILD_DETAIL_QUERY });
const result = cache.readQuery({ query: GET_PARTS });
```

Each unique query gets its own result type.

### Step 2: Create Interface Definitions

For each query, create an interface that matches the query shape:

**Example 1: Simple List Query**
```graphql
query GetBuilds {
  builds {
    id
    name
    status
  }
}
```

```typescript
interface GetBuildsResult {
  builds: Array<{
    __typename: 'Build';
    id: string;
    name: string;
    status: BuildStatus;
  }>;
}
```

**Example 2: Nested Query**
```graphql
query GetBuildDetail($id: ID!) {
  build(id: $id) {
    id
    name
    parts {
      id
      name
      sku
    }
  }
}
```

```typescript
interface GetBuildDetailResult {
  build: {
    __typename: 'Build';
    id: string;
    name: string;
    parts: Array<{
      __typename: 'Part';
      id: string;
      name: string;
      sku: string;
    }>;
  };
}
```

### Step 3: Create Type Guards

For each interface, create a type guard function:

```typescript
function isGetBuildsResult(value: unknown): value is GetBuildsResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'builds' in value &&
    Array.isArray((value as Record<string, unknown>).builds)
  );
}

function isGetBuildDetailResult(value: unknown): value is GetBuildDetailResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'build' in value &&
    typeof (value as Record<string, unknown>).build === 'object'
  );
}
```

### Step 4: Create Cache Helpers

For each query type, create read and write helpers:

```typescript
/**
 * Read builds from cache with full type safety
 */
function readBuildsFromCache(
  cache: InMemoryCache,
  query: DocumentNode
): Array<{ id: string; name: string; status: BuildStatus }> {
  const result = cache.readQuery<GetBuildsResult>({ query });
  if (isGetBuildsResult(result)) {
    return result.builds;
  }
  return [];
}

/**
 * Write builds to cache with full type safety
 */
function writeBuildsToCache(
  cache: InMemoryCache,
  query: DocumentNode,
  builds: Array<{ __typename: 'Build'; id: string; name: string; status: BuildStatus }>
): void {
  cache.writeQuery<GetBuildsResult>({
    query,
    data: { builds },
  });
}
```

### Step 5: Update Test Cases

**Before**:
```typescript
it('test case', () => {
  cache.writeQuery({
    query: GET_BUILDS,
    data: {
      builds: [
        { __typename: 'Build', id: 'b1', name: 'Build 1', status: BuildStatus.Pending },
      ],
    },
  });

  const result = cache.readQuery({ query: GET_BUILDS });
  expect(result?.builds).toHaveLength(1);
  expect(result?.builds[0].id).toBe('b1');
});
```

**After**:
```typescript
it('test case', () => {
  writeBuildsToCache(cache, GET_BUILDS, [
    { __typename: 'Build', id: 'b1', name: 'Build 1', status: BuildStatus.Pending },
  ]);

  const result = cache.readQuery<GetBuildsResult>({ query: GET_BUILDS });
  if (result && isGetBuildsResult(result)) {
    expect(result.builds).toHaveLength(1);
    expect(result.builds[0].id).toBe('b1');
  }
});
```

---

## Example: Refactoring `apollo-hooks.test.tsx`

Let's walk through a complete example.

### Original Test (Unsafe)

```typescript
// apollo-hooks.test.tsx - existing test
describe('Apollo Hooks', () => {
  it('useBuilds returns builds from cache', () => {
    const cache = new InMemoryCache();

    cache.writeQuery({
      query: BUILDS_QUERY,
      data: {
        builds: [
          {
            __typename: 'Build',
            id: 'b1',
            name: 'Build 1',
            status: BuildStatus.Pending,
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      },
    });

    const result = cache.readQuery({ query: BUILDS_QUERY });
    expect(result?.builds).toHaveLength(1);
    expect(result?.builds[0].name).toBe('Build 1');
  });
});
```

**Unsafe Issues**:
- ❌ `result` has type `unknown`
- ❌ `result?.builds` might not exist
- ❌ No type checking on nested properties

### Refactored Test (Type-Safe)

```typescript
// apollo-hooks.test.tsx - refactored
// ============================================================================
// Type Definitions
// ============================================================================

interface BuildNode {
  __typename: 'Build';
  id: string;
  name: string;
  status: BuildStatus;
  createdAt: string;
  description?: string;
}

interface GetBuildsQueryResult {
  builds: BuildNode[];
}

// ============================================================================
// Type Guards
// ============================================================================

function isGetBuildsQueryResult(value: unknown): value is GetBuildsQueryResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'builds' in value &&
    Array.isArray((value as Record<string, unknown>).builds)
  );
}

// ============================================================================
// Cache Helpers
// ============================================================================

function readBuildsFromCache(
  cache: InMemoryCache,
  query: DocumentNode
): BuildNode[] {
  const result = cache.readQuery<GetBuildsQueryResult>({ query });
  if (isGetBuildsQueryResult(result)) {
    return result.builds;
  }
  return [];
}

function writeBuildsToCache(
  cache: InMemoryCache,
  query: DocumentNode,
  builds: BuildNode[]
): void {
  cache.writeQuery<GetBuildsQueryResult>({
    query,
    data: { builds },
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('Apollo Hooks', () => {
  it('useBuilds returns builds from cache', () => {
    const cache = new InMemoryCache();

    const build: BuildNode = {
      __typename: 'Build',
      id: 'b1',
      name: 'Build 1',
      status: BuildStatus.Pending,
      createdAt: '2026-01-01T00:00:00Z',
    };

    writeBuildsToCache(cache, BUILDS_QUERY, [build]);

    const result = cache.readQuery<GetBuildsQueryResult>({ query: BUILDS_QUERY });
    expect(result).toBeDefined();
    expect(isGetBuildsQueryResult(result)).toBe(true);

    if (result && isGetBuildsQueryResult(result)) {
      expect(result.builds).toHaveLength(1);
      expect(result.builds[0].name).toBe('Build 1');
      expect(result.builds[0].status).toBe(BuildStatus.Pending);
    }
  });
});
```

**Type-Safe Benefits**:
- ✅ Each type is explicit and verified
- ✅ Type guards ensure runtime safety
- ✅ Helpers reduce boilerplate
- ✅ IDE autocomplete works perfectly
- ✅ Easy to refactor across multiple tests

---

## Reusable Test Utilities Module

To avoid duplicating helpers across test files, create a shared utility file:

**File**: `frontend/lib/__tests__/cache-test-utils.ts`

```typescript
import { InMemoryCache, DocumentNode } from '@apollo/client';
import { BuildStatus, TestStatus } from '../apollo-hooks';

// ============================================================================
// Type Definitions
// ============================================================================

export interface BuildNode {
  __typename: 'Build';
  id: string;
  name: string;
  status: BuildStatus;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PartNode {
  __typename: 'Part';
  id: string;
  name: string;
  sku: string;
  quantity?: number;
  buildId?: string;
  createdAt?: string;
}

export interface TestRunNode {
  __typename: 'TestRun';
  id: string;
  status: TestStatus;
  result: string;
  fileUrl?: string;
  buildId?: string;
  submittedAt?: string;
  completedAt?: string | null;
}

export interface GetBuildsResult {
  builds: BuildNode[];
}

export interface GetBuildDetailResult {
  build: BuildNode & {
    parts: PartNode[];
    testRuns: TestRunNode[];
  };
}

// ============================================================================
// Type Guards
// ============================================================================

export function isGetBuildsResult(value: unknown): value is GetBuildsResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'builds' in value &&
    Array.isArray((value as Record<string, unknown>).builds)
  );
}

export function isGetBuildDetailResult(value: unknown): value is GetBuildDetailResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'build' in value &&
    typeof (value as Record<string, unknown>).build === 'object'
  );
}

// ============================================================================
// Cache Helpers
// ============================================================================

export function readBuildsFromCache(
  cache: InMemoryCache,
  query: DocumentNode
): BuildNode[] {
  const result = cache.readQuery<GetBuildsResult>({ query });
  if (isGetBuildsResult(result)) {
    return result.builds;
  }
  return [];
}

export function writeBuildsToCache(
  cache: InMemoryCache,
  query: DocumentNode,
  builds: BuildNode[]
): void {
  cache.writeQuery<GetBuildsResult>({
    query,
    data: { builds },
  });
}

export function readBuildDetailFromCache(
  cache: InMemoryCache,
  query: DocumentNode
): GetBuildDetailResult['build'] | null {
  const result = cache.readQuery<GetBuildDetailResult>({ query });
  if (isGetBuildDetailResult(result)) {
    return result.build;
  }
  return null;
}

export function writeBuildDetailToCache(
  cache: InMemoryCache,
  query: DocumentNode,
  build: GetBuildDetailResult['build']
): void {
  cache.writeQuery<GetBuildDetailResult>({
    query,
    data: { build },
  });
}
```

Then use it in any test file:

```typescript
import {
  BuildNode,
  GetBuildsResult,
  isGetBuildsResult,
  readBuildsFromCache,
  writeBuildsToCache,
} from './cache-test-utils';

// Now all tests can use these helpers!
```

---

## Test Files to Refactor (Priority Order)

1. **High Priority** (Heavy cache usage):
   - [ ] `frontend/lib/__tests__/apollo-hooks.test.tsx` - Multiple cache writes
   - [ ] `frontend/__tests__/integration/multi-user.test.tsx` - Cache isolation testing
   - [ ] `frontend/lib/__tests__/issue-6-integration-flows.test.ts` - Integration scenarios

2. **Medium Priority** (Some cache usage):
   - [ ] `frontend/lib/__tests__/optimistic-updates.test.tsx` - Optimistic response caching
   - [ ] `frontend/lib/__tests__/graphql-queries.test.ts` - Query result handling

3. **Low Priority** (Minimal cache usage):
   - [ ] Component tests - Usually mock Apollo instead of using real cache
   - [ ] Unit tests - Mostly test logic, not cache

---

## Common Patterns to Look For

### Pattern A: Query with Variables

```typescript
// Before: Not type-safe
cache.readQuery({ query: QUERY, variables: { id: 'build-1' } });

// After: Type-safe
interface GetBuildWithIdResult {
  build: BuildNode;
}

function readBuildFromCache(
  cache: InMemoryCache,
  query: DocumentNode,
  id: string
): BuildNode | null {
  const result = cache.readQuery<GetBuildWithIdResult>({
    query,
    variables: { id },
  });
  if (result?.build) return result.build;
  return null;
}
```

### Pattern B: Paginated Queries

```typescript
interface GetBuildsPageResult {
  builds: {
    nodes: BuildNode[];
    pageInfo: {
      hasNextPage: boolean;
      cursor: string;
    };
  };
}

function readBuildsPageFromCache(
  cache: InMemoryCache,
  query: DocumentNode,
  first: number,
  after?: string
): Array<{ nodes: BuildNode[]; pageInfo: { hasNextPage: boolean; cursor: string } }> {
  const result = cache.readQuery<GetBuildsPageResult>({
    query,
    variables: { first, after },
  });
  if (result?.builds) return [result.builds];
  return [];
}
```

### Pattern C: Union Types

```typescript
interface SearchResultsQuery {
  search: BuildNode | PartNode | TestRunNode | null;
}

function isSearchBuild(result: unknown): result is { search: BuildNode } {
  return (
    result !== null &&
    typeof result === 'object' &&
    'search' in result &&
    typeof (result as Record<string, unknown>).search === 'object' &&
    (result as Record<string, unknown>).search !== null &&
    '__typename' in (result as Record<string, Record<string, unknown>>).search &&
    ((result as Record<string, Record<string, unknown>>).search as Record<string, unknown>)
      .__typename === 'Build'
  );
}
```

---

## Validation Checklist

After refactoring, verify:

- [ ] All tests pass: `pnpm test:frontend --run`
- [ ] No type errors: `pnpm lint frontend`
- [ ] No unsafe member access warnings
- [ ] Coverage maintained or improved
- [ ] Cache helpers are reusable in other files
- [ ] Documentation added for cache patterns
- [ ] Code review approved

---

## Tips for Successfully Refactoring

1. **Start with one test file** to refactor completely
2. **Extract utilities to shared file** after second file
3. **Use IDE find/replace** to convert all `cache.readQuery()` calls
4. **Test incrementally** - refactor test by test within a file
5. **Commit often** - one completed test per commit
6. **Get code review** - verify patterns are consistent

---

## Related Resources

- See `SSE_CACHE_REFACTOR_SUMMARY.md` for overview
- See `BEFORE_AFTER_PATTERNS.md` for concrete examples
- See refactored `sse-cache-updates.test.ts` for reference implementation


