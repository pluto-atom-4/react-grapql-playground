'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import {
  BUILDS_QUERY,
  BUILD_DETAIL_QUERY,
  TEST_RUNS_QUERY,
  CREATE_BUILD_MUTATION,
  UPDATE_BUILD_STATUS_MUTATION,
  ADD_PART_MUTATION,
  SUBMIT_TEST_RUN_MUTATION,
} from './graphql-queries';
import { BuildStatus, TestStatus, type Build, type Part, type TestRun } from './generated/graphql';
import { extractErrorMessage } from './graphql-error-handler';
import { generateTempId } from './id-utils';

// Re-export enums for backward compatibility
export { BuildStatus, TestStatus };

// Type definition for Build with details
interface BuildDetail extends Build {
  parts: Part[];
  testRuns: TestRun[];
}

// Hook: Fetch builds with pagination
export function useBuilds(
  limit: number = 10,
  offset: number = 0
): {
  builds: Array<{ id: string; name: string; status: BuildStatus; createdAt: string }>;
  loading: boolean;
  error: unknown;
  refetch: () => void;
} {
  const { data, loading, error, refetch } = useQuery<{ builds: Build[] }>(BUILDS_QUERY, {
    variables: { limit, offset },
  });

  return {
    builds: data?.builds || [],
    loading,
    error,
    refetch: () => void refetch(),
  };
}

// Hook: Fetch single build with details
export function useBuildDetail(buildId: string): {
  build: BuildDetail | undefined;
  loading: boolean;
  error: unknown;
  refetch: () => void;
} {
  const { data, loading, error, refetch } = useQuery<{ build: BuildDetail }>(BUILD_DETAIL_QUERY, {
    variables: { id: buildId },
    skip: !buildId,
  });

  return {
    build: data?.build,
    loading,
    error,
    refetch: () => void refetch(),
  };
}

// Hook: Fetch test runs for a build
export function useTestRuns(buildId: string): {
  testRuns: TestRun[];
  loading: boolean;
  error: unknown;
  refetch: () => void;
} {
  const { data, loading, error, refetch } = useQuery<{ testRuns: TestRun[] }>(TEST_RUNS_QUERY, {
    variables: { buildId },
    skip: !buildId,
  });

  return {
    testRuns: data?.testRuns || [],
    loading,
    error,
    refetch: () => void refetch(),
  };
}

// Hook: Create new build mutation
export function useCreateBuild(): {
  createBuild: (name: string, description?: string) => Promise<Build | undefined>;
  loading: boolean;
  error: string | null;
} {
  const [createBuild, { loading, error: apolloError }] = useMutation<{ createBuild: Build }>(
    CREATE_BUILD_MUTATION,
    {
      optimisticResponse: {
        createBuild: {
          __typename: 'Build',
          id: generateTempId(),
          name: '',
          status: BuildStatus.Pending,
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parts: [],
          testRuns: [],
        },
      },
      refetchQueries: [{ query: BUILDS_QUERY, variables: { limit: 10, offset: 0 } }],
      onError: (error) => {
        // Error is already captured in apolloError state
        console.error('Create build failed:', extractErrorMessage(error));
      },
    }
  );

  return {
    createBuild: async (name: string, description?: string): Promise<Build | undefined> => {
      try {
        const result = await createBuild({
          variables: { name, description },
        });
        return result.data?.createBuild;
      } catch (err) {
        const message = extractErrorMessage(err);
        throw new Error(message);
      }
    },
    loading,
    error: apolloError ? extractErrorMessage(apolloError) : null,
  };
}

