---
name: push-feature-branch
description: Create a feature branch, stage changes, commit, and push to remote. Use this skill whenever the user wants to set up a new feature branch for their work, commit changes, and push to the remote repository. The skill handles the complete workflow including auto-generating a branch name, reviewing files before staging, committing with proper messages and co-author trailers, and pushing to remote with branch tracking. Perfect for starting new features, bug fixes, or documentation updates.
compatibility: git, bash
---

# Push Feature Branch Workflow

This skill automates the complete feature branch workflow: checking for uncommitted changes, creating a feature branch, staging modified files, committing with a proper message, and pushing to remote.

## Workflow Overview

The skill performs these steps:

1. **Check Repository Status** — Detects uncommitted changes, unstaged modifications, and determines if you're on main
2. **Handle Edge Cases** — Warns about uncommitted changes, unstaged files, and asks whether to use an existing branch or create a new one
3. **Generate Branch Name** — Auto-generates a descriptive branch name based on the work context
4. **Review Files** — Shows you which files will be staged and lets you confirm before proceeding
5. **Commit & Push** — Creates the commit with your message and the Copilot co-author trailer, then pushes to remote

## How to Use

When you want to start a new feature branch and push your work:

```
@claude Create a feature branch for adding Apollo Client best practices documentation
```

Or simply:

```
@claude Create a feature branch, commit, and push to remote
```

The skill will guide you through each step with clear prompts.

## Step-by-Step Execution

### 1. Check Repository Status

```bash
git status
git log --oneline -1
```

The skill examines:
- Current branch (warns if not on `main`)
- Uncommitted changes on current branch
- Untracked files
- Unstaged modifications

**If uncommitted changes exist on main:**
```
⚠️  WARNING: You have uncommitted changes on main:
  - file1.ts (modified)
  - file2.md (untracked)

Do you want to:
1. Stash these changes first, then create the branch
2. Continue anyway (not recommended)
3. Cancel and fix manually
```

**If unstaged changes exist:**
```
⚠️  WARNING: You have unstaged changes:
  - src/component.tsx

The following files will be staged:
  - docs/new-doc.md (new)
  - lib/util.ts (modified)

Proceed with staging only the listed files? (y/n)
```

### 2. Branch Name Generation

The skill auto-generates a branch name based on:
- Your task description or context
- Recent file changes
- Type of work (feat/, fix/, docs/, etc.)

**Example outputs:**
- Task: "Add Apollo Client best practices documentation"
  → Branch: `feat/apollo-client-best-practices-documentation`

- Task: "Fix N+1 query issue in resolvers"
  → Branch: `fix/n-plus-one-query-prevention`

- Task: "Update README"
  → Branch: `docs/readme-update`

The skill shows you the suggested name:
```
Suggested branch name: feat/apollo-client-best-practices-documentation

Use this name? (y/n)
If not, enter a custom name:
```

### 3. Handle Existing Branch

If a branch with the chosen name already exists:

```
ⓘ A branch named 'feat/apollo-client-best-practices-documentation' already exists.

Do you want to:
1. Use the existing branch (check it out and continue)
2. Create a new branch with a different name
3. Cancel
```

**If you choose option 1** (use existing):
```bash
git checkout feat/apollo-client-best-practices-documentation
```
The skill checks out the branch and continues with staging/commit/push as normal.

**If you choose option 2** (create new with different name):
```
Suggested new name: feat/apollo-client-best-practices-documentation-v2

Use this name? (y/n)
Or enter a custom branch name: 
```
The skill appends `-v2` or lets you type a custom name, then creates the new branch and continues.

**If you choose option 3** (cancel):
The workflow stops. No branch is created or checked out.

### 4. Review & Confirm Files

Before staging, the skill shows which files will be added:

```
Files to stage:
  ✓ docs/apollo-client-best-practices.md (new)
  ✓ docs/session-report/APOLLO_PATTERNS.md (new)

Unstaged changes (will NOT be committed):
  • lib/resolver.ts (modified)

Proceed with staging only the listed files? (y/n)
```

User can:
- **y** — Stage and commit only the listed files
- **n** — Cancel; you'll handle staging manually with git add
- **s** — Selective staging; pick individual files to include/exclude

**Note on unstaged files**: Any modified files not listed above will remain unstaged and will NOT be included in this commit. They can be committed separately later.

### 5. Commit with Template

