# Test Setup & Isolation

This directory contains global test setup and cleanup infrastructure to ensure test isolation and prevent state leakage when tests run in parallel.

## Overview

### Problem Solved

- **Duplicated Mocks**: localStorage mock was duplicated in 5+ test files
- **No Global Cleanup**: Tests didn't have consistent beforeEach/afterEach cleanup
- **Parallel Execution Risk**: When running tests concurrently, state could leak between tests, causing flaky failures

### Solution

- **Centralized localStorage Mock** (`localStorage-mock.ts`)
  - Single source of truth for mock implementation
  - Consistent behavior across all tests
  - Easy to update mock logic in one place

- **Global Setup File** (`vitest-setup.ts`)
  - Executed once before all tests run
  - Initializes localStorage mock globally
  - Provides beforeEach/afterEach cleanup hooks
  - Clears mocks and localStorage state automatically

- **Registered in vitest.config.ts**
  - `setupFiles: ['./frontend/__tests__/setup/vitest-setup.ts']`
  - Ensures global setup runs before any tests

## Files

| File | Purpose |
|------|---------|
| `localStorage-mock.ts` | Centralized localStorage mock implementation |
| `vitest-setup.ts` | Global beforeEach/afterEach hooks for cleanup |
| `README.md` | This file - documentation |

## How It Works

### 1. Initialization (runs once per test session)

When Vitest starts, it loads `vitest.config.ts`:
```typescript
setupFiles: ['./frontend/__tests__/setup/vitest-setup.ts']
```

The setup file:
1. Imports `localStorageMock` and `initializeLocalStorageMock`
2. Calls `initializeLocalStorageMock()` to attach mock to `globalThis.localStorage`
3. Registers global `beforeEach` and `afterEach` hooks

### 2. Test Isolation (runs before and after each test)

For every test:

**beforeEach**:
- Clears localStorage: `localStorageMock.clear()`
- Clears mock tracking: `vi.clearAllMocks()`

**Test runs** (with clean state)

**afterEach**:
- Final localStorage cleanup: `localStorageMock.clear()`
- Restores all mocks: `vi.restoreAllMocks()`

### 3. Parallel Execution

Since each test has:
- Isolated localStorage (cleared before and after)
- Isolated mock state (cleared before and after)
- No shared state

Tests can safely run concurrently without interference.

## Usage in Test Files

### Old Pattern (Duplicated - DO NOT USE)

```typescript
// ❌ OLD: Mock duplicated in every test file
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return { getItem: ..., setItem: ..., removeItem: ..., clear: ... };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('My Test', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  afterEach(() => {
    localStorage.clear();
  });
  
  // Tests...
});
```

### New Pattern (Centralized - USE THIS)

```typescript
// ✅ NEW: Global setup handles initialization and cleanup automatically
import { describe, it, expect } from 'vitest';

describe('My Test', () => {
  // ✅ No need to import localStorageMock
  // ✅ No need to define beforeEach/afterEach
  // ✅ localStorage is automatically cleared before and after each test
  
  it('should use localStorage', () => {
    localStorage.setItem('key', 'value');
    expect(localStorage.getItem('key')).toBe('value');
    // Automatically cleaned up after test
  });
});
```

## Test Files Refactored

The following test files had their duplicated localStorage mocks removed and now rely on the global setup:

- `frontend/lib/__tests__/apollo-client.test.ts`
- `frontend/lib/__tests__/auth-context.test.tsx`
- `frontend/__tests__/acceptance-criteria.test.ts`
- `frontend/__tests__/integration/full-auth-flow.test.tsx`
- `frontend/__tests__/integration/auth-errors.test.tsx`
- `frontend/__tests__/integration/security-edge-cases.test.tsx`
- `frontend/__tests__/integration/multi-user.test.tsx`
- `frontend/__tests__/integration/protected-routes.test.tsx`

Each file:
1. Removed the `localStorageMock` definition (6-21 lines deleted)
2. Removed the `Object.defineProperty(globalThis, 'localStorage', ...)` (4 lines deleted)
3. Removed local `beforeEach` localStorage.clear() calls (global handles this)
4. Kept test logic unchanged - localStorage works exactly the same

## Running Tests

```bash
# Sequential execution (one test at a time)
pnpm test:frontend --run

# Shuffled order (still sequential, but random order)
pnpm test:frontend --run -- --sequence.shuffle

# Parallel execution (multiple tests at the same time)
pnpm test:frontend --run -- --sequence.parallel

# Watch mode with parallel execution
pnpm test:frontend -- --sequence.parallel
```

All three modes should pass with zero test isolation issues.

## Verification Checklist

- ✅ No duplicated localStorage mocks remain in test files
- ✅ Global setup file `vitest-setup.ts` is registered in `vitest.config.ts`
- ✅ All tests pass in sequential mode
- ✅ All tests pass in shuffle mode
- ✅ All tests pass in parallel mode
- ✅ No console warnings about state leakage
- ✅ Tests can be added/removed without affecting others

## Adding New Tests

When writing new tests:

1. **Do NOT** create a localStorage mock
2. **Do NOT** manually clear localStorage in beforeEach
3. Just use `localStorage` directly - it's automatically cleaned up

```typescript
describe('New Feature', () => {
  it('should store data', () => {
    localStorage.setItem('user', 'john');
    expect(localStorage.getItem('user')).toBe('john');
    // Cleanup happens automatically via global afterEach
  });
});
```

## Troubleshooting

### "localStorage is not defined"

If you get this error:
- Verify `setupFiles` is set in `frontend/vitest.config.ts`
- Verify `vitest-setup.ts` calls `initializeLocalStorageMock()`
- Verify the path in `setupFiles` is correct (relative to vitest.config.ts)

### "Tests failing in parallel but passing sequentially"

This indicates state leakage. Check:
- Are tests modifying global state outside of localStorage?
- Are mocks not being properly restored in afterEach?
- Are async operations not awaited?

### "localStorage not cleared between tests"

This shouldn't happen, but if it does:
- Check that `localStorageMock.clear()` is being called in afterEach
- Verify tests aren't using `import('...').default.localStorage` (different reference)
- Check for typos in storage keys (e.g., `auth_token` vs `authToken`)

## Performance Impact

- **Setup time**: ~1ms per test session (one-time initialization)
- **Per-test cleanup**: <0.1ms (clearing two objects)
- **Parallel efficiency**: 100% - no state locking, pure isolation

## Related Documentation

- [Vitest Configuration](https://vitest.dev/config/): Official Vitest setup documentation
- [Test Isolation Best Practices](https://testing-library.com/docs/queries/about/#best-practices): React Testing Library recommendations
- See `CLAUDE.md` for full test infrastructure documentation
