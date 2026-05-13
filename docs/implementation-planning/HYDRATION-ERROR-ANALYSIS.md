# React Hydration Error Analysis & Resolution Guide

**Date**: May 12, 2026  
**Issue**: React hydration mismatch error in Next.js SSR  
**Status**: Analysis & prevention guide

---

## Understanding the Error

### What is React Hydration?

In Next.js with SSR (Server-Side Rendering):
1. **Server renders**: Node.js server generates HTML string
2. **Client receives**: Browser downloads HTML and React bundle
3. **Client hydrates**: React.js attaches event listeners and state to existing DOM
4. **Mismatch error**: If server HTML ≠ client HTML, React can't hydrate

### Error Message

```
A tree hydrated but some attributes of the server rendered HTML didn't match 
the client properties. This won't be patched up.
```

**Translation**: Server rendered X, but client tried to render Y

---

## Common Causes

### 1. ❌ Server/Client Branch (`if (typeof window !== 'undefined')`)

**Problem**: Component renders different HTML on server vs client

```typescript
// BAD - Causes hydration error
export function Component() {
  if (typeof window !== 'undefined') {
    return <div>Client only</div>;
  }
  return <div>Server</div>;  // Server renders this
  // Client renders "Client only" - MISMATCH!
}
```

**Solution**: Use `useEffect` to avoid server/client mismatch

```typescript
// GOOD
export function Component() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Server</div>;  // Both render same during hydration
  }
  return <div>Client only</div>;  // Client updates after hydration
}
```

---

### 2. ❌ Dynamic Values (Date.now(), Math.random())

**Problem**: Server and client generate different values

```typescript
// BAD - Causes hydration error
export function Component() {
  return <div>{Math.random()}</div>;  // Different each time!
}
```

**Solution**: Only generate dynamic values in `useEffect`

```typescript
// GOOD
export function Component() {
  const [random, setRandom] = useState<number | null>(null);
  
  useEffect(() => {
    setRandom(Math.random());
  }, []);
  
  return <div>{random ?? 'Loading...'}</div>;
}
```

---

### 3. ❌ Locale-Specific Formatting

**Problem**: Server formats Date in GMT, client in local timezone

```typescript
// BAD - Causes hydration error
export function Component() {
  return <div>{new Date().toLocaleString()}</div>;  // Different on server!
}
```

**Solution**: Format only on client side

```typescript
// GOOD
export function Component() {
  const [formatted, setFormatted] = useState('');
  
  useEffect(() => {
    setFormatted(new Date().toLocaleString());
  }, []);
  
  return <div>{formatted}</div>;
}
```

---

### 4. ❌ External Data Without Snapshots

**Problem**: Data changes between server render and client hydration

```typescript
// BAD - Data might change during hydration
export async function ServerComponent() {
  const data = await fetch('/api/data');  // Server time T1
  return <div>{data.items.length}</div>;
}
// Client hydrates at time T2 - data might have changed!
```

**Solution**: Pass data as props or use hydration-safe state

```typescript
// GOOD - Snapshot passed to client
export async function ServerComponent() {
  const data = await fetch('/api/data');
  return <ClientComponent initialData={data} />;
}

function ClientComponent({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  // Client hydrates with same snapshot server used
}
```

---

### 5. ❌ Invalid HTML Tag Nesting

**Problem**: HTML structure is invalid (browser auto-corrects, causes mismatch)

```typescript
// BAD - Invalid nesting (div inside <p>)
export function Component() {
  return (
    <p>
      <div>Content</div>
    </p>
  );
  // Server: renders as-is, Client: browser auto-corrects structure
}
```

**Solution**: Use valid HTML nesting

```typescript
// GOOD
export function Component() {
  return (
    <div>
      <p>Content</p>
    </div>
  );
}
```

---

## Analysis: Our Implementation

### EmptyState Component Review

**File**: `frontend/components/EmptyState.tsx`

✅ **No server/client branches** - No `typeof window` checks
✅ **No dynamic values** - No `Math.random()`, `Date.now()`
✅ **No locale-specific formatting** - No `.toLocaleString()`, `.toLocaleDateString()`
✅ **Valid HTML nesting** - Proper semantic structure
✅ **'use client' directive** - Correctly marked as client component
✅ **No external API calls** - No fetching data during render

**Verdict**: ✅ EmptyState is hydration-safe

### build-detail-modal.tsx Review

**File**: `frontend/components/build-detail-modal.tsx`

```typescript
// How EmptyState is used:
<EmptyState
  title="No parts yet"
  description="Add parts to your build to get started"
  ctaText="Add Part"
  onCTA={handleAddPart}
  isLoading={isAddingPart}        // State managed with useState
  loadingText="Adding Part..."    // Static string
/>
```

✅ **Props are deterministic** - Same props render same UI
✅ **State is managed on client** - `isAddingPart` is React state
✅ **No server/client mismatch** - Component always renders with same structure
✅ **Valid nesting** - All HTML properly nested

