#!/usr/bin/env bash
# .claude/hooks/code-review-graph-status.sh
#
# Claude Code SessionStart hook (issue #360). Prints code-review-graph stats
# (last build time, node/edge counts, current branch) when a session opens,
# so the architect agent starts with a visible signal for whether the graph
# is fresh enough to trust.
#
# Contract: advisory/best-effort only, fail-open, never throws. A missing
# binary, a non-git directory, or a failed `status` call all silently no-op.
#
# Wiring lives in tracked .claude/settings.json under hooks.SessionStart.
#
# Env:
#   CLAUDE_HOOK_DRYRUN=1     report the decision, run no status call, exit 0.
#   CLAUDE_HOOK_LOG=path     override the decision log location (used by tests).
#   CRG_HOOK_DISABLED=1      disable this hook (useful for testing).
#   CLAUDE_PROJECT_DIR       project root, supplied by Claude Code.

set -u

LOG_FILE="${CLAUDE_HOOK_LOG:-}"
if [[ -z "$LOG_FILE" ]]; then
  _hook_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)" || _hook_dir="."
  LOG_FILE="${_hook_dir}/.crg-status.log"
fi

log_decision() {
  local decision="$1" reason="$2"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" || ts="unknown-time"
  { mkdir -p -- "$(dirname -- "$LOG_FILE")" 2>/dev/null &&
    printf '%s | %s | %s\n' "$ts" "$decision" "$reason" >>"$LOG_FILE"
  } 2>/dev/null
  return 0
}

allow() {
  log_decision "$1" "$2"
  exit 0
}

if [[ "${CRG_HOOK_DISABLED:-}" == "1" ]]; then
  allow "skip" "disabled-by-env"
fi

if ! command -v code-review-graph >/dev/null 2>&1; then
  allow "skip" "tool-not-installed"
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  allow "skip" "not-a-git-repo"
}

if [[ "${CLAUDE_HOOK_DRYRUN:-}" == "1" ]]; then
  printf 'would-run: code-review-graph status --repo %s\n' "$repo_root"
  allow "dry-run" "would-status"
fi

code-review-graph status --repo "$repo_root" 2>/dev/null || true
allow "printed" "session-start"
