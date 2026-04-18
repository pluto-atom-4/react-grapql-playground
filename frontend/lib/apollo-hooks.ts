'use client'

import { useMutation, useQuery } from '@apollo/client/react'
import {
  BUILDS_QUERY,
  BUILD_DETAIL_QUERY,
  TEST_RUNS_QUERY,
  CREATE_BUILD_MUTATION,
  UPDATE_BUILD_STATUS_MUTATION,
  ADD_PART_MUTATION,
  SUBMIT_TEST_RUN_MUTATION,
} from './graphql-queries'

// Type definitions for GraphQL responses
interface Build {
  id: string
  name: string
  description?: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Part {
  id: string
  buildId: string
  name: string
  sku: string
  quantity: number
  createdAt: string
}

interface TestRun {
  id: string
  buildId: string
  status: string
  result?: string
  fileUrl?: string
  completedAt?: string
  createdAt: string
}

interface BuildDetail extends Build {
  parts: Part[]
  testRuns: TestRun[]
}

// Hook: Fetch builds with pagination
export function useBuilds(limit: number = 10, offset: number = 0): {
  builds: Array<{ id: string; name: string; status: string; createdAt: string }>
  loading: boolean
  error: unknown
  refetch: () => void
} {
  const { data, loading, error, refetch } = useQuery<{ builds: Build[] }>(BUILDS_QUERY, {
    variables: { limit, offset },
  })

  return {
    builds: data?.builds || [],
    loading,
    error,
    refetch: () => void refetch(),
  }
}

// Hook: Fetch single build with details
export function useBuildDetail(buildId: string): {
  build: BuildDetail | undefined
  loading: boolean
  error: unknown
  refetch: () => void
} {
  const { data, loading, error, refetch } = useQuery<{ build: BuildDetail }>(BUILD_DETAIL_QUERY, {
    variables: { id: buildId },
    skip: !buildId,
  })

  return {
    build: data?.build,
    loading,
    error,
    refetch: () => void refetch(),
  }
}

// Hook: Fetch test runs for a build
export function useTestRuns(buildId: string): {
  testRuns: TestRun[]
  loading: boolean
  error: unknown
  refetch: () => void
} {
  const { data, loading, error, refetch } = useQuery<{ testRuns: TestRun[] }>(TEST_RUNS_QUERY, {
    variables: { buildId },
    skip: !buildId,
  })

  return {
    testRuns: data?.testRuns || [],
    loading,
    error,
    refetch: () => void refetch(),
  }
}

// Hook: Create new build mutation
export function useCreateBuild(): {
  createBuild: (name: string, description?: string) => Promise<Build | undefined>
  loading: boolean
  error: unknown
} {
  const [createBuild, { loading, error }] = useMutation<{ createBuild: Build }>(
    CREATE_BUILD_MUTATION,
    {
      refetchQueries: [{ query: BUILDS_QUERY, variables: { limit: 10, offset: 0 } }],
    }
  )

  return {
    createBuild: async (name: string, description?: string): Promise<Build | undefined> => {
      const result = await createBuild({
        variables: { name, description },
      })
      return result.data?.createBuild
    },
    loading,
    error,
  }
}

// Hook: Update build status mutation
export function useUpdateBuildStatus(): {
  updateStatus: (id: string, status: string) => Promise<Build | undefined>
  loading: boolean
  error: unknown
} {
  const [updateStatus, { loading, error }] = useMutation<{ updateBuildStatus: Build }>(
    UPDATE_BUILD_STATUS_MUTATION
  )

  return {
    updateStatus: async (id: string, status: string): Promise<Build | undefined> => {
      const result = await updateStatus({
        variables: { id, status },
      })
      return result.data?.updateBuildStatus
    },
    loading,
    error,
  }
}

// Hook: Add part to build mutation
export function useAddPart(): {
  addPart: (buildId: string, name: string, sku: string, quantity: number) => Promise<Part | undefined>
  loading: boolean
  error: unknown
} {
  const [addPart, { loading, error }] = useMutation<{ addPart: Part }>(ADD_PART_MUTATION)

  return {
    addPart: async (buildId: string, name: string, sku: string, quantity: number): Promise<Part | undefined> => {
      const result = await addPart({
        variables: { buildId, name, sku, quantity },
      })
      return result.data?.addPart
    },
    loading,
    error,
  }
}

// Hook: Submit test run mutation
export function useSubmitTestRun(): {
  submitTestRun: (buildId: string, status: string, testResult?: string, fileUrl?: string) => Promise<TestRun | undefined>
  loading: boolean
  error: unknown
} {
  const [submitTestRun, { loading, error }] = useMutation<{ submitTestRun: TestRun }>(
    SUBMIT_TEST_RUN_MUTATION
  )

  return {
    submitTestRun: async (
      buildId: string,
      status: string,
      testResult?: string,
      fileUrl?: string
    ): Promise<TestRun | undefined> => {
      const response = await submitTestRun({
        variables: { buildId, status, result: testResult, fileUrl },
      })
      return response.data?.submitTestRun
    },
    loading,
    error,
  }
}
