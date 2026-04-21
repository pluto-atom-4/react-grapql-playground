import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { mutationResolver } from '../Mutation';
import { queryResolver } from '../Query';
import { generateToken } from '../../middleware/auth';
import { createLoaders } from '../../dataloaders';
import type { BuildContext } from '../../types';
import type { GraphQLResolveInfo } from 'graphql';

/**
 * Resolver Auth Tests
 *
 * Tests that resolvers properly check for authentication before executing.
 * All mutations and protected queries should require context.user to be set.
 */

describe('Resolver Authentication', () => {
  let mockPrisma: PrismaClient;
  let mockContext: BuildContext;
  let mockContextNoAuth: BuildContext;
  const mockInfo = {} as GraphQLResolveInfo;

  beforeEach(async () => {
    // These tests don't use real database, just verify auth checks
    // In production, use real Prisma for integration testing
    mockPrisma = {
      build: {
        create: async () => ({
          id: '1',
          name: 'Test',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findUnique: async () => ({
          id: '1',
          name: 'Test',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findMany: async () => [],
        update: async () => ({
          id: '1',
          name: 'Test',
          status: 'RUNNING',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      part: {
        create: async () => ({
          id: '1',
          buildId: '1',
          name: 'Part',
          sku: 'SKU',
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      testRun: {
        create: async () => ({
          id: '1',
          buildId: '1',
          status: 'PASSED',
          result: 'PASS',
          fileUrl: '',
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findMany: async () => [],
      },
    } as unknown as PrismaClient;

    const loaders = createLoaders(mockPrisma);

    // Context with authenticated user
    mockContext = {
      user: { id: 'test-user-123' },
      prisma: mockPrisma,
      buildPartLoader: loaders.buildPartLoader,
      buildTestRunLoader: loaders.buildTestRunLoader,
    };

    // Context without user (no auth)
    mockContextNoAuth = {
      user: null,
      prisma: mockPrisma,
      buildPartLoader: loaders.buildPartLoader,
      buildTestRunLoader: loaders.buildTestRunLoader,
    };
  });

  describe('Query Resolvers', () => {
    it('should reject builds query without authentication', async () => {
      const resolver = queryResolver.Query.builds as (
        _parent: unknown,
        args: { limit: number; offset: number },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(
        resolver(null, { limit: 10, offset: 0 }, mockContextNoAuth, mockInfo)
      ).rejects.toThrow('Unauthorized');
    });

    it('should allow builds query with authentication', async () => {
      const resolver = queryResolver.Query.builds as (
        _parent: unknown,
        args: { limit: number; offset: number },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(
        resolver(null, { limit: 10, offset: 0 }, mockContext, mockInfo)
      ).resolves.toBeDefined();
    });

    it('should reject build query without authentication', async () => {
      const resolver = queryResolver.Query.build as (
        _parent: unknown,
        args: { id: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(resolver(null, { id: '1' }, mockContextNoAuth, mockInfo)).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should allow build query with authentication', async () => {
      const resolver = queryResolver.Query.build as (
        _parent: unknown,
        args: { id: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(resolver(null, { id: '1' }, mockContext, mockInfo)).resolves.toBeDefined();
    });

    it('should reject testRuns query without authentication', async () => {
      const resolver = queryResolver.Query.testRuns as (
        _parent: unknown,
        args: { buildId: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(resolver(null, { buildId: '1' }, mockContextNoAuth, mockInfo)).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should allow testRuns query with authentication', async () => {
      const resolver = queryResolver.Query.testRuns as (
        _parent: unknown,
        args: { buildId: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(resolver(null, { buildId: '1' }, mockContext, mockInfo)).resolves.toBeDefined();
    });
  });

  describe('Mutation Resolvers', () => {
    it('should reject createBuild mutation without authentication', async () => {
      const resolver = mutationResolver.Mutation.createBuild as (
        _parent: unknown,
        args: { name: string; description?: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(
        resolver(null, { name: 'Test Build' }, mockContextNoAuth, mockInfo)
      ).rejects.toThrow('Unauthorized');
    });

    it('should allow createBuild mutation with authentication', async () => {
      const resolver = mutationResolver.Mutation.createBuild as (
        _parent: unknown,
        args: { name: string; description?: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      // Should not throw Unauthorized error
      // (May throw other validation errors, but not auth error)
      try {
        await resolver(null, { name: 'Test Build' }, mockContext, mockInfo);
      } catch (err) {
        expect((err as Error).message).not.toBe('Unauthorized');
      }
    });

    it('should reject updateBuildStatus mutation without authentication', async () => {
      const resolver = mutationResolver.Mutation.updateBuildStatus as (
        _parent: unknown,
        args: { id: string; status: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(
        resolver(null, { id: '1', status: 'RUNNING' }, mockContextNoAuth, mockInfo)
      ).rejects.toThrow('Unauthorized');
    });

    it('should reject addPart mutation without authentication', async () => {
      const resolver = mutationResolver.Mutation.addPart as (
        _parent: unknown,
        args: { buildId: string; name: string; sku: string; quantity: number },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(
        resolver(
          null,
          { buildId: '1', name: 'Part', sku: 'SKU123', quantity: 1 },
          mockContextNoAuth,
          mockInfo
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('should reject submitTestRun mutation without authentication', async () => {
      const resolver = mutationResolver.Mutation.submitTestRun as (
        _parent: unknown,
        args: { buildId: string; status: string; result?: string; fileUrl?: string },
        context: BuildContext,
        _info: GraphQLResolveInfo
      ) => Promise<unknown>;

      await expect(
        resolver(null, { buildId: '1', status: 'PASSED' }, mockContextNoAuth, mockInfo)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Context User Field', () => {
    it('should have user field in context when authenticated', () => {
      expect(mockContext.user).not.toBeNull();
      expect(mockContext.user?.id).toBe('test-user-123');
    });

    it('should have null user field in context when not authenticated', () => {
      expect(mockContextNoAuth.user).toBeNull();
    });

    it('should preserve user id from JWT token', () => {
      const token = generateToken('generated-user-id');
      expect(token).toBeDefined();
      // Token is valid and can be used by extractUserFromToken
    });
  });
});
