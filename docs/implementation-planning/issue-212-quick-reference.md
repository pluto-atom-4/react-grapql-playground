# Issue #212: Quick Reference - Developer Checklist

**Issue**: Remove setState from useEffect in CreateBuildModal  
**File**: `frontend/components/create-build-modal.tsx` (line 23)  
**Status**: Ready for Implementation  
**Time**: 1-2 hours  

---

## ⚡ Quick Reference Card

### The Problem (30 seconds)
- Component calls `setState` directly in `useEffect`
- Causes unnecessary re-renders when modal opens/closes
- React anti-pattern; violates best practices

### The Solution (30 seconds)
- Add `key` prop to modal in parent component
- Remove the `useEffect` block from component
- Done! Form resets automatically when key changes

### Files to Change
```
frontend/components/create-build-modal.tsx          ← Remove useEffect
[ParentComponent].tsx                                ← Add key prop
frontend/components/__tests__/create-build-modal.test.tsx  ← Update tests (if needed)
```

---

## 🎯 Implementation Steps

### Step 1: Locate the Problem
```bash
# Find the file
cd frontend/components/
cat create-build-modal.tsx | grep -A 5 "useEffect"
```

Expected output:
```typescript
useEffect(() => {
  setBuildName('');  // ← Line 23: This is the problem
  setError('');
}, [isOpen]);
```

### Step 2: Find All Modal Usage
```bash
# Search for all uses of CreateBuildModal
grep -r "CreateBuildModal" frontend/ --include="*.tsx" --include="*.ts"
```

Note all files where `<CreateBuildModal />` appears

### Step 3: Add Key Prop
In **each** file that renders `<CreateBuildModal>`:

**Before**:
```typescript
<CreateBuildModal isOpen={isOpen} onClose={handleClose} />
```

**After**:
```typescript
<CreateBuildModal 
  key={`modal-${isOpen}`}
  isOpen={isOpen} 
  onClose={handleClose} 
/>
```

### Step 4: Remove useEffect
In `frontend/components/create-build-modal.tsx`:

**Delete these lines** (approximately line 23-27):
```typescript
useEffect(() => {
  setBuildName('');
  setError('');
}, [isOpen]);
```

Keep all other code unchanged.

### Step 5: Verify
```bash
# Check for remaining useEffect
grep "useEffect" frontend/components/create-build-modal.tsx
# Should return: (nothing - useEffect is removed)

# Check TypeScript
pnpm type-check

# Run tests
pnpm test:unit create-build-modal

# Check linting
pnpm lint
```

---

## ✅ Validation Checklist

Before you call this done:

- [ ] Added `key={`modal-${isOpen}`}` to **all** `<CreateBuildModal>` instances
- [ ] Removed entire `useEffect` block from component
- [ ] No TypeScript errors: `pnpm type-check` passes
- [ ] No linting errors: `pnpm lint` passes
- [ ] Component tests pass: `pnpm test:unit create-build-modal`
- [ ] Manually tested: Form resets when modal opens/closes
- [ ] React DevTools shows no console warnings about effects

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Form doesn't reset | Did you add the `key` prop? Check all parent files. |
| TypeScript errors | Verify you removed the entire `useEffect` block. |
| Tests fail | Update test mocks if they expect certain behavior. |
| "Invalid hook call" error | Make sure you removed `useEffect` completely. |
| ESLint still failing | Run `pnpm lint:fix` to auto-fix remaining issues. |

---

## 🚀 One-Liner Commands

```bash
# Find the component
find . -name "create-build-modal.tsx" -path "*/components/*"

# Grep for useEffect in it
grep -n "useEffect" frontend/components/create-build-modal.tsx

# Find all usages
grep -r "CreateBuildModal" frontend/ --include="*.tsx" -l

# Run only this test
pnpm test:unit -- create-build-modal

# Type check only this file
pnpm type-check frontend/components/create-build-modal.tsx
```

---

## 📋 Code Changes Summary

**Total changes**:
- 1 component file: Remove 5-7 lines (useEffect block)
- 1-N parent files: Add 1 line each (key prop)
- 0 test files: No changes needed (unless updating assertions)

**Complexity**: 🟢 Easy  
**Risk**: 🟢 Low (no behavior change, just refactoring)

---

## ❓ FAQ

**Q: Will this break the modal?**
A: No. The modal will still open/close exactly the same way. The form just resets without unnecessary renders.

**Q: Do I need to update tests?**
A: Maybe. If tests specifically verify the useEffect behavior, update them. But basic modal tests should still pass.

**Q: What if I'm not sure where the modal is used?**
A: Use `grep -r "CreateBuildModal" frontend/` to find all usages.

**Q: Is this a breaking change?**
A: No. This is purely internal refactoring. Component API stays the same.

---

## 📞 Need Help?

- Unsure about React keys? Check [React docs on keys](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- Confused about useEffect? See [useEffect documentation](https://react.dev/reference/react/useEffect)
- Still stuck? Review `issue-212-remove-useeffect-setstate.md` for detailed explanation

---

**Done?** When all checkboxes are checked, move to Issue #213! ✨
