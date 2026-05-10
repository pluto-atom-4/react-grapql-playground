# Documentation File Location Policy

## Overview
This policy ensures all project documentation is consistently organized in the `docs/` subdirectory, maintaining a clean project root and predictable structure for contributors.

## Location Rules

### ✅ Allowed at Project Root
Only these markdown files are permitted at the repository root:
- `README.md` — Main entry point and project overview
- `DESIGN.md` — High-level architecture and design decisions

All other documentation **must** go in `docs/`.

### 📁 Documentation Subdirectory (`docs/`)
All user-facing and technical documentation lives in `docs/`:

```
docs/
├── README-first.md                    # Getting started guide
├── architecture/
│   ├── dual-backend.md               # Backend separation patterns
│   └── event-bus.md                  # Real-time event architecture
├── api/
│   ├── graphql-queries.md            # GraphQL query examples
│   └── express-webhooks.md           # Express webhook endpoints
├── guides/
│   ├── adding-resolver.md            # How to add GraphQL resolver
│   ├── file-uploads.md               # File upload patterns
│   └── sse-real-time.md              # Server-Sent Events guide
├── tutorials/
│   └── build-first-feature.md        # Step-by-step tutorial
└── troubleshooting/
    └── common-issues.md              # FAQ and solutions
```

### 🚫 Session Artifacts (Exception)
Session-specific files are stored in the workspace, not the repository:
- `~/.copilot/session-state/*/plan.md` — Task planning (allowed)
- `~/.copilot/session-state/*/files/` — Temporary work (allowed)

These do **not** get committed to the repository.

## Enforcement

### When Requesting Documentation
Always specify the target path in `docs/`:

**✅ Correct:**
```
"Create docs/guides/my-feature.md with the following content..."
"Update docs/architecture/my-pattern.md to clarify..."
```

**❌ Incorrect:**
```
"Create MY-FEATURE.md"
"Add a guide to the root directory"
```

### For Copilot Agents
Agents will enforce this policy:
1. **Refuse** markdown file creation at project root (except README.md and DESIGN.md)
2. **Redirect** documentation to appropriate `docs/` subdirectory
3. **Ask for confirmation** if unsure about target location

### CI/CD Validation (Future)
A GitHub Actions check will reject PRs that violate this policy:
- ✅ Merges if documentation is properly organized
- ❌ Blocks PRs with markdown files outside `docs/` (except root exceptions)

See GitHub Issue #[FUTURE] for CI implementation details.

## Examples

### Adding a New Feature Guide
```
User: "Document how to add a new GraphQL resolver"
Agent: Creates docs/guides/adding-resolver.md
```

### API Documentation
```
User: "Document the /upload endpoint"
Agent: Creates docs/api/express-endpoints.md
```

### Architecture Decision
```
User: "Document the real-time event flow"
Agent: Creates docs/architecture/event-bus.md
```

### Fix README
```
User: "Update the README with new installation steps"
Agent: Edits README.md (at root)
```

## Rationale

- **Scalability**: Docs at root become unwieldy as the project grows
- **Navigation**: Clear hierarchy makes finding documentation easier
- **Conventions**: Mirrors industry standard (e.g., GitHub docs in `docs/` folder)
- **CI/CD**: Simplifies automated checks and documentation builds
- **Team Clarity**: New contributors immediately know where documentation lives

---

**Last Updated**: April 18, 2026  
**Status**: Active for all Copilot agents and contributors
