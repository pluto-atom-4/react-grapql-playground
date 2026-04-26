/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { GraphQLClient } from './api-client';

/**
 * Test data that can be seeded
 */
export interface SeededTestData {
  buildIds: string[];
  partIds: string[];
  testRunIds: string[];
}

/**
 * Seed test data for E2E tests via GraphQL mutations
 */
export async function seedTestData(apiClient: GraphQLClient): Promise<SeededTestData> {
  const testData: SeededTestData = {
    buildIds: [],
    partIds: [],
    testRunIds: [],
  };

  try {
    // Create test build
    const createBuildResult = await apiClient.mutation(
      `
      mutation CreateBuild($name: String!, $description: String) {
        createBuild(name: $name, description: $description) {
          id
          status
        }
      }
    `,
      {
        name: `E2E Test Build ${Date.now()}`,
        description: 'Created by E2E tests for verification',
      }
    );

    if (createBuildResult.data?.createBuild?.id) {
      const buildId = createBuildResult.data.createBuild.id;
      testData.buildIds.push(buildId);

      // Create test parts
      for (let i = 0; i < 2; i++) {
        const createPartResult = await apiClient.mutation(
          `
          mutation AddPart($buildId: ID!, $name: String!, $sku: String!, $quantity: Int!) {
            addPart(buildId: $buildId, name: $name, sku: $sku, quantity: $quantity) {
              id
            }
          }
        `,
          {
            buildId,
            name: `Test Part ${i + 1}`,
            sku: `SKU-${Date.now()}-${i}`,
            quantity: Math.floor(Math.random() * 10) + 1,
          }
        );

        if (createPartResult.data?.addPart?.id) {
          testData.partIds.push(createPartResult.data.addPart.id);
        }
      }

      // Create test run
      const createTestRunResult = await apiClient.mutation(
        `
        mutation SubmitTestRun($buildId: ID!, $status: TestStatus!, $result: String) {
          submitTestRun(buildId: $buildId, status: $status, result: $result) {
            id
          }
        }
      `,
        {
          buildId,
          status: 'PASSED',
          result: `Test run completed at ${Date.now()}`,
        }
      );

      if (createTestRunResult.data?.submitTestRun?.id) {
        testData.testRunIds.push(createTestRunResult.data.submitTestRun.id);
      }
    }
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }

  return testData;
}

/**
 * Clean up test data created during E2E tests via GraphQL mutations
 */
export function cleanupTestData(
  _apiClient: GraphQLClient,
  data: SeededTestData
): void {
  try {
    // Note: Apollo GraphQL backend doesn't have delete mutations implemented
    // Test cleanup would require database-level cleanup
    // For now, just log that cleanup was requested
    console.log('Cleanup requested for test data:', {
      builds: data.buildIds,
      parts: data.partIds,
      testRuns: data.testRunIds,
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

/**
 * Seed a single build with parts and test runs
 */
export async function seedBuildWithParts(
  apiClient: GraphQLClient,
  buildName: string,
  partCount = 3
): Promise<{ buildId: string; partIds: string[] }> {
  const partIds: string[] = [];

  // Create build
  const buildResult = await apiClient.mutation(
    `
    mutation CreateBuild($name: String!, $description: String) {
      createBuild(name: $name, description: $description) {
        id
      }
    }
  `,
    {
      name: buildName,
      description: `Test build created at ${Date.now()}`,
    }
  );

  const buildId = buildResult.data?.createBuild?.id;
  if (!buildId) {
    throw new Error('Failed to create test build');
  }

  // Create parts
  for (let i = 0; i < partCount; i++) {
    const partResult = await apiClient.mutation(
      `
      mutation AddPart($buildId: ID!, $name: String!, $sku: String!, $quantity: Int!) {
        addPart(buildId: $buildId, name: $name, sku: $sku, quantity: $quantity) {
          id
        }
      }
    `,
      {
        buildId,
        name: `Part ${i + 1}`,
        sku: `SKU-${buildId}-${i}`,
        quantity: i + 1,
      }
    );

    if (partResult.data?.addPart?.id) {
      partIds.push(partResult.data.addPart.id);
    }
  }

  return { buildId, partIds };
}
