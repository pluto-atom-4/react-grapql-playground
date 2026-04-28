/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /**
   * Boltline Manufacturing Test Workflow GraphQL Schema
   *
   * Domain Model:
   * - Build: Top-level manufacturing item
   * - Part: Components in a Build
   * - TestRun: Test execution results with file references
   */
  DateTime: { input: any; output: any; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  /** JWT token for authentication */
  token: Scalars['String']['output'];
  /** User that authenticated */
  user: AuthUser;
};

export type AuthUser = {
  __typename?: 'AuthUser';
  /** User email address */
  email: Scalars['String']['output'];
  /** User unique identifier */
  id: Scalars['ID']['output'];
};

export type Build = {
  __typename?: 'Build';
  /** Timestamp when build was created */
  createdAt: Scalars['DateTime']['output'];
  /** Optional description */
  description?: Maybe<Scalars['String']['output']>;
  /** Build unique identifier */
  id: Scalars['ID']['output'];
  /** Build name/identifier */
  name: Scalars['String']['output'];
  /** Parts included in this build (batched via DataLoader to prevent N+1) */
  parts: Array<Part>;
  /** Current build status */
  status: BuildStatus;
  /** Test runs for this build (batched via DataLoader to prevent N+1) */
  testRuns: Array<TestRun>;
  /** Timestamp of last update */
  updatedAt: Scalars['DateTime']['output'];
};

export enum BuildStatus {
  Complete = 'COMPLETE',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Running = 'RUNNING'
}

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Add a part to a build.
   *
   * Example:
   *   mutation {
   *     addPart(buildId: "abc123", name: "Valve", sku: "V-001", quantity: 2) {
   *       id
   *       buildId
   *       name
   *       sku
   *     }
   *   }
   */
  addPart: Part;
  /**
   * Create a new build.
   *
   * Example:
   *   mutation {
   *     createBuild(name: "Build-2026-001", description: "Q2 production run") {
   *       id
   *       name
   *       status
   *     }
   *   }
   */
  createBuild: Build;
  /**
   * Authenticate user with email and password.
   * Returns JWT token valid for 24 hours.
   *
   * Example:
   *   mutation {
   *     login(email: "user@example.com", password: "password123") {
   *       token
   *       user { id email }
   *     }
   *   }
   */
  login: AuthPayload;
  /**
   * Submit a test run for a build.
   *
   * fileUrl should point to Express /upload endpoint result.
   * Emits testRunCompleted event to Express event bus for real-time SSE.
   *
   * Example:
   *   mutation {
   *     submitTestRun(buildId: "abc123", status: PASSED, result: "All tests passed", fileUrl: "http://localhost:5000/uploads/test-result.txt") {
   *       id
   *       status
   *       result
   *       completedAt
   *     }
   *   }
   */
  submitTestRun: TestRun;
  /**
   * Update build status.
   *
   * Emits buildStatusChanged event to Express event bus for real-time SSE.
   *
   * Example:
   *   mutation {
   *     updateBuildStatus(id: "abc123", status: RUNNING) {
   *       id
   *       status
   *       updatedAt
   *     }
   *   }
   */
  updateBuildStatus: Build;
};


export type MutationAddPartArgs = {
  buildId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
  sku: Scalars['String']['input'];
};


export type MutationCreateBuildArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationSubmitTestRunArgs = {
  buildId: Scalars['ID']['input'];
  fileUrl?: InputMaybe<Scalars['String']['input']>;
  result?: InputMaybe<Scalars['String']['input']>;
  status: TestStatus;
};


export type MutationUpdateBuildStatusArgs = {
  id: Scalars['ID']['input'];
  status: BuildStatus;
};

export type Part = {
  __typename?: 'Part';
  /** Build this part belongs to */
  buildId: Scalars['ID']['output'];
  /** Timestamp when part was created */
  createdAt: Scalars['DateTime']['output'];
  /** Part unique identifier */
  id: Scalars['ID']['output'];
  /** Part name */
  name: Scalars['String']['output'];
  /** Quantity in build */
  quantity: Scalars['Int']['output'];
  /** Stock keeping unit */
  sku: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  /**
   * Get specific build by ID.
   *
   * Includes all parts and test runs (uses DataLoader for efficiency).
   *
   * Example:
   *   query {
   *     build(id: "abc123") {
   *       id
   *       name
   *       status
   *       parts { id name sku quantity }
   *       testRuns { id status result }
   *     }
   *   }
   */
  build?: Maybe<Build>;
  /**
   * List all builds with pagination.
   *
   * Example:
   *   query {
   *     builds(limit: 10, offset: 0) {
   *       id
   *       name
   *       status
   *       createdAt
   *     }
   *   }
   */
  builds: Array<Build>;
  /**
   * List test runs for a specific build.
   *
   * Example:
   *   query {
   *     testRuns(buildId: "abc123") {
   *       id
   *       status
   *       result
   *       fileUrl
   *     }
   *   }
   */
  testRuns: Array<TestRun>;
};


export type QueryBuildArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBuildsArgs = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
};


export type QueryTestRunsArgs = {
  buildId: Scalars['ID']['input'];
};

export type TestRun = {
  __typename?: 'TestRun';
  /** Build this test run belongs to */
  buildId: Scalars['ID']['output'];
  /** Timestamp when test completed */
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Timestamp when test was created */
  createdAt: Scalars['DateTime']['output'];
  /** URL to test result file (Express backend /upload) */
  fileUrl?: Maybe<Scalars['String']['output']>;
  /** TestRun unique identifier */
  id: Scalars['ID']['output'];
  /** Test result summary */
  result?: Maybe<Scalars['String']['output']>;
  /** Current test status */
  status: TestStatus;
  /** Timestamp of last update */
  updatedAt: Scalars['DateTime']['output'];
};

