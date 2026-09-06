#!/usr/bin/env bash
# .claude/hooks/graph-review-advisory.sh
#
# Claude Code PreToolUse hook for Grep/Glob tools (issue #357).
#
# Contract (mirrors issue #354 pattern with tool-specific behavior):
#   - ADVISORY ONLY. This script exits 0 (allow) or 1 (allow, with advisory
#     printed to stderr). It MUST NEVER exit 2 -- exit 2 is Claude Code's
#     "deny the tool call" signal. This hook is advisory, never blocking.
#   - FAIL-OPEN. Any infrastructure problem (unparseable stdin, no JSON tool,
#     missing better-code-review-graph binary, not a git repo, etc) results in
#     exit 0. A broken gate must never brick Grep/Glob calls.
#   - Every invocation appends one line to a gitignored decision log, so
#     "did it fire, and why?" is answerable without re-running scans.
#
# Behavior:
#   - If better-code-review-graph binary is not on PATH, exit 0 silently (no-op).
#   - If CRG_HOOK_DISABLED=1 env var is set, skip advisory and exit 0.
#   - Otherwise, emit an advisory suggesting the user query better-code-review-graph
#     before wide Grep/Glob scans (e.g., `better-code-review-graph graph stats`).
#   - Exit 1 (advisory), never 2.
#
# Wiring lives in tracked .claude/settings.json under hooks.PreToolUse with
# matcher: "Grep|Glob".
#
# stdin payload shape:
#   { "hook_event_name": "PreToolUse", "tool_name": "Grep" or "Glob",
#     "tool_input": { "pattern": "...", "description": "..." },
#     "cwd": "...", "session_id": "..." }
#
# Env:
#   CLAUDE_HOOK_DRYRUN=1     report the decision, run no checks, exit 0.
#   CLAUDE_HOOK_LOG=path     override the decision log location (used by tests).
#   CRG_HOOK_DISABLED=1      disable this advisory (useful for testing).
#   CLAUDE_PROJECT_DIR       project root, supplied by Claude Code.

# NOTE: deliberately no `set -e`. Fail-open must be an explicit, auditable
# decision at each step, not an accident of an unchecked non-zero exit.
set -u

# ---------------------------------------------------------------------------
# Logging -- must never fail, and must never be the reason a tool call breaks.
# ---------------------------------------------------------------------------

LOG_FILE="${CLAUDE_HOOK_LOG:-}"
if [[ -z "$LOG_FILE" ]]; then
  _hook_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)" || _hook_dir="."
  LOG_FILE="${_hook_dir}/.crg.log"
fi

# log <decision> <reason> [pattern]
log_decision() {
  local decision="$1" reason="$2" pattern="${3:-}"
  local ts sanitized
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" || ts="unknown-time"
  # Collapse newlines/tabs and cap length so one log line stays one log line.
  sanitized="$(printf '%s' "$pattern" | tr '\n\t' '  ' | cut -c1-200)" || sanitized="?"
  { mkdir -p -- "$(dirname -- "$LOG_FILE")" 2>/dev/null &&
    printf '%s | %s | %s | %s\n' "$ts" "$sanitized" "$decision" "$reason" >>"$LOG_FILE"
  } 2>/dev/null
  return 0
}

# allow <reason> [pattern] -- the only exit-0 path, always logged.
allow() {
  log_decision "allow" "$1" "${2:-}"
  exit 0
}

# ---------------------------------------------------------------------------
# Read + parse the payload. Any failure here is fail-open.
# ---------------------------------------------------------------------------

payload="$(cat 2>/dev/null)" || payload=""
if [[ -z "${payload//[[:space:]]/}" ]]; then
  allow "fail-open:empty-stdin" ""
fi

# json_get <dotted.path> -> value on stdout, non-zero exit on parse failure.
json_get() {
  local path="$1"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$payload" | jq -r --arg p "$path" '
      getpath($p | split(".")) // "" | if type == "string" then . else "" end
    ' 2>/dev/null
    return "${PIPESTATUS[1]}"
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$payload" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(3)
node = data
for key in sys.argv[1].split("."):
    node = node.get(key) if isinstance(node, dict) else None
sys.stdout.write(node if isinstance(node, str) else "")
' "$path" 2>/dev/null
    return $?
  fi
  return 127
}

if ! tool_name="$(json_get "tool_name")"; then
  allow "fail-open:unparseable-payload" ""
fi

# This hook only advises on Grep or Glob tool calls
if [[ -z "$tool_name" ]]; then
  allow "fail-open:missing-tool-name" ""
fi
if [[ "$tool_name" != "Grep" && "$tool_name" != "Glob" ]]; then
  allow "not-grep-or-glob" ""
fi

pattern="$(json_get "tool_input.pattern" 2>/dev/null)" || pattern=""

# ---------------------------------------------------------------------------
# Pre-flight checks: tool availability and disable switch.
# ---------------------------------------------------------------------------

if ! command -v better-code-review-graph >/dev/null 2>&1; then
  allow "tool-not-installed" "$pattern"
fi

if [[ "${CRG_HOOK_DISABLED:-}" == "1" ]]; then
  allow "disabled-by-env" "$pattern"
fi

# ---------------------------------------------------------------------------
# Dry run: report, run nothing, exit 0.
# ---------------------------------------------------------------------------

if [[ "${CLAUDE_HOOK_DRYRUN:-}" == "1" ]]; then
  printf 'would-advise: %s pattern detected: %s\n' "$tool_name" "$pattern"
  printf 'would-advise: suggest querying better-code-review-graph before wide scan\n'
  log_decision "dry-run" "would-advise" "$pattern"
  exit 0
fi

# ---------------------------------------------------------------------------
# Emit advisory: suggest using better-code-review-graph before the scan.
# ---------------------------------------------------------------------------

{
  printf '\n[graph-review-advisory] Tip: Before running this %s scan, consider checking\n' "$tool_name"
  printf '[graph-review-advisory] the code review graph for context:\n\n'
  printf '[graph-review-advisory]   better-code-review-graph graph stats\n\n'
  printf '[graph-review-advisory] This can help guide your search and identify relevant code regions.\n'
  printf '[graph-review-advisory] To disable this advisory, set CRG_HOOK_DISABLED=1\n\n'
} >&2

log_decision "advisory" "suggested-graph-query" "$pattern"
exit 1
