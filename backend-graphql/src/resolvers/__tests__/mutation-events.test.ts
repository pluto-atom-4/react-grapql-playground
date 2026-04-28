import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mutationResolver } from '../Mutation';
import * as eventBus from '../../services/event-bus';
import { EVENT_TYPES } from '../../types/events';
import { PrismaClient } from '@prisma/client';

// Mock the event bus
vi.mock('../../services/event-bus');
const mockedEmitEvent = vi.mocked(eventBus.emitEvent);

describe('Mutation Resolvers - Event Emission', () => {
  let context: any;

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

      const result = await mutationResolver.Mutation.createBuild(
        null,
        { name: 'Test Build', description: 'A test build' },
        context
      );

      expect(mockedEmitEvent).toHaveBeenCalledOnce();
      const [eventName, payload] = mockedEmitEvent.mock.calls[0];

      expect(eventName).toBe('buildCreated');
      expect(payload).toMatchObject({
        eventType: EVENT_TYPES.BUILD_CREATED,
        sourceLayer: 'graphql',
        userId: 'user-123',
        buildId: 'build-1',
      });
      expect(payload.build.name).toBe('Test Build');
      expect(payload.build.status).toBe('PENDING');
      expect(result.id).toBe('build-1');
    });

    it('throws when user is not authenticated', async () => {
      context.user = null;

      await expect(
        mutationResolver.Mutation.createBuild(
          null,
          { name: 'Test Build' },
          context
        )
      ).rejects.toThrow('Unauthorized');

      expect(mockedEmitEvent).not.toHaveBeenCalled();
    });

    it('throws when name is empty', async () => {
      await expect(
        mutationResolver.Mutation.createBuild(
          null,
          { name: '   ' },
          context
        )
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

      const result = await mutationResolver.Mutation.updateBuildStatus(
        null,
        { id: 'build-1', status: 'RUNNING' },
        context
      );

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
      expect(result.status).toBe('RUNNING');
    });

    it('throws for invalid status', async () => {
      context.prisma.build.findUnique.mockResolvedValue({ id: 'build-1' });

      await expect(
        mutationResolver.Mutation.updateBuildStatus(
          null,
          { id: 'build-1', status: 'INVALID' },
          context
        )
      ).rejects.toThrow('status must be one of');

      expect(mockedEmitEvent).not.toHaveBeenCalled();
    });

    it('throws when build not found', async () => {
      context.prisma.build.findUnique.mockResolvedValue(null);

      await expect(
        mutationResolver.Mutation.updateBuildStatus(
          null,
          { id: 'build-nonexistent', status: 'RUNNING' },
          context
        )
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

      const result = await mutationResolver.Mutation.addPart(
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
      expect(payload.part.name).toBe('Motor');
      expect(payload.part.sku).toBe('SKU-001');
      expect(result.id).toBe('part-1');
    });

    it('throws when build does not exist', async () => {
      context.prisma.build.findUnique.mockResolvedValue(null);

      await expect(
        mutationResolver.Mutation.addPart(
          null,
          { buildId: 'build-nonexistent', name: 'Motor', sku: 'SKU-001', quantity: 5 },
          context
        )
      ).rejects.toThrow('not found');

      expect(mockedEmitEvent).not.toHaveBeenCalled();
    });

    it('throws when quantity is invalid', async () => {
      await expect(
        mutationResolver.Mutation.addPart(
          null,
          { buildId: 'build-1', name: 'Motor', sku: 'SKU-001', quantity: 0 },
          context
        )
      ).rejects.toThrow('quantity must be >= 1');

      expect(mockedEmitEvent).not.toHaveBeenCalled();
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

      const result = await mutationResolver.Mutation.submitTestRun(
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
      expect(payload.testRun.status).toBe('PASSED');
      expect(payload.testRun.result).toBe('All tests passed');
      expect(result.id).toBe('run-1');
    });

    it('handles RUNNING status without completedAt', async () => {
      context.prisma.build.findUnique.mockResolvedValue({ id: 'build-1' });
      context.prisma.testRun.create.mockResolvedValue({
        id: 'run-1',
        buildId: 'build-1',
        status: 'RUNNING',
        result: null,
        fileUrl: null,
        completedAt: null,
        createdAt: new Date('2026-04-17T12:00:00Z'),
        updatedAt: new Date('2026-04-17T12:00:00Z'),
      });

      await mutationResolver.Mutation.submitTestRun(
        null,
        { buildId: 'build-1', status: 'RUNNING' },
        context
      );

      expect(mockedEmitEvent).toHaveBeenCalledOnce();
      const [_eventName, payload] = mockedEmitEvent.mock.calls[0];

      expect(payload.testRun.completedAt).toBeUndefined();
    });

    it('throws for invalid test status', async () => {
      await expect(
        mutationResolver.Mutation.submitTestRun(
          null,
          { buildId: 'build-1', status: 'INVALID_STATUS' },
          context
        )
      ).rejects.toThrow('status must be one of');

      expect(mockedEmitEvent).not.toHaveBeenCalled();
    });

    it('throws when build does not exist', async () => {
      context.prisma.build.findUnique.mockResolvedValue(null);

      await expect(
        mutationResolver.Mutation.submitTestRun(
          null,
          { buildId: 'build-nonexistent', status: 'PASSED' },
          context
        )
      ).rejects.toThrow('not found');

      expect(mockedEmitEvent).not.toHaveBeenCalled();
    });
  });

  describe('Event payload verification', () => {
    it('all events include eventId (UUID format)', async () => {
      const eventTypes = [
        {
          name: 'BUILD_CREATED',
          resolver: 'createBuild',
          args: { name: 'Test' },
          setup: () => {
            context.prisma.build.create.mockResolvedValue({
              id: 'b1',
              name: 'Test',
              description: null,
              status: 'PENDING',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          },
        },
        {
          name: 'BUILD_STATUS_CHANGED',
          resolver: 'updateBuildStatus',
          args: { id: 'b1', status: 'RUNNING' },
          setup: () => {
            context.prisma.build.findUnique.mockResolvedValue({
              id: 'b1',
              status: 'PENDING',
              name: 'Test',
              description: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            context.prisma.build.update.mockResolvedValue({
              id: 'b1',
              status: 'RUNNING',
              name: 'Test',
              description: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          },
        },
      ];

      for (const eventType of eventTypes) {
        vi.clearAllMocks();
        eventType.setup();

        const resolver = (mutationResolver.Mutation as any)[eventType.resolver];
        await resolver(null, eventType.args, context);

        expect(mockedEmitEvent).toHaveBeenCalledOnce();
        const [_eventName, payload] = mockedEmitEvent.mock.calls[0];

        // Check UUID format (basic check)
        expect(payload.eventId).toBeDefined();
        expect(typeof payload.eventId).toBe('string');
        expect(payload.eventId.length).toBeGreaterThan(0);
      }
    });

    it('all events include sourceLayer as graphql', async () => {
      context.prisma.build.create.mockResolvedValue({
        id: 'b1',
        name: 'Test',
        description: null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await mutationResolver.Mutation.createBuild(
        null,
        { name: 'Test' },
        context
      );

      const [_eventName, payload] = mockedEmitEvent.mock.calls[0];
      expect(payload.sourceLayer).toBe('graphql');
    });

    it('all events include userId from context', async () => {
      context.user.id = 'user-special-456';
      context.prisma.build.create.mockResolvedValue({
        id: 'b1',
        name: 'Test',
        description: null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await mutationResolver.Mutation.createBuild(
        null,
        { name: 'Test' },
        context
      );

      const [_eventName, payload] = mockedEmitEvent.mock.calls[0];
      expect(payload.userId).toBe('user-special-456');
    });
  });
});
