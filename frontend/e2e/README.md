# E2E Tests

This directory contains end-to-end tests for the full-stack application using Playwright.

## Directory Structure

```
e2e/
├── fixtures/              # Custom fixtures for tests
│   ├── base.fixture.ts
│   ├── index.ts
│   └── README.md
├── pages/                 # Page objects for UI interactions
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── index.ts
│   └── README.md
├── helpers/               # Test utilities and helpers
│   ├── api-client.ts
│   ├── seed-data.ts
│   ├── wait-helpers.ts
│   ├── test-user.ts
│   ├── index.ts
│   └── README.md
├── tests/                 # Test files organized by feature
│   ├── auth/              # Authentication tests
│   ├── builds/            # Build management tests
│   ├── integration/       # Cross-feature integration tests
│   ├── example.spec.ts    # Example test
│   └── README.md
├── utils/                 # Utilities and common functions
├── playwright.config.ts   # Playwright configuration
├── playwright.global-setup.ts  # Global setup
└── .gitignore
```

## Getting Started

### Install Dependencies

```bash
cd frontend
pnpm add -D @playwright/test
```

### Configure Environment

Create `.env.local` in project root:

```env
# Test credentials
TEST_EMAIL=test@example.com
TEST_PASSWORD=TestPassword123!

# Service URLs
GRAPHQL_URL=http://localhost:4000
EXPRESS_URL=http://localhost:5000
BASE_URL=http://localhost:3000
```

### Run Tests

```bash
# Start all services
pnpm dev

# In another terminal
# Run all tests
pnpm e2e

# Run with browser visible
pnpm e2e:headed

# Run debug mode
pnpm e2e:debug

# View test report
pnpm e2e:report

# Run specific test file
pnpm e2e tests/auth/login.spec.ts

# Run tests matching pattern
pnpm e2e -g "login"
```

## Testing Patterns

### Using Fixtures

```typescript
import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages';

test('authenticated user can view dashboard', async ({ authenticatedPage }) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  expect(await dashboard.isDashboardReady()).toBeTruthy();
});
```

### API Testing with GraphQL Client

```typescript
test('query builds via API', async ({ apiClient }) => {
  const result = await apiClient.query(`
    query GetBuilds {
      builds { id status }
    }
  `);
  expect(result.data.builds).toBeDefined();
});
```

### Seeding Test Data

```typescript
test('create and delete build', async ({ apiClient }) => {
  const { buildIds } = await seedTestData(apiClient);

  // Test something

  await cleanupTestData(apiClient, { buildIds });
});
```

## Writing Tests

### Test File Naming

- `tests/auth/login.spec.ts` - Authentication tests
- `tests/builds/create.spec.ts` - Build creation tests
- `tests/integration/workflows.spec.ts` - Cross-feature tests

### Test Structure

```typescript
import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages';

test.describe('Dashboard', () => {
  test('loads builds', async ({ authenticatedPage }) => {
    // Arrange
    const dashboard = new DashboardPage(authenticatedPage);

    // Act
    await dashboard.goto();
    const builds = await dashboard.getBuilds();

    // Assert
    expect(Array.isArray(builds)).toBeTruthy();
  });

  test('creates new build', async ({ authenticatedPage }) => {
    // Your test here
  });
});
```

### Best Practices

1. **Use Page Objects** - Avoid directly accessing selectors in tests
2. **Use Fixtures** - Pre-authenticate or provide test data via fixtures
3. **Wait Properly** - Always wait for elements/network before assertions
4. **Isolate Tests** - Each test should be independent
5. **Describe Groups** - Use `test.describe()` to group related tests
6. **Meaningful Names** - Test names should describe what is being tested
7. **Clean Up** - Use fixture cleanup to remove test data

## Debugging

### View Test Report

```bash
pnpm e2e:report
```

### Run in Debug Mode

```bash
pnpm e2e:debug
```

### Pause Test Execution

```typescript
await page.pause();
```

### View Network Requests

Enable in playwright.config.ts:

```typescript
use: {
  trace: 'on-first-retry',
}
```

### Print Debug Info

```typescript
console.log('Current URL:', page.url());
console.log('Page title:', await page.title());
```

## CI/CD Integration

Tests run in CI with:

- Single worker (no parallelization)
- 2 retries on failure
- HTML and JUnit reports
- Full traces and screenshots

## Common Issues

### Tests Timeout

- Check if services are running: `curl http://localhost:3000`
- Increase timeout: `test.setTimeout(60000)`
- Check network issues in browser DevTools

### Selector Not Found

- Verify data-testid attributes in components
- Use `page.locator()` to debug selectors
- Check if element is within iframe

### Authentication Fails

- Verify test credentials work manually
- Check localStorage token key name
- Verify GraphQL endpoint is accessible

## Resources

- [Playwright Docs](https://playwright.dev)
- [Fixtures Guide](./fixtures/README.md)
- [Page Objects Guide](./pages/README.md)
- [Helpers Guide](./helpers/README.md)
