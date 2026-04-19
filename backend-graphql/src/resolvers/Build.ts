import type { BuildParent, GraphQLContext } from '../types';
import type { GraphQLResolveInfo } from 'graphql';

/**
 * Build type resolver.
 *
 * Uses DataLoader for nested resolvers to prevent N+1 queries.
 */
export const buildResolver = {
  Build: {
    /**
     * Resolve parts for a build using DataLoader.
     *
     * Without DataLoader:
     *   query { builds(limit: 100) { parts { id } } }
     *   → 1 query for builds + 100 queries for parts = 101 total
     *
     * With DataLoader:
     *   → 1 query for builds + 1 batched query for all parts = 2 total
     *
     * Interview talking point: "DataLoader prevents N+1 queries by batching
     * multiple build IDs into a single database query."
     */
    async parts(
      parent: BuildParent,
      _args: unknown,
      context: GraphQLContext,
      _info: GraphQLResolveInfo
    ) {
      return context.buildPartLoader.load(parent.id);
    },

    /**
     * Resolve test runs for a build using DataLoader.
     *
     * Same batching as parts: single query for all test runs.
     */
    async testRuns(
      parent: BuildParent,
      _args: unknown,
      context: GraphQLContext,
      _info: GraphQLResolveInfo
    ) {
      return context.buildTestRunLoader.load(parent.id);
    },
  },
};
