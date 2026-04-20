# Implementation Plan: Issue #123 - JWT Backend Security & Type Issues

## Executive Summary

Issue #123 identifies 3 critical security and type-safety issues in the JWT implementation of the Apollo GraphQL backend. These issues can cause application crashes (Denial of Service), security vulnerabilities (invalid token acceptance), and type fragility (runtime type mismatches). This plan provides a structured, dependency-ordered approach to fix all three issues while maintaining 100% test coverage (currently 44 tests in backend-graphql).

---

## Issue Overview

### Issue #1: CRITICAL - Context Factory Crashes on Invalid JWT
- **Severity**: CRITICAL (Causes 500 errors = DoS vulnerability)
- **File**: `backend-graphql/src/index.ts:45`
- **Problem**: `extractUserFromToken()` throws exceptions that propagate to Apollo context factory, crashing server
- **Current Code**:
  ```typescript
  const user = extractUserFromToken(req.headers.authorization);
  ```
- **Risk**: Any malformed JWT token crashes the entire Apollo server for all subsequent requests
- **Solution**: Wrap in try-catch, set user: null on error, return GraphQL error instead

### Issue #2: HIGH - Missing JWT id Field Type Validation
- **Severity**: HIGH (Security vulnerability - invalid tokens accepted)
- **File**: `backend-graphql/src/middleware/auth.ts:52-57`
- **Problem**: JWT id field validation doesn't check type/length
  - Current check: `typeof decoded === 'string' || !('id' in decoded)`
  - Missing: `typeof decoded.id !== 'string' || decoded.id.length === 0`
- **Risk**: Token with `id: null`, `id: 123`, `id: []` would pass validation, causing runtime errors downstream
- **Solution**: Add type and length validation before accepting the token

### Issue #3: MEDIUM - Type Inconsistency Between BuildContext and DataLoaders
- **Severity**: MEDIUM (Type fragility - potential runtime errors in nested resolvers)
- **File**: `backend-graphql/src/types.ts:40-41` vs `backend-graphql/src/dataloaders/index.ts:69-70`
- **Problem**: Type mismatch in DataLoader return types
  - `types.ts` declares: `DataLoader<string, PartData[]>` and `PartData[]` (custom interface)
  - `dataloaders/index.ts` returns: `DataLoader<string, Part[]>` and `Part[]` (Prisma type)
- **Risk**: Custom types (PartData, TestRunData) diverge from actual Prisma types, causing confusion in resolvers
- **Solution**: Remove custom types, standardize on Prisma types (Part, TestRun) everywhere

---

## Acceptance Criteria

✅ All 44 backend-graphql tests pass  
✅ All 68 backend-express tests pass  
✅ All 10 frontend tests pass (no changes expected)  
✅ ESLint passes across all packages  
✅ TypeScript build succeeds with strict mode  
✅ Invalid JWT returns GraphQL error (not 500 server crash)  
✅ JWT id must be non-empty string (validation enforced)  
✅ Types consistent across BuildContext and DataLoaders  
✅ All resolvers use correct DataLoader types  

---

## Implementation Tasks (Ordered by Dependency)

### Task 1: Add JWT id Type Validation
- **ID**: `jwt-id-validation`
- **Description**: Add type and length validation for JWT id field
- **Files to Modify**:
  - `backend-graphql/src/middleware/auth.ts:52-57`
- **Changes**:
  - Update validation logic to check `typeof decoded.id === 'string' && decoded.id.length > 0`
  - Update error message to be more descriptive
- **Tests Affected**:
  - `backend-graphql/src/middleware/__tests__/auth.test.ts` - modify existing tests and add new ones
- **Acceptance**:
  - Tokens with `id: null`, `id: 123`, `id: []`, `id: ""` are rejected
  - Valid tokens with string id pass validation
  - Error messages are clear

### Task 2: Standardize DataLoader Return Types (Remove PartData/TestRunData)
- **ID**: `standardize-dataloader-types`
- **Depends On**: None
- **Description**: Remove custom PartData/TestRunData types, use Prisma types directly
- **Files to Modify**:
  - `backend-graphql/src/types.ts:8-30` - Remove PartData and TestRunData interfaces
  - `backend-graphql/src/dataloaders/index.ts:69-70` - Update DataLoaders interface return types
  - `backend-graphql/src/types.ts:40-41` - Update BuildContext loader types
