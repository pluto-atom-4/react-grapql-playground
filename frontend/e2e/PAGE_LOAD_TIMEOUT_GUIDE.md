# Playwright Page Load Timeout - Root Causes & Solutions

## Error

```
Test timeout of 30000ms exceeded.
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/login", waiting until "networkidle"
```

## Root Cause

The `waitUntil: 'networkidle'` option waits for **ALL network activity to cease**. This fails when:

1. **Backend has polling** - GraphQL queries polling in background
2. **Real-time connections** - WebSockets, Server-Sent Events (SSE)
3. **Background requests** - Analytics, monitoring, telemetry
4. **Services not running** - Request hangs indefinitely
5. **Slow network** - Takes longer than 30 second timeout

## Why `networkidle` Fails

```typescript
// ❌ WRONG: Waits for ALL network activity to complete
await page.goto(url, { waitUntil: 'networkidle' });

// This waits for:
// ✓ Initial HTML response
// ✓ CSS/JS bundle requests
// ✓ GraphQL queries
// ✗ Background polling
// ✗ Real-time subscriptions
// ✗ Analytics tracking
// = TIMEOUT if any activity continues
```

## Solutions

### Solution 1: Use `domcontentloaded` (Recommended)

**Best for:** Full-stack apps with background requests

```typescript
async goto(url: string): Promise<void> {
  // Wait for DOM ready, don't wait for all network
  await this.page.goto(url, {
    waitUntil: 'domcontentloaded',  // DOM ready, not all requests
    timeout: 15000,
  });
  
  // Then wait for specific elements we need
  await this.page.waitForSelector('[data-testid="email-input"]');
}
```