Once files are staged, the skill shows a commit template:

```
Commit message template:
---
docs: Add Apollo Client best practices documentation

[Add a more detailed explanation here if needed]

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
---

Edit the message above the dashes, or confirm as-is (y/n/e):
y = use template, n = cancel, e = edit in editor
```

The template includes:
- **Type prefix** (docs, feat, fix, etc.) based on file changes
- **Subject line** (auto-generated from context)
- **Body** (optional, for detailed explanation)
- **Copilot co-author trailer** (required)

### 6. Verify Before Push

Before pushing, the skill shows what will be pushed:

```bash
git log main..HEAD --oneline
```

Example output:
```
abc1234 docs: Add Apollo Client best practices
```

This confirms exactly 1 commit will be pushed. User can:
- **y** — Proceed with push
- **n** — Cancel; review changes manually before pushing later

### 7. Push to Remote

```bash
git push -u origin feat/apollo-client-best-practices-documentation
```

Success confirmation:
```
✓ Branch created and pushed to remote
✓ Tracking configured: local branch → origin/feat/apollo-client-best-practices-documentation

Remote URL: https://github.com/pluto-atom-4/stoke-full-stack/tree/feat/apollo-client-best-practices-documentation
```

### 8. Final Status Summary

After pushing, the skill shows final state:

```bash
git branch -vv
git log -1 --oneline
```

Output:
```
* feat/apollo-client-best-practices-documentation abc1234 [origin/feat/apollo-client-best-practices-documentation] docs: Add Apollo Client best practices

Committed files:
  ✓ docs/apollo-client-best-practices.md (new)

Not committed (still local):
  • lib/resolver.ts (modified, unstaged)
```

This confirms:
- ✅ You're on the feature branch
- ✅ The commit was created with the right message
- ✅ The branch is tracking the remote
- ✅ Only intended files were committed

## Edge Cases & Warnings

| Scenario | Action |
|----------|--------|
| Uncommitted changes on main | Warn user, offer to stash before branching |
| Unstaged modifications | Warn user, explicitly state they will NOT be committed, show list |
| Untracked files | Ignore unless user explicitly stages them |
| Branch already exists | Ask user: use existing, create new with variant name, or cancel |
| Mixed modified + new files | Show both types with status labels, ask which to stage |
| No files to stage | Ask user to confirm empty commit or cancel |
| Push fails (network/auth) | Show error message, suggest: check internet, verify credentials, retry |
| Branch creation fails | Show error, suggest: check branch name syntax, verify permissions, try again |
| Commit message empty | Reject empty message, ask user to provide at least a subject line |

## Error Recovery

If any step fails:

### Push Fails
```
✗ Push failed: fatal: 'origin' does not appear to be a git repository

Possible causes:
- Remote not configured (git remote -v to check)
- Network disconnected (check internet connection)
- Authentication failed (verify SSH key or credentials)

Options:
1. Check git remotes: git remote -v
2. Configure if needed: git remote add origin <url>
3. Retry push: git push -u origin <branch-name>
```

### Branch Creation Fails
```
✗ Branch creation failed: fatal: A branch named 'feat/...' already exists

Options:
1. Use existing branch: git checkout feat/...
2. Try different name: git checkout -b feat/...-v2
3. List all branches: git branch -a
```

### Commit Fails
```
✗ Commit failed: nothing to commit

Cause: No files staged, or all changes already committed.

Options:
1. Stage files: git add <filename>
2. Check status: git status
3. Verify staged files: git diff --cached
```

## Commit Message Format

The skill enforces this commit message structure:

```
<type>: <subject>

[optional body - detailed explanation]

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**Type prefix selection** (auto-detected based on files being committed):
- `feat` — New features or significant additions
- `fix` — Bug fixes
- `docs` — Documentation, README, guides
- `refactor` — Code refactoring (no behavior change)
- `test` — Tests or test improvements
- `chore` — Dependencies, build config, tooling

**Subject line rules**:
- Concise: 50 characters or less
- Lowercase (except proper nouns)
- No period at the end
- Action-oriented: "Add X", "Fix Y", "Update Z"

**For mixed files** (e.g., code + docs):
- If both are part of same feature: use the primary type (e.g., `feat:` if feature code, even if docs included)
- If truly separate concerns: ask user whether to commit separately
- Example: "fix: Add N+1 prevention to DataLoader (includes implementation report)" — uses `fix:` as primary, mentions docs in body

## Example Sessions

### Happy Path: New Documentation File

```
User: Create a feature branch for adding Apollo Client best practices documentation

