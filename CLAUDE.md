# CLAUDE.md

Full-stack React/GraphQL playground for Stoke Space interview prep.

**Quick Links**: [DESIGN.md](./DESIGN.md) (architecture) | [AGENTS.md](./AGENTS.md) (orchestration) | [.claude/settings.json](./.claude/settings.json) (config) | [docs/start-from-here.md](./docs/start-from-here.md) (roadmap)

## Tech Stack & Build System

**Language**: TypeScript (strict mode)  
**Frontend**: React 18, Apollo Client  
**Backend**: GraphQL (Apollo Server 4), Express.js  
**Database**: PostgreSQL (via Prisma ORM)  
**Package Manager**: pnpm  
**Quality**: ESLint v9, Prettier, Vitest (unit + integration)  
**Containers**: Docker + Docker Compose

## Quick Start

```bash
pnpm install && docker-compose up -d && pnpm migrate && pnpm dev
```

**Services**: Frontend (3000) | GraphQL (4000) | Express (5000)

## Commands

| Task | Command |
|------|---------|
| Dev | `pnpm dev` or `pnpm dev:{frontend,graphql,express}` |
| Test | `pnpm test --run` or `pnpm test:{frontend,graphql,express} --run` |
| Quality | `pnpm lint && pnpm type-check` |
| Database | `pnpm migrate` / `pnpm migrate:reset` / `pnpm seed` |

## Execution Modes

**Auto-Safe** (no prompt needed):
- `pnpm lint`, `pnpm type-check`, `pnpm test --run`
- `.claude/settings.json` allowlist applies

**Interactive** (always prompt):
- Destructive: `pnpm migrate:reset`, `git reset`, file deletes
- Multi-file refactors across packages
- Breaking API changes

**Claude Code**: Deep refactoring, complex reasoning, test-driven dev (local)  
**GitHub Copilot**: Real-time completions, single-file edits, inline suggestions

## Debugging

- **GraphQL**: http://localhost:4000/graphql (GraphiQL)
- **Events**: `curl -N http://localhost:5000/events` (SSE)
- **Database**: `psql postgres://user:pass@localhost:5432/boltline`
- **Express**: `DEBUG=express:* pnpm dev:express`
- **Apollo DevTools**: Browser extension

## Pre-Commit Verification

```bash
# Services running?
docker ps | grep -E "postgres|redis"

# Quality gates pass?
pnpm lint && pnpm type-check && pnpm test --run
```

**Hook** (automatic, advisory): `.claude/hooks/claude-pre-bash.sh` runs as a Claude Code `PreToolUse` hook on the Bash tool. When it detects a `git commit`, it type-checks *only the staged* `.ts`/`.tsx` files and prints any errors. It **never blocks the commit** — it exits 1 (warn) at worst, never 2 (deny), and fails open on any infrastructure problem. Every invocation is logged to `.claude/hooks/.gate.log` (gitignored) as `timestamp | command | decision | reason`.

It only gates commits made *through Claude Code's Bash tool*; a commit from a terminal or IDE bypasses it entirely. Real enforcement belongs in CI (#9). Config: `.claude/settings.json` → `hooks.PreToolUse`. Tests: `bash .claude/hooks/__tests__/claude-pre-bash.test.sh`.

## AI Tool Configuration

| Tool | Type | Purpose | Config | Test |
|------|------|---------|--------|------|
| `better-code-review-graph` | Global MCP server | Code review graph indexing; queries for context-aware analysis (issue #357) | Registered in `~/.claude/settings.json` as global stdio server; database at `.code-review-graph/graph.db` | `.code-review-graph/.gitignore` handles self-exclusion |
| `.husky/post-checkout` | Git hook | Auto-rebuild code review graph on branch changes (non-fatal) | Runs via Husky prepare script; guarded by tool availability check | Excluded from quality gates (infra/tooling) |
| `.claude/hooks/graph-review-advisory.sh` | PreToolUse advisory | Suggests querying code review graph before wide Grep/Glob scans (issue #357) | Wired to `.claude/settings.json` → `hooks.PreToolUse` with matcher `Grep\|Glob` | `bash .claude/hooks/__tests__/graph-review-advisory.test.sh` |

## Considered and Declined for Issue #357

The following were evaluated but intentionally not added to keep scope tight:

- **Graphify** (PyPI `graphify-cli`): Unrelated package; no real install/integration path.
- **Base `code-review-graph` tool**: Superseded by `better-code-review-graph` (v3.24.0+) which is more actively maintained.
- **`cc-start` alias**: No alias convention established in this repo; can be added per-user if desired.
- **`CRG_DATABASE_PATH` env var**: Tool self-manages its database location (`.code-review-graph/graph.db`); explicit override not required for standard workflows.

## Session Persistence Pattern

**On session close**: Append non-obvious insights to this file to preserve context for the next session. This is a manual convention, not an automated script.

Example: if debugging revealed a subtle TypeScript pattern, document it here so next Claude Code session inherits the discovery.

---

**Last Updated**: 2026-09-06 (Issue #357: better-code-review-graph MCP server + Husky + advisory PreToolUse hook)
