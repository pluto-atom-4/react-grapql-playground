import { Page } from '@playwright/test';

/**
 * Wait for GraphQL query to complete and data to render
 */
export async function waitForGraphQL(page: Page, _query: string, timeout = 10000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Check if Apollo Client has cached the query
      const hasQuery = await page.evaluate(() => {
        try {
          const cache = (window as any).__APOLLO_CLIENT__?.cache;
          // Simple check if query has been executed (Apollo cache has data)
          return cache?.extract && JSON.stringify(cache.extract()).length > 2;
        } catch {
          return false;
        }
      });

      if (hasQuery) {
        return;
      }

      await page.waitForTimeout(100);
    } catch {
      await page.waitForTimeout(100);
    }
  }

  throw new Error(`GraphQL query did not complete within ${timeout}ms`);
}

/**
 * Wait for Server-Sent Events message with specific event name
 */
export async function waitForSSEEvent(
  page: Page,
  eventName: string,
  timeout = 10000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      page.evaluate(() => {
        (window as any)._sseListeners?.delete?.('_e2e_test_listener');
      });
      reject(new Error(`SSE event "${eventName}" not received within ${timeout}ms`));
    }, timeout);

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes(`SSE:${eventName}:`)) {
        clearTimeout(timeoutHandle);
        try {
          const data = JSON.parse(msg.text().replace(`SSE:${eventName}:`, ''));
          resolve(data);
        } catch (error) {
          reject(error);
        }
      }
    });

    page.evaluate((event) => {
      if (!window.EventSource) {
        console.error('EventSource not supported');
        return;
      }

      try {
        const eventSource = new EventSource('/events');
        const handleEvent = (e: any) => {
          const data = JSON.parse(e.data);
          if (data.type === event) {
            console.log(`SSE:${event}:${JSON.stringify(data)}`);
            eventSource.close();
          }
        };

        eventSource.addEventListener(event, handleEvent);
        (window as any)._sseListeners = new Map([['_e2e_test_listener', eventSource]]);
      } catch (error) {
        console.error('SSE listener setup failed:', error);
      }
    }, eventName);
  });
}

/**
 * Wait for network requests to be idle (no pending requests)
 */
export async function waitForNetworkIdle(page: Page, timeout = 10000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    console.warn('Network idle timeout (continuing):', error);
  }
}

/**
 * Wait for Apollo Client cache to be ready with initial data
 */
export async function waitForApolloCacheReady(page: Page, timeout = 10000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const isReady = await page.evaluate(() => {
      try {
        const client = (window as any).__APOLLO_CLIENT__;
        const cache = client?.cache;
        const data = cache?.extract?.();

        // Check if cache has any data
        return !!(cache && data && Object.keys(data).length > 0);
      } catch {
        return false;
      }
    });

    if (isReady) {
      return;
    }

    await page.waitForTimeout(100);
  }

  throw new Error(`Apollo cache not ready within ${timeout}ms`);
}

/**
 * Wait for element to be stable (not changing DOM)
 */
export async function waitForElementStable(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();
  let lastHTML = '';
  let stableCount = 0;
  const requiredStableChecks = 3;

  while (Date.now() - startTime < timeout) {
    try {
      const html = await page.locator(selector).first().innerHTML();

      if (html === lastHTML) {
        stableCount++;
      } else {
        stableCount = 0;
      }

      if (stableCount >= requiredStableChecks) {
        return;
      }

      lastHTML = html;
      await page.waitForTimeout(100);
    } catch {
      await page.waitForTimeout(100);
    }
  }

  throw new Error(`Element not stable within ${timeout}ms`);
}

/**
 * Wait for GraphQL loading state to complete
 */
export async function waitForGraphQLLoading(page: Page, timeout = 10000): Promise<void> {
  // First, wait for loading to appear
  try {
    await page.locator('[data-testid*="loading"], .loading, .skeleton').first().waitFor({
      timeout: 2000,
      state: 'visible',
    });
  } catch {
    // Loading might not appear, continue
  }

  // Then wait for loading to disappear
  try {
    await page.locator('[data-testid*="loading"], .loading, .skeleton').first().waitFor({
      timeout,
      state: 'hidden',
    });
  } catch (error) {
    console.warn('Loading indicator still visible:', error);
  }
}

/**
 * Wait for specific HTTP response
 */
export async function waitForResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error(`Response matching "${urlPattern}" not received within ${timeout}ms`));
    }, timeout);

    const handler = (response: any) => {
      if (response.url().match(urlPattern)) {
        clearTimeout(timeoutHandle);
        page.removeListener('response', handler);
        resolve(response);
      }
    };

    page.on('response', handler);
  });
}

/**
 * Wait for multiple elements to exist
 */
export async function waitForElements(
  page: Page,
  selector: string,
  expectedCount: number,
  timeout = 10000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const count = await page.locator(selector).count();

    if (count === expectedCount) {
      return;
    }

    await page.waitForTimeout(200);
  }

  throw new Error(`Expected ${expectedCount} elements matching "${selector}" within ${timeout}ms`);
}
