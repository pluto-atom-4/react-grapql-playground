Parent Issue: #27
Effort: 45 minutes (initial estimate; may extend based on clarifications)
Priority: THIRD (after #119)

## What This Does
User-facing authentication: login form, logout button, protected routes.

## Acceptance Criteria (Original)
- Login component accepts email/password
- Submits LoginMutation to GraphQL
- Stores JWT token via AuthContext
- Redirects to dashboard after successful login
- Error messages display on failed login
- Logout button clears token and redirects to login
- App redirects to login if not authenticated
- TypeScript build passes

---

## 🆕 CLARIFICATIONS - Based on PM Review

### 1. Form Validation Specification

**When Validation Happens:**
- **Real-time feedback** - Show error message as user types (optional but recommended for UX)
- **On-blur validation** - Validate when user leaves each field
- **On-submit validation** - Final validation before sending to server
- **Status**: Submit button disabled if form is invalid

**What Gets Validated:**
- **Email field**:
  - ✅ Required (cannot be empty)
  - ✅ Must contain `@` and domain (email format: `email@example.com`)
  - ❌ Invalid format error: "Enter a valid email address"
  
- **Password field**:
  - ✅ Required (cannot be empty)
  - ✅ Minimum 8 characters (per backend JWT spec)
  - ❌ Too short error: "Password must be at least 8 characters"

**Where Feedback is Shown:**
- **Inline error messages** below each field (not modal/toast)
- Example:
  ```
  Email: [user@|]
          [Error: Enter a valid email address] ← Red text below input
  
  Password: [pass|]
             [Error: Password must be at least 8 characters] ← Red text below input
  
  [Sign In] ← Disabled if validation fails
  ```

**Example Scenarios:**
1. User enters "invalid-email" → Email field shows "Enter a valid email address", button disabled
2. User enters valid email, password "abc" → Password field shows "Password must be at least 8 characters", button disabled
3. User leaves both fields empty → Both show required field errors, button disabled
4. User enters valid email + 8-char password → All errors clear, button enabled

---

### 2. Error Message Handling

**Error Types by HTTP Response:**

#### Case 1: Invalid Credentials (401)
- **Response**: GraphQL error with message "Invalid email or password"
- **Display**: Show user-friendly message: **"Invalid email or password"**
- **Location**: Display in red error area above form (or inline below form)
- **Behavior**: Keep email field populated, clear password field
- **Duration**: Error persists until user modifies form

#### Case 2: Server Error (500)
- **Response**: GraphQL error with message "Internal server error"
- **Display**: Show user-friendly message: **"Server error. Please try again later."**
- **Location**: Display in error area
- **Behavior**: Keep both fields populated (don't clear)
- **Duration**: Error persists until user tries again

#### Case 3: Network Error (timeout/offline)
- **Response**: Network error (request failed before reaching server)
- **Display**: Show user-friendly message: **"Connection failed. Check your internet and try again."**
- **Location**: Display in error area
- **Behavior**: Keep both fields populated
- **Duration**: Error persists until user retries

#### Case 4: Validation Error (from server)
- **Response**: GraphQL validation error (e.g., email not registered)
- **Display**: Show user-friendly message: **"Email not registered. Create an account first."** (or generic "Invalid email or password")
- **Location**: Display in error area
- **Behavior**: Keep email populated, clear password
- **Duration**: Persists until user modifies form

**Example User Flow - Error Scenario:**
```
User enters: email@example.com / wrongpassword
Click "Sign In"
→ Button shows "Loading..." and disables
→ Request sent to GraphQL backend
→ Backend returns 401 "Invalid email or password"
→ Button reverts to "Sign In" state
→ Red error message appears: "Invalid email or password"
→ User can modify fields and retry
→ Editing any field removes the error message
```

---

### 3. Loading States Specification

**Submit Button Behavior During Submission:**
- **Initial state**: "Sign In" (enabled, clickable)
- **During submission** (mutation in flight):
  - Button text changes to: **"Signing in..."** OR **"Loading..."**
  - Button becomes **disabled** (cannot click again)
  - Optional: Add loading spinner inside button: 🔄 "Signing in..."
- **After success/error**: Reverts to "Sign In" (enabled again)

**Form State During Submission:**
- **Email field**: Remains enabled (user can edit)
- **Password field**: Remains enabled (user can edit)
- **Submit button**: Disabled (prevents double-submit)

**Timeout Handling:**
- **Timeout duration**: 30 seconds (if no response after 30s, abort request)
- **On timeout**: Show error message: **"Request took too long. Please try again."**
- **User can**: Click "Sign In" again to retry

**Loading Indicator Appearance:**
- **Spinner style**: Loader icon (rotating circle) next to "Signing in..." text
- **Duration**: Shows only while mutation is pending (removed on success/error)
- **Example**:
  ```
  [Sign In] → [🔄 Signing in...] → [Sign In] (on completion)
  ```

---

### 4. Protected Route Logic

**What Constitutes "Protected":**
- A "protected" route requires the user to be **authenticated** (token exists in localStorage)
- Routes that are protected:
  - `/` (dashboard) - redirect if no token
  - `/builds` - redirect if no token
  - `/builds/:id` - redirect if no token
  - Any route except `/login` and `/` (public page if no token)

**Redirect Destination if Not Authenticated:**
- **Current location**: Any protected route (e.g., `/builds/123`)
- **Check**: Does token exist in localStorage?
- **If NO token**: Redirect to `/login`
- **If YES token**: Allow access (stay on current page)

**Who Decides the Redirect:**
- **Implementation location**: `frontend/app/layout.tsx` (root layout, Server Component)
- **How it works**:
  1. Root layout checks if route is protected
  2. Root layout reads `AuthContext` to check token
  3. If no token on protected route: Use Next.js `redirect('/login')`
  4. Alternative: Middleware in `middleware.ts` (if more complex logic needed)

**Error State if Redirect Fails:**
- **Failure case**: Very rare (redirect() only fails in dev if not used in Server Component)
- **Fallback**: If redirect doesn't work, render a loading spinner and manual redirect message
- **Example**: "Redirecting to login... [Redirect to /login]"

**Session Check on Page Reload:**
- On page refresh (`window.location.reload()`):
  1. AuthContext reads localStorage for token
  2. If token exists: Set in context, allow access
  3. If no token: Redirect to `/login` (via layout check)
  4. **Behavior**: No "flash" of wrong content (handled server-side)

---

### 5. Session Persistence Strategy

**Storage Method:**
- **Primary**: localStorage (key: `auth_token`)
- **Not used**: httpOnly cookies (out of scope for this issue; future production improvement)
- **Token format**: JWT string (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.ab_sig`)

**Behavior on Page Refresh:**
- **Scenario**: User is logged in, refreshes page
- **Expected behavior**:
  1. Page loads (Server Component runs)
  2. AuthContext reads localStorage for token
  3. If token exists: User stays logged in (no redirect)
  4. If token doesn't exist: Redirect to `/login`
- **Result**: User is automatically logged back in without re-entering credentials

**Token Lifecycle:**
- **Expiration time**: 24 hours from issuance (set by backend JWT secret)
- **Stored at**: localStorage key `auth_token`
- **Refresh token**: Not implemented in this issue (future production feature)
- **Logout**: Token deleted from localStorage immediately on logout

**Recovery if Token Expires:**
- **Scenario 1: Token expires while app is open**
  - Next API call fails with 401 (Unauthorized)
  - User should be shown: **"Session expired. Please log in again."**
  - Redirect to `/login` page
  - Token removed from localStorage
  - User enters credentials again
  
- **Scenario 2: Token expires while app is closed**
  - User reopens app
  - Old expired token still in localStorage
  - First protected route access attempts to use expired token
  - Backend rejects with 401
  - Redirect to `/login`
  - Token removed from localStorage

**Example Flow - Session Persistence:**
```
Monday 9:00 AM: User logs in
→ Token stored in localStorage
→ User navigates dashboard

Monday 12:00 PM: User refreshes page
→ AuthContext reads localStorage
→ Token still valid (within 24h)
→ User stays logged in

Tuesday 9:00 AM: (Token is now >24h old)
→ User tries to access dashboard
→ Request sent with expired token
→ Backend returns 401
→ Frontend removes token from localStorage
→ User redirected to `/login`
→ User logs in again with credentials
```

---

## Files to Create/Modify
- frontend/components/login.tsx (CREATE - includes all validation/error handling)
- frontend/app/login/page.tsx (CREATE - page route)
- frontend/app/layout.tsx (MODIFY - add protected route redirect logic)
- frontend/lib/auth-context.tsx (MODIFY if needed - ensure logout clears localStorage)

## Reference
See: 
- docs/implementation-planning/IMPLEMENTATION_PLAN_ISSUE_120.md
- docs/pm-review/JWT_AUTH_ACCEPTANCE_CRITERIA_REVIEW.md

## Testing Notes
When testing this issue (#120), verify all 5 clarifications:
1. ✅ Form validation works (email format, required fields)
2. ✅ Error messages appear correctly for 401/500/network scenarios
3. ✅ Loading states show spinner and disable button
4. ✅ Protected routes redirect to /login when no token
5. ✅ Session persists across page reloads and survives 24h expiration

## Security Best Practices
- ✅ Password field never logged or stored unencrypted
- ✅ Error messages don't reveal if email exists (generic "Invalid email or password")
- ✅ Token in localStorage is XSS-vulnerable (acknowledge and plan httpOnly cookies for production)
- ✅ HTTPS enforced in production (not enforced in dev, but understood)

## Interview Talking Points
This issue demonstrates:
1. **Form UX Best Practices**: Validation, loading states, error recovery
2. **Full-Stack Integration**: Frontend form + Apollo mutation + backend JWT
3. **React Context Pattern**: Auth state management with `useAuth()` hook
4. **Session Management**: Persistence, expiration, recovery
5. **Error Handling**: Specific error messages for different scenarios (401 vs 500 vs network)
