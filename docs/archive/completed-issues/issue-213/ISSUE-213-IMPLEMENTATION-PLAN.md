# Issue #213: Implementation Plan

**Detailed step-by-step implementation guide**

---

## Overview

Fix 2 ESLint violations in test file by converting bare query expressions to proper test assertions.

---

## Step 1: Locate the File

```bash
cd frontend/__tests__/integration
ls -la multi-user.test.tsx
```

Expected: File exists and is readable

---

## Step 2: Review Current State

```bash
# View the file
cat multi-user.test.tsx | head -50

# Or open in editor
vim multi-user.test.tsx
```

Look for lines around 38 and 45.

---

## Step 3: Review Line 38

```bash
sed -n '35,42p' frontend/__tests__/integration/multi-user.test.tsx
```

Should show:
```typescript
it('should handle concurrent user interactions', async () => {
  const { getByTestId } = render(<Dashboard />);
  
  // ... setup ...
  
  getByTestId('build-button');  // ← Line 38
  
  // ... rest ...
});
```

---

## Step 4: Fix Line 38

**Replace**:
```typescript
getByTestId('build-button');
```

**With**:
```typescript
expect(getByTestId('build-button')).toBeInTheDocument();
```

---

## Step 5: Review Line 45

```bash
sed -n '42,50p' frontend/__tests__/integration/multi-user.test.tsx
```

Should show:
```typescript
it('should sync state across multiple components', async () => {
  const { getByText } = render(<BuildList />);
  
  // ... setup ...
  
  getByTestId('part-list');  // ← Line 45
  
  // ... rest ...
});
```

---

## Step 6: Fix Line 45

**Replace**:
```typescript
getByTestId('part-list');
```

**With**:
```typescript
expect(getByTestId('part-list')).toBeInTheDocument();
```

---

## Step 7: Verify Changes

```bash
# Show the fixed lines
sed -n '35,50p' frontend/__tests__/integration/multi-user.test.tsx
```

Both lines should now have `expect(...).toBeInTheDocument()`

---

## Step 8: Run ESLint

```bash
pnpm lint frontend/__tests__/integration/multi-user.test.tsx
```

Expected output: ✅ **PASS** (no errors)

---

## Step 9: Run Tests

```bash
pnpm test:unit multi-user
```

Expected output: ✅ **All tests pass**

---

## Step 10: Type Check

```bash
pnpm type-check
```

Expected output: ✅ **No errors**

---

## Step 11: Verify Overall Linting

```bash
pnpm lint
```

Expected output: ✅ **All files pass** (or at least multi-user.test.tsx passes)

---

## Rollback (If Needed)

If something goes wrong:

```bash
# Revert changes
git checkout frontend/__tests__/integration/multi-user.test.tsx

# Start over
```

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| View file | `cat frontend/__tests__/integration/multi-user.test.tsx` |
| View lines | `sed -n '35,50p' frontend/__tests__/integration/multi-user.test.tsx` |
| Lint check | `pnpm lint frontend/__tests__/integration/multi-user.test.tsx` |
| Run tests | `pnpm test:unit multi-user` |
| Type check | `pnpm type-check` |
| Revert | `git checkout frontend/__tests__/integration/multi-user.test.tsx` |

---

**Expected Time**: 5 minutes implementation + 20 minutes verification

---

Done! ✨