$ git status
  On branch main
  Untracked files: docs/session-report/ISSUE_109_REPORT.md
  nothing to commit, working tree clean

✓ Repository is clean

Suggested branch name: docs/apollo-client-best-practices
Use this name? (y/n): y

✓ Creating branch...
$ git checkout -b docs/apollo-client-best-practices

Files to stage:
  ✓ docs/apollo-client-best-practices.md (new)

Proceed with staging? (y/n): y

Commit message template (edit as needed):
---
docs: Add Apollo Client best practices guide

Comprehensive guide covering caching strategies, optimistic updates,
and subscription patterns for Apollo Client.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
---

Proceed? (y/n): y

$ git add docs/apollo-client-best-practices.md
$ git commit -m "docs: Add Apollo Client best practices guide..."
$ git log -1 --oneline
  abc1234 docs: Add Apollo Client best practices guide

Verify before push? (y/n): y
$ git log main..HEAD --oneline
  abc1234 docs: Add Apollo Client best practices guide

Ready to push to remote? (y/n): y
$ git push -u origin docs/apollo-client-best-practices

✓ Success! Branch pushed to remote.

Final status:
$ git branch -vv
* docs/apollo-client-best-practices abc1234 [origin/docs/apollo-client-best-practices]

Committed files:
  ✓ docs/apollo-client-best-practices.md (new)
```

### Edge Case: Unstaged Changes + New Files

```
User: I have unstaged code changes and a new docs file. Create a feature for a bug fix.

$ git status
  On branch main
  Changes not staged for commit:
    modified:   backend-graphql/src/resolvers.ts
  Untracked files:
    new file:   docs/bugfix-report.md

⚠️ WARNING: You have unstaged changes on main:
  - backend-graphql/src/resolvers.ts

Do you want to:
1. Stash these changes first, then branch
2. Continue anyway (changes will stay on main)
3. Cancel

Choice (1-3): 1

✓ Changes stashed (you can restore with 'git stash pop')

Suggested branch name: fix/n-plus-one-resolver-query
Use this name? (y/n): y

$ git checkout -b fix/n-plus-one-resolver-query

Files to stage:
  ✓ docs/bugfix-report.md (new)

Unstaged changes (will NOT be committed):
  • backend-graphql/src/resolvers.ts (modified)

Proceed with staging only the listed files? (y/n): y

$ git add docs/bugfix-report.md
$ git commit -m "docs: Add N+1 prevention implementation report..."

Final status:
$ git branch -vv
* fix/n-plus-one-resolver-query abc1234 [origin/fix/n-plus-one-resolver-query]

Committed files:
  ✓ docs/bugfix-report.md (new)

Not committed (still on main):
  • backend-graphql/src/resolvers.ts (modified)
```

### Edge Case: Existing Branch

```
User: Create a feature branch for dashboard tests. I think a branch might exist.

Suggested branch name: test/dashboard-component-tests
Use this name? (y/n): y

ⓘ A branch named 'test/dashboard-component-tests' already exists.

Do you want to:
1. Use the existing branch (check it out and continue)
2. Create a new branch with a different name
3. Cancel

Choice (1-3): 2

Suggested new name: test/dashboard-component-tests-v2
Use this name? (y/n): n

Enter custom branch name: test/dashboard-integration-suite

✓ Creating new branch...
$ git checkout -b test/dashboard-integration-suite

Files to stage:
  ✓ app/tests/dashboard.test.tsx (new)

Proceed with staging? (y/n): y

$ git commit -m "test: Add comprehensive dashboard component tests..."
$ git push -u origin test/dashboard-integration-suite

✓ Success! Branch pushed to remote.

Final status:
$ git branch -a
  main
  test/dashboard-component-tests
* test/dashboard-integration-suite [origin/test/dashboard-integration-suite]
```

## Execution Commands

The skill executes these git commands in sequence:

```bash
# Check status
git status --porcelain
git log --oneline -1
git branch -a

# Create branch
git checkout -b <branch-name>

# Stage files
git add <files>

# Commit
git commit -m "<message>"

# Push with tracking
git push -u origin <branch-name>
```

All commands are shown to the user before execution for transparency.
