import { BuildContext } from '../dataloaders'

export const queryResolver = {
  Query: {
    /**
     * List all builds with pagination.
     * Does NOT use DataLoader (already paginated at DB level).
     */
    async builds(
      _parent: any,
      args: { limit: number; offset: number },
      context: BuildContext
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
    async build(_parent: any, args: { id: string }, context: BuildContext) {
      return context.prisma.build.findUnique({
        where: { id: args.id },
      })
    },

    /**
     * List test runs for a specific build.
     * Does NOT use DataLoader (already filtered by buildId).
     */
    async testRuns(
      _parent: any,
      args: { buildId: string },
      context: BuildContext
    ) {
      return context.prisma.testRun.findMany({
        where: { buildId: args.buildId },
        orderBy: { createdAt: 'desc' },
      })
    },
  },
}
