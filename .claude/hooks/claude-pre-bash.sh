#!/usr/bin/env bash
# .claude/hooks/claude-pre-bash.sh
#
# Claude Code PreToolUse hook for the Bash tool (issue #354).
#
# Contract (see issue #354 plan, decisions Q1-Q5):
#   - ADVISORY ONLY. This script exits 0 (allow) or 1 (allow, with a warning
#     printed to stderr). It MUST NEVER exit 2 -- exit 2 is Claude Code's
#     "deny the tool call" signal, and blocking commits is the exact bug #354
#     reports. Do not add an `exit 2` here.
#   - FAIL-OPEN. Any infrastructure problem (unparseable stdin, no JSON tool,
#     no git, no tsc, a timeout) results in exit 0. A broken gate must never
#     brick every Bash call in a session.
#   - Every invocation appends one line to a gitignored decision log, so
#     "did it fire, and why?" is answerable without re-running risky commands.
#
# Wiring lives in tracked .claude/settings.json under hooks.PreToolUse with
# `matcher: "Bash"`. There is deliberately no `if` key -- it is not a real
# schema field and is silently ignored (two live reproductions in #354).
# ALL filtering happens here, in this script, from the stdin payload.
#
# stdin payload shape:
#   { "hook_event_name": "PreToolUse", "tool_name": "Bash",
#     "tool_input": { "command": "...", "description": "..." },
#     "cwd": "...", "session_id": "..." }
#
# Env:
#   CLAUDE_HOOK_DRYRUN=1  report the decision + the command that would run,
#                         run no checks, always exit 0.
#   CLAUDE_HOOK_LOG=path  override the decision log location (used by tests).
#   CLAUDE_PROJECT_DIR    project root, supplied by Claude Code.

# NOTE: deliberately no `set -e`. Fail-open must be an explicit, auditable
# decision at each step, not an accident of an unchecked non-zero exit.
set -u

readonly TSC_TIMEOUT_SECONDS=20

# tsc error lines: <relative/path>(line,col): error TSxxxx: message
# Held in a variable: an inline [[ =~ ]] with the "(" inside [^(] is a
# bash conditional-parser syntax error.
TSC_ERROR_RE='^([^(]+)\(([0-9]+),([0-9]+)\): error TS'

# ---------------------------------------------------------------------------
# Logging -- must never fail, and must never be the reason a Bash call breaks.
# ---------------------------------------------------------------------------

LOG_FILE="${CLAUDE_HOOK_LOG:-}"
if [[ -z "$LOG_FILE" ]]; then
  _hook_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)" || _hook_dir="."
  LOG_FILE="${_hook_dir}/.gate.log"
fi

# log <decision> <reason> [command]
log_decision() {
  local decision="$1" reason="$2" cmd="${3:-}"
  local ts sanitized
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" || ts="unknown-time"
  # Collapse newlines/tabs and cap length so one log line stays one log line.
  sanitized="$(printf '%s' "$cmd" | tr '\n\t' '  ' | cut -c1-200)" || sanitized="?"
  { mkdir -p -- "$(dirname -- "$LOG_FILE")" 2>/dev/null &&
    printf '%s | %s | %s | %s\n' "$ts" "$sanitized" "$decision" "$reason" >>"$LOG_FILE"
  } 2>/dev/null
  return 0
}

# allow <reason> [command] -- the only exit-0 path, always logged.
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
  # No JSON tool at all: signal fail-open rather than guessing with sed.
  return 127
}

if ! command_text="$(json_get "tool_input.command")"; then
  allow "fail-open:unparseable-payload" ""
fi
if ! tool_name="$(json_get "tool_name")"; then
  allow "fail-open:unparseable-payload" ""
fi

if [[ -z "$command_text" ]]; then
  allow "fail-open:no-command-field" ""
fi
if [[ -n "$tool_name" && "$tool_name" != "Bash" ]]; then
  allow "not-bash-tool" "$command_text"
fi

# ---------------------------------------------------------------------------
# Boundary-anchored `git commit` detection.
#
# Substring matching is wrong: `git log --grep="git commit"` and
# `echo "git commit"` both contain the substring but commit nothing.
# This regex requires `git` to sit at a COMMAND POSITION -- start of string,
# or immediately after a shell command separator (; & | && || ( ) { newline
# backtick) -- and requires `commit` to be a whole token, with only
# recognisable git *global options* allowed in between (`-c user.name=x`,
# `--no-pager`, `-C path`, ...). That last restriction is what keeps
# `git log --grep="git commit"` from matching: `log` is not an option token,
# so the optional-options group cannot span it.
#
# Known limitation (observed live, deliberately accepted): this is a regex, not
# a shell parser, so a `git commit` sitting at line-start INSIDE a quoted
# string or heredoc still counts as command position and will fire. The cost is
# bounded -- a wasted type-check and at worst an advisory exit 1 -- because the
# hook never blocks. Erring toward over-firing is the right side to be on: the
# plan for #354 identifies silent under-firing as the dangerous failure mode.
# ---------------------------------------------------------------------------