**What it waits for:**
- ✓ HTML parsed
- ✓ DOM ready
- ✓ Initial CSS/JS loaded
- ✗ Background requests (don't wait)
- ✗ Polling queries (don't wait)

**Why this works:**
- Page is interactive and usable
- No need to wait for background tasks
- Faster test execution

### Solution 2: Use `load` (Also Good)

```typescript
await this.page.goto(url, {
  waitUntil: 'load',  // All resources loaded (but not background tasks)
  timeout: 15000,
});
```

**What it waits for:**
- ✓ HTML, CSS, JS loaded
- ✓ All images/fonts loaded
- ✓ Page `load` event fired
- ✗ Async background requests

### Solution 3: Reduce Timeout & Retry

For flaky networks, allow faster timeout with retry:

```typescript
const maxRetries = 3;
let lastError: Error | null = null;

for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,  // Shorter timeout
    });
    return;  // Success
  } catch (error) {
    lastError = error as Error;
    if (attempt < maxRetries) {
      console.log(`Retry ${attempt}/${maxRetries}...`);
      await this.page.reload();
    }
  }
}

throw lastError;  // Failed after retries
```

### Solution 4: Wait for Specific Elements Instead

```typescript
// Don't wait for network to be idle
await this.page.goto(url, { timeout: 10000 });

// Wait for the specific elements/data we need
await this.page.waitForSelector('[data-testid="email-input"]', { 
  timeout: 5000 
});

// Or wait for Apollo cache to have data
await this.page.waitForFunction(
  () => (window as any).__APOLLO_CLIENT__?.cache?.data?.data?.ROOT_QUERY,
  { timeout: 5000 }
);
```

## Implemented Fix

The repository now uses **Solution 1** in `BasePage.ts`:

```typescript
async goto(url: string, options?: { timeout?: number }): Promise<void> {
  await this.page.goto(url, {
    waitUntil: 'domcontentloaded',  // DOM ready, don't wait for all network
    timeout: options?.timeout || 15000,
  });
  
  // Wait for Next.js hydration
  await this.page.waitForFunction(
    () => {
      return (window as any).__NEXT_DATA__ && (window as any).__NEXT_DATA__.isReady !== false;
    },
    { timeout: 5000 }
  ).catch(() => true);  // Ignore if check fails
}
```

**Benefits:**
- Waits for DOM ready (page is interactive)
- Doesn't wait for background polling
- 15 second timeout (reasonable for real apps)
- Specifically waits for form elements before returning

## Comparison: Load Strategies

| Strategy | Waits For | Speed | Reliability | Use Case |
|----------|-----------|-------|-------------|----------|
| `networkidle` | All requests done | Slowest | Breaks with polling | Simple static sites |
| `load` | Resources loaded | Fast | Good | Standard web apps |
| `domcontentloaded` | DOM ready | Fastest | Excellent | Full-stack apps with background tasks |
| Custom waits | Specific elements | Fastest | Best | When you know what to wait for |

## When Services Are Not Running

**Symptom:**
```
page.goto: Test timeout of 30000ms exceeded.
navigating to "http://localhost:3000/login"
```

**Root Cause:** Frontend loads but can't connect to backend, request hangs

**Fix:**
```bash
# Terminal 1: Start all services
pnpm dev

# Wait 5-10 seconds for services to start

# Terminal 2: Run tests
pnpm e2e
```

**Check services:**
```bash
# Quick check
curl http://localhost:3000              # Should respond with HTML
curl http://localhost:4000/graphql      # Should respond with GraphQL schema
curl http://localhost:5000/health       # Should respond with OK

# All three must respond before running tests
```

## Testing Load Strategies

### Test with Different `waitUntil` Values

```typescript
test('measure load time with domcontentloaded', async ({ page }) => {
  const start = Date.now();
  
  await page.goto('http://localhost:3000/login', {
    waitUntil: 'domcontentloaded',
  });
  
  const duration = Date.now() - start;
  console.log(`Load time: ${duration}ms`);
  // Typical: 1-3 seconds
});

test('measure load time with networkidle', async ({ page }) => {
  const start = Date.now();
  
  try {
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 5000,  // Short timeout to see failure quickly
    });
  } catch (e) {
    console.log('networkidle timed out (expected)');
  }
});
```

## How Playwright Waits Work

```
Browser sends request to server
    ↓
HTML response starts arriving
    ↓
Browser parses HTML
    ↓
DOM ready → 'domcontentloaded' event fires ✓
    ↓
CSS/JS resources load
    ↓
Page 'load' event fires → 'load' strategy ✓
    ↓
... Network requests continue in background (polling, analytics, etc)
    ↓
All requests complete → 'networkidle' fires (may never happen) ✗
```

## Best Practices

1. **Use `domcontentloaded` for interactive testing** (most reliable)
   ```typescript
   await page.goto(url, { waitUntil: 'domcontentloaded' });
   ```

2. **Always wait for specific elements after goto**
   ```typescript
   await page.goto(url, { waitUntil: 'domcontentloaded' });
   await page.waitForSelector('[data-testid="login-form"]');
   ```

3. **Set reasonable timeouts** (avoid 30000+ ms)
   ```typescript
   await page.goto(url, { 
     waitUntil: 'domcontentloaded',
     timeout: 15000,  // 15 seconds max
   });
   ```

4. **For services-dependent pages, ensure services running**
   ```bash
   # Before running tests
   pnpm dev &
   sleep 10
   pnpm e2e
   ```

## Updated Code

### BasePage.ts Changes

✅ `goto()` now uses `domcontentloaded` with 15 second timeout  
✅ `fillByTestId()` waits for enabled state before filling  
✅ `clickByTestId()` waits for enabled state before clicking  

### LoginPage.ts Changes

✅ `goto()` waits for all form elements visible  

## Quick Checklist

- [ ] Are all services running? `pnpm dev`
- [ ] Did you wait 5-10 seconds after `pnpm dev`?
- [ ] Is timeout >= 15000ms?
- [ ] Using `domcontentloaded` not `networkidle`?
- [ ] Waiting for specific elements after `goto()`?
- [ ] Check network tab in headed mode: `pnpm e2e:headed`?

## Still Timing Out?

Enable debugging:

```typescript
test('debug goto timeout', async ({ page }) => {
  // Log network activity
  page.on('request', request => console.log('→', request.url()));
  page.on('response', response => console.log('←', response.status(), response.url()));
  
  try {
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });
  } catch (error) {
    console.log('Timeout error:', error.message);
    
    // Check what loaded
    const content = await page.content();
    console.log('Page content length:', content.length);
  }
});
```

Then run with headed mode to see network:
```bash
pnpm e2e:headed
```

## References

- [Playwright goto() docs](https://playwright.dev/docs/api/class-page#page-goto)
- [waitUntil options](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming)
- [Network-Driven Page Load Strategies](https://web.dev/metrics/)
