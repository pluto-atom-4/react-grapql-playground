/**
 * Mock factory functions for Build, Part, and TestRun objects
 * Used in component tests to ensure proper typing and complete test data
 */

import type { Build, Part, TestRun, BuildStatus, TestStatus } from '@/lib/generated/graphql';

/**
 * Factory function to create mock Build objects for testing
 * Ensures all required properties are present and typed correctly
 */
export function createMockBuild(overrides?: Partial<Build>): Build {
  const now = new Date().toISOString();
  return {
    __typename: 'Build',
    id: '1',
    name: 'Test Build',
    status: 'PENDING' as BuildStatus,
    description: 'A test build',
    parts: [],
    testRuns: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Factory to create mock Part objects
 */
export function createMockPart(overrides?: Partial<Part>): Part {
  const now = new Date().toISOString();
  return {
    __typename: 'Part',
    id: 'part-1',
    buildId: '1',
    name: 'Part A',
    sku: 'SKU-001',
    quantity: 5,
    createdAt: now,
    ...overrides,
  };
}

/**
 * Factory to create mock TestRun objects
 */
export function createMockTestRun(overrides?: Partial<TestRun>): TestRun {
  const now = new Date().toISOString();
  return {
    __typename: 'TestRun',
    id: 'run-1',
    buildId: '1',
    status: 'PASSED' as TestStatus,
    result: 'All tests passed',
    fileUrl: '/uploads/test-report.pdf',
    completedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a complete mock Build with related objects
 */
export function createMockBuildWithRelations(overrides?: Partial<Build>): Build {
  return createMockBuild({
    parts: [createMockPart()],
    testRuns: [createMockTestRun()],
    ...overrides,
  });
}
