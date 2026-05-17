# Issue #213: Visual Guide & Test Map

**Understanding test structure and implementation**

---

## Visual Flow: How to Find and Fix

```
START
  ↓
Open file: frontend/__tests__/integration/multi-user.test.tsx
  ↓
Find line 38: getByTestId('build-button');
  ↓
Replace with: expect(getByTestId('build-button')).toBeInTheDocument();
  ↓
Find line 45: getByTestId('part-list');
  ↓
Replace with: expect(getByTestId('part-list')).toBeInTheDocument();
  ↓
Run: pnpm lint (should pass ✅)
  ↓
Run: pnpm test:unit multi-user (should pass ✅)
  ↓
DONE! ✨
```

---

## File Structure Map

```
frontend/__tests__/integration/
├── multi-user.test.tsx
│   ├── describe('Multi-user interactions')
│   │   ├── it('should handle concurrent user interactions')
│   │   │   ├── render(<Dashboard />)
│   │   │   ├── getByTestId('build-button')  ← LINE 38: ❌ FIX THIS
│   │   │   └── // rest of test
│   │   ├── it('should sync state across multiple components')
│   │   │   ├── render(<BuildList />)
│   │   │   ├── getByTestId('part-list')  ← LINE 45: ❌ FIX THIS
│   │   │   └── // rest of test
│   │   └── // other tests...
```

---

## Test Element References

### Test 1: Concurrent User Interactions

```
Component: Dashboard
Elements to verify:
  ├── build-button (testid)
  └── Expected: Should be in the DOM

Current code:   getByTestId('build-button');
Expected code:  expect(getByTestId('build-button')).toBeInTheDocument();
Purpose:        Verify the button exists in rendered component
```

### Test 2: State Sync Across Components

```
Component: BuildList
Elements to verify:
  ├── part-list (testid)
  └── Expected: Should be in the DOM

Current code:   getByTestId('part-list');
Expected code:  expect(getByTestId('part-list')).toBeInTheDocument();
Purpose:        Verify the part list exists in rendered component
```

---

## Query Function Explanation

### What getByTestId() Does

```
getByTestId('element-id')
    ↓
1. Searches for HTML element with data-testid="element-id"
2. If found: Returns the HTMLElement
3. If not found: Throws an error (test fails)
4. In BOTH cases: No assertion made
    ↓
Result: Just queries, doesn't verify
```

### What expect().toBeInTheDocument() Does

```
expect(getByTestId('element-id')).toBeInTheDocument()
    ↓
1. Calls getByTestId('element-id')
2. Gets HTMLElement (if found)
3. Asserts that element is in the document
4. Assertion passes: ✅ Element is in DOM
5. Assertion fails: ❌ Element not in DOM
    ↓
Result: Queries AND verifies
```

---

## Common Query Methods Reference

| Method | Returns | Throws if | Use for |
|--------|---------|-----------|---------|
| `getByTestId()` | Element | Not found | Querying by test ID |
| `getByText()` | Element | Not found | Querying by text |
| `getByRole()` | Element | Not found | Querying by accessibility role |
| `queryByTestId()` | Element or null | Never | Checking if element exists |
| `queryByText()` | Element or null | Never | Checking if text exists |

---

## Fix Application Decision Tree

```
Found unused expression query?
    ├─ YES
    │   ├─ Used later in test?
    │   │   ├─ YES: Assign to variable ← assign to const
    │   │   └─ NO: Need to verify exists? 
    │   │       ├─ YES: Add expect().toBeInTheDocument() ← DO THIS
    │   │       └─ NO: Remove the line (if truly unneeded)
    │   └─ NO: Keep as is (or review intent)
```

---

## Implementation Checklist

- [ ] Open file in editor
- [ ] Navigate to line 38
- [ ] Select and replace: `getByTestId('build-button');`
- [ ] With: `expect(getByTestId('build-button')).toBeInTheDocument();`
- [ ] Navigate to line 45
- [ ] Select and replace: `getByTestId('part-list');`
- [ ] With: `expect(getByTestId('part-list')).toBeInTheDocument();`
- [ ] Save file
- [ ] Run: `pnpm lint` (verify no errors)
- [ ] Run: `pnpm test:unit multi-user` (verify tests pass)
- [ ] Commit changes

---

## ESLint Rule Reference

### The Rule: @typescript-eslint/no-unused-expressions

**Purpose**: Warn about statements that don't do anything

**Triggers on**:
```typescript
getByTestId('id');        // ❌ Unused expression
x + 1;                    // ❌ Unused expression
functionCall();           // ❌ Unused expression (if no side effect)
```

**Doesn't trigger on**:
```typescript
expect(condition);        // ✅ Assertion
const x = getByTestId('id');  // ✅ Assignment
functionCall(arg1, arg2);     // ✅ Has meaningful side effects
```

**Our fix**: Add meaningful use (assertion) to the expression

---

## Testing Your Fix

### Before Fix
```bash
$ pnpm lint frontend/__tests__/integration/multi-user.test.tsx

❌ FAIL
frontend/__tests__/integration/multi-user.test.tsx
  38:3  error  Expression statement is not assigned or used
  45:3  error  Expression statement is not assigned or used
```

### After Fix
```bash
$ pnpm lint frontend/__tests__/integration/multi-user.test.tsx

✅ PASS
No errors found
```

---

## Test Execution Flow (After Fix)

```
Test 1: 'should handle concurrent user interactions'
  1. Render Dashboard component
  2. Get element by testid 'build-button'
  3. Assert it's in the document
  4. Run rest of test...
  5. Result: ✅ PASS

Test 2: 'should sync state across multiple components'  
  1. Render BuildList component
  2. Get element by testid 'part-list'
  3. Assert it's in the document
  4. Run rest of test...
  5. Result: ✅ PASS
```

---

**Visual Summary**: Replace bare queries with assertions ✅
