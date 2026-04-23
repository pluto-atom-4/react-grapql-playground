# E2E Tests

End-to-end tests for the full-stack application.

## Directory Structure

- **auth/** - Authentication and login tests
- **builds/** - Build management tests (create, read, update, delete)
- **integration/** - Cross-feature integration tests
- **example.spec.ts** - Example test demonstrating all patterns

## Writing Your First Test

### Basic Test Structure

```typescript
import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages';

test.describe('My Feature', () => {
  test('should do something', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    // Your test code
  });
});
```

### Using Fixtures

Three main fixtures are available:

```typescript
// authenticatedPage - Pre-logged-in browser page
test('logged-in test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
});

// apiClient - GraphQL API with JWT token
test('API test', async ({ apiClient }) => {
  const builds = await apiClient.query(`...`);
});

// testUser - Test credentials
test('with test user', async ({ testUser }) => {
  console.log(testUser.email);
});
```

### Using Page Objects

```typescript
import { DashboardPage, LoginPage, BasePage } from '../pages';

test('dashboard workflow', async ({ authenticatedPage }) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  const builds = await dashboard.getBuilds();
  expect(builds.length).toBeGreaterThan(0);
  
  await dashboard.createBuild('My Build');
});
```

### Seeding Test Data

```typescript
import { seedTestData, cleanupTestData } from '../helpers';

test('with seeded data', async ({ apiClient, authenticatedPage }) => {
  // Create test data
  const data = await seedTestData(apiClient);
  
  try {
    // Use the data in your test
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
  } finally {
    // Cleanup
    await cleanupTestData(apiClient, data);
  }
});
```

### API Client Usage

```typescript
import { GraphQLClient, ExpressClient } from '../helpers';

test('GraphQL and REST API', async ({ apiClient }) => {
  // Query GraphQL
  const result = await apiClient.graphql.query(`
    query GetBuilds {
      builds { id status }
    }
  `);

  // Upload file via Express
  const buffer = Buffer.from('test');
  const { fileId } = await apiClient.express.uploadFile('/upload', buffer, 'test.txt');

  // Check Express health
  const health = await apiClient.express.getHealth();
});
```

## Test Organization

### By Feature (Recommended)

```
tests/
├── auth/
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   └── session.spec.ts
├── builds/
│   ├── create.spec.ts
│   ├── read.spec.ts
│   ├── update.spec.ts
│   └── delete.spec.ts
├── integration/
│   ├── workflows.spec.ts
│   ├── realtime.spec.ts
│   └── errors.spec.ts
└── example.spec.ts
```

### Naming Convention

- File: `{feature}.spec.ts`
- Test groups: `test.describe('Feature Name', () => { ... })`
- Test name: `test('should [action] when [condition]', ...)`

Example:
```typescript
test.describe('Build Creation', () => {
  test('should create build with valid input', async (...) => {});
  test('should show error with invalid input', async (...) => {});
  test('should redirect after successful creation', async (...) => {});
});
```

## Best Practices

### 1. **Isolate Tests**

Each test should be independent and not depend on execution order.

```typescript
test('creates build', async ({ apiClient }) => {
  // Create fresh data for this test
  const data = await seedTestData(apiClient);
  // ... test code ...
  await cleanupTestData(apiClient, data);
});
```

### 2. **Use Page Objects**

Avoid brittle selectors in test code:

```typescript
// ✅ Good
const dashboard = new DashboardPage(page);
const builds = await dashboard.getBuilds();

// ❌ Avoid
const builds = await page.locator('[data-testid="builds-list"]').all();
```

### 3. **Wait Properly**

Always wait for elements/network before assertions:

```typescript
// ✅ Good
await dashboard.waitForNetworkIdle();
const builds = await dashboard.getBuilds();

// ❌ Avoid
const builds = await dashboard.getBuilds(); // May be stale
```

### 4. **Test User Flows, Not Implementation**

Test what users see and do, not internal state:

```typescript
// ✅ Good - tests user flow
await dashboard.createBuild('Test Build');
await expect(dashboard.buildCard('test-build')).toBeVisible();

// ❌ Avoid - tests implementation detail
const cache = await page.evaluate(() => window.__APOLLO_CLIENT__.cache.extract());
```

### 5. **Descriptive Error Messages**

Use meaningful expectations and comments:

```typescript
// ✅ Good
const builds = await dashboard.getBuilds();
expect(builds.length).toBe(5); // Expect 5 builds after seeding

// ❌ Avoid
expect(builds.length).toBe(5);
```

### 6. **Cleanup After Tests**

Always cleanup created resources:

```typescript
test('my test', async ({ apiClient }) => {
  const data = await seedTestData(apiClient);
  
  try {
    // Test code
  } finally {
    await cleanupTestData(apiClient, data);
  }
});
```

### 7. **Handle Dynamic Content**

Use waits for content that loads asynchronously:

```typescript
// Wait for specific count
await waitForElements(page, '[data-testid="build-item"]', 3);

// Wait for specific status
await dashboard.waitForBuildStatus('build-123', 'COMPLETE', 30000);

// Wait for GraphQL query
await waitForApolloCacheReady(page);
```

## Debugging Tests

### View Test Report

```bash
pnpm e2e:report
```

### Run Single Test

```bash
pnpm e2e tests/auth/login.spec.ts
```

### Run Tests Matching Pattern

```bash
pnpm e2e -g "login"
```

### Debug Mode (Pause Execution)

```bash
pnpm e2e:debug
```

Add in test code to pause:
```typescript
await page.pause();
```

### Print Debug Information

```typescript
// Log URLs
console.log('Current URL:', authenticatedPage.url());

// Log element state
const element = authenticatedPage.locator('[data-testid="build-list"]');
console.log('Visible:', await element.isVisible());
console.log('Text:', await element.textContent());

// Capture screenshot
await authenticatedPage.screenshot({ path: 'debug.png' });
```

### Run with Browser Visible

```bash
pnpm e2e:headed
```

## Common Test Scenarios

### Test Authentication

See `example.spec.ts` for authentication examples.

```typescript
test('login and access protected page', async ({ authenticatedPage }) => {
  // authenticatedPage fixture handles login
  await authenticatedPage.goto('/dashboard');
  expect(await authenticatedPage.isVisible('[data-testid="builds-list"]')).toBeTruthy();
});
```

### Test Form Submission

```typescript
test('submit form with validation', async ({ authenticatedPage }) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  await dashboard.createBuild('Test Build');
  await expect(dashboard.buildCard('test-build')).toBeVisible();
});
```

### Test Error Handling

```typescript
test('show error on failed mutation', async ({ apiClient }) => {
  const result = await apiClient.mutation(`
    mutation InvalidMutation {
      createBuild(input: {}) { id }
    }
  `);
  
  expect(result.errors).toBeDefined();
  expect(result.errors[0].message).toContain('validation');
});
```

### Test Real-time Updates

```typescript
test('updates on status change', async ({ authenticatedPage, apiClient }) => {
  // Create build
  const buildResult = await apiClient.mutation(`mutation { ... }`);
  const buildId = buildResult.data.createBuild.id;
  
  // Subscribe to updates
  const eventPromise = waitForSSEEvent(authenticatedPage, 'buildStatusChanged', 5000);
  
  // Trigger update
  await apiClient.mutation(`mutation { updateBuild(id: "...", status: "COMPLETE") }`);
  
  // Wait for event
  const event = await eventPromise;
  expect(event.buildId).toBe(buildId);
});
```

## Performance Tips

### Run Tests in Parallel

By default, tests run in parallel for speed. To run sequentially:

```bash
pnpm e2e --workers=1
```

### Run Specific Tests Only

```bash
pnpm e2e tests/auth/
pnpm e2e -g "login"
```

### Skip Slow Tests During Development

```typescript
test.skip('slow integration test', async (...) => {
  // Test code
});
```

### Focus on Single Test

```typescript
test.only('only run this test', async (...) => {
  // Test code
});
```

## Continuous Integration

In CI environments (set `CI=true`):
- Tests run with 1 worker (sequential)
- Tests retry up to 2 times on failure
- Full traces are captured
- Screenshots and videos on failure
- Reports generated in HTML and JUnit formats

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Fixtures Guide](../fixtures/README.md)
- [Page Objects Guide](../pages/README.md)
- [Helpers Guide](../helpers/README.md)
- [Example Test](./example.spec.ts)
