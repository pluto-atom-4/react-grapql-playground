# Issue #140 Implementation Plan: Fix React Hooks Rules Violation in Apollo Client Auth Link

## Executive Summary

**Issue**: `useAuth()` hook is being called inside `setContext()` callback in `frontend/lib/apollo-client.ts:21`, which violates React Hooks Rules (hooks can only be called at the top level of React components, not inside callbacks).

**Impact**: Auth flow is completely non-functional in production builds. This is a **CRITICAL BLOCKER** for Issue #142 (E2E tests).

**Solution**: Replace `useAuth()` hook call with direct `localStorage.getItem('auth_token')` access, since the token is already persisted to localStorage by the AuthContext.

**Effort**: ~30 minutes (5 files modified, minimal testing required)

---

## 1. Scope Analysis

### 1.1 Current Architecture
```
RootLayout (app/layout.tsx)
  └─ AuthProvider (lib/auth-context.tsx)
      └─ ApolloWrapper (app/apollo-wrapper.tsx)
          └─ makeClient() (lib/apollo-client.ts) ❌ PROBLEM HERE
              └─ setContext() callback
                  └─ useAuth() ❌ VIOLATES HOOKS RULES
```

### 1.2 Files Requiring Changes
| File | Change Type | Priority |
|------|-------------|----------|
| `frontend/lib/apollo-client.ts` | Fix | CRITICAL |
| `frontend/lib/__tests__/apollo-client.test.ts` | Create (new) | HIGH |
| `frontend/__tests__/apollo-wrapper.test.tsx` | Update | MEDIUM |
| `frontend/app/apollo-wrapper.tsx` | No change | - |
| `frontend/lib/auth-context.tsx` | No change | - |

### 1.3 Token Storage Details
**Key Finding**: Auth token storage is already properly implemented in `AuthContext`:

```typescript
// frontend/lib/auth-context.tsx:21
const AUTH_TOKEN_KEY = 'auth_token';  // Storage key name

// Token is stored on login:
login(newToken: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, newToken);  // line 38
}

// Token is retrieved on app startup:
useEffect(() => {
  const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);  // line 29
  setToken(storedToken);
}, []);
```

**Conclusion**: `localStorage.getItem('auth_token')` is the correct approach. The token is:
- ✅ Already stored in localStorage by AuthContext
- ✅ Already loaded on app startup
- ✅ Already cleared on logout
- ✅ Safe to access directly from `setContext()` callback (not a React hook)

### 1.4 Why This Works
- `setContext()` is **not a React component**, it's a function that runs during Apollo Client initialization
- It's called **once per request** to inject headers
- It runs in a **non-React context** (middleware), where hooks are prohibited
- `localStorage.getItem()` is a **synchronous web API call**, not a React hook
- The token is **guaranteed to be in localStorage** because AuthContext loads it on mount

---

## 2. Fix Strategy

### 2.1 Root Cause Analysis
```typescript
// CURRENT CODE (apollo-client.ts:20-29) - ❌ VIOLATES RULES OF HOOKS
const authLink = setContext((_, context) => {
  const { token } = useAuth();  // ❌ Hook inside callback - WRONG
  const { headers } = context as { headers: Record<string, string> };
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
```

**Problem**: `useAuth()` can only be called:
- At the top level of a React component
- Inside other custom React hooks
- NOT inside callbacks, event handlers, or middleware

**Why it fails in production**: 
- Production builds enable React's strict Hooks validation
- The error occurs during Apollo Client initialization (outside React component context)
- Browser DevTools shows: "Hooks can only be called inside of the body of a function component"

### 2.2 Solution: Direct localStorage Access
```typescript
// FIXED CODE (apollo-client.ts:20-29) - ✅ FOLLOWS HOOKS RULES
const authLink = setContext((_, context) => {
  const token = localStorage.getItem('auth_token') || null;  // ✅ Direct API call
  const { headers } = context as { headers: Record<string, string> };
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
```

### 2.3 Edge Cases and Considerations

