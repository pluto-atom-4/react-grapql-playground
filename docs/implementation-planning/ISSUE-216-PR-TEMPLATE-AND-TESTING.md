# Issue #216: PR Template & Testing Guide

**Testing the cleanup changes**

---

## PR Template for Issue #216

### Title
```
fix: issue-216 cleanup unused ESLint directives and missing return types
```

### Description

```markdown
## Summary
Cleanup code quality issues across E2E and test files:
- Remove unused ESLint directives (no-undef, no-console)
- Remove unexpected console.log statements
- Add missing return type annotations to test functions

## Changes
- [ ] Frontend E2E setup file: Remove unused no-undef directives
- [ ] Build workflow tests: Remove unused directives + console.log
- [ ] Minimal fixture tests: Remove unused directive + console.log
- [ ] Error boundary tests: Add return type annotations
- [ ] Error link tests: Add return type annotations

## Files Changed
- frontend/e2e/playwright.global-setup.ts
- frontend/e2e/tests/build-workflow.spec.ts
- frontend/e2e/tests/minimal-fixture.spec.ts
- frontend/components/__tests__/error-boundary.test.tsx
- frontend/lib/__tests__/error-link.test.ts

## Testing
- [x] ESLint passes: `pnpm lint`
- [x] Tests pass: `pnpm test:unit`
- [x] TypeScript passes: `pnpm type-check`
- [x] E2E tests pass: `pnpm test:e2e`

## Related Issues
- Closes #216
- Related: Issue #212, #213, #215 (cleanup initiative)

## Type of Change
- [ ] Bug fix
- [x] Refactoring/Cleanup
- [ ] New feature
- [ ] Breaking change

## Checklist
- [x] My code follows the style guidelines
- [x] No new errors or warnings from ESLint
- [x] All tests pass locally
- [x] No console warnings
```

---

## Testing Checklist

### Pre-Implementation Test

```bash
# Baseline - check current state
pnpm lint 2>&1 | grep -E "error|warning" | head -20

# Note the existing errors related to this issue
```

### After Implementation Test

```bash
# Test 1: ESLint Check
echo "=== ESLint Check ==="
pnpm lint

# Test 2: Unit Tests
echo "=== Unit Tests ==="
pnpm test:unit

# Test 3: Type Check
echo "=== Type Check ==="
pnpm type-check

# Test 4: E2E Tests (if affected)
echo "=== E2E Tests ==="
pnpm test:e2e
```

### Verification Script

```bash
#!/bin/bash
# Save as verify-issue-216.sh

echo "Verifying Issue #216 fixes..."

# Check for unused directives
echo "Checking for remaining unused directives..."
grep -r "eslint-disable no-undef" frontend/e2e/ || echo "✅ No unused no-undef directives"
grep -r "eslint-disable no-console" frontend/e2e/ | wc -l | xargs -I {} echo "Remaining no-console directives: {}"

# Run lint
echo ""
echo "Running lint..."
pnpm lint >/dev/null && echo "✅ Lint passed" || echo "❌ Lint failed"

# Run tests
echo ""
echo "Running tests..."
pnpm test:unit >/dev/null && echo "✅ Tests passed" || echo "❌ Tests failed"

# Type check
echo ""
echo "Running type check..."
pnpm type-check >/dev/null && echo "✅ Type check passed" || echo "❌ Type check failed"

echo ""
echo "Verification complete!"
```

---

## Manual Testing (Each File)

### playwright.global-setup.ts

```bash
# Before fix
grep "eslint-disable no-undef" frontend/e2e/playwright.global-setup.ts

# After fix - should be empty
grep "eslint-disable no-undef" frontend/e2e/playwright.global-setup.ts || echo "✅ All removed"
```

### build-workflow.spec.ts

```bash
# Count before fix (note the number)
grep -c "eslint-disable" frontend/e2e/tests/build-workflow.spec.ts

# After fix - should be fewer or zero (unless intentional)
grep -c "eslint-disable" frontend/e2e/tests/build-workflow.spec.ts

# Check console.log
grep "console.log" frontend/e2e/tests/build-workflow.spec.ts || echo "✅ All removed or annotated"
```

### error-boundary.test.tsx

```bash
# Check return types added
grep ": void" frontend/components/__tests__/error-boundary.test.tsx | wc -l

# Should be ~6 functions with return types
```

### error-link.test.ts

```bash
# Check return types
grep ": void" frontend/lib/__tests__/error-link.test.ts | wc -l

# Should be ~2 functions with return types
```

---

## Integration Testing

### Test That Nothing Broke

```bash
# Run full test suite
pnpm test

# Run full lint
pnpm lint

# Check for new warnings
```

### Regression Testing

```bash
# E2E tests still work (if they exist)
pnpm test:e2e

# Component tests still work
pnpm test:unit error-boundary
pnpm test:unit error-link
```

---

## Review Checklist (For Code Reviewer)

- [ ] All unused `eslint-disable` comments removed
- [ ] `console.log` statements handled appropriately
- [ ] Return type annotations added (`: void`)
- [ ] ESLint passes
- [ ] Tests pass
- [ ] No new warnings introduced
- [ ] Code is cleaner and more maintainable
- [ ] Related to Issue #226 coordination noted

---

## Common Test Results

### ✅ Success Scenario

```
✅ 5 files modified
✅ ~20 unused directives removed
✅ ~12 console.log cleaned
✅ ~8 return types added
✅ ESLint: All checks pass
✅ Tests: All pass
✅ TypeScript: No errors
```

### ⚠️ Warning Scenario

```
⚠️ ESLint still has warnings in Issue #226 related files
→ Coordinate with Issue #226 implementation
```

### ❌ Failure Scenarios

```
❌ Tests fail after cleanup
→ Review changes, ensure no logic changed

❌ ESLint still failing
→ Check all files were edited
→ Run `pnpm lint:fix` again

❌ Type errors appear
→ Added return types might be wrong
→ Check they're all `: void` or appropriate type
```

---

## Performance Impact

- ✅ No performance impact (cleanup only)
- ✅ Code is cleaner
- ✅ Linting faster (fewer directives to process)
- ✅ Test execution same

---

## Deployment Notes

- Safe to deploy: ✅ Yes
- Breaking changes: ❌ None
- Requires migrations: ❌ No
- Requires restart: ❌ No

---

**Ready to test!** Run the checklist above to verify everything works. 🚀
