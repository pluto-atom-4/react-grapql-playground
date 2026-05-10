# MCP Server Setup Guide

This repository is configured with four MCP (Model Context Protocol) servers to enhance Copilot's capabilities across different layers of the full-stack application.

## Quick Start

1. **Ensure all services are running:**
   ```bash
   docker-compose up -d          # Start PostgreSQL
   pnpm dev                       # Start all services (frontend, Apollo, Express)
   ```

2. **Enable MCP servers in your Copilot settings** (see configuration below)

3. **Start asking Copilot to work with these tools:**
   - "Test the build dashboard with Playwright"
   - "Query the builds table to check test data"
   - "Show me the git history of the resolvers"
   - "Execute a GraphQL query to fetch builds with nested parts"

---

## MCP Server Configurations

### 1. **Playwright MCP** - Browser Automation & E2E Testing

**Purpose:** Automate browser interactions to test the React frontend and full-stack integration flows.

**Enabled Capabilities:**
- Navigate to pages and verify content
- Fill forms and submit mutations
- Assert on DOM elements and styles
- Capture screenshots for debugging
- Monitor network requests and responses
- Measure performance metrics

**Use Cases:**
- Test the build dashboard: load data, verify filtering, pagination
- Test file upload: upload a test report and verify UI feedback
- Test real-time updates: simulate SSE events and verify frontend reactivity
- Verify error handling: test invalid mutations and error messages
- Visual regression testing: capture and compare screenshots

**Configuration:**
```json
{
  "headless": true,
  "viewport": { "width": 1280, "height": 720 },
  "timeout": 30000
}
```

**Example Copilot Request:**
```
Test the build status mutation with Playwright:
1. Navigate to http://localhost:3000/builds/123
2. Find the status update button
3. Click it and verify optimistic update shows instantly
4. Take a screenshot after mutation completes
```

---

### 2. **PostgreSQL MCP** - Database Inspection & Query Execution

**Purpose:** Inspect database schema, query data, and validate migrations without manual psql access.

**Enabled Capabilities:**
- List tables and inspect schema
- Execute SELECT queries for data inspection
- Analyze table relationships (foreign keys)
- Check migration status
- Validate data integrity

**Use Cases:**
- Inspect `builds`, `parts`, `testRuns` tables during development
- Query test data: "Show me all builds with status PENDING"
- Debug N+1 query issues by analyzing resolver queries
- Validate seed data populated correctly
- Check for orphaned records after mutations
- Verify indexes and column types

**Configuration:**
```json
{
  "connectionString": "postgresql://user:password@localhost:5432/boltline",
  "timeout": 5000,
  "maxConnections": 5
}
```

**Example Copilot Request:**
```
Query the database:
1. Show me all tables and their structure
2. Count the number of builds with status = 'COMPLETE'
3. Find all parts that belong to build_id = 'build-123'
4. Show recent test run results
```

---

### 3. **Git MCP** - Repository Analysis & History Inspection

**Purpose:** Analyze git history, trace feature development, and investigate code origins without CLI.

**Enabled Capabilities:**
- View commit history with messages and authors
- Analyze branch structure
- Use git blame to find code origins
- Compare differences between branches/commits
- Inspect tags and releases

**Use Cases:**
- Understand codebase evolution: "Show commits that modified the DataLoader pattern"
- Trace a feature: "What was added to resolvers in the last 10 commits?"
- Investigate a bug: "Who modified the TestRun resolver and when?"
- Review patterns: "Compare the current resolver style with 5 commits ago"
- Understand decisions: "Show me commits that touched the dual-backend architecture"

**Configuration:**
```json
{
  "depth": 100,
  "includeRemotes": true
}
```

**Example Copilot Request:**
```
Analyze git history:
1. Show the last 20 commits affecting backend-graphql/src/resolvers
2. Use git blame on the DataLoader implementation
3. What was the first commit that added the Express event bus?
4. Compare the current schema.graphql with the version from 5 commits ago
```

---

### 4. **API Testing MCP** - GraphQL & REST Endpoint Testing

**Purpose:** Test GraphQL queries/mutations and Express routes without manual curl/Postman.

