# GitHub Copilot Configuration

This directory contains Copilot-specific configuration and guidance for this repository.

## Files

### 📋 `copilot-instructions.md`
**Main guidance document** for Copilot sessions in this codebase.

Contains:
- Project overview (React + GraphQL + Express monorepo)
- Build, test, and lint commands
- High-level architecture and communication flows
- Key code conventions and patterns
- Important context about the interview prep nature of this project
- Interview talking points

**Start here** if you're new to the codebase.

### 🔧 `mcp-config.json`
**Machine-readable MCP server configuration**.

Defines four MCP servers:
1. **Playwright** - Browser automation and E2E testing
2. **PostgreSQL** - Database inspection and queries
3. **Git** - Repository analysis and history
4. **API Testing** - GraphQL/REST endpoint testing

Use this to enable MCP servers in your Copilot settings.

### 📚 `MCP_SETUP.md`
**Detailed MCP setup and usage guide**.

For each MCP server, includes:
- What it does and why it's useful
- Enabled capabilities
- Practical use cases
- Configuration details
- Example Copilot requests
- Advanced usage patterns
- Troubleshooting

**Read this** if you want to use MCP servers effectively.

### ⚡ `MCP_QUICK_REF.md`
**Quick reference for common MCP requests**.

One-time setup instructions and a cheat sheet of typical Copilot requests for each MCP server.

Use this as a **quick lookup** when you know what you want to do.

## Quick Start

1. **Read** `copilot-instructions.md` to understand the codebase
2. **Setup services**:
   ```bash
   docker-compose up -d
   pnpm install && pnpm dev
   ```
3. **Enable MCP servers** in your Copilot settings using `mcp-config.json`
4. **Reference** `MCP_QUICK_REF.md` or `MCP_SETUP.md` when asking Copilot for help

## Key Commands

### Development
```bash
pnpm dev                    # Start all services (frontend, Apollo, Express)
pnpm dev:frontend           # Frontend only
pnpm dev:graphql            # Apollo GraphQL only
pnpm dev:express            # Express only
```

### Testing
```bash
pnpm test                   # Run all tests
pnpm test:frontend          # Frontend tests
pnpm test:graphql           # GraphQL resolver tests
pnpm test:express           # Express route tests
```

### Quality
```bash
pnpm lint                   # Check linting
pnpm lint:fix               # Auto-fix linting issues
```

### Database
```bash
docker-compose up -d        # Start PostgreSQL
pnpm migrate                # Run migrations
pnpm seed                   # Populate sample data
```

## Project Structure

```
Frontend (Next.js 16 + React 19 + Apollo Client)
    ↓
    ├→ Apollo GraphQL (Port 4000) — Build, Part, TestRun CRUD
    └→ Express (Port 5000) — File uploads, webhooks, real-time SSE
```

**Domain Model:**
- **Build** - Top-level manufacturing item (status, metadata)
- **Part** - Components in a build
- **TestRun** - Test execution results with file references

## Common Copilot Requests

With MCP servers enabled, you can ask:

```
Test the build dashboard with Playwright
Query the builds table to inspect test data
Show me the git history of the DataLoader implementation
Execute a GraphQL query to fetch builds with nested parts
Simulate a CI/CD webhook result
Debug the N+1 query issue in the resolver
```

See `MCP_QUICK_REF.md` for more examples.

## Architecture Highlights

- **Dual-backend design**: GraphQL for data (CRUD), Express for auxiliary (files, webhooks, real-time)
- **DataLoader pattern**: Batch loading prevents N+1 queries
- **Optimistic updates**: Mutations show instant UI feedback
- **Real-time with SSE**: Server-Sent Events for live status updates
- **Type safety**: End-to-end TypeScript + GraphQL schema

## Related Documentation

- **CLAUDE.md** - Comprehensive development guide and debugging tips
- **DESIGN.md** - Deep dive into dual-backend architecture
- **docs/start-from-here.md** - 7-day interview prep plan and practice schedule
- **docs/version-conflict-free-stack.md** - Tech stack versions and compatibility
- **.claude/about-me.md** - Interview context and candidate background

## Troubleshooting

**Can't connect to database?**
- Ensure Docker container is running: `docker-compose ps`
- Check credentials in `.env.local`

**Services won't start?**
- Clear node_modules: `rm -rf **/node_modules && pnpm install`
- Check port availability: `lsof -i :3000`, `lsof -i :4000`, `lsof -i :5000`

**MCP servers not responding?**
- Verify all services are running: `pnpm dev`
- Check `.github/mcp-config.json` endpoints (localhost:3000, :4000, :5000)
- See `MCP_SETUP.md` troubleshooting section

**Tests failing?**
- Run `pnpm test --reporter=verbose` for detailed output
- Check database is seeded: `pnpm seed`
- Ensure PostgreSQL is running: `docker-compose ps`

---

**Last Updated:** April 16, 2026