export enum TestStatus {
  Failed = 'FAILED',
  Passed = 'PASSED',
  Pending = 'PENDING',
  Running = 'RUNNING'
}

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'AuthUser', id: string, email: string } } };

export type BuildInfoFragment = { __typename?: 'Build', id: string, name: string, description?: string | null, status: BuildStatus, createdAt: any, updatedAt: any } & { ' $fragmentName'?: 'BuildInfoFragment' };

export type PartInfoFragment = { __typename?: 'Part', id: string, buildId: string, name: string, sku: string, quantity: number, createdAt: any } & { ' $fragmentName'?: 'PartInfoFragment' };

export type TestRunInfoFragment = { __typename?: 'TestRun', id: string, buildId: string, status: TestStatus, result?: string | null, fileUrl?: string | null, completedAt?: any | null, createdAt: any, updatedAt: any } & { ' $fragmentName'?: 'TestRunInfoFragment' };

export type GetBuildsQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetBuildsQuery = { __typename?: 'Query', builds: Array<(
    { __typename?: 'Build' }
    & { ' $fragmentRefs'?: { 'BuildInfoFragment': BuildInfoFragment } }
  )> };

export type GetBuildDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetBuildDetailQuery = { __typename?: 'Query', build?: (
    { __typename?: 'Build', parts: Array<(
      { __typename?: 'Part' }
      & { ' $fragmentRefs'?: { 'PartInfoFragment': PartInfoFragment } }
    )>, testRuns: Array<(
      { __typename?: 'TestRun' }
      & { ' $fragmentRefs'?: { 'TestRunInfoFragment': TestRunInfoFragment } }
    )> }
    & { ' $fragmentRefs'?: { 'BuildInfoFragment': BuildInfoFragment } }
  ) | null };

export type GetTestRunsQueryVariables = Exact<{
  buildId: Scalars['ID']['input'];
}>;


export type GetTestRunsQuery = { __typename?: 'Query', testRuns: Array<(
    { __typename?: 'TestRun' }
    & { ' $fragmentRefs'?: { 'TestRunInfoFragment': TestRunInfoFragment } }
  )> };

export type CreateBuildMutationVariables = Exact<{
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateBuildMutation = { __typename?: 'Mutation', createBuild: (
    { __typename?: 'Build' }
    & { ' $fragmentRefs'?: { 'BuildInfoFragment': BuildInfoFragment } }
  ) };

export type UpdateBuildStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: BuildStatus;
}>;


export type UpdateBuildStatusMutation = { __typename?: 'Mutation', updateBuildStatus: (
    { __typename?: 'Build' }
    & { ' $fragmentRefs'?: { 'BuildInfoFragment': BuildInfoFragment } }
  ) };

export type AddPartMutationVariables = Exact<{
  buildId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  sku: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
}>;


export type AddPartMutation = { __typename?: 'Mutation', addPart: (
    { __typename?: 'Part' }
    & { ' $fragmentRefs'?: { 'PartInfoFragment': PartInfoFragment } }
  ) };

export type SubmitTestRunMutationVariables = Exact<{
  buildId: Scalars['ID']['input'];
  status: TestStatus;
  result?: InputMaybe<Scalars['String']['input']>;
  fileUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type SubmitTestRunMutation = { __typename?: 'Mutation', submitTestRun: (
    { __typename?: 'TestRun' }
    & { ' $fragmentRefs'?: { 'TestRunInfoFragment': TestRunInfoFragment } }
  ) };

export const BuildInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BuildInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Build"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<BuildInfoFragment, unknown>;
export const PartInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Part"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buildId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<PartInfoFragment, unknown>;
export const TestRunInfoFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestRunInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TestRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buildId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"result"}},{"kind":"Field","name":{"kind":"Name","value":"fileUrl"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<TestRunInfoFragment, unknown>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const GetBuildsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBuilds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"builds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BuildInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BuildInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Build"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetBuildsQuery, GetBuildsQueryVariables>;
export const GetBuildDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBuildDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"build"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BuildInfo"}},{"kind":"Field","name":{"kind":"Name","value":"parts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PartInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"testRuns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestRunInfo"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BuildInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Build"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Part"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buildId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestRunInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TestRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buildId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"result"}},{"kind":"Field","name":{"kind":"Name","value":"fileUrl"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetBuildDetailQuery, GetBuildDetailQueryVariables>;
export const GetTestRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTestRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"buildId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testRuns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"buildId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"buildId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestRunInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestRunInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TestRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buildId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"result"}},{"kind":"Field","name":{"kind":"Name","value":"fileUrl"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetTestRunsQuery, GetTestRunsQueryVariables>;
export const CreateBuildDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateBuild"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBuild"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BuildInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BuildInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Build"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateBuildMutation, CreateBuildMutationVariables>;
export const UpdateBuildStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateBuildStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BuildStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateBuildStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BuildInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BuildInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Build"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateBuildStatusMutation, UpdateBuildStatusMutationVariables>;
export const AddPartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddPart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"buildId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sku"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"quantity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addPart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"buildId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"buildId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"sku"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sku"}}},{"kind":"Argument","name":{"kind":"Name","value":"quantity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"quantity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PartInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PartInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Part"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buildId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<AddPartMutation, AddPartMutationVariables>;
export const SubmitTestRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitTestRun"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"buildId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"result"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitTestRun"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"buildId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"buildId"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"result"},"value":{"kind":"Variable","name":{"kind":"Name","value":"result"}}},{"kind":"Argument","name":{"kind":"Name","value":"fileUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileUrl"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TestRunInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TestRunInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TestRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buildId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"result"}},{"kind":"Field","name":{"kind":"Name","value":"fileUrl"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<SubmitTestRunMutation, SubmitTestRunMutationVariables>;