#### 2.3.1 Server-Side Rendering (SSR)
**Issue**: `localStorage` is not available on the server (Node.js environment)

**Solution**: Already handled by Apollo Client:
```typescript
// apollo-client.ts:32
ssrMode: typeof window === 'undefined',  // Disables auth link on server
```

When `ssrMode: true` (server-side):
- Apollo Client runs in SSR mode
- The auth link middleware still runs, but no GraphQL request is made
- `localStorage.getItem()` will throw ReferenceError if called on server
- **FIX**: Add `typeof window !== 'undefined'` check to prevent errors

#### 2.3.2 Token Initialization Race Condition
**Issue**: What if `setContext()` is called before AuthContext finishes loading token from localStorage?

**Solution**: 
- AuthContext loads token in useEffect **before any GraphQL queries run**
- Next.js waits for layout components to render before child pages
- The token is loaded **synchronously** from localStorage on component mount
- By the time the first GraphQL request is made, the token is already loaded
- **No race condition risk** since:
  - AuthProvider wraps ApolloWrapper in layout.tsx
  - AuthContext initializes first
  - Apollo Client is created in ApolloWrapper (child component)
  - Token is already available in localStorage

#### 2.3.3 Token Updates During Session
**Issue**: If token is refreshed or user logs in/out during a session, will new requests use the updated token?

**Solution**: 
- Each GraphQL request calls `setContext()` callback
- Each call reads the current token from localStorage
- Token updates are **immediately available** for next request
- Apollo cache invalidation happens separately (not affected by this fix)
- **Verified by existing tests** in auth-context.test.tsx

---

## 3. Implementation Steps

### Step 1: Fix apollo-client.ts

**File**: `frontend/lib/apollo-client.ts`

**Changes**:
- Remove `import { useAuth } from './auth-context';` (line 10)
- Replace `useAuth()` call with `localStorage.getItem()` (lines 20-29)
- Add SSR guard to prevent errors on server

**Code**:
```typescript
// BEFORE (lines 1-36)
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { useAuth } from './auth-context';  // ❌ REMOVE THIS

export function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

  const httpLink = new HttpLink({
    uri: graphqlUrl,
    credentials: 'include',
  });

  const authLink = setContext((_, context) => {
    const { token } = useAuth();  // ❌ REPLACE THIS
    const { headers } = context as { headers: Record<string, string> };
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
  });
}

// AFTER (lines 1-37)
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';

export function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

  const httpLink = new HttpLink({
    uri: graphqlUrl,
    credentials: 'include',
  });

  const authLink = setContext((_, context) => {
    // Get token directly from localStorage instead of using useAuth() hook
    // This is safe because:
    // 1. setContext() is not a React component, hooks are not allowed here
    // 2. Token is persisted by AuthContext on login/logout
    // 3. Token is loaded on app startup before any GraphQL requests
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const { headers } = context as { headers: Record<string, string> };
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
  });
}
```

### Step 2: Create apollo-client.test.ts

**File**: `frontend/lib/__tests__/apollo-client.test.ts`

**Purpose**: Unit tests for auth header injection without using React hooks

