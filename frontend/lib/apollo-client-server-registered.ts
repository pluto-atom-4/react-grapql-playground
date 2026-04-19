/**
 * Apollo Client configuration for Next.js 16 Server Components using registerApolloClient
 *
 * This uses Apollo's official @apollo/client-integration-nextjs integration,
 * which handles per-request client creation automatically. This prevents the cache
 * pollution vulnerability where a singleton client could leak data between requests.
 *
 * Key advantages:
 * - Fresh InMemoryCache() per request (no cross-request state contamination)
 * - Official Apollo integration for Next.js 13+ App Router
 * - Automatic request isolation without manual lifecycle management
 *
 * Fixes Issue #107: CRITICAL - Apollo Client Cache Pollution
 */

import { registerApolloClient } from '@apollo/client-integration-nextjs';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';

/**
 * Register Apollo Client factory for server-side use.
 * registerApolloClient ensures a fresh client instance per request.
 *
 * @example
 * import { getClient } from '@/lib/apollo-client-server-registered'
 * import { BUILDS_QUERY } from '@/lib/graphql-queries'
 *
 * // In an async Server Component:
 * export default async function Page() {
 *   const client = getClient()
 *   const { data } = await client.query({ query: BUILDS_QUERY })
 *   return <BuildDashboard initialBuilds={data.builds} />
 * }
 */
export const { getClient } = registerApolloClient(() => {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

  return new ApolloClient({
    // Always true for server-side rendering
    ssrMode: true,

    // Fresh cache for each server request (prevents cross-request contamination)
    // registerApolloClient ensures a new instance per request
    cache: new InMemoryCache(),

    // HTTP link to GraphQL endpoint
    link: new HttpLink({
      uri: graphqlUrl,
      // Include credentials (cookies, auth headers) if applicable
      credentials: 'include',
      // HttpLink uses Node's fetch automatically in server context (Node 18+)
    }),
  });
});
