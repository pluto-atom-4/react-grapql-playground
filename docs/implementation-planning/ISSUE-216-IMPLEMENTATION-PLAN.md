# Issue #216: Implementation Plan - Step by Step

**Issue**: Cleanup unused ESLint directives & missing return types  
**Status**: Ready for Implementation  
**Effort**: 1-2 hours  
**Complexity**: Medium  

---

## Pre-Implementation Checklist

- [ ] Understand the three cleanup categories
- [ ] Locate all affected files
- [ ] Back up changes (you're using Git ✓)
- [ ] Review each file for issues

---

## Step 1: Locate Files

```bash
# Create list of files to fix
FILES=(
  "frontend/e2e/playwright.global-setup.ts"
  "frontend/e2e/tests/build-workflow.spec.ts"
  "frontend/e2e/tests/minimal-fixture.spec.ts"
  "frontend/components/__tests__/error-boundary.test.tsx"
  "frontend/lib/__tests__/error-link.test.ts"
)

# Check each exists
for file in "${FILES[@]}"; do
  test -f "$file" && echo "✅ $file" || echo "❌ $file"
done
```

---

## Step 2: Create Feature Branch

```bash
git checkout -b fix/issue-216-cleanup
```

---

## Step 3: Fix playwright.global-setup.ts

```bash
# Find unused directives
grep -n "eslint-disable no-undef" frontend/e2e/playwright.global-setup.ts

# Remove the directives (delete the lines or the comment)
# Expected: ~4 directives removed
```

---

## Step 4: Fix build-workflow.spec.ts

```bash
# Find unused directives
grep -n "eslint-disable" frontend/e2e/tests/build-workflow.spec.ts

# Find console.log statements
grep -n "console.log" frontend/e2e/tests/build-workflow.spec.ts

# Remove directives: ~12
# Clean console.log: ~6
```

---

## Step 5: Fix minimal-fixture.spec.ts

```bash
# Find unused directives
grep -n "eslint-disable" frontend/e2e/tests/minimal-fixture.spec.ts

# Find console.log
grep -n "console.log" frontend/e2e/tests/minimal-fixture.spec.ts

# Remove: ~1 directive
# Clean: ~6 console.log
```

---

## Step 6: Add Return Types - error-boundary.test.tsx

```bash
# Find test functions without return types
grep -n "it('.*'," frontend/components/__tests__/error-boundary.test.tsx

# Add `: void` after function signature
# Example: it('should work', () => {
# Change to: it('should work', (): void => {
# Expected: ~6 functions updated
```

---

## Step 7: Add Return Types - error-link.test.ts

```bash
# Find test functions
grep -n "it('.*'," frontend/lib/__tests__/error-link.test.ts

# Add `: void` to function signatures
# Expected: ~2 functions updated
```

---

## Step 8: Verify Changes

```bash
# Show what changed
git diff

# Check if changes look correct
```

---

## Step 9: Run ESLint

```bash
pnpm lint
```

**Expected**: All checks pass (or at least these files pass)

---

## Step 10: Run Tests

```bash
pnpm test:unit
```

**Expected**: All tests pass

---

## Step 11: Type Check

```bash
pnpm type-check
```

**Expected**: No errors

---

## Step 12: Commit Changes

```bash
git add -A
git commit -m "fix: issue-216 cleanup unused directives and add return types"
```

---

## Using Auto-Fix (Alternative)

If you prefer ESLint auto-fix:

```bash
# Run auto-fix
pnpm lint:fix

# Review what changed
git diff

# Note: This won't remove console.log or add all return types
# You may need to do that manually
```

---

## Rollback (If Needed)

```bash
# Undo all changes
git checkout -- .

# Or revert specific file
git checkout -- frontend/e2e/playwright.global-setup.ts
```

---

## Common Commands

| Action | Command |
|--------|---------|
| Find unused no-undef | `grep -n "eslint-disable no-undef" <file>` |
| Find unused no-console | `grep -n "eslint-disable no-console" <file>` |
| Find console.log | `grep -n "console.log" <file>` |
| View specific line | `sed -n '<line>p' <file>` |
| Lint check | `pnpm lint` |
| Auto-fix | `pnpm lint:fix` |
| Run tests | `pnpm test:unit` |
| Type check | `pnpm type-check` |

---

## Expected Changes

```
Files to change: 5
Lines to remove: ~20-30 (unused directives)
Console.log to clean: ~12 (remove or annotate)
Return types to add: ~8 (`: void` annotations)
Total effort: 1-2 hours
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't find files | Check paths, run `find . -name <filename>` |
| Auto-fix didn't work | Run `pnpm lint:fix` again or fix manually |
| Tests still failing | Review changes with `git diff` |
| Lint still failing | Check file was saved, run `pnpm lint` again |

---

## Success Checklist

- [ ] All unused directives removed
- [ ] All console.log statements handled
- [ ] All return types added
- [ ] ESLint passes
- [ ] Tests pass
- [ ] TypeScript passes
- [ ] Changes committed

---

**Ready to implement!** Follow the steps above and verify everything passes. 🚀
