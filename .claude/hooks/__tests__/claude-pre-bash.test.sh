#!/usr/bin/env bash
# Offline table tests for .claude/hooks/claude-pre-bash.sh (issue #354).
#
# Fully hermetic and non-interactive:
#   - every row runs with CLAUDE_HOOK_DRYRUN=1 unless it is explicitly
#     exercising a fail-open path that returns before any check;
#   - no real commit is ever created and no pnpm/tsc process is ever spawned
#     (a PATH canary asserts pnpm is never invoked);
#   - the decision log is redirected to a temp file via CLAUDE_HOOK_LOG.
#
# Usage: bash .claude/hooks/__tests__/claude-pre-bash.test.sh
# Exit 0 = all rows pass. Suitable for CI.

set -u

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HERE/../claude-pre-bash.sh"
TMPDIR_TEST="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_TEST"' EXIT

PASS=0
FAIL=0

# PATH canary: a `pnpm` that records any invocation. The hook must never run it.
mkdir -p "$TMPDIR_TEST/bin"
cat >"$TMPDIR_TEST/bin/pnpm" <<'CANARY'
#!/bin/sh
echo "pnpm invoked: $*" >> "$CANARY_FILE"
exit 0
CANARY
chmod +x "$TMPDIR_TEST/bin/pnpm"
export CANARY_FILE="$TMPDIR_TEST/pnpm-canary"
: >"$CANARY_FILE"

json_payload() {
  python3 -c '
import json, sys
print(json.dumps({
    "hook_event_name": "PreToolUse",
    "tool_name": "Bash",
    "tool_input": {"command": sys.argv[1], "description": "test"},
    "cwd": sys.argv[2],
    "session_id": "test-session",
}))' "$1" "$2"
}

report() {
  local status="$1" name="$2" detail="${3:-}"
  if [[ "$status" == "PASS" ]]; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$name"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n        %s\n' "$name" "$detail"
  fi
}

# run_case <name> <command> <expected_decision> <expected_reason_substr> <expected_exit> [dryrun:0|1] [raw_payload]
run_case() {
  local name="$1" cmd="$2" want_decision="$3" want_reason="$4" want_exit="$5"
  local dryrun="${6:-1}" raw="${7:-}"
  local log="$TMPDIR_TEST/gate-$RANDOM$RANDOM.log"
  local payload out rc decision reason problems=""

  if [[ "$raw" == "__NO_STDIN__" ]]; then
    payload=""
  elif [[ -n "$raw" ]]; then
    payload="$raw"
  else
    payload="$(json_payload "$cmd" "$PWD")"
  fi

  local -a env_args=("CLAUDE_HOOK_LOG=$log" "PATH=$TMPDIR_TEST/bin:$PATH")
  [[ "$dryrun" == "1" ]] && env_args+=("CLAUDE_HOOK_DRYRUN=1")

  out="$(printf '%s' "$payload" | env "${env_args[@]}" bash "$HOOK" 2>&1)"
  rc=$?

  # Log line: "ts | command | decision | reason"; the command may itself
  # contain " | ", so read the decision/reason off the END of the line.
  if [[ -f "$log" ]]; then
    decision="$(awk -F' \\| ' 'END { print $(NF-1) }' "$log")"
    reason="$(awk -F' \\| ' 'END { print $NF }' "$log")"
  else
    decision="<no-log>"
    reason="<no-log>"
  fi

  [[ "$rc" == "$want_exit" ]] || problems+="exit=$rc want=$want_exit; "
  [[ "$rc" == "2" ]] && problems+="EXIT 2 = HARD BLOCK, forbidden by Q1; "
  [[ "$decision" == "$want_decision" ]] || problems+="decision='$decision' want='$want_decision'; "
  [[ "$reason" == *"$want_reason"* ]] || problems+="reason='$reason' want-substr='$want_reason'; "
  [[ "$(wc -l <"$log" 2>/dev/null || echo 0)" == "1" ]] || problems+="expected exactly 1 log line; "

  if [[ -z "$problems" ]]; then
    report PASS "$name"
  else
    report FAIL "$name" "$problems (output: ${out:0:200})"
  fi
}

