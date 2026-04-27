/**
 * GraphQL Query and Mutation Document Tests
 *
 * Tests the structure, composition, and syntax of all GraphQL query
 * and mutation documents used throughout the application.
 *
 * These tests ensure:
 * - Query documents parse correctly
 * - Fragments are properly composed
 * - Variable types match schema requirements
 * - All required fields are included
 */

import { describe, it, expect } from 'vitest';
import { parse } from 'graphql';
import {
  BUILD_FRAGMENT,
  PART_FRAGMENT,
  TEST_RUN_FRAGMENT,
  BUILDS_QUERY,
  BUILD_DETAIL_QUERY,
  TEST_RUNS_QUERY,
  LOGIN_MUTATION,
  CREATE_BUILD_MUTATION,
  UPDATE_BUILD_STATUS_MUTATION,
  ADD_PART_MUTATION,
  SUBMIT_TEST_RUN_MUTATION,
} from '../graphql-queries';

describe('GraphQL Query and Mutation Documents', () => {
  describe('Fragment Definitions', () => {
    it('should have BUILD_FRAGMENT defined', () => {
      expect(BUILD_FRAGMENT).toBeDefined();
      expect(BUILD_FRAGMENT.kind).toBe('Document');
    });

    it('should have PART_FRAGMENT defined', () => {
      expect(PART_FRAGMENT).toBeDefined();
      expect(PART_FRAGMENT.kind).toBe('Document');
    });

    it('should have TEST_RUN_FRAGMENT defined', () => {
      expect(TEST_RUN_FRAGMENT).toBeDefined();
      expect(TEST_RUN_FRAGMENT.kind).toBe('Document');
    });

    it('BUILD_FRAGMENT should include essential Build fields', () => {
      const fragmentStr = BUILD_FRAGMENT.loc?.source.body || '';
      expect(fragmentStr).toContain('id');
      expect(fragmentStr).toContain('name');
      expect(fragmentStr).toContain('status');
      expect(fragmentStr).toContain('createdAt');
      expect(fragmentStr).toContain('updatedAt');
    });

    it('PART_FRAGMENT should include essential Part fields', () => {
      const fragmentStr = PART_FRAGMENT.loc?.source.body || '';
      expect(fragmentStr).toContain('id');
      expect(fragmentStr).toContain('buildId');
      expect(fragmentStr).toContain('name');
      expect(fragmentStr).toContain('sku');
      expect(fragmentStr).toContain('quantity');
    });

    it('TEST_RUN_FRAGMENT should include essential TestRun fields', () => {
      const fragmentStr = TEST_RUN_FRAGMENT.loc?.source.body || '';
      expect(fragmentStr).toContain('id');
      expect(fragmentStr).toContain('buildId');
      expect(fragmentStr).toContain('status');
      expect(fragmentStr).toContain('result');
      expect(fragmentStr).toContain('fileUrl');
      expect(fragmentStr).toContain('completedAt');
      expect(fragmentStr).toContain('createdAt');
      expect(fragmentStr).toContain('updatedAt');
    });
  });

  describe('Query Documents', () => {
    it('should have BUILDS_QUERY defined', () => {
      expect(BUILDS_QUERY).toBeDefined();
      expect(BUILDS_QUERY.kind).toBe('Document');
    });

    it('should have BUILD_DETAIL_QUERY defined', () => {
      expect(BUILD_DETAIL_QUERY).toBeDefined();
      expect(BUILD_DETAIL_QUERY.kind).toBe('Document');
    });

    it('should have TEST_RUNS_QUERY defined', () => {
      expect(TEST_RUNS_QUERY).toBeDefined();
      expect(TEST_RUNS_QUERY.kind).toBe('Document');
    });

    it('BUILDS_QUERY should be a query operation', () => {
      const queryStr = BUILDS_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('query');
      expect(queryStr).toContain('GetBuilds');
    });

    it('BUILDS_QUERY should accept limit and offset variables', () => {
      const queryStr = BUILDS_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('$limit: Int!');
      expect(queryStr).toContain('$offset: Int!');
    });

    it('BUILD_DETAIL_QUERY should use BUILD_FRAGMENT', () => {
      const queryStr = BUILD_DETAIL_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('...BuildInfo');
    });

    it('BUILD_DETAIL_QUERY should include nested parts and testRuns', () => {
      const queryStr = BUILD_DETAIL_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('parts');
      expect(queryStr).toContain('testRuns');
    });

    it('TEST_RUNS_QUERY should use TEST_RUN_FRAGMENT', () => {
      const queryStr = TEST_RUNS_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('...TestRunInfo');
    });

    it('TEST_RUNS_QUERY should accept buildId variable', () => {
      const queryStr = TEST_RUNS_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('$buildId: ID!');
    });
  });

  describe('Mutation Documents', () => {
    it('should have LOGIN_MUTATION defined', () => {
      expect(LOGIN_MUTATION).toBeDefined();
      expect(LOGIN_MUTATION.kind).toBe('Document');
    });

    it('should have CREATE_BUILD_MUTATION defined', () => {
      expect(CREATE_BUILD_MUTATION).toBeDefined();
      expect(CREATE_BUILD_MUTATION.kind).toBe('Document');
    });

    it('should have UPDATE_BUILD_STATUS_MUTATION defined', () => {
      expect(UPDATE_BUILD_STATUS_MUTATION).toBeDefined();
      expect(UPDATE_BUILD_STATUS_MUTATION.kind).toBe('Document');
    });

    it('should have ADD_PART_MUTATION defined', () => {
      expect(ADD_PART_MUTATION).toBeDefined();
      expect(ADD_PART_MUTATION.kind).toBe('Document');
    });

    it('should have SUBMIT_TEST_RUN_MUTATION defined', () => {
      expect(SUBMIT_TEST_RUN_MUTATION).toBeDefined();
      expect(SUBMIT_TEST_RUN_MUTATION.kind).toBe('Document');
    });

    it('LOGIN_MUTATION should accept email and password variables', () => {
      const mutationStr = LOGIN_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('$email: String!');
      expect(mutationStr).toContain('$password: String!');
    });

    it('CREATE_BUILD_MUTATION should use BUILD_FRAGMENT', () => {
      const mutationStr = CREATE_BUILD_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('...BuildInfo');
    });

    it('UPDATE_BUILD_STATUS_MUTATION should accept id and status variables', () => {
      const mutationStr = UPDATE_BUILD_STATUS_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('$id: ID!');
      expect(mutationStr).toContain('$status: BuildStatus!');
    });

    it('ADD_PART_MUTATION should use PART_FRAGMENT', () => {
      const mutationStr = ADD_PART_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('...PartInfo');
    });

    it('SUBMIT_TEST_RUN_MUTATION should use TEST_RUN_FRAGMENT', () => {
      const mutationStr = SUBMIT_TEST_RUN_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('...TestRunInfo');
    });
  });

  describe('Document Parsing', () => {
    const documents = [
      { name: 'BUILD_FRAGMENT', doc: BUILD_FRAGMENT },
      { name: 'PART_FRAGMENT', doc: PART_FRAGMENT },
      { name: 'TEST_RUN_FRAGMENT', doc: TEST_RUN_FRAGMENT },
      { name: 'BUILDS_QUERY', doc: BUILDS_QUERY },
      { name: 'BUILD_DETAIL_QUERY', doc: BUILD_DETAIL_QUERY },
      { name: 'TEST_RUNS_QUERY', doc: TEST_RUNS_QUERY },
      { name: 'LOGIN_MUTATION', doc: LOGIN_MUTATION },
      { name: 'CREATE_BUILD_MUTATION', doc: CREATE_BUILD_MUTATION },
      { name: 'UPDATE_BUILD_STATUS_MUTATION', doc: UPDATE_BUILD_STATUS_MUTATION },
      { name: 'ADD_PART_MUTATION', doc: ADD_PART_MUTATION },
      { name: 'SUBMIT_TEST_RUN_MUTATION', doc: SUBMIT_TEST_RUN_MUTATION },
    ];

    it.each(documents)('$name should parse correctly', ({ doc }) => {
      expect(() => {
        parse(doc.loc?.source.body || '');
      }).not.toThrow();
    });

    it.each(documents)('$name should have valid GraphQL structure', ({ doc }) => {
      const source = doc.loc?.source.body || '';
      const parsed = parse(source);
      expect(parsed.definitions.length).toBeGreaterThan(0);
    });
  });

  describe('Fragment Composition', () => {
    it('BUILD_DETAIL_QUERY should compose all fragments correctly', () => {
      const queryStr = BUILD_DETAIL_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('...BuildInfo');
      expect(queryStr).toContain('...PartInfo');
      expect(queryStr).toContain('...TestRunInfo');
    });

    it('CREATE_BUILD_MUTATION should reference BUILD_FRAGMENT', () => {
      const mutationStr = CREATE_BUILD_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('...BuildInfo');
    });

    it('ADD_PART_MUTATION should reference PART_FRAGMENT', () => {
      const mutationStr = ADD_PART_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('...PartInfo');
    });

    it('SUBMIT_TEST_RUN_MUTATION should reference TEST_RUN_FRAGMENT', () => {
      const mutationStr = SUBMIT_TEST_RUN_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('...TestRunInfo');
    });
  });

  describe('Variable Requirements', () => {
    it('BUILDS_QUERY requires limit and offset variables', () => {
      const queryStr = BUILDS_QUERY.loc?.source.body || '';
      expect(queryStr).toMatch(/\(\$limit:\s*Int!,\s*\$offset:\s*Int!\)/);
    });

    it('BUILD_DETAIL_QUERY requires id variable', () => {
      const queryStr = BUILD_DETAIL_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('$id: ID!');
    });

    it('TEST_RUNS_QUERY requires buildId variable', () => {
      const queryStr = TEST_RUNS_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('$buildId: ID!');
    });

    it('CREATE_BUILD_MUTATION requires name variable', () => {
      const mutationStr = CREATE_BUILD_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('$name: String!');
    });

    it('UPDATE_BUILD_STATUS_MUTATION requires id and status variables', () => {
      const mutationStr = UPDATE_BUILD_STATUS_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('$id: ID!');
      expect(mutationStr).toContain('$status: BuildStatus!');
    });

    it('ADD_PART_MUTATION requires buildId, name, sku, quantity variables', () => {
      const mutationStr = ADD_PART_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('$buildId: ID!');
      expect(mutationStr).toContain('$name: String!');
      expect(mutationStr).toContain('$sku: String!');
      expect(mutationStr).toContain('$quantity: Int!');
    });

    it('SUBMIT_TEST_RUN_MUTATION requires buildId, status variables', () => {
      const mutationStr = SUBMIT_TEST_RUN_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('$buildId: ID!');
      expect(mutationStr).toContain('$status: TestStatus!');
    });
  });

  describe('No Hardcoded Values', () => {
    const documents = [
      { name: 'BUILDS_QUERY', doc: BUILDS_QUERY },
      { name: 'BUILD_DETAIL_QUERY', doc: BUILD_DETAIL_QUERY },
      { name: 'TEST_RUNS_QUERY', doc: TEST_RUNS_QUERY },
      { name: 'CREATE_BUILD_MUTATION', doc: CREATE_BUILD_MUTATION },
      { name: 'UPDATE_BUILD_STATUS_MUTATION', doc: UPDATE_BUILD_STATUS_MUTATION },
      { name: 'ADD_PART_MUTATION', doc: ADD_PART_MUTATION },
      { name: 'SUBMIT_TEST_RUN_MUTATION', doc: SUBMIT_TEST_RUN_MUTATION },
    ];

    it.each(documents)('$name should use variables, not hardcoded values', ({ doc }) => {
      const source = doc.loc?.source.body || '';
      const parsed = parse(source);

      // Check that all queries have variables defined
      const hasDefinitions = parsed.definitions.some(def => {
        if (def.kind === 'OperationDefinition') {
          return def.variableDefinitions && def.variableDefinitions.length > 0;
        }
        return false;
      });

      expect(hasDefinitions).toBe(true);
    });
  });

  describe('Query Response Types', () => {
    it('BUILDS_QUERY should return array of builds', () => {
      const queryStr = BUILDS_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('builds');
    });

    it('BUILD_DETAIL_QUERY should return single build', () => {
      const queryStr = BUILD_DETAIL_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('build');
      expect(queryStr).not.toContain('builds:'); // Should not be plural
    });

    it('TEST_RUNS_QUERY should return array of test runs', () => {
      const queryStr = TEST_RUNS_QUERY.loc?.source.body || '';
      expect(queryStr).toContain('testRuns');
    });

    it('CREATE_BUILD_MUTATION should return build', () => {
      const mutationStr = CREATE_BUILD_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('createBuild');
    });

    it('UPDATE_BUILD_STATUS_MUTATION should return build', () => {
      const mutationStr = UPDATE_BUILD_STATUS_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('updateBuildStatus');
    });

    it('ADD_PART_MUTATION should return part', () => {
      const mutationStr = ADD_PART_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('addPart');
    });

    it('SUBMIT_TEST_RUN_MUTATION should return test run', () => {
      const mutationStr = SUBMIT_TEST_RUN_MUTATION.loc?.source.body || '';
      expect(mutationStr).toContain('submitTestRun');
    });
  });
});