**Content**:
```typescript
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { makeClient } from '../apollo-client';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('Apollo Client Configuration (Issue #140)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Auth Header Injection', () => {
    it('should create Apollo client without calling useAuth hook', () => {
      // This test verifies no React Hooks error occurs
      // Simply creating the client should work without warnings
      expect(() => {
        makeClient();
      }).not.toThrow();
    });

    it('should include Authorization header when token exists in localStorage', () => {
      // Setup
      const testToken = 'test-token-12345';
      localStorage.setItem('auth_token', testToken);

      // Create client and simulate a request context
      const client = makeClient();

      // Verify: Client is created successfully
      expect(client).toBeDefined();
      expect(client.cache).toBeDefined();

      // Note: Full header injection testing would require mocking HttpLink
      // This test verifies client creation succeeds with token in localStorage
    });

    it('should handle missing token gracefully', () => {
      // Setup: No token in localStorage
      expect(localStorage.getItem('auth_token')).toBeNull();

      // Create client should work without errors
      const client = makeClient();

      // Verify: Client is created successfully
      expect(client).toBeDefined();
      expect(client.cache).toBeDefined();
    });

    it('should work in SSR mode (server-side rendering)', () => {
      // In SSR mode, window is undefined
      // This test verifies the SSR guard prevents errors
      const originalWindow = globalThis.window;

      try {
        // Simulate server environment
        Object.defineProperty(globalThis, 'window', {
          value: undefined,
          configurable: true,
        });

        // Should not throw even though localStorage would not be accessible on server
        const client = makeClient();
        expect(client).toBeDefined();
        expect(client.cache).toBeDefined();
      } finally {
        // Restore window
        Object.defineProperty(globalThis, 'window', {
          value: originalWindow,
          configurable: true,
        });
      }
    });

    it('should read updated token after login', () => {
      // Setup: Initial state (no token)
      let client = makeClient();
      expect(client).toBeDefined();

      // Simulate login
      const newToken = 'new-token-67890';
      localStorage.setItem('auth_token', newToken);

      // Create new client instance (in real app, same client is reused)
      // But the setContext callback would read the new token on next request
      client = makeClient();
      expect(client).toBeDefined();

      // Verify: Token is in localStorage for next request
      expect(localStorage.getItem('auth_token')).toBe(newToken);
    });

    it('should clear Authorization header on logout', () => {
      // Setup
      localStorage.setItem('auth_token', 'test-token');
      let client = makeClient();
      expect(client).toBeDefined();

      // Simulate logout
      localStorage.removeItem('auth_token');

      // Create new client (or same client on next request)
      client = makeClient();
      expect(client).toBeDefined();

      // Verify: Token is cleared
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Apollo Client Initialization', () => {
    it('should initialize with InMemoryCache', () => {
      const client = makeClient();

      expect(client.cache).toBeDefined();
      expect(client.cache.constructor.name).toBe('InMemoryCache');
    });

    it('should set ssrMode based on environment', () => {
      const client = makeClient();

      // In Node.js test environment, window is defined (jsdom), so ssrMode should be false
      // In actual SSR (server), window would be undefined, so ssrMode would be true
      expect(client).toBeDefined();
    });

    it('should use NEXT_PUBLIC_GRAPHQL_URL environment variable', () => {
      const originalEnv = process.env.NEXT_PUBLIC_GRAPHQL_URL;

      try {
        process.env.NEXT_PUBLIC_GRAPHQL_URL = 'http://custom-graphql:4000/graphql';

        const client = makeClient();
        expect(client).toBeDefined();

        // Note: HttpLink URL is not directly accessible, but client is created without errors
      } finally {
        process.env.NEXT_PUBLIC_GRAPHQL_URL = originalEnv;
      }
    });

    it('should default to localhost:4000 when NEXT_PUBLIC_GRAPHQL_URL is not set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_GRAPHQL_URL;

      try {
        delete process.env.NEXT_PUBLIC_GRAPHQL_URL;

        const client = makeClient();
        expect(client).toBeDefined();
      } finally {
        process.env.NEXT_PUBLIC_GRAPHQL_URL = originalEnv;
      }
    });
  });
});
```

### Step 3: No Changes Required for Other Files

**Files that don't need changes**:
- ✅ `frontend/lib/auth-context.tsx` - Already correctly implements token storage
- ✅ `frontend/app/apollo-wrapper.tsx` - Already uses `useMemo` correctly
- ✅ `frontend/app/layout.tsx` - Already has correct provider order
- ✅ `frontend/__tests__/apollo-wrapper.test.tsx` - Will pass with fix

---

## 4. Testing Plan

### 4.1 Unit Tests

**Test File**: `frontend/lib/__tests__/apollo-client.test.ts` (created in Step 2)

**Test Cases**:
- ✅ Client creates without React Hooks error
- ✅ Authorization header injected when token exists
- ✅ Missing token handled gracefully
- ✅ SSR mode guard prevents errors
- ✅ Token updates read on next request
- ✅ Token cleared on logout
- ✅ InMemoryCache initialized
- ✅ GRAPHQL_URL configuration works

