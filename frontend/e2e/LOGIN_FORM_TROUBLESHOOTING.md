# Login Form - Playwright Interaction Troubleshooting

## Common Issue: Form Inputs Not Accepting Input

**Symptom:**

```
Nothing entered in username or password fields
Button 'Sign In' not clickable
No action works
```

## Root Causes & Solutions

### 1. Services Not Running ⚠️ **FIRST CHECK**

**Symptom:** Page loads but form fields are empty/unresponsive

**Solution:**

```bash
# Terminal 1: Ensure ALL services are running
pnpm dev

# Wait 5-10 seconds for services to fully start

# Terminal 2: Then run tests
pnpm e2e tests/auth/login-logout.spec.ts
```

**Check services:**

```bash
curl http://localhost:3000              # Frontend
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'       # GraphQL
curl http://localhost:5000/health       # Express
```

---

### 2. Form Inputs Disabled During Mutation

**Root Cause:** Inputs are disabled when `loading === true`:

```tsx
disabled = { loading }; // Line 198, 223 in login-form.tsx
```

**Problem in Playwright:**

- If test tries to fill input while mutation is running, it fails
- If button is disabled, click fails

**Solution in Tests:**

```typescript
// ✅ CORRECT: Wait for form to be enabled first
async login(email: string, password: string): Promise<void> {
  // Ensure inputs are enabled (not disabled)
  await this.page.locator('[data-testid="email-input"]').waitFor({
    state: 'visible',
    timeout: 5000
  });

  // Fill with explicit wait and slow interaction
  await this.page.locator('[data-testid="email-input"]').fill(email);
  await this.page.locator('[data-testid="password-input"]').fill(password);

  // Ensure button is enabled before clicking
  const submitBtn = this.page.locator('[data-testid="submit-button"]');
  await submitBtn.waitFor({ state: 'enabled', timeout: 5000 });
  await submitBtn.click();
}
```

---

### 3. Form Validation Prevents Interaction

**Root Cause:**

- Button is disabled until form is valid: `disabled={!isFormValid || loading}`
- Form validation on initial render might fail
- Inputs need proper email/password format

**What Makes Form Valid:**

```typescript
// From login-form.tsx line 170-171
const isFormValid =
  !validationErrors.email && // No email error
  !validationErrors.password && // No password error
  formState.email && // Email not empty
  formState.password; // Password not empty

// Email validation (line 57-65)
const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Email is required';
  if (!email.includes('@')) return 'Enter a valid email address';
  return undefined;
};

// Password validation (line 67-82)
const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) return 'Password must contain letters and numbers';
  return undefined;
};
```

**Required Test Credentials:**

- Email: Valid email format with `@` (e.g., `test@example.com`)
- Password: At least 8 chars, letters AND numbers (e.g., `TestPass123`)

**✅ Valid Examples:**

```
test@example.com / TestPass123
user@domain.com / ValidPass456
admin@test.co / SecurePass789
```

**❌ Invalid Examples:**

```
test            (not email format)
pass123         (no @ symbol)
test@test       (too short, needs 8+ chars)
testpass        (no numbers)
12345678        (no letters)
```

---

### 4. Element Not Ready for Interaction

**Symptom:**

```
Error: Element cannot be interacted with
```

**Root Cause:** Playwright tries to interact before element is in interactive state

**Solution: Add Proper Waits**

```typescript
// ❌ WRONG: Direct interaction without waiting
await this.page.locator('[data-testid="email-input"]').fill(email);

// ✅ CORRECT: Wait for visibility AND enabled state
const emailInput = this.page.locator('[data-testid="email-input"]');
await emailInput.waitFor({ state: 'visible', timeout: 5000 });
await emailInput.waitFor({ state: 'enabled', timeout: 5000 });
await emailInput.fill(email);

// ✅ BETTER: Wait and interact with explicit focus
const emailInput = this.page.locator('[data-testid="email-input"]');
await emailInput.focus();
await emailInput.fill(email);
await emailInput.blur(); // Trigger validation
```

---

### 5. Page Not Fully Loaded

**Symptom:**

```
Element detached from DOM
Cannot find element [data-testid="email-input"]
```

**Root Cause:**

- Page still loading
- Next.js hydration incomplete
- Apollo Client not initialized

**Solution:**

```typescript
// ❌ WRONG: Go to page and immediately interact
async goto(): Promise<void> {
  await this.page.goto('/login');
  await this.fillByTestId('email-input', 'test@example.com');
}

// ✅ CORRECT: Wait for page hydration and form elements
async goto(): Promise<void> {
  await this.page.goto('/login', { waitUntil: 'networkidle' });

  // Wait for form to be interactive
  await this.page.waitForSelector('[data-testid="email-input"]', {
    state: 'visible',
    timeout: 10000
  });

  // Optional: Wait for Apollo Client initialization
  await this.page.waitForFunction(
    () => (window as any).__APOLLO_CLIENT__?.cache,
    { timeout: 5000 }
  );
}
```

---

### 6. Button Disabled Due to Missing Environment Variables