BOUNDARY=$'(^|[;&|(){}`\n])'
GIT_GLOBAL_OPT='([[:space:]]+(-[cC][[:space:]]+[^[:space:];&|]+|--(git-dir|work-tree|namespace|exec-path|config-env|config)[[:space:]]+[^[:space:];&|]+|-[^[:space:];&|]+))'
HELP_RE='commit([[:space:]]+[^[:space:]]+)*[[:space:]]+(--help|-h)([[:space:]]|$)'
COMMIT_RE="${BOUNDARY}[[:space:]]*git${GIT_GLOBAL_OPT}*[[:space:]]+commit([[:space:]]|;|&|\||$)"

if [[ ! "$command_text" =~ $COMMIT_RE ]]; then
  allow "not-a-commit" "$command_text"
fi

# `git commit --help` / `-h` opens documentation; it creates no commit, so
# there is nothing to type-check. Judgment call: ALLOW. Running a type-check
# on a docs lookup is pure latency for zero signal, and the false-negative
# risk is nil (a help invocation cannot produce a commit).
if [[ "$command_text" =~ $HELP_RE ]]; then
  allow "help-invocation" "$command_text"
fi

# ---------------------------------------------------------------------------
# A commit is in flight. Scope the type-check to the STAGED files only.
# ---------------------------------------------------------------------------

if ! command -v git >/dev/null 2>&1; then
  allow "fail-open:git-unavailable" "$command_text"
fi

payload_cwd="$(json_get "cwd" 2>/dev/null)" || payload_cwd=""
start_dir="${payload_cwd:-${CLAUDE_PROJECT_DIR:-$PWD}}"
[[ -d "$start_dir" ]] || start_dir="$PWD"

repo_root="$(git -C "$start_dir" rev-parse --show-toplevel 2>/dev/null)" || repo_root=""
if [[ -z "$repo_root" || ! -d "$repo_root" ]]; then
  if [[ "${CLAUDE_HOOK_DRYRUN:-}" == "1" ]]; then
    printf 'would-check: git commit detected, but no git repo at %s (staged set unknown)\n' "$start_dir"
    log_decision "dry-run" "would-check:no-repo" "$command_text"
    exit 0
  fi
  allow "fail-open:not-a-git-repo" "$command_text"
fi

staged_ts=()
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  case "$file" in
    *.ts|*.tsx|*.mts|*.cts) staged_ts+=("$file") ;;
  esac
done < <(git -C "$repo_root" diff --cached --name-only --diff-filter=ACMR 2>/dev/null)

# Map each staged file to the nearest ancestor package.json that defines a
# `type-check` script -- i.e. the workspace `pnpm -r run type-check` would
# have run for it.
workspaces=()
add_workspace() {
  local candidate="$1" existing
  for existing in ${workspaces[@]+"${workspaces[@]}"}; do
    [[ "$existing" == "$candidate" ]] && return 0
  done
  workspaces+=("$candidate")
}

for file in ${staged_ts[@]+"${staged_ts[@]}"}; do
  dir="$(dirname -- "$file")"
  while :; do
    pkg="$repo_root/${dir#./}/package.json"
    [[ "$dir" == "." ]] && pkg="$repo_root/package.json"
    if [[ -f "$pkg" ]] && grep -q '"type-check"[[:space:]]*:' "$pkg" 2>/dev/null; then
      add_workspace "${dir#./}"
      break
    fi
    [[ "$dir" == "." || "$dir" == "/" ]] && break
    dir="$(dirname -- "$dir")"
  done
done