**Enabled Capabilities:**
- Execute GraphQL queries and mutations
- Validate schema and response types
- Test Express REST endpoints
- Mock responses for testing
- Simulate webhook payloads

**Use Cases:**
- Test GraphQL queries: "Query all builds with their nested parts and test runs"
- Test mutations: "Create a new build and verify the response includes the correct fields"
- Test file upload: "POST a test report to /upload and verify the fileId"
- Test webhooks: "Simulate a CI/CD webhook and verify the build status updates"
- Test real-time: "Trigger a mutation and verify the SSE event is emitted"
- Debug resolver issues: "Execute a query and show me the resolver execution time"

**Configuration:**
```json
{
  "graphqlEndpoint": "http://localhost:4000/graphql",
  "expressEndpoint": "http://localhost:5000",
  "timeout": 10000,
  "retries": 2
}
```

**Example Copilot Request:**
```
Test GraphQL API:
1. Query all builds with their status and nested parts
2. Execute a mutation to update build status to COMPLETE
3. POST a file upload and capture the fileId
4. Simulate a webhook: POST ci-results with buildId=123, status=PASSED
5. Show me resolver execution time for the nested parts query
```

---

## Integration with Copilot

### Enabling MCP Servers

Add the MCP configuration to your Copilot/Claude settings:

**For Claude.ai (Web):**
1. Go to Settings → Developer
2. Enable "Developer Mode"
3. Add MCP servers from `.github/mcp-config.json`

**For VS Code / IDE Extensions:**
Check your IDE's Copilot extension settings and add custom MCP servers.

**For Cursor:**
Create or update `.cursor/mcp.json` with the configuration from `.github/mcp-config.json`.

### Using MCP in Requests

When asking Copilot for help, you can explicitly invoke MCP capabilities:

```
Use Playwright to test [scenario]
Use PostgreSQL to query [data]
Use Git to analyze [code pattern]
Use API Testing to verify [endpoint]
```

Or let Copilot choose automatically:
```
Test that the file upload mutation works end-to-end
Debug why the nested parts query is slow
```

---

## Troubleshooting

### PostgreSQL Connection Fails
- Ensure Docker container is running: `docker-compose ps`
- Check credentials in `.env.local` match `docker-compose.yml`
- Verify POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB are set

### Playwright Tests Timeout
- Increase `timeout` in mcp-config.json if services are slow
- Ensure frontend is running on http://localhost:3000
- Check browser logs for JavaScript errors

### API Testing Returns 404
- Verify all three services are running: `pnpm dev`
- Check that Apollo is on :4000 and Express is on :5000
- Update endpoint URLs if running on different ports

### Git Commands Return No Results
- Ensure repository is initialized: `git status`
- Check you have commit history: `git log --oneline | head`
- Verify you're in the repository root

---

## Advanced Usage

### Combining Multiple MCPs

Copilot can chain MCP calls to debug complex issues:

```
I'm getting an N+1 query issue in the builds resolver.
1. Use Git to show when this was introduced
2. Use PostgreSQL to show the slow query
3. Use API Testing to reproduce the issue
4. Suggest a fix using DataLoader
```

### Creating Test Scenarios

Use multiple MCPs to create end-to-end test scenarios:

```
Create a Playwright test that:
1. Navigates to the builds dashboard
2. Uses PostgreSQL to seed 10 builds
3. Verifies the dashboard loads all builds
4. Uses API Testing to simulate a real-time status update
5. Captures before/after screenshots
```

### Debugging Production Issues

When investigating a bug:

```
I suspect the build status mutation is cached incorrectly.
1. Use Git blame to find who modified the Apollo cache update logic
2. Use API Testing to reproduce the issue with a mutation
3. Use Playwright to test the UI behavior after mutation
4. Suggest how to fix the cache invalidation
```

---

## Related Documentation

- **copilot-instructions.md** - General project guidance for Copilot
- **CLAUDE.md** - Comprehensive development and debugging tips
- **DESIGN.md** - Architecture and patterns documentation
- **.github/mcp-config.json** - MCP configuration (source of truth)
