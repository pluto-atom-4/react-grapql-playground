#!/usr/bin/env bash
# Offline table tests for .claude/hooks/graph-review-advisory.sh
# (issue #357, retargeted from better-code-review-graph to graphify in #360).
#
# Fully hermetic and non-interactive:
#   - every row runs with CLAUDE_HOOK_DRYRUN=1 unless it explicitly
#     exercises a fail-open path that returns before any advisory;
#   - no real graphify invocation ever occurs
#     (a PATH canary asserts the tool is never invoked);
#   - the decision log is redirected to a temp file via CLAUDE_HOOK_LOG.
#
# Usage: bash .claude/hooks/__tests__/graph-review-advisory.test.sh
# Exit 0 = all rows pass. Suitable for CI.

set -u

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HERE/../graph-review-advisory.sh"
TMPDIR_TEST="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_TEST"' EXIT

PASS=0
FAIL=0

# PATH canary: a `graphify` that records any invocation.
# The hook must never run it.
mkdir -p "$TMPDIR_TEST/bin"
cat >"$TMPDIR_TEST/bin/graphify" <<'CANARY'
#!/bin/sh
echo "graphify invoked: $*" >> "$CANARY_FILE"
exit 0
CANARY
chmod +x "$TMPDIR_TEST/bin/graphify"
export CANARY_FILE="$TMPDIR_TEST/crg-canary"
: >"$CANARY_FILE"

