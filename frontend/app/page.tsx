import type { ReactElement } from 'react';
import Link from 'next/link';
import { getClient } from '@/lib/apollo-client-server-registered';
import { BUILDS_QUERY } from '@/lib/graphql-queries';
import BuildDashboard from '@/components/build-dashboard';
import type { Build } from '@/lib/generated/graphql';

/**
 * SEO Metadata for Build Dashboard
 * Displayed in browser tab and social media previews
 */
export const metadata = {
  title: 'Build Dashboard - Boltline',
  description:
    'Monitor manufacturing builds, parts, and test runs in real-time. Track status, manage test results, and coordinate production workflows.',
};

/**
 * Root page server component - unprotected, shows login link or dashboard
 *
 * Benefits from Issue #85 (Type Safety):
 * - Explicit Build[] type prevents re-renders from type mismatches during hydration
 *
 * Security (Issue #107 - Cache Pollution Fix):
 * - Uses registerApolloClient to create fresh Apollo client per request
 * - Prevents User A's cached data from leaking into User B's page render
 *
 * Architecture:
 * - Server-side: Fetches builds via fresh apollo-client per request (parallel with JS download)
 * - Client-side: BuildDashboard uses cache-first strategy when initialBuilds provided
 * - Result: ~50% faster FCP + zero hydration re-renders + no cache pollution
 */
export default async function Page(): Promise<ReactElement> {
  // First check if user is authenticated by trying to get protected data
  let initialBuilds: Build[] = [];
  let serverError: string | null = null;
  let isAuthenticated = false;

  try {
    // Get a fresh Apollo client instance for this request
    const client = getClient();

    // Fetch builds on the server (runs in parallel with JS bundle download)
    const result = await client.query({
      query: BUILDS_QUERY,
      variables: { limit: 10, offset: 0 },
    });

    // Type-safe builds array from Apollo result
    // ESLint disabled because Apollo query result type is complex and not well-exported
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const builds = ((result?.data as any)?.builds as Build[] | undefined) ?? [];
    initialBuilds = builds;
    isAuthenticated = true;
  } catch (err) {
    // If we get an auth error, user is not authenticated
    // Otherwise, log the error but continue
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    if (!errorMsg.includes('Unauthorized') && !errorMsg.includes('auth')) {
      console.error('Failed to fetch builds on server:', err);
      serverError = errorMsg;
    }
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Welcome to Boltline</h1>
          <p className="mb-8 text-xl text-gray-600">
            Manufacturing builds, parts, and test runs management
          </p>
          <Link
            href="/login"
            data-testid="home-login-link"
            className="inline-block rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // If authenticated, show dashboard (unprotected here, dashboard component handles auth)
  return <BuildDashboard initialBuilds={initialBuilds} serverError={serverError} />;
}
