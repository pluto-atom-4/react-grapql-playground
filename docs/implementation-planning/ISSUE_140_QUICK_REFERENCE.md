# Issue #140: React Hooks Rules Violation - Quick Reference

**File**: `docs/implementation-planning/ISSUE_140_IMPLEMENTATION_PLAN.md`

## 🎯 Quick Navigation

### For Busy Developers (5 min read)
- **Problem**: Lines 2-5 of this document
- **Solution**: Lines 8-10 of this document
- **Implementation**: Jump to Section 3 (Implementation Steps)
- **Timeline**: Jump to Section 7 (30 minutes total)

### For Thorough Analysis (20 min read)
1. Executive Summary (this file)
2. Section 1: Scope Analysis - Understand the architecture
3. Section 2: Fix Strategy - Understand why it works
4. Section 6: Risk Assessment - Understand edge cases

### For Implementation (30 min)
1. Section 3: Implementation Steps (follow exactly)
2. Section 4: Testing Plan (run all tests)
3. Section 5: Verification Checklist (verify everything)

---

## 🔴 The Problem

**Issue #140**: React Hooks violation in `frontend/lib/apollo-client.ts:21`

```typescript
// WRONG - Violates React Hooks Rules
const authLink = setContext((_, context) => {
  const { token } = useAuth();  // ❌ Hook called in callback!
  return {
    headers: { ...headers, authorization: `Bearer ${token}` }
  };
});
```

**Why it fails**:
- `useAuth()` is a React hook → can only be called in React components
- `setContext()` callback is **not** a React component → middleware
- Production builds enforce this rule → app breaks in production

**Impact**: 
- ❌ Authentication doesn't work in production
- ❌ Blocks Issue #142 (E2E tests)
- ❌ CRITICAL BLOCKER

---

## ✅ The Solution