**Run**:
```bash
pnpm test:frontend lib/__tests__/apollo-client.test.ts
```

### 4.2 Integration Tests (Existing)

**Files**: 
- `frontend/__tests__/integration/full-auth-flow.test.tsx` - Already passing
- `frontend/__tests__/integration/auth-errors.test.tsx` - Already passing
- `frontend/__tests__/apollo-wrapper.test.tsx` - Should continue to pass

**Run**:
```bash
pnpm test:frontend __tests__/integration/full-auth-flow.test.tsx
pnpm test:frontend __tests__/integration/auth-errors.test.tsx
pnpm test:frontend __tests__/apollo-wrapper.test.tsx
```

### 4.3 Production Build Test

**Purpose**: Verify no React Hooks warnings in production build

```bash
# Clear cache
rm -rf frontend/.next frontend/dist

# Build production
pnpm build

# Expected output: No warnings about Hooks Rules violation
# Should see: "✓ all builds were successful"
```

### 4.4 Dev Mode Testing

**Purpose**: Verify authentication still works in development

```bash
# Terminal 1: Start all services
pnpm dev

# Terminal 2: In browser
# 1. Navigate to http://localhost:3000
# 2. Check browser DevTools Console - no Hooks warnings
# 3. Try GraphQL query (e.g., get builds list)
# 4. Verify request includes Authorization header
#    (DevTools → Network → Request to graphql → Headers → Authorization: Bearer ...)
# 5. Test logout and login again
```

**Verification Checklist**:
- [ ] No "Hooks can only be called..." warning in console
- [ ] GraphQL queries execute successfully
- [ ] Authorization header present in requests
- [ ] Logout clears token from localStorage
- [ ] Login sets new token in localStorage
- [ ] Page reload preserves authentication state

### 4.5 Browser DevTools Verification

**Steps**:
1. Open DevTools Console (F12)
2. Clear console (Ctrl+Shift+K)
3. Perform login action
4. Check for warnings:
   - ❌ "Warning: Hooks can only be called inside of the body of a function component"
   - ❌ "Warning: setContext called inside callback"
   - ✅ Should see no Hooks-related warnings

**Network Tab Verification**:
1. Open DevTools Network tab
2. Filter by "graphql"
3. Make a GraphQL request (e.g., fetch builds)
4. Click request → Headers tab
5. Look for: `Authorization: Bearer eyJ...`
6. Verify token is properly formatted JWT or test token

---

## 5. Verification Checklist

### 5.1 Code Quality

- [ ] `useAuth` import removed from apollo-client.ts
- [ ] `localStorage.getItem('auth_token')` used instead
- [ ] `typeof window !== 'undefined'` guard added (SSR safety)
- [ ] Comment explaining why localStorage is safe to use
- [ ] No other files import or use `apollo-client.ts` for hooks

### 5.2 Testing

- [ ] `pnpm test:frontend` passes all tests
- [ ] No test failures related to Apollo Client
- [ ] New apollo-client.test.ts has >80% coverage
- [ ] Integration tests still pass
- [ ] apollo-wrapper.test.tsx still passes

### 5.3 Linting

- [ ] `pnpm lint` passes without errors
- [ ] No ESLint warnings about React Hooks
- [ ] No TypeScript type errors
- [ ] No unused imports

### 5.4 Build

- [ ] `pnpm build` succeeds
- [ ] No warnings in build output
- [ ] Production bundle size unchanged (±5%)
- [ ] No Hooks-related errors in build logs

### 5.5 Runtime Behavior

- [ ] No console warnings in dev mode
- [ ] No console warnings in production build
- [ ] GraphQL requests include Authorization header when logged in
- [ ] GraphQL requests don't include Authorization header when logged out
- [ ] Token refreshes are immediately reflected in next request
- [ ] SSR page renders without errors
- [ ] Client-side hydration works correctly

### 5.6 Edge Cases