- **Changes**:
  - Delete `PartData` interface (lines 8-16)
  - Delete `TestRunData` interface (lines 18-30)
  - Update `DataLoaders` interface:
    ```typescript
    export interface DataLoaders {
      buildPartLoader: DataLoader<string, Part[]>;
      buildTestRunLoader: DataLoader<string, TestRun[]>;
    }
    ```
  - Update `BuildContext` interface:
    ```typescript
    export interface BuildContext {
      user: AuthUser | null;
      prisma: PrismaClient;
      buildPartLoader: DataLoader<string, Part[]>;
      buildTestRunLoader: DataLoader<string, TestRun[]>;
    }
    ```
- **Tests Affected**: None (internal type changes, no test changes needed)
- **Acceptance**:
  - No TypeScript errors in dataloaders, types, or resolvers
  - DataLoader returns typed as Prisma Part[] and TestRun[]
  - Build.parts and Build.testRuns resolvers receive correct types

### Task 3: Wrap extractUserFromToken in Try-Catch (Context Factory)
- **ID**: `jwt-crash-fix`
- **Depends On**: Task 1 (JWT id validation must be complete first)
- **Description**: Add try-catch wrapper in Apollo context factory to prevent server crashes
- **Files to Modify**:
  - `backend-graphql/src/index.ts:43-54`
- **Changes**:
  ```typescript
  context: async ({ req }) => {
    let user: AuthUser | null = null;
    try {
      user = extractUserFromToken(req.headers.authorization);
    } catch (error) {
      console.warn('JWT extraction failed:', error instanceof Error ? error.message : String(error));
      // user remains null, no crash
    }
    const loaders = createLoaders(prisma);
    return {
      user,
      prisma,
      buildPartLoader: loaders.buildPartLoader,
      buildTestRunLoader: loaders.buildTestRunLoader,
    };
  },
  ```
- **Tests Affected**:
  - `backend-graphql/src/resolvers/__tests__/auth-check.test.ts` - verify invalid JWT doesn't crash
  - May need new test for context factory error handling
- **Acceptance**:
  - Invalid JWT header returns user: null (no crash)
  - Invalid JWT throws error in extractUserFromToken, caught and logged
  - GraphQL query with invalid JWT returns "Unauthorized" (resolver checks context.user)

### Task 4: Add Tests for New JWT Validation
- **ID**: `jwt-validation-tests`
- **Depends On**: Task 1 (JWT id validation)
- **Description**: Add comprehensive tests for JWT id type validation
- **Files to Modify**:
  - `backend-graphql/src/middleware/__tests__/auth.test.ts`
- **Tests to Add**:
  1. "should throw error for id field that is null"
  2. "should throw error for id field that is number"
  3. "should throw error for id field that is empty string"
  4. "should throw error for id field that is array"
  5. "should throw error for id field that is object"
- **Acceptance**:
  - All 5 new tests pass
  - Total auth tests increase from ~12 to ~17

### Task 5: Add Tests for Context Factory Error Handling
- **ID**: `context-factory-tests`
- **Depends On**: Task 3 (Context factory try-catch)
- **Description**: Add tests verifying context factory handles errors gracefully
- **Files to Modify**:
  - `backend-graphql/src/resolvers/__tests__/auth-check.test.ts` (or new file)
- **Tests to Add**:
  1. "should not crash context factory with invalid JWT signature"
  2. "should not crash context factory with expired token"
  3. "should not crash context factory with malformed Bearer header"
  4. "should set user to null when extractUserFromToken throws"
- **Acceptance**:
  - All 4 new tests pass
  - No unhandled exceptions in context factory
  - Unauthorized queries return GraphQL error, not 500

