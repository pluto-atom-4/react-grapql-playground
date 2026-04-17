import DataLoader from 'dataloader'
import { PrismaClient } from '@prisma/client'

/**
 * BuildLoader prevents N+1 queries when resolving parts for multiple builds.
 *
 * Example without DataLoader (N+1 problem):
 *   - Query: builds(limit: 100)          → 1 query for 100 builds
 *   - Resolver: build.parts              → 100 queries (one per build!)
 *   - Total: 101 queries
 *
 * Example with DataLoader (batch query):
 *   - Query: builds(limit: 100)          → 1 query for 100 builds
 *   - Resolver: buildLoader.load(id)     → batches into 1 query for all parts
 *   - Total: 2 queries
 */
export function createBuildPartLoader(prisma: PrismaClient) {
  return new DataLoader(async (buildIds: readonly string[]) => {
    const parts = await prisma.part.findMany({
      where: { buildId: { in: buildIds as string[] } },
    })

    // Group parts by buildId and return in same order as buildIds
    const partsByBuildId: Record<string, typeof parts> = {}
    parts.forEach((part) => {
      if (!partsByBuildId[part.buildId]) {
        partsByBuildId[part.buildId] = []
      }
      partsByBuildId[part.buildId].push(part)
    })

    return buildIds.map((buildId) => partsByBuildId[buildId] || [])
  })
}

/**
 * TestRunLoader prevents N+1 queries when resolving test runs for multiple builds.
 *
 * Same pattern as BuildPartLoader: batch multiple build IDs into single query.
 */
export function createBuildTestRunLoader(prisma: PrismaClient) {
  return new DataLoader(async (buildIds: readonly string[]) => {
    const testRuns = await prisma.testRun.findMany({
      where: { buildId: { in: buildIds as string[] } },
      orderBy: { createdAt: 'desc' },
    })

    const testRunsByBuildId: Record<string, typeof testRuns> = {}
    testRuns.forEach((testRun) => {
      if (!testRunsByBuildId[testRun.buildId]) {
        testRunsByBuildId[testRun.buildId] = []
      }
      testRunsByBuildId[testRun.buildId].push(testRun)
    })

    return buildIds.map((buildId) => testRunsByBuildId[buildId] || [])
  })
}

/**
 * BuildContext: All data loaders for a single GraphQL request.
 *
 * DataLoader batches within a single request, then clears.
 * Each new GraphQL request gets fresh loaders (prevents stale cache).
 */
export interface BuildContext {
  prisma: PrismaClient
  buildPartLoader: DataLoader<string, any[]>
  buildTestRunLoader: DataLoader<string, any[]>
}

export function createLoaders(prisma: PrismaClient): Omit<BuildContext, 'prisma'> {
  return {
    buildPartLoader: createBuildPartLoader(prisma),
    buildTestRunLoader: createBuildTestRunLoader(prisma),
  }
}