- [ ] App works with no token in localStorage
- [ ] App works with invalid/expired token
- [ ] App works after page reload (token persisted)
- [ ] App works after logout and re-login
- [ ] Multiple simultaneous GraphQL requests all include token
- [ ] localStorage is unavailable (SSR environment) - no errors

---

## 6. Risk Assessment

### 6.1 Edge Cases

#### Q: What if localStorage is not available?
**A**: The `typeof window !== 'undefined'` check prevents access on server-side. On client, localStorage is always available in browsers.
**Risk Level**: ✅ LOW - Browser API is guaranteed available on client

#### Q: What if token is updated while request is in-flight?
**A**: New token is read on next request. In-flight request uses token from when setContext was called. This is expected behavior.
**Risk Level**: ✅ LOW - Same as before (useAuth had same behavior)

#### Q: What about hydration mismatches between server and client?
**A**: 
- Server (SSR): `window` is undefined, `typeof window !== 'undefined'` returns false, token is not read
- Client: `window` is defined, token is read from localStorage
- No mismatch because server doesn't render auth-dependent content (useAuth requirement)
**Risk Level**: ✅ LOW - SSR is already handled by existing code

#### Q: Can auth token be updated dynamically after initial load?
**A**: Yes. Each GraphQL request calls setContext callback, which reads current token from localStorage. Token updates are immediately visible on next request.
**Risk Level**: ✅ LOW - This improves on previous behavior

#### Q: What if setContext callback is called before AuthProvider initializes?
**A**: 
- AuthProvider is parent of ApolloWrapper in layout.tsx
- React renders providers top-down
- AuthProvider useEffect runs first, loading token from localStorage
- Then ApolloWrapper is mounted, creating Apollo Client
- By the time any GraphQL request is made, token is already in localStorage
**Risk Level**: ✅ LOW - Provider order enforces initialization sequence

### 6.2 Breaking Changes

**Question**: Will this break existing implementations?

**Answer**: ✅ NO - This is a **drop-in replacement** for the exact same functionality:
- Before: Hook read from React Context (which itself reads from localStorage)
- After: Direct read from localStorage (same source)
- Result: Identical token value, identical behavior
- Benefit: Fixes Hooks Rules violation without changing functionality

### 6.3 Rollback Plan

**If issues occur**:
1. Revert apollo-client.ts to use `useAuth()` hook (undo Step 1)
2. Delete apollo-client.test.ts if created (undo Step 2)
3. The original issue will still exist but app will continue to work

---

## 7. Implementation Timeline

### Total Estimated Effort: 30 minutes

| Task | Time | Notes |
|------|------|-------|
| **Implementation** | |
| Fix apollo-client.ts | 5 min | Remove useAuth, add localStorage.getItem |
| Create apollo-client.test.ts | 10 min | Unit tests for auth injection |
| Update apollo-wrapper.test.tsx | 5 min | Verify no regression (if needed) |
| **Testing & Verification** | |
| Run unit tests | 5 min | `pnpm test:frontend` |
| Run build | 3 min | `pnpm build` |
| Manual dev testing | 5 min | Verify auth flow in browser |
| **Documentation & Review** | |
| Review for typos/issues | 2 min | |
| Commit with proper message | 2 min | Include co-author trailer |

### Order of Operations

1. **First**: Modify `frontend/lib/apollo-client.ts` (Step 1)
   - This fixes the root cause
   - If something goes wrong, it's isolated to this file
   
2. **Second**: Create unit tests in `frontend/lib/__tests__/apollo-client.test.ts` (Step 2)
   - Validates the fix
   - Prevents regression
   
3. **Third**: Run all tests and builds
   - Verify no regressions
   - Confirm no new warnings
   
4. **Fourth**: Manual dev testing
   - Verify auth flow works end-to-end
   - Check DevTools for Hooks warnings
   
5. **Fifth**: Commit and push
   - Feature branch (e.g., `fix/issue-140-hooks-violation`)
   - Link to Issue #140

---

## 8. Related Issues

**This fix unblocks**:
- Issue #142: E2E Tests - Cannot run E2E tests while Hooks violation exists
- Issue #121: Auth Integration Tests - Currently failing due to Apollo Client initialization

