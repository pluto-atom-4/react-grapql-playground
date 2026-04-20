# Push Feature Branch Skill - Quick Start

## One-Liner

```
@claude Create a feature branch for [your task description]
```

## Common Uses

```
"Create a feature branch for adding Apollo Client best practices documentation"

"Set up a branch for fixing the N+1 query issue"

"Create a feature branch for dashboard component tests"
```

## What Happens

The skill automatically:

1. ✅ Checks your git status (warns if uncommitted changes)
2. ✅ Suggests a branch name based on your task
3. ✅ Shows files that will be committed
4. ✅ Creates the branch
5. ✅ Stages files (with options to confirm/modify)
6. ✅ Commits with proper message format + Copilot trailer
7. ✅ Verifies what will be pushed (git log check)
8. ✅ Pushes to remote with tracking

## Response When It's Done

You'll see:
```
✓ Branch created: feat/apollo-client-best-practices
✓ File staged: docs/apollo-client-best-practices.md
✓ Commit created: docs: Add Apollo Client best practices...
✓ Pushed to remote

Final status:
* feat/apollo-client-best-practices abc1234 [origin/...]
```

## Edge Cases It Handles

| Scenario | What Happens |
|----------|--------------|
| **Uncommitted changes on main** | ⚠️ Warns, offers to stash |
| **Mixed unstaged + new files** | Shows both types, asks which to stage |
| **Branch already exists** | Offers to use existing or create `-v2` variant |
| **Empty commit** | Asks for confirmation |
| **Push fails** | Shows error with recovery steps |

## Quick Tips

- **Let it suggest branch names** — Usually good (e.g., `feat/`, `fix/`, `docs/`)
- **Review files before confirming** — It shows you what will be committed
- **Use `s` for selective staging** — Pick individual files if needed
- **Check pre-push verification** — Catches mistakes before the irreversible push
- **Saves time on commit messages** — Template auto-generates with proper format

## Files

- **Full docs**: `.claude/skills/push-feature-branch/SKILL.md`
- **Project overview**: `.claude/skills/README.md`
- **This guide**: `.claude/skills/QUICK_START.md`

## When NOT to Use

- If you want to cherry-pick specific commits from another branch
- If you need to rebase or resolve conflicts
- If you're creating a release/hotfix branch (use main instead of current branch)
- If you need to push to a non-default remote

---

**TL;DR**: Type `@claude Create a feature branch for [task]` and follow the prompts. Done in ~1 minute. ✨