### Task 6: Verify DataLoader Type Compatibility
- **ID**: `dataloader-type-check`
- **Depends On**: Task 2 (Standardize types)
- **Description**: Verify DataLoaders work correctly with Prisma types
- **Files to Check**:
  - `backend-graphql/src/dataloaders/index.ts` - createBuildPartLoader, createBuildTestRunLoader
  - `backend-graphql/src/resolvers/Build.ts` - parts and testRuns resolvers
  - Test: Ensure parts/testRuns have correct Prisma properties (id, buildId, name, sku, etc.)
- **Acceptance**:
  - TypeScript strict mode passes
  - No type errors in resolvers or loaders
  - All queries returning parts and testRuns work correctly

### Task 7: Final Integration Test
- **ID**: `integration-test-final`
- **Depends On**: All previous tasks
- **Description**: Run full test suite and verify no regressions
- **Files to Run**:
  - `pnpm test` (all packages)
  - `pnpm lint` (all packages)
  - `pnpm build` (all packages)
- **Acceptance**:
  - 44 backend-graphql tests pass (including new JWT tests)
  - 68 backend-express tests pass
  - 10 frontend tests pass
  - ESLint passes
  - TypeScript build succeeds
  - No warnings or errors

---

## Task Dependencies and Ordering

```
┌─────────────────────────────────────────┐
│  Task 1: JWT id Type Validation         │  (HIGH PRIORITY)
│  - Add typeof + length checks           │
│  - Update error messages                │
└──────────────┬──────────────────────────┘
               │
               ├──> ┌──────────────────────────────────────┐
               │    │  Task 4: JWT Validation Tests       │
               │    │  - Test id: null, number, [], etc  │
               │    │  - Verify validation logic         │
               │    └──────────────────────────────────────┘
               │
               └──> ┌──────────────────────────────────────┐
                    │  Task 3: Context Factory Try-Catch  │ (depends on Task 1)
                    │  - Wrap extractUserFromToken()      │
                    │  - Set user: null on error          │
                    └──────────────────────────────────────┘
                                  │
                                  └──> ┌────────────────────────────────────┐
                                       │  Task 5: Context Factory Tests    │
                                       │  - Test error handling            │
                                       │  - Verify no crashes              │
                                       └────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Task 2: Standardize DataLoader Types   │  (INDEPENDENT)
│  - Remove PartData/TestRunData          │
│  - Use Prisma types directly            │
└──────────────┬──────────────────────────┘
               │
               └──> ┌──────────────────────────────────────┐
                    │  Task 6: Verify Type Compatibility  │
                    │  - Check DataLoader integration     │
                    │  - Verify resolver types            │
                    └──────────────────────────────────────┘

Both chains converge:
┌──────────────────────────────────┐
│  Task 7: Final Integration Test  │
│  - Run all tests                 │
│  - Run lint                      │
│  - Run build                     │
└──────────────────────────────────┘
```

**Execution Order**:
1. **Phase 1 (Parallel)**: Tasks 1 and 2 (independent)
2. **Phase 2 (Sequential)**: Task 3 (depends on Task 1)
3. **Phase 3 (Parallel)**: Tasks 4, 5, 6 (depend on Tasks 1, 2, or 3)
4. **Phase 4 (Final)**: Task 7 (integration test)

---

## Testing Strategy

### Unit Tests for JWT id Validation (Task 1 + Task 4)

**Test Cases** (add to `backend-graphql/src/middleware/__tests__/auth.test.ts`):

```typescript
describe('JWT id Field Validation', () => {
  // New cases to add:
  it('should throw error for token with null id', () => {
    const token = jwt.sign({ id: null }, JWT_SECRET, { expiresIn: '24h' });
    const authHeader = `Bearer ${token}`;
    expect(() => extractUserFromToken(authHeader)).toThrow();
  });

  it('should throw error for token with numeric id', () => {
    const token = jwt.sign({ id: 123 }, JWT_SECRET, { expiresIn: '24h' });
    const authHeader = `Bearer ${token}`;
    expect(() => extractUserFromToken(authHeader)).toThrow();
  });

  it('should throw error for token with empty string id', () => {
    const token = jwt.sign({ id: '' }, JWT_SECRET, { expiresIn: '24h' });
    const authHeader = `Bearer ${token}`;
    expect(() => extractUserFromToken(authHeader)).toThrow();
  });

  it('should throw error for token with array id', () => {
    const token = jwt.sign({ id: ['user1'] }, JWT_SECRET, { expiresIn: '24h' });
    const authHeader = `Bearer ${token}`;
    expect(() => extractUserFromToken(authHeader)).toThrow();
  });

  it('should throw error for token with object id', () => {
    const token = jwt.sign({ id: { nested: 'value' } }, JWT_SECRET, { expiresIn: '24h' });
    const authHeader = `Bearer ${token}`;
    expect(() => extractUserFromToken(authHeader)).toThrow();
  });

  it('should accept token with valid string id', () => {
    const token = generateToken('user-123');
    const authHeader = `Bearer ${token}`;
    const user = extractUserFromToken(authHeader);
    expect(user?.id).toBe('user-123');
  });
});
```

