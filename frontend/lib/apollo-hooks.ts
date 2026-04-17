'use client'

import { useMutation, useQuery } from '@apollo/client'
import {
  BUILDS_QUERY,
  BUILD_DETAIL_QUERY,
  TEST_RUNS_QUERY,
  CREATE_BUILD_MUTATION,
  UPDATE_BUILD_STATUS_MUTATION,
  ADD_PART_MUTATION,
  SUBMIT_TEST_RUN_MUTATION,
} from './graphql-queries'

// Hook: Fetch builds with pagination
export function useBuilds(limit: number = 10, offset: number = 0) {
  const { data, loading, error, refetch } = useQuery(BUILDS_QUERY, {
    variables: { limit, offset },
  })

  return {
    builds: data?.builds || [],
    loading,
    error,
    refetch,
  }
}

// Hook: Fetch single build with details
export function useBuildDetail(buildId: string) {
  const { data, loading, error, refetch } = useQuery(BUILD_DETAIL_QUERY, {
    variables: { id: buildId },
    skip: !buildId,
  })

  return {
    build: data?.build,
    loading,
    error,
    refetch,
  }
}

// Hook: Fetch test runs for a build
export function useTestRuns(buildId: string) {
  const { data, loading, error, refetch } = useQuery(TEST_RUNS_QUERY, {
    variables: { buildId },
    skip: !buildId,
  })

  return {
    testRuns: data?.testRuns || [],
    loading,
    error,
    refetch,
  }
}

// Hook: Create new build mutation
export function useCreateBuild() {
  const [createBuild, { loading, error }] = useMutation(CREATE_BUILD_MUTATION, {
    refetchQueries: [{ query: BUILDS_QUERY, variables: { limit: 10, offset: 0 } }],
  })

  return {
    createBuild: async (name: string, description?: string) => {
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
export function useUpdateBuildStatus() {
  const [updateStatus, { loading, error }] = useMutation(UPDATE_BUILD_STATUS_MUTATION)

  return {
    updateStatus: async (id: string, status: string) => {
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
export function useAddPart() {
  const [addPart, { loading, error }] = useMutation(ADD_PART_MUTATION)

  return {
    addPart: async (buildId: string, name: string, sku: string, quantity: number) => {
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
export function useSubmitTestRun() {
  const [submitTestRun, { loading, error }] = useMutation(SUBMIT_TEST_RUN_MUTATION)

  return {
    submitTestRun: async (
      buildId: string,
      status: string,
      testResult?: string,
      fileUrl?: string
    ) => {
      const response = await submitTestRun({
        variables: { buildId, status, result: testResult, fileUrl },
      })
      return response.data?.submitTestRun
    },
    loading,
    error,
  }
}