// Hook: Update build status mutation
export function useUpdateBuildStatus(): {
  updateStatus: (id: string, status: BuildStatus) => Promise<Build | undefined>;
  loading: boolean;
  error: string | null;
} {
  const [updateStatus, { loading, error: apolloError }] = useMutation<{
    updateBuildStatus: Build;
  }>(UPDATE_BUILD_STATUS_MUTATION, {
    optimisticResponse: {
      updateBuildStatus: {
        __typename: 'Build',
        id: '',
        name: '',
        status: BuildStatus.Pending,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parts: [],
        testRuns: [],
      },
    },
    refetchQueries: [
      { query: BUILDS_QUERY, variables: { limit: 10, offset: 0 } },
      // Note: BUILD_DETAIL_QUERY will be refetched separately when needed
    ],
    onError: (error) => {
      console.error('Update build status failed:', extractErrorMessage(error));
    },
  });

  return {
    updateStatus: async (id: string, status: BuildStatus): Promise<Build | undefined> => {
      try {
        const result = await updateStatus({
          variables: { id, status },
          optimisticResponse: {
            updateBuildStatus: {
              __typename: 'Build',
              id,
              name: '',
              status,
              description: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              parts: [],
              testRuns: [],
            },
          },
        });
        return result.data?.updateBuildStatus;
      } catch (err) {
        const message = extractErrorMessage(err);
        throw new Error(message);
      }
    },
    loading,
    error: apolloError ? extractErrorMessage(apolloError) : null,
  };
}

// Hook: Add part to build mutation
export function useAddPart(): {
  addPart: (
    buildId: string,
    name: string,
    sku: string,
    quantity: number
  ) => Promise<Part | undefined>;
  loading: boolean;
  error: string | null;
} {
  const [addPart, { loading, error: apolloError }] = useMutation<{ addPart: Part }>(
    ADD_PART_MUTATION,
    {
      optimisticResponse: {
        addPart: {
          __typename: 'Part',
          id: generateTempId(),
          buildId: '',
          name: '',
          sku: '',
          quantity: 1,
          createdAt: new Date().toISOString(),
        },
      },
      refetchQueries: [
        // Note: BUILD_DETAIL_QUERY will refetch with specific buildId when component has it
      ],
      onError: (error) => {
        console.error('Add part failed:', extractErrorMessage(error));
      },
    }
  );

  return {
    addPart: async (
      buildId: string,
      name: string,
      sku: string,
      quantity: number
    ): Promise<Part | undefined> => {
      try {
        const result = await addPart({
          variables: { buildId, name, sku, quantity },
          optimisticResponse: {
            addPart: {
              __typename: 'Part',
              id: generateTempId(),
              buildId,
              name,
              sku,
              quantity,
              createdAt: new Date().toISOString(),
            },
          },
        });
        return result.data?.addPart;
      } catch (err) {
        const message = extractErrorMessage(err);
        throw new Error(message);
      }
    },
    loading,
    error: apolloError ? extractErrorMessage(apolloError) : null,
  };
}

// Hook: Submit test run mutation
export function useSubmitTestRun(): {
  submitTestRun: (
    buildId: string,
    status: TestStatus,
    testResult?: string,
    fileUrl?: string
  ) => Promise<TestRun | undefined>;
  loading: boolean;
  error: string | null;
} {
  const [submitTestRun, { loading, error: apolloError }] = useMutation<{
    submitTestRun: TestRun;
  }>(SUBMIT_TEST_RUN_MUTATION, {
    optimisticResponse: {
      submitTestRun: {
        __typename: 'TestRun',
        id: generateTempId(),
        buildId: '',
        status: TestStatus.Pending,
        result: '',
        fileUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      },
    },
    refetchQueries: [
      // Note: BUILD_DETAIL_QUERY will refetch with specific buildId when component has it
    ],
    onError: (error) => {
      console.error('Submit test run failed:', extractErrorMessage(error));
    },
  });

  return {
    submitTestRun: async (
      buildId: string,
      status: TestStatus,
      testResult?: string,
      fileUrl?: string
    ): Promise<TestRun | undefined> => {
      try {
        const response = await submitTestRun({
          variables: { buildId, status, result: testResult, fileUrl },
          optimisticResponse: {
            submitTestRun: {
              __typename: 'TestRun',
              id: generateTempId(),
              buildId,
              status,
              result: testResult || '',
              fileUrl: fileUrl || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              completedAt: null,
            },
          },
        });
        return response.data?.submitTestRun;
      } catch (err) {
        const message = extractErrorMessage(err);
        throw new Error(message);
      }
    },
    loading,
    error: apolloError ? extractErrorMessage(apolloError) : null,
  };
}
