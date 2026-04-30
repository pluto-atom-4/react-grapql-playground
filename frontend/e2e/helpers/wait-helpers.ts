import { Page } from '@playwright/test';

interface Window {
  __APOLLO_CLIENT__?: {
    cache: {
      extract: () => Record<string, unknown>;
    };
  };
  _sseListeners?: Map<string, EventSource>;
  EventSource?: typeof EventSource;
}

/**
 * Wait for GraphQL query to complete and data to render
 */
export async function waitForGraphQL(page: Page, _query: string, timeout = 10000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Check if Apollo Client has cached the query
      const hasQuery = await page.evaluate((): boolean => {
        try {
          const cache = (window as unknown as Window).__APOLLO_CLIENT__?.cache;
          // Simple check if query has been executed (Apollo cache has data)
          return !!(cache?.extract && JSON.stringify(cache.extract()).length > 2);
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
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeoutHandle = globalThis.setTimeout(() => {
      void page.evaluate(() => {
        (window as unknown as Window)._sseListeners?.delete?.('_e2e_test_listener');
      });
      reject(new Error(`SSE event "${eventName}" not received within ${timeout}ms`));
    }, timeout);

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes(`SSE:${eventName}:`)) {
        globalThis.clearTimeout(timeoutHandle);
        try {
          const data = JSON.parse(msg.text().replace(`SSE:${eventName}:`, '')) as unknown;
          resolve(data);
        } catch (error) {
          reject(error as Error);
        }
      }
    });

    void page.evaluate((event: string) => {
      if (!(window as unknown as Window).EventSource) {
        console.error('EventSource not supported');
        return;
      }

      try {
        const eventSource = new EventSource('/events');
        const handleEvent = (e: Event): void => {
          const messageEvent = e as MessageEvent<string>;
          const data = JSON.parse(messageEvent.data) as { type?: string };
          if (data.type === event) {
            console.warn(`SSE:${event}:${JSON.stringify(data)}`);
            eventSource.close();
          }
        };

        eventSource.addEventListener(event, handleEvent);
        (window as unknown as Window)._sseListeners = new Map([['_e2e_test_listener', eventSource]]);
      } catch (error) {
        console.error('SSE listener setup failed:', error);
      }
    }, eventName);
  });
}

/**
 * Wait for network requests to be idle (no pending requests)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    // Network idle timeout is not critical - allow tests to continue
    console.warn(
      '[waitForNetworkIdle] Timeout (continuing):',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Wait for Apollo Client cache to be ready with initial data
 */
export async function waitForApolloCacheReady(page: Page, timeout = 5000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const isReady = await page.evaluate((): boolean => {
        try {
          const client = (window as unknown as Window).__APOLLO_CLIENT__;
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
    } catch (error) {
      // If page is closed or error occurs, stop waiting
      if (
        error instanceof Error &&
        (error.message.includes('closed') || error.message.includes('Target'))
      ) {
        console.warn('Page closed or not available - stopping Apollo cache wait');
        return;
      }
      // For other errors, continue trying
      await page.waitForTimeout(100);
    }
  }

  console.warn(`Apollo cache not ready within ${timeout}ms (but continuing)`);
  // Don't throw - allow tests to continue even if cache isn't ready
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
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeoutHandle = globalThis.setTimeout(() => {
      reject(new Error(`Response matching "${typeof urlPattern === 'string' ? urlPattern : urlPattern.source}" not received within ${timeout}ms`));
    }, timeout);

    const handler = (response: unknown): void => {
      const resp = response as { url: () => string };
      if (resp.url().match(urlPattern)) {
        globalThis.clearTimeout(timeoutHandle);
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
