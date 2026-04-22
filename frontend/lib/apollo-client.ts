/**
 * Apollo Client configuration for Next.js 16 with React 19
 *
 * Includes authentication link for JWT token injection
 */

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';

export function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

  const httpLink = new HttpLink({
    uri: graphqlUrl,
    credentials: 'include',
  });

  const authLink = setContext((_, context) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
    const { headers } = context as { headers: Record<string, string> };
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
  });
}
