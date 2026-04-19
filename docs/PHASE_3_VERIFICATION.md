# Phase 3: SSR Testing & Verification Guide

This guide walks through manual verification of Issue #26 (Server Component Pattern) implementation.

## Quick Test: Hydration Safety (5 minutes)

### Step 1: Start Dev Server
```bash
cd /home/pluto-atom-4/Documents/stoke-full-stack/react-grapql-playground
pnpm dev
```

Wait for all three services to start:
- Frontend: http://localhost:3000 ✓
- GraphQL: http://localhost:4000 ✓  
- Express: http://localhost:5000 ✓

### Step 2: Verify Server Renders SEO Metadata
```bash
# In another terminal
curl -s http://localhost:3000 | grep -E '<title>|description' | head -5

# Expected output:
# <title>Build Dashboard - Boltline</title>
# <meta name="description" content="Monitor manufacturing builds..."/>
```

✅ **Pass**: Metadata present in HTML from server

### Step 3: Check Browser Console (Zero Hydration Warnings)
1. Open http://localhost:3000 in Chrome/Firefox
2. Open DevTools (F12)
3. Go to Console tab
4. Look for any errors containing "Hydration" or "mismatch"

✅ **Expected**: Console is clean, no hydration errors

### Step 4: Verify Apollo Cache (Server Data Cached)
1. Install Apollo DevTools browser extension (if not already)
2. Open DevTools (F12)
3. Go to "Apollo" tab in DevTools
4. Look at "Queries" section
5. Should see `BUILDS_QUERY` with data populated

✅ **Expected**: Query shows data from server fetch, not re-fetching

### Step 5: Verify Server-Rendered Data in HTML
```bash
curl -s http://localhost:3000 | grep -i 'build-' | head -3

# Expected: Build data from initialBuilds prop visible in HTML
```

✅ **Pass**: Build data visible in server-rendered HTML

---

## Full Test: Dev Server with Network Inspection (10 minutes)

### Step 1-5: Repeat Hydration Safety Tests (above)

### Step 6: Check Network Requests (Single GraphQL Query)
1. Open DevTools → Network tab
2. Reload page (Cmd+Shift+R for hard refresh)
3. Filter by "graphql" or "XHR"
4. Look at requests during page load

✅ **Expected**: 
- First request: GraphQL query on server (appears in HTML response)
- Subsequent requests: No graphql queries on initial page load
- Total: 1 query (server-side), 0 from client hydration

### Step 7: Test Client-Side Interaction
1. Click "Create Build" button
2. Complete the form
3. Check Network tab again

✅ **Expected**: New GraphQL mutation request appears (client-side, works normally)

### Step 8: Verify Error Fallback (if time permits)
1. Stop GraphQL server: `docker-compose stop postgres` or kill Apollo process
2. Reload page in browser
3. Should see error message but dashboard still renders

✅ **Expected**: "Server error" warning, but UI remains functional

---

## Performance Baseline: Lighthouse (Optional, 15 minutes)

### For Reference Only (Full Benchmark in Phase 3):
```bash
# Build production bundle
pnpm build

# Start production server
pnpm start

# Open http://localhost:3000 in Chrome
# Run Lighthouse:
# - DevTools → Lighthouse tab
# - Select "Mobile (3G)" network throttling
# - Run audit

# Record FCP (First Contentful Paint) metric
# Expected improvement: 30-50% faster than baseline
```

---

## Checklist: Phase 3 Hydration Testing

- [ ] Dev server starts without errors: `pnpm dev`
- [ ] curl http://localhost:3000 shows build data in HTML
- [ ] Browser console has zero hydration warnings
- [ ] Apollo DevTools shows BUILDS_QUERY cached (not re-fetching)
- [ ] Page interactive within 2-3 seconds
- [ ] Network tab shows 1 GraphQL query (server), 0 from client hydration
- [ ] Client mutations work after hydration
- [ ] Error fallback renders when server fails (optional)
- [ ] All existing frontend tests still pass: `pnpm test:frontend`

---

## Debugging Tips

### Hydration Mismatch?
- Check that server and client are rendering the exact same HTML
- Verify initialBuilds types match (Build[] from graphql-codegen)
- Check for dynamic values (timestamps, random IDs) that might differ
- Use `NODE_ENV=development pnpm dev` for more detailed warnings

### Apollo Query Not Cached?
- Check Apollo DevTools → Queries tab
- Verify `ssrMode: true` is set in apollo-client-server.ts
- Check that initialBuilds prop is being passed to BuildDashboard
- Verify useBuilds() hook is not being called when initialBuilds provided

### Server Data Not Rendering?
- Check Network tab → find HTML response
- Search for build data in response (curl http://localhost:3000 | grep build)
- Verify BUILDS_QUERY succeeds in GraphQL (test in http://localhost:4000/graphql)
- Check server console for errors

### Build Fails?
- Run `pnpm lint` to check for linting errors
- Run `pnpm -F frontend build` for TypeScript errors
- Check that Build[] type is imported from @/lib/generated/graphql
- Verify no 'use client' directive in app/page.tsx (it should be async Server Component)

---

## Success Criteria Met

✅ Hydration Safety Testing
- Server renders with data
- No hydration warnings in browser console
- Apollo cache shows query cached (not re-fetching)
- Page interactive after hydration

✅ E2E Verification
- Server data appears in HTML
- Client hydration works without errors
- Client mutations work normally after hydration

✅ Integration Tests
- Error fallback renders gracefully
- buildDashboard accepts initialBuilds prop
- Type-safe Build[] types from graphql-codegen

✅ Performance Ready
- Foundation laid for Lighthouse benchmark
- Architecture supports 30-50% FCP improvement

---

## Next: Phase 3 Completion

When all checks pass:
1. Mark todos as done: `UPDATE todos SET status = 'done' WHERE id IN (...)`
2. Commit verification results
3. Create PR on branch `feat/server-component-pattern`
4. Ready for code review and merge to main