### Unit Tests for Context Factory Error Handling (Task 3 + Task 5)

**Test Cases** (add to `backend-graphql/src/resolvers/__tests__/auth-check.test.ts` or new file):

```typescript
describe('Apollo Context Factory Error Handling', () => {
  it('should not throw error with invalid JWT signature', () => {
    const fakeToken = jwt.sign({ id: 'user' }, 'wrong-secret', { expiresIn: '24h' });
    const authHeader = `Bearer ${fakeToken}`;
    
    // Simulate context factory behavior
    let user = null;
    try {
      user = extractUserFromToken(authHeader);
    } catch {
      user = null;  // This is what context factory does
    }
    
    expect(user).toBeNull();
  });

  it('should not throw error with expired token', () => {
    const expiredToken = jwt.sign({ id: 'user' }, JWT_SECRET, { expiresIn: '-1h' });
    const authHeader = `Bearer ${expiredToken}`;
    
    let user = null;
    try {
      user = extractUserFromToken(authHeader);
    } catch {
      user = null;
    }
    
    expect(user).toBeNull();
  });

  it('should not throw error with malformed Bearer header', () => {
    let user = null;
    try {
      user = extractUserFromToken('NotBearerFormat');
    } catch {
      user = null;
    }
    
    expect(user).toBeNull();
  });

  it('should set user to null when extractUserFromToken throws', () => {
    const malformedToken = 'not.a.valid.token';
    const authHeader = `Bearer ${malformedToken}`;
    
    let user = null;
    try {
      user = extractUserFromToken(authHeader);
    } catch {
      user = null;
    }
    
    expect(user).toBeNull();
  });
});
```

### Integration Test: Type Consistency (Task 6)

**Test Cases** (verify no TypeScript errors):

```bash
# 1. Build with strict TypeScript
pnpm -F backend-graphql build

# 2. Check for type errors in resolvers
pnpm -F backend-graphql tsc --noEmit

# 3. Verify DataLoader properties available in resolvers
# (By running existing tests that use DataLoaders)
pnpm -F backend-graphql test
```

### End-to-End Test Plan

1. **Test Invalid JWT Doesn't Crash Server**:
   ```bash
   # Start Apollo server
   pnpm dev:graphql &
   
   # Send query with invalid JWT
   curl -H "Authorization: Bearer invalid-token" \
        http://localhost:4000/graphql \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"query": "{ builds(limit: 10, offset: 0) { id } }"}'
   
   # Expected: GraphQL error (not 500)
   # Response: { "errors": [{ "message": "Unauthorized" }] }
   ```

2. **Test Valid JWT Works**:
   ```bash
   # Generate valid token
   TOKEN=$(pnpm dev:graphql | grep -o "Bearer token: [^\"]*" | cut -d' ' -f3)
   
   # Send query with valid JWT
   curl -H "Authorization: Bearer $TOKEN" \
        http://localhost:4000/graphql \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"query": "{ builds(limit: 10, offset: 0) { id } }"}'
   
   # Expected: List of builds returned
   ```

3. **Test Type Consistency in Nested Queries**:
   ```graphql
   query {
     builds(limit: 10, offset: 0) {
       id
       name
       status
       parts {           # Should return Part[] (Prisma type)
         id
         name
         sku
         quantity
       }
       testRuns {        # Should return TestRun[] (Prisma type)
         id
         status
         result
         fileUrl
       }
     }
   }
   ```

