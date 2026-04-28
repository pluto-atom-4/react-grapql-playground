import { BuildContext } from '../types';
import { BuildStatus, TestStatus } from '@prisma/client';
import { emitEvent } from '../services/event-bus';
import { generateToken } from '../middleware/auth';
import { EVENT_TYPES, createEventEnvelope } from '../types/events';
import type { GraphQLResolveInfo } from 'graphql';
import bcrypt from 'bcrypt';

/**
 * Mutation resolvers with event emission to Express event bus.
 *
 * Pattern:
 * 1. Require authentication (context.user must exist)
 * 2. Validate input
 * 3. Perform database mutation
 * 4. Emit event to Express event bus (for real-time SSE) with proper schema
 * 5. Return result
 *
 * Events include: eventId (UUID), eventType, timestamp, sourceLayer ('graphql'),
 * userId, and typed payload matching EventPayload union.
 */
export const mutationResolver = {
  Mutation: {
    /**
     * Authenticate user with email and password.
     * Returns JWT token valid for 24 hours.
     *
     * Interview talking point: "Login mutation validates credentials against
     * bcrypt hash, then generates JWT token. Token is sent to frontend via GraphQL,
     * stored in localStorage, and injected into all subsequent GraphQL requests."
     */
    async login(
      _parent: unknown,
      args: { email: string; password: string },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      // Validate input
      if (!args.email || args.email.trim().length === 0) {
        throw new Error('email is required');
      }
      if (!args.password || args.password.length === 0) {
        throw new Error('password is required');
      }

      // Find user by email
      const user = await context.prisma.user.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Compare password with hash
      const passwordMatch = await bcrypt.compare(args.password, user.passwordHash);
      if (!passwordMatch) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = generateToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    },

    /**
     * Create a new build in PENDING status.
     * Requires authentication.
     * Emits: BUILD_CREATED event
     */
    async createBuild(
      _parent: unknown,
      args: { name: string; description?: string },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      // Require authentication
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      if (!args.name || args.name.trim().length === 0) {
        throw new Error('name is required');
      }

      const build = await context.prisma.build.create({
        data: {
          name: args.name.trim(),
          description: args.description?.trim(),
        },
      });

      // Emit BUILD_CREATED event with proper schema
      const event = createEventEnvelope(EVENT_TYPES.BUILD_CREATED, 'graphql', context.user.id);
      Object.assign(event, {
        buildId: build.id,
        build: {
          id: build.id,
          name: build.name,
          description: build.description,
          status: build.status,
          createdAt: build.createdAt.toISOString(),
        },
      });

      emitEvent('buildCreated', {
        eventId: event.eventId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        sourceLayer: event.sourceLayer,
        userId: event.userId,
        buildId: build.id,
        build: {
          id: build.id,
          name: build.name,
          description: build.description,
          status: build.status,
          createdAt: build.createdAt.toISOString(),
        },
      }).catch((err) => {
        console.error('Failed to emit BUILD_CREATED event:', err);
      });

      return build;
    },

    /**
     * Update build status and emit real-time event.
     * Requires authentication.
     * Emits: BUILD_STATUS_CHANGED event
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
      // Require authentication
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      const validStatuses = ['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'];
      if (!validStatuses.includes(args.status)) {
        throw new Error(`status must be one of: ${validStatuses.join(', ')}`);
      }

      const build = await context.prisma.build.findUnique({
        where: { id: args.id },
      });
      if (!build) {
        throw new Error(`Build with id ${args.id} not found`);
      }

      const updated = await context.prisma.build.update({
        where: { id: args.id },
        data: { status: args.status as BuildStatus },
      });

      // Emit BUILD_STATUS_CHANGED event
      const event = createEventEnvelope(
        EVENT_TYPES.BUILD_STATUS_CHANGED,
        'graphql',
        context.user.id
      );
      Object.assign(event, {
        buildId: updated.id,
        oldStatus: build.status,
        newStatus: updated.status,
        build: {
          id: updated.id,
          status: updated.status,
          updatedAt: updated.updatedAt.toISOString(),
        },
      });

      emitEvent('buildStatusChanged', {
        eventId: event.eventId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        sourceLayer: event.sourceLayer,
        userId: event.userId,
        buildId: updated.id,
        oldStatus: build.status,
        newStatus: updated.status,
        build: {
          id: updated.id,
          status: updated.status,
          updatedAt: updated.updatedAt.toISOString(),
        },
      }).catch((err) => {
        console.error('Failed to emit BUILD_STATUS_CHANGED event:', err);
      });

      return updated;
    },

    /**
     * Add a part to a build.
     * Requires authentication.
     * Emits: PART_ADDED event
     */
    async addPart(
      _parent: unknown,
      args: { buildId: string; name: string; sku: string; quantity: number },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      // Require authentication
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      if (!args.name || args.name.trim().length === 0) {
        throw new Error('name is required');
      }
      if (!args.sku || args.sku.trim().length === 0) {
        throw new Error('sku is required');
      }
      if (args.quantity < 1) {
        throw new Error('quantity must be >= 1');
      }

      // Verify build exists
      const build = await context.prisma.build.findUnique({
        where: { id: args.buildId },
      });
      if (!build) {
        throw new Error(`Build with id ${args.buildId} not found`);
      }

      const part = await context.prisma.part.create({
        data: {
          buildId: args.buildId,
          name: args.name.trim(),
          sku: args.sku.trim(),
          quantity: args.quantity,
        },
      });

      // Emit PART_ADDED event
      const event = createEventEnvelope(EVENT_TYPES.PART_ADDED, 'graphql', context.user.id);
      Object.assign(event, {
        buildId: args.buildId,
        partId: part.id,
        part: {
          id: part.id,
          buildId: part.buildId,
          name: part.name,
          sku: part.sku,
          quantity: part.quantity,
          createdAt: part.createdAt.toISOString(),
        },
      });

      emitEvent('partAdded', {
        eventId: event.eventId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        sourceLayer: event.sourceLayer,
        userId: event.userId,
        buildId: args.buildId,
        partId: part.id,
        part: {
          id: part.id,
          buildId: part.buildId,
          name: part.name,
          sku: part.sku,
          quantity: part.quantity,
          createdAt: part.createdAt.toISOString(),
        },
      }).catch((err) => {
        console.error('Failed to emit PART_ADDED event:', err);
      });

      return part;
    },

    /**
     * Submit a test run result for a build.
     * Requires authentication.
     * Emits: TEST_RUN_SUBMITTED event
     */
    async submitTestRun(
      _parent: unknown,
      args: {
        buildId: string;
        status: string;
        result?: string;
        fileUrl?: string;
      },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      // Require authentication
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      const validStatuses = ['PENDING', 'RUNNING', 'PASSED', 'FAILED'];
      if (!validStatuses.includes(args.status)) {
        throw new Error(`status must be one of: ${validStatuses.join(', ')}`);
      }

      // Verify build exists
      const build = await context.prisma.build.findUnique({
        where: { id: args.buildId },
      });
      if (!build) {
        throw new Error(`Build with id ${args.buildId} not found`);
      }

      const testRun = await context.prisma.testRun.create({
        data: {
          buildId: args.buildId,
          status: args.status as TestStatus,
          result: args.result,
          fileUrl: args.fileUrl,
          completedAt: args.status === 'RUNNING' ? null : new Date(),
        },
      });

      // Emit TEST_RUN_SUBMITTED event
      const event = createEventEnvelope(
        EVENT_TYPES.TEST_RUN_SUBMITTED,
        'graphql',
        context.user.id
      );
      Object.assign(event, {
        buildId: args.buildId,
        testRunId: testRun.id,
        testRun: {
          id: testRun.id,
          buildId: testRun.buildId,
          status: testRun.status,
          result: testRun.result,
          fileUrl: testRun.fileUrl,
          completedAt: testRun.completedAt?.toISOString(),
          createdAt: testRun.createdAt.toISOString(),
        },
      });

      emitEvent('testRunSubmitted', {
        eventId: event.eventId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        sourceLayer: event.sourceLayer,
        userId: event.userId,
        buildId: args.buildId,
        testRunId: testRun.id,
        testRun: {
          id: testRun.id,
          buildId: testRun.buildId,
          status: testRun.status,
          result: testRun.result,
          fileUrl: testRun.fileUrl,
          completedAt: testRun.completedAt?.toISOString(),
          createdAt: testRun.createdAt.toISOString(),
        },
      }).catch((err) => {
        console.error('Failed to emit TEST_RUN_SUBMITTED event:', err);
      });

      return testRun;
    },
  },
};

/**
 * Event emission pattern used by all mutations:
 *
 * 1. Create event envelope with createEventEnvelope():
 *    const event = createEventEnvelope(EVENT_TYPES.BUILD_CREATED, 'graphql', context.user.id);
 *
 * 2. Call emitEvent() with typed payload:
 *    await emitEvent('eventName', {
 *      eventId: event.eventId,
 *      eventType: event.eventType,
 *      timestamp: event.timestamp,
 *      sourceLayer: event.sourceLayer,
 *      userId: event.userId,
 *      ...typedPayload
 *    }).catch(err => console.error(...));
 *
 * 3. emitEvent() handles retry logic automatically (3 retries, exponential backoff)
 *
 * 4. Errors are logged but don't throw—mutations complete even if events fail
 */
