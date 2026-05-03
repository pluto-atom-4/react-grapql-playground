/**
 * Apollo Client configuration for Next.js 16 with React 19
 *
 * Includes:
 * - Authentication link for JWT token injection
 * - Error link for GraphQL and network error handling (Issue #28)
 * - Connection to Toast notifications for user feedback
 */

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { extractErrorMessage } from './graphql-error-handler';
import { createToast } from '@/components/toast-notification';

/**
 * Error link handler that catches GraphQL and network errors.
 *
 * - Displays user-friendly error messages via Toast notifications
 * - Logs full error details to console for debugging
 * - Continues the link chain for RetryLink integration (Issue #32)
 *
 * Link order (after Issue #32):
 * errorLink → retryLink → authLink → httpLink
 */
const errorLink = new ErrorLink(({ error, operation, forward }) => {
  // Extract user-friendly message
  const message =
    error instanceof CombinedGraphQLErrors
      ? extractErrorMessage({
          graphQLErrors: error.errors.map((e) => ({
            message: e.message,
            extensions: e.extensions,
          })),
        })
      : extractErrorMessage(error);

  // Log error details to console for debugging
  console.error(`[Apollo Error] (${operation.operationName}):`, {
    message,
    timestamp: new Date().toISOString(),
    errorType:
      error instanceof CombinedGraphQLErrors ? 'graphql' : 'network',
    error,
  });

  // Display error to user via toast
  createToast(message, 'error', 7000);

  // Continue the chain (critical for RetryLink integration in Issue #32)
  return forward(operation);
});

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
    // Error link first to catch all errors before other links
    link: errorLink.concat(authLink).concat(httpLink),
  });
}
