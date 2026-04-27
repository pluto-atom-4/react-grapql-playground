/**
 * Global setup for Playwright tests
 * Verifies all required services are running before tests begin
 */
async function globalSetup() {
  console.log('🔍 Verifying service connectivity...');

  const serviceChecks = [
    {
      name: 'Frontend',
      url: process.env.BASE_URL || 'http://localhost:3000',
      check: 'frontend',
    },
    {
      name: 'GraphQL API',
      url: `${process.env.GRAPHQL_URL || 'http://localhost:4000'}/graphql`,
      check: 'graphql',
    },
    {
      name: 'Express Server',
      url: `${process.env.EXPRESS_URL || 'http://localhost:5000'}/health`,
      check: 'express',
    },
  ];

  const results: Array<{ name: string; status: 'success' | 'failed'; error?: string }> = [];

  for (const service of serviceChecks) {
    try {
      const status = await checkService(
        service.url,
        service.check as 'frontend' | 'graphql' | 'express'
      );
      if (status) {
        console.log(`✅ ${service.name} is running`);
        results.push({ name: service.name, status: 'success' });
      } else {
        throw new Error('Service check failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${service.name} is not available: ${errorMessage}`);
      results.push({
        name: service.name,
        status: 'failed',
        error: errorMessage,
      });
    }
  }

  // Check if all services are available
  const failed = results.filter((r) => r.status === 'failed');
  if (failed.length > 0) {
    console.error('\n❌ Service checks failed:');
    failed.forEach((f) => {
      console.error(`   - ${f.name}: ${f.error}`);
    });
    console.error('\n📝 Make sure all services are running:\n   pnpm dev');
    throw new Error('Service connectivity check failed');
  }

  console.log('\n✅ All services are ready for E2E testing\n');
}

/**
 * Check if a service is available and responding
 */
async function checkService(
  url: string,
  type: 'frontend' | 'graphql' | 'express'
): Promise<boolean> {
  const maxRetries = 3;
  const retryDelay = 2000;
  const timeout = 30000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   Checking ${url} (attempt ${attempt}/${maxRetries})...`);

      const controller = new AbortController();
      // eslint-disable-next-line no-undef
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        let response;

        if (type === 'frontend') {
          // Check frontend with browser
          response = await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
          });
        } else if (type === 'graphql') {
          // Check GraphQL with introspection query
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                query IntrospectionQuery {
                  __schema {
                    types {
                      name
                    }
                  }
                }
              `,
            }),
            signal: controller.signal,
          });
        } else {
          // Check Express health endpoint
          response = await fetch(url, {
            signal: controller.signal,
          });
        }

        // eslint-disable-next-line no-undef
        clearTimeout(timeoutId);

        if (response.ok) {
          if (type === 'graphql') {
            // Verify GraphQL response has schema
            const data = await response.json() as { data?: { __schema?: { types?: Array<unknown> } } };
            return !!data.data?.__schema?.types;
          } else {
            // For frontend and express, just check status
            return true;
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        // eslint-disable-next-line no-undef
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (attempt < maxRetries) {
        console.log(`   ⏳ Retry in ${retryDelay}ms... (${errorMessage})`);
        // eslint-disable-next-line no-undef
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        throw new Error(`Service unavailable after ${maxRetries} attempts: ${errorMessage}`);
      }
    }
  }

  return false;
}

export default globalSetup;
