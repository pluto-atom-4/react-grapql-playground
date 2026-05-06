# Issue #213: Quick Start Guide

**Issue**: Remove unused expressions in multi-user integration test  
**File**: `frontend/__tests__/integration/multi-user.test.tsx` (lines 38, 45)  
**Time**: 30 minutes  
**Difficulty**: Easy  

---

## Quick Summary

Two test lines have unused expressions that violate ESLint rules. Replace them with proper test assertions.

---

## The Problem

```typescript
// Line 38 - ❌ Unused expression
getByTestId('build-button');

// Line 45 - ❌ Unused expression  
getByTestId('part-list');
```

## The Solution

```typescript
// Line 38 - ✅ Proper assertion
expect(getByTestId('build-button')).toBeInTheDocument();

// Line 45 - ✅ Proper assertion
expect(getByTestId('part-list')).toBeInTheDocument();
```

---

## Implementation (5 minutes)

1. Open file: `frontend/__tests__/integration/multi-user.test.tsx`
2. Go to line 38
3. Replace: `getByTestId('build-button');`
4. With: `expect(getByTestId('build-button')).toBeInTheDocument();`
5. Go to line 45
6. Replace: `getByTestId('part-list');`
7. With: `expect(getByTestId('part-list')).toBeInTheDocument();`

---

## Verify (25 minutes)

```bash
# Check ESLint
pnpm lint frontend/__tests__/integration/multi-user.test.tsx

# Run tests
pnpm test:unit multi-user

# Type check
pnpm type-check
```

All should pass ✅

---

## Done! ✨

Move to Issue #215 when complete.