echo "== claude-pre-bash.sh table tests =="
echo
echo "-- allow rows (must not fire) --"
run_case 'git diff --stat'                 'git diff --stat'                 allow    not-a-commit 0
run_case 'git log --grep="git commit"'     'git log --grep="git commit"'     allow    not-a-commit 0
run_case 'echo "git commit"'               'echo "git commit"'               allow    not-a-commit 0
run_case 'pnpm test'                       'pnpm test'                       allow    not-a-commit 0
run_case 'git log --grep="git commit " (trailing space)' 'git log --grep="git commit "' allow not-a-commit 0
run_case 'grep -r "git commit" docs/'      'grep -r "git commit" docs/'      allow    not-a-commit 0

echo
echo "-- fire rows (must detect a real commit) --"
run_case 'git commit -m "x"'               'git commit -m "x"'               dry-run  would-check 0
run_case 'git -c user.name=x commit (flags before commit)' 'git -c user.name=x commit -m "y"' dry-run would-check 0
run_case 'pnpm build && git commit -am x (chained)'        'pnpm build && git commit -am x'   dry-run would-check 0
run_case 'cd f; git commit -m a (semicolon-chained)'       'cd f; git commit -m a'            dry-run would-check 0
run_case 'git --no-pager commit -m z'      'git --no-pager commit -m z'      dry-run  would-check 0

echo
echo "-- judgment call: documented in the script --"
# `git commit --help` opens documentation and creates no commit, so it is
# treated as ALLOW (reason: help-invocation). Type-checking a docs lookup is
# latency for zero signal, and a help invocation cannot produce a commit,
# so the false-negative risk is nil.
run_case 'git commit --help'               'git commit --help'               allow    help-invocation 0

echo
echo "-- fail-open rows (infrastructure problems must never block) --"
run_case 'malformed JSON stdin'            ''  allow fail-open 0 1 'this is not json {{{'
run_case 'empty stdin'                     ''  allow fail-open:empty-stdin 0 1 '__NO_STDIN__'
run_case 'valid JSON, no command field'    ''  allow fail-open 0 1 '{"tool_name":"Bash","tool_input":{}}'
run_case 'non-Bash tool payload'           ''  allow not-bash-tool 0 1 '{"tool_name":"Read","tool_input":{"command":"git commit -m x"}}'
# Same fail-open rows again WITHOUT dry-run: these paths return before any
# check runs, so they must be exit 0 in live mode too.
run_case 'malformed JSON (live mode)'      ''  allow fail-open 0 0 'not json at all'
run_case 'git diff --stat (live mode)'     'git diff --stat' allow not-a-commit 0 0

echo
echo "-- fail-open: no JSON tool on PATH --"
# Genuinely reachable, not theoretical: build a PATH with coreutils but
# without jq or python3, and confirm the hook still exits 0.
STUB="$TMPDIR_TEST/nojson"
mkdir -p "$STUB"
missing=""
for b in bash cat date tr cut dirname mkdir wc; do
  src="$(command -v "$b" 2>/dev/null)" || { missing="$b"; break; }
  ln -sf "$src" "$STUB/$b"
done
if [[ -n "$missing" ]]; then
  echo "  SKIP  no-JSON-tool fail-open (missing coreutils: $missing)"
else
  log="$TMPDIR_TEST/nojson.log"
  out="$(json_payload 'git commit -m "x"' "$PWD" | env -i "PATH=$STUB" "CLAUDE_HOOK_LOG=$log" bash "$HOOK" 2>&1)"
  rc=$?
  if [[ "$rc" == "0" ]]; then
    report PASS 'no jq and no python3 on PATH -> exit 0 (fail-open)'
  else
    report FAIL 'no jq and no python3 on PATH -> exit 0 (fail-open)' "exit=$rc output=${out:0:200}"
  fi
fi

echo
echo "-- static contract checks --"
if grep -qE '^[[:space:]]*exit[[:space:]]+2\b' "$HOOK"; then
  report FAIL 'script contains no `exit 2` (Q1: advisory, never blocking)' "found an exit 2 statement"
else
  report PASS 'script contains no `exit 2` (Q1: advisory, never blocking)'
fi

if [[ -x "$HOOK" ]]; then
  report PASS 'hook script is executable'
else
  report FAIL 'hook script is executable' "chmod +x $HOOK"
fi

if [[ -s "$CANARY_FILE" ]]; then
  report FAIL 'no real pnpm invocation during the suite' "$(cat "$CANARY_FILE")"
else
  report PASS 'no real pnpm invocation during the suite'
fi

echo
echo "== $PASS passed, $FAIL failed =="
[[ "$FAIL" -eq 0 ]]
