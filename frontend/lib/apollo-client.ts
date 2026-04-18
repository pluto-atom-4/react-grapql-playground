/**
 * Apollo Client configuration for Next.js 16 with React 19
 * 
 * Simple shared client instance for client components
 */

import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

export function makeClient(): ApolloClient<object> {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: graphqlUrl,
      credentials: 'include',
    }),
  })
}