**Symptom:** GraphQL mutation fails, button stuck disabled

**Root Cause:**

- `.env.local` not configured
- GraphQL endpoint URL wrong
- Database not seeded with test user

**Solution:**

```bash
# Check .env.local exists
cat .env.local

# Should contain:
# NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
# TEST_EMAIL=test@example.com
# TEST_PASSWORD=TestPassword123
```

---

## Debug Procedure

When tests fail to interact with form:

### Step 1: Verify Services Running

```bash
curl -I http://localhost:3000
curl -I http://localhost:4000/graphql
curl -I http://localhost:5000/health
```

### Step 2: Run Test in Headed Mode (Visual)

```bash
pnpm e2e:headed tests/auth/login-logout.spec.ts
```

See if inputs actually accept text visually.

### Step 3: Add Debug Logging

```typescript
test('debug login', async ({ page }) => {
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  // Check if elements exist
  const emailInput = page.locator('[data-testid="email-input"]');
  const passwordInput = page.locator('[data-testid="password-input"]');
  const submitBtn = page.locator('[data-testid="submit-button"]');

  console.log('Email input visible:', await emailInput.isVisible());
  console.log('Email input enabled:', await emailInput.isEnabled());
  console.log('Password input visible:', await passwordInput.isVisible());
  console.log('Password input enabled:', await passwordInput.isEnabled());
  console.log('Submit button visible:', await submitBtn.isVisible());
  console.log('Submit button enabled:', await submitBtn.isEnabled());

  // Try to fill
  try {
    await emailInput.fill('test@example.com');
    console.log('✓ Email filled successfully');
  } catch (e) {
    console.log('✗ Email fill failed:', e.message);
  }

  // Take screenshot
  await page.screenshot({ path: 'debug-form.png' });
});
```

### Step 4: Run Debug Mode

```bash
pnpm e2e:debug tests/auth/login-logout.spec.ts
```

Step through execution interactively.

### Step 5: Check GraphQL Mutation

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id email } } }",
    "variables": {
      "email": "test@example.com",
      "password": "TestPassword123"
    }
  }'
```

Should return token, not error.

---

## Checklist: Form Not Accepting Input

- [ ] Are all 3 services running? (`pnpm dev`)
- [ ] Did you wait 5-10 seconds for services to start?
- [ ] Is email a valid format? (has `@`)
- [ ] Is password 8+ chars with letters AND numbers?
- [ ] Is `.env.local` configured with correct GraphQL URL?
- [ ] Does test user exist in database? (`pnpm seed`)
- [ ] Did you run in headed mode to visually debug? (`pnpm e2e:headed`)
- [ ] Are form inputs actually visible on the page?
- [ ] Is button disabled due to validation errors?
- [ ] Check browser console for JavaScript errors

---

## Fixed Login Page Helpers

### Update `BasePage.ts` to Add Better Wait Methods

Add these helper methods:

```typescript
/**
 * Wait for element to be visible AND enabled
 */
async waitForElementInteractive(selector: string, timeout = 10000): Promise<void> {
  await this.page.waitForSelector(selector, { timeout, state: 'visible' });

  // For inputs, also wait for enabled state
  if (selector.includes('input') || selector.includes('button')) {
    await this.page.locator(selector).waitFor({ state: 'enabled', timeout });
  }
}

/**
 * Fill input with proper waits
 */
async fillWithWait(testId: string, text: string): Promise<void> {
  const input = this.getByTestId(testId);

  // Wait for visibility
  await input.waitFor({ state: 'visible', timeout: 5000 });

  // Wait for enabled
  await input.waitFor({ state: 'enabled', timeout: 5000 });

  // Focus and fill
  await input.focus();
  await input.fill(text);
  await input.blur();
}

/**
 * Click button with proper waits
 */
async clickWithWait(testId: string): Promise<void> {
  const button = this.getByTestId(testId);

  // Wait for visibility
  await button.waitFor({ state: 'visible', timeout: 5000 });

  // Wait for enabled
  await button.waitFor({ state: 'enabled', timeout: 5000 });

  // Click
  await button.click();
}
```

### Update `LoginPage.ts` to Use New Methods

```typescript
async login(email: string, password: string): Promise<void> {
  // Use new helper methods with proper waits
  await this.fillWithWait('email-input', email);
  await this.fillWithWait('password-input', password);
  await this.clickWithWait('submit-button');

  // Wait for token
  await this.page.waitForFunction(
    () => {
      const token = localStorage.getItem('auth_token');
      return token && token.length > 0;
    },
    { timeout: 15000 }
  );
}
```

---

## Next Steps

1. **Verify services running:** `pnpm dev`
2. **Use valid credentials:** Email with `@`, password 8+ chars with letters+numbers
3. **Test in headed mode:** `pnpm e2e:headed`
4. **Add debug logging** if still failing
5. **Update helper methods** in BasePage.ts for better waits
6. **Check browser console** for errors

If still failing after these steps, enable trace capture:

```bash
pnpm e2e -- --trace=on
pnpm e2e:report
```

Review the trace to see exactly where interaction fails.
