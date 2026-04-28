# Type-Conscious Refactoring: Before & After Patterns

This document shows concrete examples of the refactoring improvements made to `sse-cache-updates.test.ts`.

## Pattern 1: Cache Query Reading

### ❌ Before (Unsafe)

```typescript
// Type is `unknown`, needs unsafe casting
const result = cache.readQuery({ query });

// Unsafe member access - bypasses type checking
expect(result?.builds).toHaveLength(2);
expect(result?.builds[1].id).toBe('build-2');  // Could be undefined!
```

**Problems**:
- ⚠️ `result` has type `unknown` - no type safety
- ⚠️ `result?.builds` might not exist (no compile error)
- ⚠️ `result?.builds[1].id` could throw at runtime if structure changes
- ⚠️ Requires `@typescript-eslint/no-unsafe-member-access` eslint-disable

### ✅ After (Type-Safe)

```typescript
// Type is explicitly GetBuildsResult
const result = cache.readQuery<GetBuildsResult>({ query });

// Runtime verification
expect(result).toBeDefined();
expect(isGetBuildsResult(result)).toBe(true);

// Inside type guard: builds is narrowed to BuildNode[]
if (result && isGetBuildsResult(result)) {
  expect(result.builds).toHaveLength(2);  // ✅ Type-safe
  expect(result.builds[1].id).toBe('build-2');  // ✅ Know .id exists
}
```

**Benefits**:
- ✅ `result` has type `GetBuildsResult | null` - clear intent
- ✅ Type guard verifies data shape at runtime
- ✅ Inside guard block, TypeScript knows `.builds` and `.id` exist
- ✅ No eslint-disable needed
- ✅ Better IDE autocomplete and refactoring support

---

## Pattern 2: Cache Writing with Data Preparation

### ❌ Before (Unsafe)

```typescript
// Mixed responsibilities: reading and writing
const existing = cache.readQuery({ query });
const existingBuilds = (existing as { builds?: Array<Record<string, unknown>> })?.builds || [];
// ^ Type assertion defeats type checking

cache.writeQuery({
  query,
  data: {
    builds: [...existingBuilds, newBuild],
  },
});

// Later: reading result again with same unsafe pattern
const result = cache.readQuery({ query });
expect(result?.builds).toHaveLength(2);
```

**Problems**:
- ⚠️ Type assertion `as { builds?: ... }` is fragile
- ⚠️ `existingBuilds` has type `unknown[]` - loses type info
- ⚠️ Code is repetitive across multiple tests
- ⚠️ No guarantee that `newBuild` matches `BuildNode` shape

### ✅ After (Type-Safe)

```typescript
// Step 1: Use typed helper to read (type-safe)
const existingBuilds = readBuildsFromCache(cache, query);
// existingBuilds has type BuildNode[] - fully typed

// Step 2: Prepare new data with proper type
const newBuild: BuildNode = {
  __typename: 'Build',
  id: 'build-2',
  name: 'New Build',
  status: BuildStatus.Pending,
};

// Step 3: Use typed helper to write
writeBuildsToCache(cache, query, [...existingBuilds, newBuild]);

// Step 4: Read result with helper (type-safe)
const result = cache.readQuery<GetBuildsResult>({ query });
if (result && isGetBuildsResult(result)) {
  expect(result.builds).toHaveLength(2);
}
```

**Benefits**:
- ✅ Each step has clear responsibility
- ✅ Type information flows through pipeline
- ✅ Helpers encapsulate cache logic - reusable
- ✅ `newBuild` is type-checked against `BuildNode` interface
- ✅ `existingBuilds` has type `BuildNode[]` - all properties known

---

## Pattern 3: Build Detail Cache Operations

### ❌ Before (Unsafe)

```typescript
cache.writeQuery({
  query,
  data: {
    build: {
      __typename: 'Build',
      id: 'build-1',
      name: 'Build',
      parts: [{ __typename: 'Part', id: 'part-1', name: 'Part 1', sku: 'SKU-1' }],
    },
  },
});

// Reading back - no type info
const result = cache.readQuery({ query });
expect(result?.build.parts).toHaveLength(1);  // Unsafe access
expect(result?.build.parts[0].id).toBe('part-1');  // Could be undefined
```

**Problems**:
- ⚠️ Inline object creation - hard to verify shape matches schema
- ⚠️ Easy to miss required fields or add wrong ones
- ⚠️ Result reading has no type safety
- ⚠️ Hard to see what the expected structure is

### ✅ After (Type-Safe)

