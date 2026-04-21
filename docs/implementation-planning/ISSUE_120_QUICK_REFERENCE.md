# Issue #120: Login Component & User Flow - Quick Reference

## Overview
**Status**: Planning Phase  
**Parent**: Issue #27 (JWT Authentication)  
**Dependency**: ✅ Issue #119 (Frontend Auth Context) - COMPLETED  
**Effort**: 25 hours (~3-4 developer days)  
**Target**: End of Week (April 25, 2026)

---

## What's Being Built

A complete user login experience:
1. **LoginForm Component** - Email/password input with validation
2. **Login Page** - `/login` route with form rendering
3. **Backend Login Mutation** - GraphQL endpoint for authentication
4. **User Model** - Database schema for user storage
5. **Token Flow** - JWT generation, storage, and injection

---

## Key Files to Create/Modify

| File | Type | Purpose |
|------|------|---------|
| `frontend/components/login-form.tsx` | NEW | React form component with validation |
| `frontend/app/(auth)/login/page.tsx` | NEW | Login page server component |
| `frontend/lib/graphql-mutations.ts` | MODIFY | Add LOGIN_MUTATION |
| `backend-graphql/src/resolvers/Mutation.ts` | MODIFY | Add login resolver |
| `backend-graphql/src/schema.graphql` | MODIFY | Add login mutation + AuthPayload type |
| `backend-graphql/prisma/schema.prisma` | MODIFY | Add User model |

---

## User Flow (30-second Summary)

```
User enters email/password
    ↓
Client validates (required, format, length)
    ↓
Submit to GraphQL login(email, password) mutation
    ↓
Backend validates credentials + bcrypt password verification
    ↓
Backend returns JWT token
    ↓
Frontend stores token in localStorage via AuthContext
    ↓
Apollo Client auto-injects token on next requests
    ↓
Redirect to dashboard
    ↓
BuildDashboard fetches protected data (now authorized)
    ↓
SUCCESS - User is logged in
```

---

## Implementation Phases

### Phase 1: Backend User Model (2 hours)
- Add User to Prisma schema (id, email, passwordHash, createdAt, updatedAt)
- Run migration: `pnpm migrate`
- Install bcrypt: `pnpm add bcrypt`

### Phase 2: Backend Login Resolver (3 hours)
- Add AuthPayload type to GraphQL schema
- Add login mutation to schema
- Implement login resolver with bcrypt validation
- Write tests

### Phase 3: Frontend Mutation (1 hour)
- Create LOGIN_MUTATION in graphql-mutations.ts
- Test in GraphiQL

### Phase 4: LoginForm Component (4 hours)
- Create login-form.tsx with validation, submission, error handling
- Create login/page.tsx (server component wrapper)
- Write unit tests

### Phase 5: Integration & Testing (3 hours)
- Full end-to-end test of login flow
- Test error cases
- Test session persistence

### Phase 6: Quality & Documentation (2 hours)
- Lint/format code
- TypeScript build verification
- Add JSDoc comments

### Phase 7: Final Verification (1 hour)
- All tests passing
- Manual E2E verification
- Security review

---

## Acceptance Criteria (9 Points)

✅ **Form & Validation**
- [ ] Login form renders with email, password, submit button
- [ ] Form validation works (required fields, email format, 8-char password)
- [ ] Submit button disabled when invalid, enabled when valid

✅ **Successful Login**
- [ ] Valid credentials → token returned from backend
- [ ] Token stored in localStorage via AuthContext
- [ ] Redirect to dashboard after login
- [ ] Token persists across page reload

✅ **Error Handling**
- [ ] Invalid credentials → error message displayed
- [ ] Network errors handled gracefully
- [ ] User can retry after error

✅ **Backend**
- [ ] GraphQL login mutation defined and working
- [ ] User model with passwordHash in database
- [ ] Bcrypt used for password verification
- [ ] Protected queries require token

