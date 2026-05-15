'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useState, useCallback } from 'react';
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
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useBuilds(
  initialPageSize: number = 10,
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);

  // Calculate offset from page and pageSize
  const offset = (page - 1) * pageSize;

  const { data, loading, error, refetch: apolloRefetch } = useQuery<
    { builds: { items: Build[]; totalCount: number; hasNextPage: boolean; hasPreviousPage: boolean } }
  >(BUILDS_QUERY, {
    variables: { limit: pageSize, offset },
  });

  const builds = data?.builds?.items || [];
  const totalCount = data?.builds?.totalCount || 0;
  const hasNextPage = data?.builds?.hasNextPage || false;
  const hasPreviousPage = data?.builds?.hasPreviousPage || false;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Handle page size changes - reset to page 1
  const handleSetPageSize = useCallback((newPageSize: number) => {
    setInternalPageSize(newPageSize);
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber);
    }
  }, [totalPages]);

  return {
    builds,
    loading,
    error,
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    refetch: () => void apolloRefetch(),
    // Pagination controls
    currentPage: page,
    totalPages,
    pageSize: internalPageSize,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    setPageSize: handleSetPageSize,
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
      onError: (error) => {
        // Error is already captured in apolloError state
        console.error('Create build failed:', extractErrorMessage(error));
      },
    }
  );

  return {
    createBuild: async (name: string, description?: string): Promise<Build | undefined> => {
      try {
        const tempId = generateTempId();
        const result = await createBuild({
          variables: { name, description },
          optimisticResponse: {
            createBuild: {
              __typename: 'Build',
              id: tempId,
              name,
              status: BuildStatus.Pending,
              description: description || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              parts: [],
              testRuns: [],
            },
          },
          update(cache, { data }) {
            if (data?.createBuild) {
              cache.modify({
                fields: {
                  builds(existing) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
                    return [data.createBuild, ...existing];
                  },
                },
              });
            }
          },
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
              description: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              parts: [],
              testRuns: [],
            },
          },
          update(cache, { data }) {
            if (data?.updateBuildStatus) {
              cache.modify({
                fields: {
                  builds(existing) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
                    const result = existing.map((b: unknown) => {
                      return (b as Build).id === id ? { ...(b as Build), status } : b;
                    });
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return result;
                  },
                },
              });
            }
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
        const tempId = generateTempId();
        const result = await addPart({
          variables: { buildId, name, sku, quantity },
          optimisticResponse: {
            addPart: {
              __typename: 'Part',
              id: tempId,
              buildId,
              name,
              sku,
              quantity,
              createdAt: new Date().toISOString(),
            },
          },
          update(cache, { data }) {
            if (data?.addPart) {
              cache.modify({
                id: cache.identify({ __typename: 'Build', id: buildId }),
                fields: {
                  build(existing) {
                    const existingAsDetail = existing as Partial<BuildDetail>;
                    return {
                      ...existingAsDetail,
                      parts: [...(existingAsDetail.parts || []), data.addPart],
                    };
                  },
                },
              });
            }
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
        const tempId = generateTempId();
        const response = await submitTestRun({
          variables: { buildId, status, result: testResult, fileUrl },
          optimisticResponse: {
            submitTestRun: {
              __typename: 'TestRun',
              id: tempId,
              buildId,
              status,
              result: testResult || '',
              fileUrl: fileUrl || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              completedAt: null,
            },
          },
          update(cache, { data }) {
            if (data?.submitTestRun) {
              cache.modify({
                id: cache.identify({ __typename: 'Build', id: buildId }),
                fields: {
                  build(existing) {
                    const existingAsDetail = existing as Partial<BuildDetail>;
                    return {
                      ...existingAsDetail,
                      testRuns: [...(existingAsDetail.testRuns || []), data.submitTestRun],
                    };
                  },
                },
              });
            }
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