---

## Verification Steps

### Step 1: Type Validation
```bash
# Run TypeScript strict check
cd backend-graphql
pnpm tsc --noEmit

# Expected: No errors
```

### Step 2: Lint Check
```bash
# Run ESLint
pnpm lint

# Expected: No errors or warnings in auth.ts, index.ts, types.ts, dataloaders/index.ts
```

### Step 3: Unit Tests
```bash
# Run backend-graphql tests
pnpm -F backend-graphql test

# Expected output:
# ✓ src/middleware/__tests__/auth.test.ts (17 tests, including 5 new JWT id validation tests)
# ✓ src/resolvers/__tests__/auth-check.test.ts (updated with 4 new context factory tests)
# ✓ Total: 44 tests passed
```

### Step 4: Full Test Suite
```bash
# Run all tests
pnpm test

# Expected:
# backend-graphql: 44 tests passed
# backend-express: 68 tests passed
# frontend: 10 tests passed
# Total: 122 tests passed
```

### Step 5: Security Validation
```bash
# Start server
pnpm dev:graphql &
SERVER_PID=$!

# Test 1: Invalid JWT should not crash server
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature" \
     -X POST http://localhost:4000/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ builds(limit: 1, offset: 0) { id } }"}'
# Should return: {"errors": [{"message": "Unauthorized"}]} (not 500)

# Test 2: Valid JWT should work
TOKEN=$(node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({id: 'test-user'}, 'test-secret-key', {expiresIn: '24h'}))")
curl -H "Authorization: Bearer $TOKEN" \
     -X POST http://localhost:4000/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ builds(limit: 1, offset: 0) { id } }"}'
# Should return: list of builds (not error)

# Clean up
kill $SERVER_PID
```

### Step 6: Type Consistency Check
```bash
# Check that dataloaders return correct types
grep -A5 "buildPartLoader: DataLoader" backend-graphql/src/dataloaders/index.ts
# Should show: DataLoader<string, Part[]>

grep -A5 "buildTestRunLoader: DataLoader" backend-graphql/src/dataloaders/index.ts
# Should show: DataLoader<string, TestRun[]>

# Verify no PartData or TestRunData types referenced
grep -r "PartData\|TestRunData" backend-graphql/src --exclude-dir=node_modules
# Should return: (empty - types removed)
```

---

## Gotchas and Considerations

### Gotcha 1: JWT Library Type Behavior
**Issue**: `jwt.verify()` returns `string | JwtPayload`. If verification succeeds but payload is string, it's a decoded token string, not an object.

**Mitigation**: Current code checks `typeof decoded === 'string'` at line 52. This is correct but only prevents string payloads. We need to add type check for the `id` field specifically.

### Gotcha 2: Custom Types vs Prisma Types
**Issue**: If we suddenly switch from PartData[] to Part[], existing code that accesses properties might break if properties differ.

**Mitigation**: Prisma `Part` type has all required properties. Custom PartData interface was redundant and causes confusion. Remove it entirely.

### Gotcha 3: DataLoader Batch Order
**Issue**: DataLoader must return results in the same order as input IDs. If `buildPartLoader.loadMany(['build-1', 'build-2'])` is called, it must return `[parts for build-1, parts for build-2]`.

**Verification**: Current code at `dataloaders/index.ts:32` correctly handles this:
```typescript
return buildIds.map((buildId) => partsByBuildId[buildId] || []);
```

### Gotcha 4: Error Propagation in Context Factory
**Issue**: If we swallow errors in context factory, resolvers won't know JWT validation failed. They'll see `user: null` and throw "Unauthorized".

**This is Correct**: Resolvers check `if (!context.user) throw new Error('Unauthorized')`. So invalid JWT → user: null → resolver throws Unauthorized → GraphQL error.

### Gotcha 5: Empty String id
**Issue**: JWT with `id: ""` (empty string) passes `typeof decoded.id === 'string'` but is invalid.

**Solution**: Add `decoded.id.length > 0` check.

