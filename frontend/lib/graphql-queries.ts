/**
 * GraphQL Query and Mutation fragments for Build management
 *
 * Used by Apollo Client to fetch builds, parts, test runs
 * and execute mutations to update the GraphQL backend.
 */

import { gql } from '@apollo/client/core'

// Build type fragment (used in multiple queries)
export const BUILD_FRAGMENT = gql`
  fragment BuildInfo on Build {
    id
    name
    description
    status
    createdAt
    updatedAt
  }
`

// Part type fragment
export const PART_FRAGMENT = gql`
  fragment PartInfo on Part {
    id
    buildId
    name
    sku
    quantity
    createdAt
  }
`

// TestRun type fragment
export const TEST_RUN_FRAGMENT = gql`
  fragment TestRunInfo on TestRun {
    id
    buildId
    status
    result
    fileUrl
    completedAt
    createdAt
  }
`

// Query: Get all builds with pagination
export const BUILDS_QUERY = gql`
  query GetBuilds($limit: Int!, $offset: Int!) {
    builds(limit: $limit, offset: $offset) {
      ...BuildInfo
    }
  }
  ${BUILD_FRAGMENT}
`

// Query: Get single build with parts and test runs
export const BUILD_DETAIL_QUERY = gql`
  query GetBuildDetail($id: ID!) {
    build(id: $id) {
      ...BuildInfo
      parts {
        ...PartInfo
      }
      testRuns {
        ...TestRunInfo
      }
    }
  }
  ${BUILD_FRAGMENT}
  ${PART_FRAGMENT}
  ${TEST_RUN_FRAGMENT}
`

// Query: Get test runs for a build
export const TEST_RUNS_QUERY = gql`
  query GetTestRuns($buildId: ID!) {
    testRuns(buildId: $buildId) {
      ...TestRunInfo
    }
  }
  ${TEST_RUN_FRAGMENT}
`

// Mutation: Create new build
export const CREATE_BUILD_MUTATION = gql`
  mutation CreateBuild($name: String!, $description: String) {
    createBuild(name: $name, description: $description) {
      ...BuildInfo
    }
  }
  ${BUILD_FRAGMENT}
`

// Mutation: Update build status
export const UPDATE_BUILD_STATUS_MUTATION = gql`
  mutation UpdateBuildStatus($id: ID!, $status: BuildStatus!) {
    updateBuildStatus(id: $id, status: $status) {
      ...BuildInfo
    }
  }
  ${BUILD_FRAGMENT}
`

// Mutation: Add part to build
export const ADD_PART_MUTATION = gql`
  mutation AddPart($buildId: ID!, $name: String!, $sku: String!, $quantity: Int!) {
    addPart(buildId: $buildId, name: $name, sku: $sku, quantity: $quantity) {
      ...PartInfo
    }
  }
  ${PART_FRAGMENT}
`

// Mutation: Submit test run result
export const SUBMIT_TEST_RUN_MUTATION = gql`
  mutation SubmitTestRun($buildId: ID!, $status: TestStatus!, $result: String, $fileUrl: String) {
    submitTestRun(buildId: $buildId, status: $status, result: $result, fileUrl: $fileUrl) {
      ...TestRunInfo
    }
  }
  ${TEST_RUN_FRAGMENT}
`