**Verdict**: ✅ Implementation is hydration-safe

---

## Where Hydration Errors Come From

### 1. Next.js App Router with Server Components

If `page.tsx` or parent is a **Server Component** (default):

```typescript
// app/page.tsx (Server Component)
import { BuildDetailModal } from '@/components/build-detail-modal';

export default function Page() {
  return <BuildDetailModal />;  // Server tries to render Client Component!
}
```

**Problem**: Server can't render `'use client'` components in SSR

**Solution**: Either:
- Mark the page as `'use client'`
- Use the client component only on client (in `useEffect`)
- Wrap in dynamic import with `ssr: false`

---

### 2. Hydration During SSR Build

If build-time HTML generation doesn't match client runtime:

```typescript
// Components used during `next build`
// May render differently than during client hydration
```

**Solution**: Ensure components don't depend on runtime-only APIs

---

### 3. Browser Extensions

Some browser extensions (especially ad blockers, React DevTools) modify DOM after React loads.

**Solution**: 
- Test in private/incognito mode
- Check browser console for extension warnings
- Suppress specific hydration errors if intentional

---

## Prevention Checklist

For any React component, especially in Next.js:

- [ ] No `typeof window !== 'undefined'` checks
- [ ] No `Math.random()`, `Date.now()` in render
- [ ] No `.toLocaleString()`, `.toLocaleDateString()`
- [ ] All data fetching in `useEffect` or server functions
- [ ] Valid HTML nesting (no divs in `<p>`, etc.)
- [ ] All components marked with `'use client'` if using hooks
- [ ] No dynamic imports without proper loading states
- [ ] Consistent props across server/client render

---

## Testing for Hydration Errors

### 1. Build and Test Locally

```bash
pnpm build          # Full production build (includes SSR)
pnpm start          # Run production server
```

Then visit `http://localhost:3000` and check browser console for warnings.

### 2. Check Next.js Dev Server

```bash
pnpm dev:frontend   # Next.js dev server
```

Dev server shows hydration errors as yellow warnings.

### 3. Inspect HTML Source

```bash
# View page source (Cmd+U or Ctrl+U)
# Check if HTML matches what client would render
```

### 4. React DevTools

- Install React DevTools browser extension
- Look for yellow/red highlighting indicating hydration issues
- Check component tree for mismatches

---

## Current Status: EmptyState Implementation

### ✅ Analysis Summary

**Our Implementation Assessment**:
- ✅ EmptyState component is hydration-safe
- ✅ No server/client branches
- ✅ No dynamic values in render
- ✅ No locale-specific formatting
- ✅ Valid HTML nesting
- ✅ Properly marked as `'use client'`

**Conclusion**: The EmptyState enhancement should NOT cause hydration errors.

---

## If Hydration Error Occurs

### Debugging Steps

1. **Check browser console** - Note exact error location
2. **Inspect element** - See what HTML server rendered vs client expects
3. **Search for causes** - Look for:
   - `typeof window !== 'undefined'`
   - `Math.random()`, `Date.now()`
   - `.toLocaleString()`, `.toLocaleDateString()`
   - Invalid HTML nesting
   - `useEffect` state mismatches

4. **Verify props** - Ensure all props passed to components are the same

5. **Test in private mode** - Disable extensions to rule them out

### Common Fix Patterns

```typescript
// Pattern 1: Wrap client-only content
'use client';
import { useEffect, useState } from 'react';

export function Component() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return <Skeleton />;
  
  return <div>{/* Client-only content */}</div>;
}
```

```typescript
// Pattern 2: Move API calls to useEffect
'use client';
import { useEffect, useState } from 'react';

export function Component() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);
  
  return <div>{data ? data.name : 'Loading...'}</div>;
}
```

```typescript
// Pattern 3: Use suppressHydrationWarning for known mismatches
<div suppressHydrationWarning>
  {new Date().toLocaleString()}
</div>
```

---

## Recommendations Going Forward

### For Phase 1 Work (Current)

✅ **No action needed** - Implementation is hydration-safe

### For Phases 2-5

When adding new components or features:
1. Always test `pnpm build && pnpm start` locally
2. Check browser console for hydration warnings
3. Follow prevention checklist above
4. Document any intentional hydration suppressions

### For Code Review

Add to PR checklist:
- [ ] No `typeof window` checks without `useEffect`
- [ ] No dynamic values in render
- [ ] No locale-specific formatting in render
- [ ] All data fetching properly async
- [ ] HTML structure is valid

---

## References

- [Next.js Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Guide](https://react.dev/reference/react-dom/hydrate)
- [Next.js SSR Best Practices](https://nextjs.org/docs/basic-features/data-fetching/server-side-rendering)

---

**Prepared**: May 12, 2026  
**Status**: Educational / Prevention Guide  
**Action**: No immediate fix needed - implementation is hydration-safe