### Gotcha 6: Test Database State
**Issue**: Some integration tests might use a real database. Ensure fresh state.

**Mitigation**: Use `beforeEach` to reset data or mock Prisma.

---

## Risk Assessment and Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Breaking change to DataLoader types | LOW | No breaking change - PartData/TestRunData only used internally, not exposed in GraphQL schema |
| Missing error case in JWT validation | HIGH | Comprehensive test coverage for all invalid id types (null, number, empty, array, object) |
| Context factory still crashes | CRITICAL | Wrap in try-catch AND test with invalid JWT to verify no crash |
| Type errors after refactoring | MEDIUM | Run `pnpm tsc --noEmit` and full test suite before committing |
| Resolvers still access wrong properties | LOW | Use Prisma types directly (source of truth), verify with `pnpm test` |

---

## Implementation Checklist

- [ ] **Task 1**: Add JWT id type validation
  - [ ] Update auth.ts line 52 validation logic
  - [ ] Test with id: null, number, "", array, object
  
- [ ] **Task 2**: Remove PartData/TestRunData types
  - [ ] Delete interfaces from types.ts
  - [ ] Update DataLoaders interface
  - [ ] Update BuildContext interface
  - [ ] Verify no import errors
  
- [ ] **Task 3**: Wrap extractUserFromToken in try-catch
  - [ ] Add try-catch in index.ts context factory
  - [ ] Test with invalid JWT
  - [ ] Verify no server crash
  
- [ ] **Task 4**: Add JWT validation tests
  - [ ] Add 5 new test cases for id field validation
  - [ ] Verify all pass
  
- [ ] **Task 5**: Add context factory tests
  - [ ] Add 4 new test cases for error handling
  - [ ] Verify all pass
  
- [ ] **Task 6**: Verify DataLoader type compatibility
  - [ ] Run TypeScript strict check
  - [ ] Verify resolver types correct
  
- [ ] **Task 7**: Final integration test
  - [ ] Run `pnpm test` - all tests pass
  - [ ] Run `pnpm lint` - no errors
  - [ ] Run `pnpm build` - succeeds
  - [ ] Verify 44 backend-graphql tests pass (including new tests)

---

## Success Criteria Summary

✅ **Security**: Invalid JWT returns GraphQL error, not 500 crash  
✅ **Validation**: JWT id must be non-empty string (all other types rejected)  
✅ **Type Safety**: Types consistent across BuildContext and DataLoaders  
✅ **Tests**: 44 backend-graphql tests pass (up from original, with new test coverage)  
✅ **Quality**: ESLint passes, TypeScript strict mode succeeds, no warnings  
✅ **Stability**: No regressions in any other tests (68 Express, 10 frontend tests still pass)

---

## Files Changed Summary

| File | Type | Changes |
|------|------|---------|
| `backend-graphql/src/middleware/auth.ts` | Code | Add id type validation (1 change) |
| `backend-graphql/src/index.ts` | Code | Wrap in try-catch (1 change) |
| `backend-graphql/src/types.ts` | Code | Remove PartData/TestRunData, update interfaces (2 changes) |
| `backend-graphql/src/dataloaders/index.ts` | Code | Update DataLoaders interface type annotations (1 change) |
| `backend-graphql/src/middleware/__tests__/auth.test.ts` | Test | Add 5 new JWT validation tests (1 change block) |
| `backend-graphql/src/resolvers/__tests__/auth-check.test.ts` | Test | Add 4 new context factory tests (1 change block) |

**Total Modifications**: 6 files, ~8 logical changes, ~200 lines added/modified

---

## Estimated Effort

**Planning**: ✅ Complete  
**Implementation**: 2-3 hours (Tasks 1-3)  
**Testing**: 1-2 hours (Tasks 4-6)  
**Verification**: 30 minutes (Task 7)  
**Total**: 4-5.5 hours (assuming experienced developer)

---

## References

- **Issue**: #123 - JWT Backend Security & Type Issues  
- **Related**: #118 - Initial JWT implementation  
- **Files**: See "Files Changed Summary" above  
- **Tests**: 44 backend-graphql tests (suite must pass after changes)