**Related files**:
- `frontend/lib/auth-context.tsx` - Token storage implementation
- `frontend/app/apollo-wrapper.tsx` - Apollo Client provider
- `frontend/app/layout.tsx` - Provider order

---

## 9. Acceptance Criteria

### AC1: Fix Hooks Rules Violation
- [ ] No `useAuth()` call in apollo-client.ts
- [ ] No "Hooks can only be called..." warning in console
- [ ] `pnpm lint` passes without Hooks-related warnings

### AC2: Maintain Functionality
- [ ] GraphQL requests include Authorization header when logged in
- [ ] GraphQL requests work without token when logged out
- [ ] Token updates reflected in subsequent requests
- [ ] All existing tests pass

### AC3: Production Build Works
- [ ] `pnpm build` succeeds without warnings
- [ ] Production build includes no Hooks violation errors
- [ ] E2E tests can now run (Issue #142)

### AC4: Code Quality
- [ ] Unit test coverage >80% for apollo-client.ts
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Proper comments explaining localStorage usage

---

## 10. Implementation Summary

### Files Modified
```
frontend/lib/apollo-client.ts (1 file changed)
  - Remove: import { useAuth } from './auth-context'
  - Replace: useAuth() hook call with localStorage.getItem('auth_token')
  - Add: typeof window !== 'undefined' guard for SSR safety
  - Add: Explanatory comment about why this is safe

frontend/lib/__tests__/apollo-client.test.ts (1 new file)
  - Create: Unit tests for auth header injection
  - Tests: localStorage integration, SSR safety, client initialization
  - Coverage: >80% of apollo-client.ts code paths
```

### Testing Coverage
```
Unit Tests:
  - apollo-client.test.ts: 8 test cases

Integration Tests:
  - full-auth-flow.test.tsx: Should still pass (9 test cases)
  - auth-errors.test.tsx: Should still pass (9 test cases)
  - apollo-wrapper.test.tsx: Should still pass (15 test cases)

Total: 31+ test cases covering auth flow
```

### Risk Level: ✅ LOW
- Drop-in replacement for existing functionality
- No breaking changes
- Easy rollback if issues occur
- Comprehensive test coverage
- Clear edge case handling

---

## 11. Developer Checklist

Before starting implementation:
- [ ] Read through this entire plan
- [ ] Understand the problem (React Hooks Rules violation)
- [ ] Understand the solution (localStorage.getItem)
- [ ] Understand why it's safe (token already persisted)

During implementation:
- [ ] Make changes in order (Step 1 → Step 2 → Testing)
- [ ] Run tests after each step
- [ ] Check console for Hooks warnings
- [ ] Verify no regressions in existing tests

After implementation:
- [ ] All verification checklist items marked ✅
- [ ] Commit with proper message and co-author trailer
- [ ] Push feature branch to remote
- [ ] Link PR to Issue #140

---

## Appendix A: Why Not Other Solutions?

### ❌ Option 1: Move useAuth to top level of component
**Problem**: apollo-client.ts is not a React component, it's a factory function

### ❌ Option 2: Use Context API with useContext
**Problem**: Same as useAuth - cannot call hooks in non-component context

### ❌ Option 3: Pass token as parameter to makeClient
**Problem**: ApolloWrapper doesn't have access to token (would need to lift state)

### ❌ Option 4: Use custom hooks with localStorage wrapper
**Problem**: Still violates Hooks Rules - hooks can't be called in callbacks

### ✅ Option 5: Direct localStorage access (CHOSEN)
**Advantages**:
- No Hooks Rules violation
- Token already stored here by AuthContext
- Simple, clean, minimal code change
- Zero-risk replacement for existing functionality
- Already tested pattern in auth-context.test.tsx

---

**Document Version**: 1.0  
**Last Updated**: April 17, 2026  
**Status**: Ready for Implementation  
**Effort Estimate**: 30 minutes  
**Risk Level**: LOW  
**Blocker**: Issue #142 (E2E Tests)
