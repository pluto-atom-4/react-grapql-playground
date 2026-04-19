# Phase C Quick Reference

## 4 Phase C Issues at a Glance

```
┌─────────────────────────────────────────────────────────┐
│ ISSUE #26: Server Component Pattern      ⭐ START HERE │
├─────────────────────────────────────────────────────────┤
│ Complexity: SIMPLE    │ Effort: 1 hour  │ Risk: 🟢 LOW  │
│ Dependencies: NONE                                      │
│ What: Convert frontend/app/page.tsx to async Server    │
│       Component. Fetch builds server-side, pass to      │
│       BuildDashboard.                                   │
│ Impact: Data in initial HTML, 30-40% faster FCP        │
│ Status: Ready to start immediately                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ISSUE #30: Optimistic Updates          🚀 2ND PRIORITY │
├─────────────────────────────────────────────────────────┤
│ Complexity: MODERATE │ Effort: 2 hours │ Risk: 🟡 MED  │
│ Dependencies: Phase B (#23, #25) ✓                      │
│ What: Add optimisticResponse to mutations. Show UI      │
│       changes instantly, revert on error.               │
│ Impact: Mutations feel 3-5x faster on slow networks    │
│ Enables: Integration tests can test optimistic flow    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ISSUE #27: JWT Authentication          🔐 3RD PRIORITY │
├─────────────────────────────────────────────────────────┤
│ Complexity: MODERATE │ Effort: 3 hours │ Risk: 🟡 MED  │
│ Dependencies: Phase B (#23, #25) ✓                      │
│ What: AuthContext + Login component. Attach JWT to     │
│       Apollo headers. Validate on backend.              │
│ Impact: Secure application, user context in resolvers  │
│ Production: Use httpOnly cookies, refresh tokens       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ISSUE #37: Integration Tests            ✅ 4TH PRIORITY│
├─────────────────────────────────────────────────────────┤
│ Complexity: MODERATE │ Effort: 2-3 hrs │ Risk: 🟢 LOW  │
│ Dependencies: #30 (Optimistic updates)                  │
│              #27 (Auth - optional)                      │
│ What: E2E tests covering create → add → update → verify│
│       Uses React Testing Library + MockedProvider       │
│ Impact: Validates all Phase C features work together   │
│ Coverage: Target 60%+ of components                    │
└─────────────────────────────────────────────────────────┘
```

## Dependency Map

```
PHASE B (Complete)
  ├─ #23: Apollo singleton ✅
  ├─ #24: (GraphQL schema) ✅
  └─ #25: TypeScript types ✅

PHASE C (Unblocked)
  ├─ #26: Server Components (depends: NONE)
  │        ↓
  │        (Can start immediately)
  │
  ├─ #30: Optimistic Updates (depends: Phase B ✅)
  │        ↓
  │        Enables: #37 tests
  │
  ├─ #27: JWT Auth (depends: Phase B ✅)
  │        ↓
  │        Independent of #26, #30
  │
  └─ #37: Integration Tests (depends: #30)
           Optional: #27 for auth workflows
```

## Recommended Implementation Order

```
START: Issue #26 (1 hour)
  ↓
THEN: Issue #30 (2 hours)
  ↓
THEN: Issue #27 (3 hours)
  ↓
THEN: Issue #37 (2-3 hours)

Total Sequential Time: ~8-9 hours
```

## Key Metrics

| Metric | Value |
|--------|-------|
| Total Issues | 4 |
| Total Effort (Sequential) | 8-9 hours |
| Total Effort (Parallel) | ~3 hours |
| Min Issues Blocked | 0 (all can start independently) |
| Recommended Start | #26 |
| Lowest Risk Issue | #26 (Server Components) |
| Most Complex Issue | #27 (JWT Auth) |

## Preparation Checklist

Before starting Issue #26:

- [ ] Phase B merged to main
- [ ] Apollo singleton (#23) working
- [ ] TypeScript types (#25) working
- [ ] GraphQL schema (#24) accessible
- [ ] All Phase B tests passing
- [ ] Fresh branch from main

## Success Criteria Per Issue

### #26: Server Components
- ✅ Page renders without 'use client'
- ✅ Build data in initial HTML
- ✅ No hydration mismatches
- ✅ `pnpm build` succeeds
- ✅ Tests pass

### #30: Optimistic Updates
- ✅ Mutations show instant feedback (no spinner)
- ✅ Cache reverts on error
- ✅ Temp IDs for new items
- ✅ Real IDs update cache
- ✅ Tests verify optimistic flow

### #27: JWT Auth
- ✅ Can't access dashboard without login
- ✅ Token stored in localStorage
- ✅ Authorization header sent to GraphQL
- ✅ Backend validates JWT
- ✅ Logout clears token and redirects

### #37: Integration Tests
- ✅ All integration tests pass
- ✅ Tests cover full workflows
- ✅ 60%+ component coverage
- ✅ Tests verify optimistic updates
- ✅ Error scenarios tested

## Interview Talking Points (Per Issue)

**#26 - Server Components:**
"I use Next.js 16+ Server Components to fetch data server-side before rendering. This parallelizes data fetching with JavaScript bundling, improving Time to First Byte by 30-40%. The initial HTML already contains the dashboard data, eliminating client-side loading spinners."

**#30 - Optimistic Updates:**
"I implement Apollo optimistic responses to show mutations instantly before server confirms. On 3G networks (1+ second latency), this changes perceived performance from a 2-3 second wait to instant feedback. If the mutation fails, Apollo automatically reverts the cache."

**#27 - JWT Auth:**
"I implement JWT authentication across the full stack. Frontend stores JWT in localStorage (production uses httpOnly cookies), attaches it to Apollo headers. Backend middleware validates token on every query, ensuring only authenticated users access data. User context is available in all resolvers for fine-grained authorization."

**#37 - Integration Tests:**
"I write end-to-end integration tests using React Testing Library and MockedProvider. These tests verify complete user workflows (create → update → verify) work together, not just isolated components. They catch integration bugs that unit tests miss."

---

**Phase C Status**: 🟢 **READY TO START**  
**Recommended Entry**: Issue #26  
**Risk Level**: 🟢 **LOW** (all issues manageable, clear path)
