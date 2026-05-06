# Issue #216: Quick Start Guide

**Issue**: Cleanup unused ESLint directives and missing return types  
**Files**: 4-6 test/setup files  
**Time**: 1-2 hours  
**Difficulty**: Medium  

---

## Quick Summary

Clean up:
1. Unused `eslint-disable` comments
2. Unexpected console.log statements
3. Missing return type annotations

---

## The Files to Fix

1. `frontend/e2e/playwright.global-setup.ts` - Remove unused directives
2. `frontend/e2e/tests/build-workflow.spec.ts` - Remove unused directives + console.log
3. `frontend/e2e/tests/minimal-fixture.spec.ts` - Remove unused directive + console.log
4. `frontend/components/__tests__/error-boundary.test.tsx` - Add return types
5. `frontend/lib/__tests__/error-link.test.ts` - Add return types

---

## Quick Fixes

### Fix 1: Remove Unused Directives

```typescript
// ❌ Before
// eslint-disable-next-line no-undef
const x = getConfig();

// ✅ After (just remove the comment)
const x = getConfig();
```

### Fix 2: Clean Console.log

```typescript
// ❌ Before
console.log('Debug message');
doWork();

// ✅ After (remove the line)
doWork();
```

### Fix 3: Add Return Types

```typescript
// ❌ Before
it('should work', () => {
  expect(true).toBe(true);
});

// ✅ After
it('should work', (): void => {
  expect(true).toBe(true);
});
```

---

## Implementation (30 minutes)

### Option A: Manual Fix
1. Open each file
2. Find and remove unused directives
3. Remove console.log statements
4. Add return types

### Option B: Auto-Fix with ESLint
```bash
pnpm lint:fix
```

Then manually:
- Remove console.log statements
- Add return types where not auto-fixed

---

## Verify (15-30 minutes)

```bash
# Check linting
pnpm lint

# Run tests
pnpm test:unit

# Type check
pnpm type-check
```

All should pass ✅

---

## Done! ✨

Move to next issue when complete.
