#!/usr/bin/env bash
# .claude/hooks/code-review-graph-update.sh
#
# Claude Code PostToolUse hook for Edit|Write (issue #360). Keeps the
# code-review-graph SQLite index (<repo-root>/.code-review-graph/graph.db)
# incrementally fresh after every file edit, so the architect agent's
# structural queries (callers_of/callees_of/impact/etc) never see a stale
# graph mid-session.
#
# Contract (same family as claude-pre-bash.sh / graph-review-advisory.sh):
#   - ADVISORY / BEST-EFFORT ONLY. PostToolUse hooks cannot block anything
#     that already happened, but this still never throws: any failure here
#     must not surface as a broken session. Exit 0 unconditionally.
#   - FAIL-OPEN. Missing binary, not a git repo, or a failed `update` all
#     result in a silent (logged) no-op -- never a thrown error.
#   - Every invocation appends one line to a gitignored decision log.
#
# Wiring lives in tracked .claude/settings.json under hooks.PostToolUse with
# matcher: "Edit|Write".
#
# Env:
#   CLAUDE_HOOK_DRYRUN=1     report the decision, run no update, exit 0.
#   CLAUDE_HOOK_LOG=path     override the decision log location (used by tests).
#   CRG_HOOK_DISABLED=1      disable this hook (useful for testing).
#   CLAUDE_PROJECT_DIR       project root, supplied by Claude Code.

set -u

LOG_FILE="${CLAUDE_HOOK_LOG:-}"
if [[ -z "$LOG_FILE" ]]; then
  _hook_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)" || _hook_dir="."
  LOG_FILE="${_hook_dir}/.crg-update.log"
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
  printf 'would-run: code-review-graph update --skip-flows --repo %s\n' "$repo_root"
  allow "dry-run" "would-update"
fi

if code-review-graph update --skip-flows --repo "$repo_root" >/dev/null 2>&1; then
  allow "updated" "post-edit-refresh"
else
  allow "skip" "update-failed"
fi
