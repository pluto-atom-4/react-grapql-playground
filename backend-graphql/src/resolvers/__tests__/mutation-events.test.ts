import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mutationResolver } from '../Mutation';
import * as eventBus from '../../services/event-bus';
import { EVENT_TYPES } from '../../types/events';

// Mock the event bus
vi.mock('../../services/event-bus');
const mockedEmitEvent = vi.mocked(eventBus.emitEvent);

interface TestContext {
  user: { id: string } | null;
  prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
}

describe('Mutation Resolvers - Event Emission', () => {
  let context: TestContext;

  beforeEach(() => {
    vi.clearAllMocks();

    context = {
      user: { id: 'user-123' },
      prisma: {
        build: {
          create: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        part: {
          create: vi.fn(),
        },
        testRun: {
          create: vi.fn(),
        },
        user: {
          findUnique: vi.fn(),
        },
      },
    };

    mockedEmitEvent.mockResolvedValue(undefined);
  });

  describe('createBuild mutation', () => {
    it('emits BUILD_CREATED event with correct schema', async () => {
      const buildData = {
        id: 'build-1',
        name: 'Test Build',
        description: 'A test build',
        status: 'PENDING',
        createdAt: new Date('2026-04-17T12:00:00Z'),
        updatedAt: new Date('2026-04-17T12:00:00Z'),
      };

      context.prisma.build.create.mockResolvedValue(buildData);

      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      const result = await (Mutations.createBuild as (
        p: null,
        a: Record<string, unknown>,
        c: TestContext
      ) => Promise<unknown>)(null, { name: 'Test Build', description: 'A test build' }, context);

      expect(mockedEmitEvent).toHaveBeenCalledOnce();
      const [eventName, payload] = mockedEmitEvent.mock.calls[0];

      expect(eventName).toBe('buildCreated');
      expect(payload).toMatchObject({
        eventType: EVENT_TYPES.BUILD_CREATED,
        sourceLayer: 'graphql',
        userId: 'user-123',
        buildId: 'build-1',
      });
      expect((payload as Record<string, unknown>).build).toMatchObject({
        name: 'Test Build',
        status: 'PENDING',
      });
      expect((result as Record<string, unknown>).id).toBe('build-1');
    });

    it('throws when user is not authenticated', async () => {
      context.user = null;

      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      await expect(
        (Mutations.createBuild as (
          p: null,
          a: Record<string, unknown>,
          c: TestContext
        ) => Promise<unknown>)(null, { name: 'Test Build' }, context)
      ).rejects.toThrow('Unauthorized');

      expect(mockedEmitEvent).not.toHaveBeenCalled();
    });

    it('throws when name is empty', async () => {
      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      await expect(
        (Mutations.createBuild as (
          p: null,
          a: Record<string, unknown>,
          c: TestContext
        ) => Promise<unknown>)(null, { name: '   ' }, context)
      ).rejects.toThrow('name is required');

      expect(mockedEmitEvent).not.toHaveBeenCalled();
    });
  });

  describe('updateBuildStatus mutation', () => {
    it('emits BUILD_STATUS_CHANGED event with correct schema', async () => {
      const oldBuild = {
        id: 'build-1',
        status: 'PENDING',
        name: 'Test',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedBuild = {
        ...oldBuild,
        status: 'RUNNING',
        updatedAt: new Date('2026-04-17T12:05:00Z'),
      };

      context.prisma.build.findUnique.mockResolvedValue(oldBuild);
      context.prisma.build.update.mockResolvedValue(updatedBuild);

      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      const result = await (Mutations.updateBuildStatus as (
        p: null,
        a: Record<string, unknown>,
        c: TestContext
      ) => Promise<unknown>)(null, { id: 'build-1', status: 'RUNNING' }, context);

      expect(mockedEmitEvent).toHaveBeenCalledOnce();
      const [eventName, payload] = mockedEmitEvent.mock.calls[0];

      expect(eventName).toBe('buildStatusChanged');
      expect(payload).toMatchObject({
        eventType: EVENT_TYPES.BUILD_STATUS_CHANGED,
        sourceLayer: 'graphql',
        userId: 'user-123',
        buildId: 'build-1',
        oldStatus: 'PENDING',
        newStatus: 'RUNNING',
      });
      expect((result as Record<string, unknown>).status).toBe('RUNNING');
    });

    it('throws when build not found', async () => {
      context.prisma.build.findUnique.mockResolvedValue(null);

      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      await expect(
        (Mutations.updateBuildStatus as (
          p: null,
          a: Record<string, unknown>,
          c: TestContext
        ) => Promise<unknown>)(null, { id: 'build-nonexistent', status: 'RUNNING' }, context)
      ).rejects.toThrow('not found');

      expect(mockedEmitEvent).not.toHaveBeenCalled();
    });
  });

  describe('addPart mutation', () => {
    it('emits PART_ADDED event with correct schema', async () => {
      context.prisma.build.findUnique.mockResolvedValue({ id: 'build-1' });
      context.prisma.part.create.mockResolvedValue({
        id: 'part-1',
        buildId: 'build-1',
        name: 'Motor',
        sku: 'SKU-001',
        quantity: 5,
        createdAt: new Date('2026-04-17T12:00:00Z'),
        updatedAt: new Date('2026-04-17T12:00:00Z'),
      });

      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      const result = await (Mutations.addPart as (
        p: null,
        a: Record<string, unknown>,
        c: TestContext
      ) => Promise<unknown>)(
        null,
        { buildId: 'build-1', name: 'Motor', sku: 'SKU-001', quantity: 5 },
        context
      );

      expect(mockedEmitEvent).toHaveBeenCalledOnce();
      const [eventName, payload] = mockedEmitEvent.mock.calls[0];

      expect(eventName).toBe('partAdded');
      expect(payload).toMatchObject({
        eventType: EVENT_TYPES.PART_ADDED,
        sourceLayer: 'graphql',
        userId: 'user-123',
        buildId: 'build-1',
        partId: 'part-1',
      });
      expect((payload as Record<string, unknown>).part).toMatchObject({
        name: 'Motor',
        sku: 'SKU-001',
      });
      expect((result as Record<string, unknown>).id).toBe('part-1');
    });
  });

  describe('submitTestRun mutation', () => {
    it('emits TEST_RUN_SUBMITTED event with correct schema', async () => {
      context.prisma.build.findUnique.mockResolvedValue({ id: 'build-1' });
      context.prisma.testRun.create.mockResolvedValue({
        id: 'run-1',
        buildId: 'build-1',
        status: 'PASSED',
        result: 'All tests passed',
        fileUrl: '/files/report.pdf',
        completedAt: new Date('2026-04-17T12:05:00Z'),
        createdAt: new Date('2026-04-17T12:00:00Z'),
        updatedAt: new Date('2026-04-17T12:05:00Z'),
      });

      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      const result = await (Mutations.submitTestRun as (
        p: null,
        a: Record<string, unknown>,
        c: TestContext
      ) => Promise<unknown>)(
        null,
        {
          buildId: 'build-1',
          status: 'PASSED',
          result: 'All tests passed',
          fileUrl: '/files/report.pdf',
        },
        context
      );

      expect(mockedEmitEvent).toHaveBeenCalledOnce();
      const [eventName, payload] = mockedEmitEvent.mock.calls[0];

      expect(eventName).toBe('testRunSubmitted');
      expect(payload).toMatchObject({
        eventType: EVENT_TYPES.TEST_RUN_SUBMITTED,
        sourceLayer: 'graphql',
        userId: 'user-123',
        buildId: 'build-1',
        testRunId: 'run-1',
      });
      expect((payload as Record<string, unknown>).testRun).toMatchObject({
        status: 'PASSED',
        result: 'All tests passed',
      });
      expect((result as Record<string, unknown>).id).toBe('run-1');
    });
  });

  describe('Event payload verification', () => {
    it('all events include sourceLayer as graphql', async () => {
      context.prisma.build.create.mockResolvedValue({
        id: 'b1',
        name: 'Test',
        description: null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      await (Mutations.createBuild as (
        p: null,
        a: Record<string, unknown>,
        c: TestContext
      ) => Promise<unknown>)(null, { name: 'Test' }, context);

      const [_eventName, payload] = mockedEmitEvent.mock.calls[0];
      expect((payload as Record<string, unknown>).sourceLayer).toBe('graphql');
    });

    it('all events include userId from context', async () => {
      context.user = { id: 'user-special-456' };
      context.prisma.build.create.mockResolvedValue({
        id: 'b1',
        name: 'Test',
        description: null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      await (Mutations.createBuild as (
        p: null,
        a: Record<string, unknown>,
        c: TestContext
      ) => Promise<unknown>)(null, { name: 'Test' }, context);

      const [_eventName, payload] = mockedEmitEvent.mock.calls[0];
      expect((payload as Record<string, unknown>).userId).toBe('user-special-456');
    });

    it('BUILD_CREATED event has eventId', async () => {
      context.prisma.build.create.mockResolvedValue({
        id: 'b1',
        name: 'Test',
        description: null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const Mutations = mutationResolver.Mutation as Record<string, unknown>;
      await (Mutations.createBuild as (
        p: null,
        a: Record<string, unknown>,
        c: TestContext
      ) => Promise<unknown>)(null, { name: 'Test' }, context);

      const [_eventName, payload] = mockedEmitEvent.mock.calls[0];
      expect((payload as Record<string, unknown>).eventId).toBeDefined();
      expect(typeof (payload as Record<string, unknown>).eventId).toBe('string');
      expect(((payload as Record<string, unknown>).eventId as string).length).toBeGreaterThan(0);
    });
  });
});