✅ **Quality**
- [ ] All tests passing (unit + integration)
- [ ] No ESLint errors or TypeScript errors
- [ ] Type-safe throughout (no `any` types)

---

## Critical Implementation Notes

### 🔒 Security Best Practices
1. **Always use bcrypt** for password hashing (never plaintext)
2. **Generic error messages**: "Invalid email or password" (don't leak if user exists)
3. **SSR-safe localStorage**: Always guard with `typeof window !== 'undefined'`
4. **Never return passwordHash** to client in any response
5. **Set JWT expiry**: Default 24 hours (can be customized)

### ✨ Frontend Best Practices
1. **Client-side validation first** (email format, required fields, length)
2. **Show loading state** during submission (disable button, show spinner)
3. **Clear errors on input change** (better UX)
4. **Redirect after login** (router.push('/'))
5. **Catch Apollo errors** and display user-friendly messages

### 🚀 Backend Best Practices
1. **Validate input** (email and password required)
2. **Query by email** (use findUnique for performance)
3. **Compare with bcrypt** (never string comparison)
4. **Generate token with generateToken()** utility (24h expiry built-in)
5. **Return only token** (no password, no hash, no secrets)

---

## Common Pitfalls to Avoid

❌ **DON'T**:
- Store plaintext passwords in database
- Return different error messages for user-not-found vs wrong-password
- Access localStorage without `typeof window !== 'undefined'` guard
- Forget to validate email format on backend
- Use `any` type for form state or response data
- Forget to test token persistence across page reload

✅ **DO**:
- Use bcrypt with salt rounds 10+
- Use generic error message for security
- Always add SSR guards for browser APIs
- Validate on both client AND server
- Define explicit TypeScript interfaces
- Test the complete flow end-to-end

---

## Testing Checklist

### Unit Tests (form-level)
- [ ] Email validation (required, format)
- [ ] Password validation (required, length)
- [ ] Submit button state changes
- [ ] Error display/clearing
- [ ] Token handling in AuthContext

### Integration Tests (resolver-level)
- [ ] Valid credentials return token
- [ ] Invalid credentials throw error
- [ ] Non-existent user handled
- [ ] Wrong password handled
- [ ] Bcrypt comparison works

### E2E Tests (full flow)
- [ ] Can navigate to /login
- [ ] Can fill form and submit
- [ ] Redirect to dashboard on success
- [ ] Token in localStorage persists
- [ ] Error message shown on failure
- [ ] Can retry after error

---

## Support Resources

- **Full Plan**: `docs/implementation-planning/IMPLEMENTATION_PLAN_ISSUE_120.md`
- **Architecture**: `CLAUDE.md` → Full-Stack Architecture
- **Auth Pattern**: `backend-graphql/src/middleware/auth.ts`
- **Issue Tracker**: GitHub Issues #120, #119, #118, #27
- **Examples**: `backend-graphql/src/resolvers/__tests__/auth-check.test.ts`

---

## Quick Commands

```bash
# Start all services
pnpm dev

# Run specific tests
pnpm test:frontend        # Frontend tests
pnpm test:graphql         # Backend tests
pnpm test                 # All tests

# Linting & formatting
pnpm lint                 # Check ESLint
pnpm lint:fix             # Auto-fix

# Build verification
pnpm build                # TypeScript + build check

# Database
pnpm migrate              # Run migrations
pnpm seed                 # Seed test data

# GraphQL testing
# Open: http://localhost:4000/graphql
# Execute login mutation in GraphiQL IDE
```

---

## Contact & Escalation

- **Questions about requirements**: Review IMPLEMENTATION_PLAN_ISSUE_120.md (full details)
- **Technical blockers**: Check risk mitigation section
- **Design decisions**: See "Design the User Flow" section
- **Test strategy**: See "Testing Strategy" section

---

**Last Updated**: April 2026  
**Status**: Ready for Implementation  
**Complexity**: Medium (Full-Stack)  
**Priority**: High (Required for MVP)
