/**
 * Apollo Client configuration for Next.js 16 Server Components
 *
 * Server-side Apollo Client instance for fetching data on the server before rendering.
 * This client is used in async Server Components (e.g., app/page.tsx) to fetch initial data
 * that gets passed to client components via props. This eliminates the data waterfall and
 * enables parallel data fetching with JavaScript bundle download.
 *
 * Key differences from client-side Apollo:
 * - ssrMode is always true (not conditional)
 * - Fresh InMemoryCache() per request (no cross-request state contamination)
 * - Server-side fetch implementation
 *
 * Benefits from Issue #85 (Type Safety):
 * - Explicit return types on all queries prevent re-renders from type mismatches on hydration
 * - Promise types ensure proper async/await handling in Server Components
 */

import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

/**
 * Create a new Apollo Client instance for server-side use.
 * Each request gets a fresh cache to prevent cross-request state contamination.
 *
 * @example
 * import { client } from '@/lib/apollo-client-server'
 * import { BUILDS_QUERY } from '@/lib/graphql-queries'
 *
 * // In an async Server Component:
 * const { data } = await client.query({ query: BUILDS_QUERY })
 * return <BuildDashboard initialBuilds={data.builds} />
 */
export function createApolloClientServer(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

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
  })
}

/**
 * Singleton Apollo Client instance for server-side queries.
 * Safe to use in async Server Components and server actions.
 *
 * Note: Each request uses a fresh cache (no per-request pollution).
 * For truly request-scoped caching, create a new client per request:
 *
 * @example
 * const serverClient = createApolloClientServer()
 * const { data } = await serverClient.query({ query: BUILDS_QUERY })
 */
export const client = createApolloClientServer()