# ---------------------------------------------------------------------------
# Dry run: report, run nothing, exit 0.
# ---------------------------------------------------------------------------
if [[ "${CLAUDE_HOOK_DRYRUN:-}" == "1" ]]; then
  printf 'would-check: git commit detected in: %s\n' "$command_text"
  if [[ ${#staged_ts[@]} -eq 0 ]]; then
    printf 'would-check: no staged .ts/.tsx files -> would exit 0 (no-staged-ts)\n'
  else
    printf 'would-check: %d staged TS file(s): %s\n' "${#staged_ts[@]}" "${staged_ts[*]}"
    for ws in ${workspaces[@]+"${workspaces[@]}"}; do
      ws_abs="$repo_root/$ws"
      [[ "$ws" == "." ]] && ws_abs="$repo_root"
      printf 'would-run: (cd %s && tsc --noEmit)  [errors filtered to staged files]\n' "$ws_abs"
    done
  fi
  log_decision "dry-run" "would-check" "$command_text"
  exit 0
fi

if [[ ${#staged_ts[@]} -eq 0 ]]; then
  allow "no-staged-ts" "$command_text"
fi
if [[ ${#workspaces[@]} -eq 0 ]]; then
  allow "no-type-check-workspace" "$command_text"
fi

# ---------------------------------------------------------------------------
# Run each workspace's `tsc --noEmit`, intersect errors with the staged set.
# ---------------------------------------------------------------------------

# Prefer the workspace-local tsc binary: it is exactly what `pnpm run
# type-check` resolves to, without the pnpm process layer (which #354 shows
# can itself be entangled with hooks).
resolve_tsc() {
  local ws_abs="$1"
  if [[ -x "$ws_abs/node_modules/.bin/tsc" ]]; then
    printf '%s' "$ws_abs/node_modules/.bin/tsc"
  elif [[ -x "$repo_root/node_modules/.bin/tsc" ]]; then
    printf '%s' "$repo_root/node_modules/.bin/tsc"
  else
    return 1
  fi
}

# Bound every external command so this hook can never hang the session.
run_bounded() {
  if command -v timeout >/dev/null 2>&1; then
    timeout "$TSC_TIMEOUT_SECONDS" "$@"
  else
    "$@"
  fi
}

matched_errors=""
checked_any=0      # did at least one workspace actually produce a usable verdict?
degraded=""        # workspaces where the check could not be trusted

for ws in "${workspaces[@]}"; do
  ws_abs="$repo_root/$ws"
  [[ "$ws" == "." ]] && ws_abs="$repo_root"

  if ! tsc_bin="$(resolve_tsc "$ws_abs")"; then
    degraded+="no-tsc($ws) "
    continue
  fi

  tsc_output="$(cd "$ws_abs" 2>/dev/null && run_bounded "$tsc_bin" --noEmit 2>&1)"
  tsc_status=$?

  if [[ $tsc_status -eq 124 || $tsc_status -eq 137 ]]; then
    degraded+="timeout($ws) "
    continue
  fi

  # A non-zero tsc that emitted no parseable diagnostics did not type-check
  # anything -- it crashed (bad tsconfig, broken install, OOM). Reporting that
  # as "clean" would be a silent no-fire: the log would claim the gate ran when
  # it did not. Record it as degraded instead, and still allow (fail-open).
  ws_errors="$(printf '%s\n' "$tsc_output" | grep -E '\([0-9]+,[0-9]+\): error TS' 2>/dev/null)"
  if [[ $tsc_status -ne 0 && -z "$ws_errors" ]]; then
    degraded+="tsc-crashed($ws) "
    continue
  fi

  checked_any=1
  [[ $tsc_status -eq 0 ]] && continue

  while IFS= read -r line; do
    [[ "$line" =~ $TSC_ERROR_RE ]] || continue
    rel="${BASH_REMATCH[1]}"
    rel="${rel#./}"
    full="$rel"
    [[ "$ws" != "." ]] && full="$ws/$rel"
    for staged in "${staged_ts[@]}"; do
      if [[ "$staged" == "$full" ]]; then
        matched_errors+="$line"$'\n'
        break
      fi
    done
  done <<<"$ws_errors"
done

if [[ -n "$matched_errors" ]]; then
  error_count="$(printf '%s' "$matched_errors" | grep -c 'error TS')"
  {
    printf '\n[claude-pre-bash] ADVISORY: %s type error(s) in files staged for this commit.\n' "$error_count"
    printf '[claude-pre-bash] This is a warning, not a block -- the commit is NOT prevented.\n\n'
    printf '%s\n' "$matched_errors"
  } >&2
  log_decision "warn" "type-errors:$error_count" "$command_text"
  # Advisory (Q1). exit 1, never exit 2. See the header contract.
  exit 1
fi

# Never claim "clean" for a check that did not actually run.
if [[ $checked_any -eq 0 ]]; then
  allow "fail-open:${degraded% }" "$command_text"
fi
if [[ -n "$degraded" ]]; then
  allow "type-check-clean-partial:${degraded% }" "$command_text"
fi
allow "type-check-clean" "$command_text"
