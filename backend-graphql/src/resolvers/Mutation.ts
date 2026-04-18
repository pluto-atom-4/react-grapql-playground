import { BuildContext } from '../types'
import { BuildStatus, TestStatus } from '@prisma/client'
import { emitEvent } from '../services/event-bus'
import type { GraphQLResolveInfo } from 'graphql'

/**
 * Mutation resolvers with event emission to Express event bus.
 *
 * Pattern:
 * 1. Validate input
 * 2. Perform database mutation
 * 3. Emit event to Express event bus (for real-time SSE)
 * 4. Return result
 */
export const mutationResolver = {
  Mutation: {
    /**
     * Create a new build in PENDING status.
     */
    async createBuild(
      _parent: unknown,
      args: { name: string; description?: string },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      if (!args.name || args.name.trim().length === 0) {
        throw new Error('name is required')
      }

      const build = await context.prisma.build.create({
        data: {
          name: args.name.trim(),
          description: args.description?.trim(),
        },
      })

      // Emit event for real-time SSE (Express event bus)
      emitEvent('buildCreated', { buildId: build.id, build }).catch(err => {
        console.error('Failed to emit buildCreated event:', err)
      })

      return build
    },

    /**
     * Update build status and emit real-time event.
     *
     * Interview talking point: "Mutation updates DB, then emits event
     * to Express event bus, which broadcasts to frontend SSE listeners.
     * Result: all clients see update in <100ms."
     */
    async updateBuildStatus(
      _parent: unknown,
      args: { id: string; status: string },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      const validStatuses = ['PENDING', 'RUNNING', 'COMPLETE', 'FAILED']
      if (!validStatuses.includes(args.status)) {
        throw new Error(`status must be one of: ${validStatuses.join(', ')}`)
      }

      const build = await context.prisma.build.findUnique({
        where: { id: args.id },
      })
      if (!build) {
        throw new Error(`Build with id ${args.id} not found`)
      }

      const updated = await context.prisma.build.update({
        where: { id: args.id },
        data: { status: args.status as BuildStatus },
      })

      // Emit event for real-time SSE
      emitEvent('buildStatusChanged', { buildId: updated.id, build: updated }).catch(err => {
        console.error('Failed to emit buildStatusChanged event:', err)
      })

      return updated
    },

    /**
     * Add a part to a build.
     */
    async addPart(
      _parent: unknown,
      args: { buildId: string; name: string; sku: string; quantity: number },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      if (!args.name || args.name.trim().length === 0) {
        throw new Error('name is required')
      }
      if (!args.sku || args.sku.trim().length === 0) {
        throw new Error('sku is required')
      }
      if (args.quantity < 1) {
        throw new Error('quantity must be >= 1')
      }

      // Verify build exists
      const build = await context.prisma.build.findUnique({
        where: { id: args.buildId },
      })
      if (!build) {
        throw new Error(`Build with id ${args.buildId} not found`)
      }

      const part = await context.prisma.part.create({
        data: {
          buildId: args.buildId,
          name: args.name.trim(),
          sku: args.sku.trim(),
          quantity: args.quantity,
        },
      })

      emitEvent('partAdded', { buildId: args.buildId, part }).catch(err => {
        console.error('Failed to emit partAdded event:', err)
      })

      return part
    },

    /**
     * Submit a test run result for a build.
     */
    async submitTestRun(
      _parent: unknown,
      args: {
        buildId: string
        status: string
        result?: string
        fileUrl?: string
      },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      const validStatuses = ['PENDING', 'RUNNING', 'PASSED', 'FAILED']
      if (!validStatuses.includes(args.status)) {
        throw new Error(`status must be one of: ${validStatuses.join(', ')}`)
      }

      // Verify build exists
      const build = await context.prisma.build.findUnique({
        where: { id: args.buildId },
      })
      if (!build) {
        throw new Error(`Build with id ${args.buildId} not found`)
      }

      const testRun = await context.prisma.testRun.create({
        data: {
          buildId: args.buildId,
          status: args.status as TestStatus,
          result: args.result,
          fileUrl: args.fileUrl,
          completedAt: args.status === 'RUNNING' ? null : new Date(),
        },
      })

      emitEvent('testRunSubmitted', { buildId: args.buildId, testRun }).catch(err => {
        console.error('Failed to emit testRunSubmitted event:', err)
      })

      return testRun
    },
  },
}

/**
 * Emit event to Express event bus.
 * Implemented via HTTP POST in services/event-bus.ts.
 * Errors are logged but don't throw—mutations complete even if events fail.
 */
