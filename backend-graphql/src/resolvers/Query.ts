import { BuildContext, PaginationArgs } from '../types'
import type { GraphQLResolveInfo } from 'graphql'

export const queryResolver = {
  Query: {
    /**
     * List all builds with pagination.
     * Does NOT use DataLoader (already paginated at DB level).
     */
    async builds(
      _parent: unknown,
      args: PaginationArgs,
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      if (args.limit < 1 || args.limit > 100) {
        throw new Error('limit must be between 1 and 100')
      }
      if (args.offset < 0) {
        throw new Error('offset must be >= 0')
      }

      return context.prisma.build.findMany({
        take: args.limit,
        skip: args.offset,
        orderBy: { createdAt: 'desc' },
      })
    },

    /**
     * Get specific build by ID.
     * Does NOT use DataLoader (single ID lookup, not a list).
     */
    async build(
      _parent: unknown,
      args: { id: string },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      return context.prisma.build.findUnique({
        where: { id: args.id },
      })
    },

    /**
     * List test runs for a specific build.
     * Does NOT use DataLoader (already filtered by buildId).
     */
    async testRuns(
      _parent: unknown,
      args: { buildId: string },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      return context.prisma.testRun.findMany({
        where: { buildId: args.buildId },
        orderBy: { createdAt: 'desc' },
      })
    },
  },
}
