---
name: session-blog-to-gist
description: "Convert any development session into a professional portfolio blog post and publish it as a GitHub Gist. Works with Claude Code, GitHub Copilot, terminal work, or any coding session. Automatically extract key decisions from conversation history (if available), analyze git commits since main, synthesize technical and business impact, auto-title from PR/Issue, and share publicly or privately. Trigger whenever you want to document and share a completed session: just say 'create a blog post from this session', 'blog this', 'make a gist', or similar. Perfect for portfolio building, team documentation, and creating shareable summaries of your development work."
compatibility: "Requires: gh CLI (GitHub), git. Works across any project."
---

## Overview

This skill transforms any completed work session into a professional, portfolio-ready blog post and publishes it as a GitHub Gist. It works with Claude Code sessions, GitHub Copilot sessions, terminal work, or any development workflow that results in git commits.

**What the skill does:**
1. Extracts key decisions and workflow from available session context
2. Analyzes git commits since `main` to understand technical changes
3. Identifies related PR/Issue titles for automatic gist naming
4. Synthesizes impact: what problem was solved, why it matters, what changed
5. Formats into a public-facing blog post (Markdown)
6. Publishes to GitHub Gist (public or private, your choice)
7. Returns the gist URL for sharing

## When to Use

Use this skill whenever:
- You've completed a meaningful feature, fix, or refactor and want to document it
- You want to add a portfolio piece showcasing your decision-making and technical depth
- You need to share learnings or a workflow with your team or the public
- You're building a public portfolio of your development work
- You want a shareable link to your work session with context and impact
- You finished a Copilot session or terminal-based work and want to preserve what you learned

## Workflow

### Step 1: Understand Your Session

The skill will:
- Gather available context from your session (conversation history, prompts, or your summary)
- Extract key decision points and milestones you reached
- Identify the main problem you were solving and your approach
- Synthesize the reasoning behind your technical choices

### Step 2: Examine Code Changes

The skill will:
- Run `git log main..HEAD` to find all commits since branching from main
- Extract commit messages, file changes, and the scope of modifications
- Understand what code changed and why (from your commit messages and context)

### Step 3: Infer Title & Context

The skill will attempt to:
- Find related GitHub PR or Issue titles using `gh` CLI
- Use the most relevant PR/Issue title as the gist title
- If no PR/Issue exists, generate a descriptive title from your work summary

### Step 4: Synthesize Impact

Write a focused **Impact** section covering:
- **Problem Solved**: What was broken, missing, or suboptimal? Why did it matter?
- **Technical Approach**: How did you solve it? What's the architecture or pattern?
- **Learnings**: What surprised you? What did you discover about the codebase or the problem?
- **Metrics/Outcomes**: If applicable, any performance improvements, lines changed, tests added, or bugs fixed

Keep the tone professional and portfolio-friendly. Assume the reader is a peer engineer or potential collaborator who wants to understand:
- Your problem-solving approach
- Your technical depth
- The business/user impact of your work
- Lessons learned

### Step 5: Format & Publish

The skill will:
- Format the blog post as clean Markdown
- Ask you whether the gist should be **public** (shareable URL, visible to all) or **private** (only with direct link)
- Create the gist using `gh gist create` with your chosen visibility
- Return the gist URL and confirmation

## Example Output Structure

```markdown
# [Auto-titled from PR/Issue or generated]

## Problem

[Context: what was broken, missing, or needed optimization]

## Approach

[How you solved it: architecture, patterns, key decisions]

## Impact

[What changed, why it matters, metrics if available]

## Learnings

[What you discovered, surprises, decision rationale]
```

## Setup Requirements

Before using this skill, ensure:

1. **GitHub CLI installed and authenticated:**
   ```bash
   gh auth status  # Should show "Logged in to github.com"
   ```

2. **Git configured:**
   ```bash
   git config --global user.name
   git config --global user.email
   ```

3. **Working directory is a git repository** with at least one commit on `main`

If `gh` is not authenticated, the skill will ask you to run `gh auth login` first.

## Usage Examples

**Example 1: After a Claude Code session**
```
"Create a blog post from this session"
```
The skill reads your conversation history, analyzes your commits, and walks you through gist creation.

**Example 2: After a Copilot session or terminal work**
```
"Blog this"
```
The skill analyzes your commits and asks you to summarize the key decisions, then creates the gist.

**Example 3: With explicit context**
```
"Turn this session into a portfolio gist. Here's what I did: [summary]"
```
You provide context, the skill enhances it with git analysis and publishes.

## What You Provide

- **Context about your work** (from conversation history, or a brief summary if using terminal/Copilot)
- **Confirmation of extracted decisions** (the skill may ask clarifying questions)
- **Public or private choice** for the gist
- **Final approval** before publishing (the skill will show you the draft)

## What the Skill Produces

- **A Markdown blog post** stored in the gist (no code snippets, focused on impact)
- **A GitHub Gist URL** you can share, add to your portfolio, or email to stakeholders
- **Local copy** saved to `./session-blog-[timestamp].md` for your records

## Tips for Best Results

1. **Clear commit messages**: The skill reads your git history, so descriptive commits help immensely.
2. **Session context**: Whether from conversation history or your summary, more detail helps the skill extract better decisions.
3. **Related PR/Issue**: If you opened a PR or Issue for this work, the skill will use its title automatically.
4. **Public sharing mindset**: Write your answers as if a peer engineer or hiring manager is reading. Explain *why*, not just *what*.

## Supported Session Types

This skill works with:
- **Claude Code sessions** (full conversation history available)
- **GitHub Copilot sessions** (you summarize key decisions; git commits provide evidence)
- **Terminal-based development** (you provide context; git commits are analyzed)
- **Mixed workflows** (any combination of tools)

## Troubleshooting

**"gh: command not found"**
- Install GitHub CLI: `brew install gh` (macOS) or `sudo apt-get install gh` (Linux)
- Authenticate: `gh auth login`

**"Not a git repository"**
- Ensure you're running this from a project directory with `.git/`
- If starting a new project: `git init && git add . && git commit -m "Initial commit"`

**"No commits since main"**
- Make sure you've committed your work and created a branch: `git branch` should show a branch other than `main`
- If on main: `git checkout -b feature/my-work && git commit -m "Your work"`

**"Can't find PR/Issue title"**
- The skill will auto-generate a title from your work summary if no PR/Issue is found
- You can also override the title when prompted

**"Session context not available (terminal/Copilot work)"**
- The skill will ask you to provide a brief summary of what you did and why
- The git commits provide the technical evidence; your summary explains the reasoning

---

**Ready to share your work?** Just ask the skill to "create a blog post from this session" and follow the prompts. Your portfolio awaits!
