# Issue #213: Summary

**Remove unused expressions in multi-user integration test**

**Status**: Ready for Implementation  
**Complexity**: 🟢 Easy  
**Time**: 30 minutes  
**File**: `frontend/__tests__/integration/multi-user.test.tsx`  
**Lines**: 38, 45  

---

## One-Liner

Replace two bare query calls with proper test assertions to fix ESLint violations and clarify test intent.

---

## The Problem

Two test lines call query functions but don't use the results:

```typescript
// Line 38
getByTestId('build-button');  // ❌ ESLint: no-unused-expressions

// Line 45
getByTestId('part-list');     // ❌ ESLint: no-unused-expressions
```

---

## The Solution

Add assertions to make the intent clear:

```typescript
// Line 38
expect(getByTestId('build-button')).toBeInTheDocument();  // ✅ Verify element exists

// Line 45
expect(getByTestId('part-list')).toBeInTheDocument();     // ✅ Verify element exists
```

---

## Changes

| Line | Type | Change |
|------|------|--------|
| 38 | Replace | Add assertion wrapper |
| 45 | Replace | Add assertion wrapper |

**Total**: 2 lines modified  
**Lines of code**: -0 (same length, just clearer)  
**Complexity**: None - straightforward replacement  

---

## Verification

```bash
pnpm lint            # Should pass
pnpm test:unit       # Should pass  
pnpm type-check      # Should pass
```

---

## Success Criteria

✅ ESLint passes (no no-unused-expressions errors)  
✅ Tests pass  
✅ No new errors introduced  

---

## Related Issues

- Issue #212: Remove setState from useEffect (similar cleanup)
- Issue #215-216: Code cleanup and type safety (broader initiative)

---

## Next Steps

1. Implement the fix (2 lines to change)
2. Run tests and linting
3. Verify everything passes
4. Move to Issue #215

---

**Impact**: ✅ Better test clarity, fixed linting errors, no behavior changes
