# Page Objects

Page object classes for testing UI interactions.

## BasePage

Base class providing common page interactions.

**Methods**:
- `goto(url)` - Navigate to URL
- `getByTestId(testId)` - Get element by data-testid
- `waitForElement(selector, timeout)` - Wait for element visibility
- `waitForTestId(testId, timeout)` - Wait for test ID element
- `clickByTestId(testId)` - Click element by test ID
- `fillByTestId(testId, text)` - Fill input by test ID
- `getTextByTestId(testId)` - Get text of element
- `isVisible(selector)` - Check if element is visible
- `waitForNetworkIdle(timeout)` - Wait for network requests
- `getTitle()` - Get page title
- `getCurrentUrl()` - Get current URL
- `reload()` - Reload page

## LoginPage

Extends BasePage. Handles login page interactions.

**Methods**:
- `goto()` - Navigate to login page
- `login(email, password)` - Perform login
- `loginAndWaitForRedirect(email, password, expectedUrl)` - Login with redirect
- `expectErrorMessage(message)` - Verify error message
- `expectNoError()` - Verify no error
- `expectLoading()` - Verify loading state
- `expectLoadingComplete()` - Verify loading complete
- `isFormReady()` - Check if form is ready

## DashboardPage

Extends BasePage. Handles dashboard interactions.

**Methods**:
- `goto()` - Navigate to dashboard
- `getBuilds()` - Get list of builds
- `clickBuild(id)` - Click on build
- `createBuild(name)` - Create new build
- `expectEmptyState()` - Verify empty state
- `expectBuildsLoaded(count)` - Verify build count
- `expectBuildVisible(id)` - Verify build is visible
- `logout()` - Perform logout
- `isDashboardReady()` - Check if dashboard loaded
- `waitForBuildStatus(id, status, timeout)` - Wait for build status change

## Usage Example

```typescript
import { test } from '../fixtures';
import { LoginPage, DashboardPage } from '../pages';

test('create and view build', async ({ authenticatedPage }) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();

  const builds = await dashboard.getBuilds();
  expect(builds.length).toBeGreaterThanOrEqual(0);

  await dashboard.createBuild('Test Build');
  
  const updatedBuilds = await dashboard.getBuilds();
  expect(updatedBuilds.length).toBeGreaterThan(builds.length);
});
```