json_payload() {
  local tool_name="$1" pattern="$2"
  python3 -c '
import json, sys
print(json.dumps({
    "hook_event_name": "PreToolUse",
    "tool_name": sys.argv[1],
    "tool_input": {"pattern": sys.argv[2], "description": "test"},
    "cwd": sys.argv[3],
    "session_id": "test-session",
}))' "$tool_name" "$pattern" "$PWD"
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

# run_case <name> <tool_name> <pattern> <expected_decision> <expected_reason_substr> <expected_exit> [dryrun:0|1] [raw_payload]
run_case() {
  local name="$1" tool="$2" pattern="$3" want_decision="$4" want_reason="$5" want_exit="$6"
  local dryrun="${7:-1}" raw="${8:-}"
  local log="$TMPDIR_TEST/log-$RANDOM$RANDOM.log"
  local payload out rc decision reason problems=""

  if [[ "$raw" == "__NO_STDIN__" ]]; then
    payload=""
  elif [[ -n "$raw" ]]; then
    payload="$raw"
  else
    payload="$(json_payload "$tool" "$pattern")"
  fi

  local -a env_args=("CLAUDE_HOOK_LOG=$log" "PATH=$TMPDIR_TEST/bin:$PATH")
  [[ "$dryrun" == "1" ]] && env_args+=("CLAUDE_HOOK_DRYRUN=1")

  out="$(printf '%s' "$payload" | env "${env_args[@]}" bash "$HOOK" 2>&1)"
  rc=$?

  # Log line: "ts | pattern | decision | reason"
  if [[ -f "$log" ]]; then
    decision="$(awk -F' \\| ' 'END { print $(NF-1) }' "$log")"
    reason="$(awk -F' \\| ' 'END { print $NF }' "$log")"
  else
    decision="<no-log>"
    reason="<no-log>"
  fi

  [[ "$rc" == "$want_exit" ]] || problems+="exit=$rc want=$want_exit; "
  [[ "$rc" == "2" ]] && problems+="EXIT 2 = HARD BLOCK, forbidden by contract; "
  [[ "$decision" == "$want_decision" ]] || problems+="decision='$decision' want='$want_decision'; "
  [[ "$reason" == *"$want_reason"* ]] || problems+="reason='$reason' want-substr='$want_reason'; "
  [[ "$(wc -l <"$log" 2>/dev/null || echo 0)" == "1" ]] || problems+="expected exactly 1 log line; "

  if [[ -z "$problems" ]]; then
    report PASS "$name"
  else
    report FAIL "$name" "$problems (output: ${out:0:200})"
  fi
}

echo "== graph-review-advisory.sh table tests =="
echo
echo "-- allow rows (must not fire advisory) --"
run_case 'non-Grep/Glob tool (Read)'           Read 'file.ts' allow not-grep-or-glob 0
run_case 'non-Grep/Glob tool (Bash)'           Bash 'ls' allow not-grep-or-glob 0
run_case 'Read tool with grep pattern'         Read '**/graph/*' allow not-grep-or-glob 0

echo
echo "-- fire rows (Grep/Glob with tool installed) --"
run_case 'Grep tool detected'                  Grep '*.ts' dry-run would-advise 0
run_case 'Glob tool detected'                  Glob 'src/**/*.tsx' dry-run would-advise 0
run_case 'Grep with complex pattern'           Grep 'query.*resolver' dry-run would-advise 0

echo
echo "-- tool not installed: no-op --"
# Temporarily remove the tool from PATH so the hook sees it as unavailable
log="$TMPDIR_TEST/notinst-$RANDOM.log"
out="$(json_payload 'Grep' '*.ts' | env "CLAUDE_HOOK_LOG=$log" "PATH=/bin:/usr/bin:/usr/local/bin" "CLAUDE_HOOK_DRYRUN=1" bash "$HOOK" 2>&1)"
rc=$?
if [[ "$rc" == "0" && "$(awk -F' \\| ' 'END { print $(NF-1) }' "$log" 2>/dev/null)" == "allow" ]]; then
  report PASS 'Grep with tool not on PATH -> no-op (allow)'
else
  report FAIL 'Grep with tool not on PATH -> no-op (allow)' "exit=$rc"
fi

echo
echo "-- disable via env var --"
log="$TMPDIR_TEST/disabled-$RANDOM.log"
out="$(json_payload 'Glob' '**/*.rs' | env "CLAUDE_HOOK_LOG=$log" "PATH=$TMPDIR_TEST/bin:$PATH" "CLAUDE_HOOK_DRYRUN=1" "CRG_HOOK_DISABLED=1" bash "$HOOK" 2>&1)"
rc=$?
if [[ "$rc" == "0" && "$(awk -F' \\| ' 'END { print $(NF-1) }' "$log" 2>/dev/null)" == "allow" ]]; then
  report PASS 'CRG_HOOK_DISABLED=1 -> no-op (allow)'
else
  report FAIL 'CRG_HOOK_DISABLED=1 -> no-op (allow)' "exit=$rc"
fi

echo
echo "-- fail-open rows (infrastructure problems must never block) --"
run_case 'empty stdin'                         '' '' allow fail-open 0 1 '__NO_STDIN__'
run_case 'malformed JSON stdin'                '' '' allow fail-open 0 1 'this is not json {{{'
run_case 'valid JSON, no tool_name field'      '' '' allow fail-open:missing 0 1 '{"hook_event_name":"PreToolUse","tool_input":{"pattern":"x"}}'
run_case 'Grep (live mode without dryrun)'     Grep '*.ts' advisory suggested-graph-query 1 0

echo
echo "-- fail-open: no JSON tool on PATH --"
# Genuinely reachable: build a PATH with coreutils but without jq or python3.
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
  out="$(json_payload 'Grep' '*.ts' | env -i "PATH=$STUB" "CLAUDE_HOOK_LOG=$log" bash "$HOOK" 2>&1)"
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
  report FAIL 'script contains no `exit 2` (advisory, never blocking)' "found an exit 2 statement"
else
  report PASS 'script contains no `exit 2` (advisory, never blocking)'
fi

if [[ -x "$HOOK" ]]; then
  report PASS 'hook script is executable'
else
  report FAIL 'hook script is executable' "chmod +x $HOOK"
fi

if [[ -s "$CANARY_FILE" ]]; then
  report FAIL 'no real graphify invocation during the suite' "$(cat "$CANARY_FILE")"
else
  report PASS 'no real graphify invocation during the suite'
fi

echo
echo "== $PASS passed, $FAIL failed =="
[[ "$FAIL" -eq 0 ]]
