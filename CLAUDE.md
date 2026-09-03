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

## Session Persistence Pattern

**On session close**: Append non-obvious insights to this file to preserve context for the next session. This is a manual convention, not an automated script.

Example: if debugging revealed a subtle TypeScript pattern, document it here so next Claude Code session inherits the discovery.

---

**Last Updated**: 2026-08-30 (Phase 1: Execution modes + session hook pattern added)
