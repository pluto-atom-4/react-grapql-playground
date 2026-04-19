/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment BuildInfo on Build {\n    id\n    name\n    description\n    status\n    createdAt\n    updatedAt\n  }\n": typeof types.BuildInfoFragmentDoc,
    "\n  fragment PartInfo on Part {\n    id\n    buildId\n    name\n    sku\n    quantity\n    createdAt\n  }\n": typeof types.PartInfoFragmentDoc,
    "\n  fragment TestRunInfo on TestRun {\n    id\n    buildId\n    status\n    result\n    fileUrl\n    completedAt\n    createdAt\n  }\n": typeof types.TestRunInfoFragmentDoc,
    "\n  query GetBuilds($limit: Int!, $offset: Int!) {\n    builds(limit: $limit, offset: $offset) {\n      ...BuildInfo\n    }\n  }\n  \n": typeof types.GetBuildsDocument,
    "\n  query GetBuildDetail($id: ID!) {\n    build(id: $id) {\n      ...BuildInfo\n      parts {\n        ...PartInfo\n      }\n      testRuns {\n        ...TestRunInfo\n      }\n    }\n  }\n  \n  \n  \n": typeof types.GetBuildDetailDocument,
    "\n  query GetTestRuns($buildId: ID!) {\n    testRuns(buildId: $buildId) {\n      ...TestRunInfo\n    }\n  }\n  \n": typeof types.GetTestRunsDocument,
    "\n  mutation CreateBuild($name: String!, $description: String) {\n    createBuild(name: $name, description: $description) {\n      ...BuildInfo\n    }\n  }\n  \n": typeof types.CreateBuildDocument,
    "\n  mutation UpdateBuildStatus($id: ID!, $status: BuildStatus!) {\n    updateBuildStatus(id: $id, status: $status) {\n      ...BuildInfo\n    }\n  }\n  \n": typeof types.UpdateBuildStatusDocument,
    "\n  mutation AddPart($buildId: ID!, $name: String!, $sku: String!, $quantity: Int!) {\n    addPart(buildId: $buildId, name: $name, sku: $sku, quantity: $quantity) {\n      ...PartInfo\n    }\n  }\n  \n": typeof types.AddPartDocument,
    "\n  mutation SubmitTestRun($buildId: ID!, $status: TestStatus!, $result: String, $fileUrl: String) {\n    submitTestRun(buildId: $buildId, status: $status, result: $result, fileUrl: $fileUrl) {\n      ...TestRunInfo\n    }\n  }\n  \n": typeof types.SubmitTestRunDocument,
};
const documents: Documents = {
    "\n  fragment BuildInfo on Build {\n    id\n    name\n    description\n    status\n    createdAt\n    updatedAt\n  }\n": types.BuildInfoFragmentDoc,
    "\n  fragment PartInfo on Part {\n    id\n    buildId\n    name\n    sku\n    quantity\n    createdAt\n  }\n": types.PartInfoFragmentDoc,
    "\n  fragment TestRunInfo on TestRun {\n    id\n    buildId\n    status\n    result\n    fileUrl\n    completedAt\n    createdAt\n  }\n": types.TestRunInfoFragmentDoc,
    "\n  query GetBuilds($limit: Int!, $offset: Int!) {\n    builds(limit: $limit, offset: $offset) {\n      ...BuildInfo\n    }\n  }\n  \n": types.GetBuildsDocument,
    "\n  query GetBuildDetail($id: ID!) {\n    build(id: $id) {\n      ...BuildInfo\n      parts {\n        ...PartInfo\n      }\n      testRuns {\n        ...TestRunInfo\n      }\n    }\n  }\n  \n  \n  \n": types.GetBuildDetailDocument,
    "\n  query GetTestRuns($buildId: ID!) {\n    testRuns(buildId: $buildId) {\n      ...TestRunInfo\n    }\n  }\n  \n": types.GetTestRunsDocument,
    "\n  mutation CreateBuild($name: String!, $description: String) {\n    createBuild(name: $name, description: $description) {\n      ...BuildInfo\n    }\n  }\n  \n": types.CreateBuildDocument,
    "\n  mutation UpdateBuildStatus($id: ID!, $status: BuildStatus!) {\n    updateBuildStatus(id: $id, status: $status) {\n      ...BuildInfo\n    }\n  }\n  \n": types.UpdateBuildStatusDocument,
    "\n  mutation AddPart($buildId: ID!, $name: String!, $sku: String!, $quantity: Int!) {\n    addPart(buildId: $buildId, name: $name, sku: $sku, quantity: $quantity) {\n      ...PartInfo\n    }\n  }\n  \n": types.AddPartDocument,
    "\n  mutation SubmitTestRun($buildId: ID!, $status: TestStatus!, $result: String, $fileUrl: String) {\n    submitTestRun(buildId: $buildId, status: $status, result: $result, fileUrl: $fileUrl) {\n      ...TestRunInfo\n    }\n  }\n  \n": types.SubmitTestRunDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment BuildInfo on Build {\n    id\n    name\n    description\n    status\n    createdAt\n    updatedAt\n  }\n"): (typeof documents)["\n  fragment BuildInfo on Build {\n    id\n    name\n    description\n    status\n    createdAt\n    updatedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PartInfo on Part {\n    id\n    buildId\n    name\n    sku\n    quantity\n    createdAt\n  }\n"): (typeof documents)["\n  fragment PartInfo on Part {\n    id\n    buildId\n    name\n    sku\n    quantity\n    createdAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TestRunInfo on TestRun {\n    id\n    buildId\n    status\n    result\n    fileUrl\n    completedAt\n    createdAt\n  }\n"): (typeof documents)["\n  fragment TestRunInfo on TestRun {\n    id\n    buildId\n    status\n    result\n    fileUrl\n    completedAt\n    createdAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetBuilds($limit: Int!, $offset: Int!) {\n    builds(limit: $limit, offset: $offset) {\n      ...BuildInfo\n    }\n  }\n  \n"): (typeof documents)["\n  query GetBuilds($limit: Int!, $offset: Int!) {\n    builds(limit: $limit, offset: $offset) {\n      ...BuildInfo\n    }\n  }\n  \n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetBuildDetail($id: ID!) {\n    build(id: $id) {\n      ...BuildInfo\n      parts {\n        ...PartInfo\n      }\n      testRuns {\n        ...TestRunInfo\n      }\n    }\n  }\n  \n  \n  \n"): (typeof documents)["\n  query GetBuildDetail($id: ID!) {\n    build(id: $id) {\n      ...BuildInfo\n      parts {\n        ...PartInfo\n      }\n      testRuns {\n        ...TestRunInfo\n      }\n    }\n  }\n  \n  \n  \n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTestRuns($buildId: ID!) {\n    testRuns(buildId: $buildId) {\n      ...TestRunInfo\n    }\n  }\n  \n"): (typeof documents)["\n  query GetTestRuns($buildId: ID!) {\n    testRuns(buildId: $buildId) {\n      ...TestRunInfo\n    }\n  }\n  \n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateBuild($name: String!, $description: String) {\n    createBuild(name: $name, description: $description) {\n      ...BuildInfo\n    }\n  }\n  \n"): (typeof documents)["\n  mutation CreateBuild($name: String!, $description: String) {\n    createBuild(name: $name, description: $description) {\n      ...BuildInfo\n    }\n  }\n  \n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateBuildStatus($id: ID!, $status: BuildStatus!) {\n    updateBuildStatus(id: $id, status: $status) {\n      ...BuildInfo\n    }\n  }\n  \n"): (typeof documents)["\n  mutation UpdateBuildStatus($id: ID!, $status: BuildStatus!) {\n    updateBuildStatus(id: $id, status: $status) {\n      ...BuildInfo\n    }\n  }\n  \n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddPart($buildId: ID!, $name: String!, $sku: String!, $quantity: Int!) {\n    addPart(buildId: $buildId, name: $name, sku: $sku, quantity: $quantity) {\n      ...PartInfo\n    }\n  }\n  \n"): (typeof documents)["\n  mutation AddPart($buildId: ID!, $name: String!, $sku: String!, $quantity: Int!) {\n    addPart(buildId: $buildId, name: $name, sku: $sku, quantity: $quantity) {\n      ...PartInfo\n    }\n  }\n  \n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitTestRun($buildId: ID!, $status: TestStatus!, $result: String, $fileUrl: String) {\n    submitTestRun(buildId: $buildId, status: $status, result: $result, fileUrl: $fileUrl) {\n      ...TestRunInfo\n    }\n  }\n  \n"): (typeof documents)["\n  mutation SubmitTestRun($buildId: ID!, $status: TestStatus!, $result: String, $fileUrl: String) {\n    submitTestRun(buildId: $buildId, status: $status, result: $result, fileUrl: $fileUrl) {\n      ...TestRunInfo\n    }\n  }\n  \n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;