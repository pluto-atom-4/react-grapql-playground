import { BuildContext, PaginationArgs } from '../types';
import type { GraphQLResolveInfo } from 'graphql';

export const queryResolver = {
  Query: {
    /**
     * List all builds with pagination.
     * Requires authentication.
     * Returns pagination metadata along with builds.
     */
    async builds(
      _parent: unknown,
      args: PaginationArgs,
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      // Require authentication
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      if (args.limit < 1 || args.limit > 100) {
        throw new Error('limit must be between 1 and 100');
      }
      if (args.offset < 0) {
        throw new Error('offset must be >= 0');
      }

      // Get total count for pagination metadata
      const totalCount = await context.prisma.build.count();

      // Fetch builds for current page
      const items = await context.prisma.build.findMany({
        take: args.limit,
        skip: args.offset,
        orderBy: { createdAt: 'desc' },
      });

      // Calculate pagination flags
      const hasNextPage = args.offset + args.limit < totalCount;
      const hasPreviousPage = args.offset > 0;

      return {
        items,
        totalCount,
        hasNextPage,
        hasPreviousPage,
      };
    },

    /**
     * Get specific build by ID.
     * Requires authentication.
     * Does NOT use DataLoader (single ID lookup, not a list).
     */
    async build(
      _parent: unknown,
      args: { id: string },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      // Require authentication
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      return context.prisma.build.findUnique({
        where: { id: args.id },
      });
    },

    /**
     * List test runs for a specific build.
     * Requires authentication.
     * Does NOT use DataLoader (already filtered by buildId).
     */
    async testRuns(
      _parent: unknown,
      args: { buildId: string },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      // Require authentication
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      return context.prisma.testRun.findMany({
        where: { buildId: args.buildId },
        orderBy: { createdAt: 'desc' },
      });
    },
  },
};