```typescript
// Step 1: Define typed data object
const initialPart: PartNode = {
  __typename: 'Part',
  id: 'part-1',
  name: 'Part 1',
  sku: 'SKU-1',
};

const buildDetail: GetBuildDetailResult['build'] = {
  __typename: 'Build',
  id: 'build-1',
  name: 'Build',
  status: BuildStatus.Pending,
  parts: [initialPart],
  testRuns: [],
};

// Step 2: Write with typed helper
writeBuildDetailToCache(cache, query, buildDetail);

// Step 3: Read with typed helper
const result = cache.readQuery<GetBuildDetailResult>({ query });
if (result && isGetBuildDetailResult(result)) {
  expect(result.build.parts).toHaveLength(1);  // Type-safe
  expect(result.build.parts[0].id).toBe('part-1');  // Know .id exists
}
```

**Benefits**:
- ✅ `buildDetail` type checks against `GetBuildDetailResult['build']`
- ✅ TypeScript error if missing required fields
- ✅ IDE shows all available fields for build, parts, testRuns
- ✅ Structure is clear and self-documenting
- ✅ Safe property access in assertions

---

## Pattern 4: Type Guards for Runtime Safety

### ❌ Before (No Runtime Verification)

```typescript
const result = cache.readQuery({ query });
expect(result?.builds).toHaveLength(2);  // What if result is null or missing builds?
```

**Problems**:
- ⚠️ No runtime check that `builds` field exists
- ⚠️ Test might pass with wrong data structure
- ⚠️ Hides bugs where cache data is misshapen

### ✅ After (Runtime Verified)

```typescript
const result = cache.readQuery<GetBuildsResult>({ query });

// Step 1: Type check
expect(result).toBeDefined();

// Step 2: Runtime verification using type guard
expect(isGetBuildsResult(result)).toBe(true);

// Step 3: Now safe to access properties
if (result && isGetBuildsResult(result)) {
  expect(result.builds).toHaveLength(2);
  // TypeScript knows builds: BuildNode[]
}
```

**Type Guard Implementation**:
```typescript
function isGetBuildsResult(value: unknown): value is GetBuildsResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'builds' in value &&
    Array.isArray((value as Record<string, unknown>).builds)
  );
}
```

**Benefits**:
- ✅ Runtime verification of data shape
- ✅ Catches misshapen data before assertions
- ✅ TypeScript narrows type inside if block
- ✅ Reusable across multiple tests
- ✅ Self-documents the expected data shape

---

## Pattern 5: Cache Modification with Type Safety

### ❌ Before (Unsafe)

```typescript
cache.modify({
  fields: {
    builds: (existing = [] as Array<Record<string, unknown>>) => [
      ...(existing as Array<Record<string, unknown>>),
      {
        __typename: 'Build',
        id: 'build-1',
        name: 'New Build',
        status: BuildStatus.Pending,
      },
    ],
  },
});
```

**Problems**:
- ⚠️ Type assertion `as Array<Record<...>>` is fragile
- ⚠️ Inner array elements have type `Record<string, unknown>` - loose
- ⚠️ No verification that new build matches BuildNode shape

### ✅ After (Type-Safe)

```typescript
const newBuild: BuildNode = {
  __typename: 'Build',
  id: 'build-1',
  name: 'New Build',
  status: BuildStatus.Pending,
};

cache.modify({
  fields: {
    builds: (existing: unknown): BuildNode[] => {
      const existingBuilds = (existing as BuildNode[]) || [];
      return [...existingBuilds, newBuild];
    },
  },
});
```

**Benefits**:
- ✅ `newBuild` is type-checked against `BuildNode`
- ✅ Return type is explicitly `BuildNode[]`
- ✅ TypeScript knows type of each element
- ✅ Clearer intent - we're adding a BuildNode

---

## Summary Table

| Aspect | Before | After |
|--------|--------|-------|
| **Cache Read Type** | `unknown` | `GetBuildsResult \| null` |
| **Runtime Verification** | ❌ None | ✅ Type guards |
| **Type Assertions** | ⚠️ Many `as` casts | ✅ Minimal, contained |
| **Unsafe Member Access** | ⚠️ High | ✅ None |
| **Reusability** | ❌ Low (repetitive) | ✅ High (helpers) |
| **IDE Support** | ⚠️ Limited | ✅ Full autocomplete |
| **Self-Documenting** | ❌ Low | ✅ High |
| **Maintainability** | ⚠️ Medium | ✅ High |
| **Test Robustness** | ⚠️ Medium | ✅ High |
| **Eslint-Disable** | ⚠️ Needed | ✅ Not needed |

---

## Key Takeaways

1. **Use Generics**: `cache.readQuery<QueryType>()` provides type info
2. **Create Type Guards**: `value is QueryType` for runtime safety
3. **Extract Helpers**: Reduce duplication with `readXFromCache()`
4. **Type Your Data**: Define interfaces matching GraphQL schema
5. **Verify at Runtime**: Use type guards before accessing properties
6. **Minimize Casting**: Use narrowing and guards instead of `as`

These patterns make tests **more robust**, **easier to maintain**, and **less prone to runtime errors**.