**Fix**: Read token directly from localStorage (where it's already stored)

```typescript
// CORRECT - No hooks violation
const authLink = setContext((_, context) => {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null;
  return {
    headers: { ...headers, authorization: token ? `Bearer ${token}` : '' }
  };
});
```

**Why it works**:
- ✅ Token is already stored in localStorage by AuthContext
- ✅ `localStorage.getItem()` is a web API, not a hook
- ✅ Safe to call in middleware/callbacks
- ✅ Zero functionality change (reads same token source)
- ✅ Handles SSR correctly with `typeof window` guard

---

## 📋 Implementation Checklist

### Pre-Implementation (5 min)
- [ ] Read Sections 1-2 of the full plan
- [ ] Understand the architecture
- [ ] Verify token storage in AuthContext (lines 21-40)

### Implementation (10 min)
- [ ] Follow Step 1: Fix apollo-client.ts
- [ ] Follow Step 2: Create apollo-client.test.ts
- [ ] Review Step 3 (no other changes needed)

### Testing (10 min)
- [ ] `pnpm test:frontend lib/__tests__/apollo-client.test.ts`
- [ ] `pnpm test:frontend` (all tests)
- [ ] `pnpm lint` (no errors)
- [ ] `pnpm build` (no warnings)

### Verification (5 min)
- [ ] Review Section 5 Verification Checklist
- [ ] Dev mode testing (pnpm dev)
- [ ] Check DevTools Console for warnings
- [ ] Verify auth header in Network tab

### Finalization
- [ ] Commit with co-author trailer
- [ ] Push to feature branch
- [ ] Link PR to Issue #140

---

## 📊 Plan Structure

| Section | Topic | Read Time |
|---------|-------|-----------|
| 1 | Scope Analysis | 5 min |
| 2 | Fix Strategy | 5 min |
| 3 | Implementation Steps | 5 min |
| 4 | Testing Plan | 3 min |
| 5 | Verification Checklist | 3 min |
| 6 | Risk Assessment | 5 min |
| 7 | Timeline | 2 min |
| 8 | Related Issues | 2 min |
| 9 | Acceptance Criteria | 2 min |
| 10 | Implementation Summary | 2 min |
| 11 | Developer Checklist | 2 min |
| A | Why Not Other Solutions | 3 min |
| **TOTAL** | | **40 min** |

**Implementation only**: ~30 minutes (not reading time)

---

## 🔑 Key Facts

### Architecture
- **Apollo Client** initialized by `makeClient()` factory function
- **Provider order**: AuthProvider (parent) → ApolloWrapper (child)
- **Token source**: localStorage (key: `'auth_token'`)
- **Token lifecycle**: Loaded on app startup → persisted on login → cleared on logout

### The Token Already Works
```typescript
// frontend/lib/auth-context.tsx shows token is already:
- Stored in localStorage on login (line 38)
- Loaded on app startup (line 29)
- Cleared on logout (line 45)
```

### Why Direct localStorage is Safe
1. **Token is persisted**: AuthContext already stores it there
2. **AuthProvider initializes first**: Parent component renders before children
3. **Read on every request**: setContext callback called for each GraphQL request
4. **SSR protected**: `typeof window !== 'undefined'` guard prevents server errors

---

## 🧪 Testing Summary

### New Unit Tests (8 cases)
```
1. Client creates without Hooks error ✅
2. Authorization header with token ✅
3. Missing token handled gracefully ✅
4. SSR mode guard prevents errors ✅
5. Token updates read on next request ✅
6. Token cleared on logout ✅
7. InMemoryCache initialized ✅
8. GRAPHQL_URL configuration ✅
```

### Existing Integration Tests (31+ total)
- `full-auth-flow.test.tsx` (9 tests) - Should still pass
- `auth-errors.test.tsx` (9 tests) - Should still pass
- `apollo-wrapper.test.tsx` (15 tests) - Should still pass

---

## ⚠️ Risk Level: LOW

### Why This is Low Risk
- ✅ Drop-in replacement (reads same token source)
- ✅ No breaking changes (identical functionality)
- ✅ Easy rollback (undo 2 files)
- ✅ Clear edge case handling (SSR guard)
- ✅ Comprehensive test coverage (8 new tests)

### Edge Cases Handled
| Scenario | Solution |
|----------|----------|
| SSR environment | `typeof window !== 'undefined'` guard |
| Token not yet loaded | Provider order ensures initialization |
| Token updated mid-session | Read on every request |
| Missing token | Handled gracefully (returns `null`) |
| localStorage unavailable | SSR guard + client-only execution |

---

## ⏱️ Timeline: 30 Minutes

```
Step 1: Fix apollo-client.ts ......................... 5 min
Step 2: Create apollo-client.test.ts ................ 10 min
Step 3: Verify (no other files changed) ............ 2 min
Testing & Verification .............................. 10 min
Documentation & Commit ............................... 3 min
──────────────────────────────────────────────────────────────
TOTAL ................................................... 30 min
```

---

## 🚀 Next Steps

1. **Read** the full plan: `docs/implementation-planning/ISSUE_140_IMPLEMENTATION_PLAN.md`
2. **Understand** Sections 1-2 (scope and fix strategy)
3. **Implement** Section 3 (follow exactly)
4. **Test** Section 4 (run all tests)
5. **Verify** Section 5 (checklist)
6. **Commit** and push

---

## ❓ FAQ

**Q: Why not keep using useAuth()?**  
A: Can't use hooks in callbacks - violates React Hooks Rules

**Q: Why not move token to different storage?**  
A: Token is already in localStorage via AuthContext - use existing storage

**Q: What about SSR?**  
A: Protected by `typeof window !== 'undefined'` guard

**Q: Will this break anything?**  
A: No - reads same token source as useAuth() did

**Q: Can I rollback if issues occur?**  
A: Yes - undo 2 files and original code is restored

---

## 📞 Questions?

Refer to the full plan sections:
- **Architecture?** → Section 1 (Scope Analysis)
- **Why it works?** → Section 2 (Fix Strategy)
- **How to implement?** → Section 3 (Implementation Steps)
- **What tests?** → Section 4 (Testing Plan)
- **Edge cases?** → Section 6 (Risk Assessment)
- **Timeline?** → Section 7 (Implementation Timeline)

---

**Document**: ISSUE_140_IMPLEMENTATION_PLAN.md  
**Status**: Ready for Implementation  
**Effort**: 30 minutes  
**Risk**: LOW  
**Blocker**: Issue #142 (E2E Tests)
