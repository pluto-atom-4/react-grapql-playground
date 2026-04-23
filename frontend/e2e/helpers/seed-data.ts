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
    const createBuildResult = await apiClient.mutation(`
      mutation CreateBuild($input: CreateBuildInput!) {
        createBuild(input: $input) {
          id
          status
        }
      }
    `, {
      input: {
        name: `E2E Test Build ${Date.now()}`,
        description: 'Created by E2E tests for verification',
        metadata: {
          testRun: true,
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (createBuildResult.data?.createBuild?.id) {
      const buildId = createBuildResult.data.createBuild.id;
      testData.buildIds.push(buildId);

      // Create test parts
      for (let i = 0; i < 2; i++) {
        const createPartResult = await apiClient.mutation(`
          mutation CreatePart($input: CreatePartInput!) {
            createPart(input: $input) {
              id
            }
          }
        `, {
          input: {
            buildId,
            name: `Test Part ${i + 1}`,
            description: `Test part created at ${Date.now()}`,
            quantity: Math.floor(Math.random() * 10) + 1,
          },
        });

        if (createPartResult.data?.createPart?.id) {
          testData.partIds.push(createPartResult.data.createPart.id);
        }
      }

      // Create test run
      const createTestRunResult = await apiClient.mutation(`
        mutation CreateTestRun($input: CreateTestRunInput!) {
          createTestRun(input: $input) {
            id
          }
        }
      `, {
        input: {
          buildId,
          name: `Test Run ${Date.now()}`,
          status: 'PENDING',
          testType: 'UNIT',
        },
      });

      if (createTestRunResult.data?.createTestRun?.id) {
        testData.testRunIds.push(createTestRunResult.data.createTestRun.id);
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
export async function cleanupTestData(
  apiClient: GraphQLClient,
  data: SeededTestData
): Promise<void> {
  try {
    // Delete test runs first (FK dependency)
    for (const testRunId of data.testRunIds) {
      try {
        await apiClient.mutation(`
          mutation DeleteTestRun($id: ID!) {
            deleteTestRun(id: $id) {
              success
            }
          }
        `, { id: testRunId });
      } catch (error) {
        console.warn(`Failed to delete test run ${testRunId}:`, error);
      }
    }

    // Delete parts (FK dependency)
    for (const partId of data.partIds) {
      try {
        await apiClient.mutation(`
          mutation DeletePart($id: ID!) {
            deletePart(id: $id) {
              success
            }
          }
        `, { id: partId });
      } catch (error) {
        console.warn(`Failed to delete part ${partId}:`, error);
      }
    }

    // Delete builds last (top-level entity)
    for (const buildId of data.buildIds) {
      try {
        await apiClient.mutation(`
          mutation DeleteBuild($id: ID!) {
            deleteBuild(id: $id) {
              success
            }
          }
        `, { id: buildId });
      } catch (error) {
        console.warn(`Failed to delete build ${buildId}:`, error);
      }
    }
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
  const buildResult = await apiClient.mutation(`
    mutation CreateBuild($input: CreateBuildInput!) {
      createBuild(input: $input) {
        id
      }
    }
  `, {
    input: {
      name: buildName,
      description: `Test build created at ${Date.now()}`,
    },
  });

  const buildId = buildResult.data?.createBuild?.id;
  if (!buildId) {
    throw new Error('Failed to create test build');
  }

  // Create parts
  for (let i = 0; i < partCount; i++) {
    const partResult = await apiClient.mutation(`
      mutation CreatePart($input: CreatePartInput!) {
        createPart(input: $input) {
          id
        }
      }
    `, {
      input: {
        buildId,
        name: `Part ${i + 1}`,
        quantity: i + 1,
      },
    });

    if (partResult.data?.createPart?.id) {
      partIds.push(partResult.data.createPart.id);
    }
  }

  return { buildId, partIds };
}
