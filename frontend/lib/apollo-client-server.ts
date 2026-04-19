/**
 * Apollo Client configuration for Next.js 16 Server Components
 *
 * DEPRECATED: Use apollo-client-server-registered.ts instead
 *
 * This file previously exported a singleton client which caused cache pollution
 * (Issue #107: CRITICAL - Apollo Client Cache Pollution). The singleton pattern
 * reused the same InMemoryCache across all requests, allowing User A's data to
 * leak into User B's server-rendered pages in production.
 *
 * ⚠️ DO NOT USE: The singleton export has been removed.
 *
 * MIGRATION: Import from apollo-client-server-registered.ts instead:
 * ```typescript
 * import { getClient } from '@/lib/apollo-client-server-registered'
 * const client = getClient()  // Fresh client per request
 * ```
 *
 * Key differences from client-side Apollo:
 * - ssrMode is always true (not conditional)
 * - Fresh InMemoryCache() per request (registerApolloClient ensures this)
 * - Server-side fetch implementation
 *
 * Benefits from Issue #85 (Type Safety):
 * - Explicit return types on all queries prevent re-renders from type mismatches on hydration
 * - Promise types ensure proper async/await handling in Server Components
 */

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';

/**
 * Create a new Apollo Client instance for server-side use.
 * Each request gets a fresh cache to prevent cross-request state contamination.
 *
 * DEPRECATED: Use registerApolloClient from apollo-client-server-registered.ts instead.
 *
 * @example
 * // ❌ OLD (do not use):
 * import { client } from '@/lib/apollo-client-server'
 *
 * // ✅ NEW (use this):
 * import { getClient } from '@/lib/apollo-client-server-registered'
 * const client = getClient()
 */
export function createApolloClientServer(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

  return new ApolloClient({
    // Always true for server-side rendering (not conditional like client)
    ssrMode: true,

    // Fresh cache for each server request (prevents cross-request contamination)
    cache: new InMemoryCache(),

    // HTTP link to GraphQL endpoint
    link: new HttpLink({
      uri: graphqlUrl,
      // Include credentials (cookies, auth headers) if applicable
      credentials: 'include',
      // HttpLink uses Node's fetch automatically in server context (Node 18+)
    }),
  });
}
