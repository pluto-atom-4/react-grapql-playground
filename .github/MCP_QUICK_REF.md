# MCP Quick Reference

## Setup (One-time)

```bash
docker-compose up -d              # Start PostgreSQL
pnpm install                       # Install dependencies
pnpm dev                          # Start frontend, Apollo, Express
# Enable MCP servers in Copilot settings (see MCP_SETUP.md)
```

## Common MCP Requests

### Playwright - E2E Testing

```
Test the build dashboard loads correctly with Playwright
Test the file upload feature end-to-end
Verify the real-time SSE updates work in the browser
Take a screenshot of the build detail page
```

### PostgreSQL - Database Queries

```
Show me all builds in the database
Query builds with status = 'PENDING'
Find parts that belong to build ID 'abc123'
Check if the test_runs table has any orphaned records
Show me the schema of the builds table
```

### Git - Code History

```
Show the git history of the DataLoader implementation
Who modified the Build resolver and when?
What was the first commit that added file upload support?
Show me commits that touched the Apollo schema
```

### API Testing - GraphQL & REST

```
Execute a GraphQL query to fetch all builds with nested parts
Test the updateBuildStatus mutation
POST a test file to the /upload endpoint
Simulate a CI/CD webhook result
Show me the resolver execution time for nested queries
```

## Files Reference

- **`.github/copilot-instructions.md`** - Main development guide (you are here)
- **`.github/mcp-config.json`** - MCP server configuration (JSON)
- **`.github/MCP_SETUP.md`** - Detailed MCP setup and usage guide
- **`CLAUDE.md`** - Comprehensive development and debugging tips
- **`DESIGN.md`** - Architecture deep dive
- **`docs/start-from-here.md`** - 7-day interview prep plan
