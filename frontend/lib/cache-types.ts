/**
 * Shared Cache Type Definitions
 *
 * Type definitions for Apollo cache data structures used across the frontend.
 * These types represent the shape of GraphQL objects when stored in Apollo cache.
 *
 * Usage:
 * ```typescript
 * import { BuildNode, PartNode, TestRunNode } from '@/lib/cache-types';
 * import type { GetBuildsResult, GetBuildDetailResult } from '@/lib/cache-types';
 * ```
 */
import { BuildStatus, TestStatus } from './apollo-hooks';
// ============================================================================
// GraphQL Object Types - Base Structures
// ============================================================================
/**
 * Build object structure from GraphQL
 *
 * Represents a manufacturing build with status, description, and timestamps.
 * Stored in Apollo cache with __typename: 'Build'.
 */
export interface BuildNode {
  __typename: 'Build';
  id: string;
  name: string;
  status: BuildStatus;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
/**
 * Part object structure from GraphQL
 *
 * Represents a component used in a build with SKU and quantity.
 * Stored in Apollo cache with __typename: 'Part'.
 */
export interface PartNode {
  __typename: 'Part';
  id: string;
  name: string;
  sku: string;
  quantity?: number;
  buildId?: string;
  createdAt?: string;
}
/**
 * TestRun object structure from GraphQL
 *
 * Represents a test execution result with status and file reference.
 * Stored in Apollo cache with __typename: 'TestRun'.
 */
export interface TestRunNode {
  __typename: 'TestRun';
  id: string;
  status: TestStatus;
  result: string;
  fileUrl?: string;
  buildId?: string;
  submittedAt?: string;
  completedAt?: string | null;
}
// ============================================================================
// Query Result Types - Cache Query Responses
// ============================================================================
/**
 * Query result for GetBuilds query
 *
 * Cache structure for queries that fetch a list of builds.
 * Example query:
 * ```graphql
 * query GetBuilds {
 *   builds { id name status }
 * }
 * ```
 */
export interface GetBuildsResult {
  builds: BuildNode[];
}
/**
 * Query result for GetBuildDetail query
 *
 * Cache structure for queries fetching a single build with nested relations.
 * Example query:
 * ```graphql
 * query GetBuildDetail($id: ID!) {
 *   build(id: $id) {
 *     id name status
 *     parts { id name sku }
 *     testRuns { id status result }
 *   }
 * }
 * ```
 */
export interface GetBuildDetailResult {
  build: BuildNode & {
    parts: PartNode[];
    testRuns: TestRunNode[];
  };
}
/**
 * Query result for paginated builds query
 *
 * Cache structure for paginated build lists with cursor info.
 */
export interface GetBuildsPageResult {
  builds: {
    nodes: BuildNode[];
    pageInfo: {
      hasNextPage: boolean;
      cursor: string;
    };
  };
}
/**
 * Query result for TestRuns query
 *
 * Cache structure for queries fetching test runs for a build.
 */
export interface GetTestRunsResult {
  testRuns: TestRunNode[];
}
/**
 * Query result for Parts query
 *
 * Cache structure for queries fetching parts for a build.
 */
export interface GetPartsResult {
  parts: PartNode[];
}
// ============================================================================
// Mutation Response Types
// ============================================================================
/**
 * Response type for create/update build mutations
 */
export interface CreateBuildResponse {
  createBuild: BuildNode;
}
/**
 * Response type for status update mutations
 */
export interface UpdateBuildStatusResponse {
  updateBuildStatus: BuildNode;
}
/**
 * Response type for add part mutations
 */
export interface AddPartResponse {
  addPart: PartNode;
}
/**
 * Response type for submit test run mutations
 */
export interface SubmitTestRunResponse {
  submitTestRun: TestRunNode;
}
// ============================================================================
// Utility Types
// ============================================================================
/**
 * Cache entry for a single build by ID
 */
export interface BuildCacheEntry {
  build: BuildNode;
}
/**
 * Cache entry for build with nested relations
 */
export interface BuildDetailCacheEntry {
  build: BuildNode & {
    parts: PartNode[];
    testRuns: TestRunNode[];
  };
}
/**
 * Generic cache response wrapper
 */
export type CacheResponse<T> = T | null | undefined;
/**
 * Build state shorthand
 */
export type BuildState = {
  id: string;
  status: BuildStatus;
  name: string;
};
/**
 * Part state shorthand
 */
export type PartState = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
};
/**
 * TestRun state shorthand
 */
export type TestRunState = {
  id: string;
  status: TestStatus;
  result: string;
  fileUrl?: string;
};
