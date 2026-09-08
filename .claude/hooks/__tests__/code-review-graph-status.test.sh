#!/usr/bin/env bash
# Offline tests for .claude/hooks/code-review-graph-status.sh (issue #360).
#
# Hermetic: a PATH canary stands in for the real `code-review-graph` binary;
# the decision log is redirected via CLAUDE_HOOK_LOG.
#
# Usage: bash .claude/hooks/__tests__/code-review-graph-status.test.sh

set -u

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HERE/../code-review-graph-status.sh"
TMPDIR_TEST="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_TEST"' EXIT

PASS=0
FAIL=0
report() {
  local status="$1" name="$2" detail="${3:-}"
  if [[ "$status" == "PASS" ]]; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$name"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n        %s\n' "$name" "$detail"
  fi
}

mkdir -p "$TMPDIR_TEST/bin"
cat >"$TMPDIR_TEST/bin/code-review-graph" <<'CANARY'
#!/bin/sh
echo "code-review-graph invoked: $*" >> "$CANARY_FILE"
echo "graph stats: ok"
exit 0
CANARY
chmod +x "$TMPDIR_TEST/bin/code-review-graph"
export CANARY_FILE="$TMPDIR_TEST/canary"
: >"$CANARY_FILE"

last_decision() { awk -F' \\| ' 'END { print $2 }' "$1" 2>/dev/null; }

log="$TMPDIR_TEST/1.log"
rc="$(env "CLAUDE_HOOK_LOG=$log" "PATH=/bin:/usr/bin:/usr/local/bin" bash "$HOOK" </dev/null >/dev/null 2>&1; echo $?)"
[[ "$rc" == "0" && "$(last_decision "$log")" == "skip" ]] \
  && report PASS 'tool not on PATH -> exit 0, skip' \
  || report FAIL 'tool not on PATH -> exit 0, skip' "rc=$rc decision=$(last_decision "$log")"

log="$TMPDIR_TEST/2.log"
rc="$(env "CLAUDE_HOOK_LOG=$log" "PATH=$TMPDIR_TEST/bin:$PATH" "CRG_HOOK_DISABLED=1" bash "$HOOK" </dev/null >/dev/null 2>&1; echo $?)"
[[ "$rc" == "0" && "$(last_decision "$log")" == "skip" && ! -s "$CANARY_FILE" ]] \
  && report PASS 'CRG_HOOK_DISABLED=1 -> skip, no invocation' \
  || report FAIL 'CRG_HOOK_DISABLED=1 -> skip, no invocation' "rc=$rc"

log="$TMPDIR_TEST/3.log"
rc="$(env "CLAUDE_HOOK_LOG=$log" "PATH=$TMPDIR_TEST/bin:$PATH" "CLAUDE_HOOK_DRYRUN=1" bash "$HOOK" </dev/null >/dev/null 2>&1; echo $?)"
[[ "$rc" == "0" && "$(last_decision "$log")" == "dry-run" && ! -s "$CANARY_FILE" ]] \
  && report PASS 'CLAUDE_HOOK_DRYRUN=1 -> dry-run, no invocation' \
  || report FAIL 'CLAUDE_HOOK_DRYRUN=1 -> dry-run, no invocation' "rc=$rc"

log="$TMPDIR_TEST/4.log"
rc="$(cd "$TMPDIR_TEST" && env "CLAUDE_HOOK_LOG=$log" "PATH=$TMPDIR_TEST/bin:$PATH" bash "$HOOK" </dev/null >/dev/null 2>&1; echo $?)"
[[ "$rc" == "0" && "$(last_decision "$log")" == "skip" ]] \
  && report PASS 'not a git repo -> exit 0, skip' \
  || report FAIL 'not a git repo -> exit 0, skip' "rc=$rc decision=$(last_decision "$log")"

log="$TMPDIR_TEST/5.log"
rc="$(env "CLAUDE_HOOK_LOG=$log" "PATH=$TMPDIR_TEST/bin:$PATH" bash "$HOOK" >/dev/null 2>&1; echo $?)"
[[ "$rc" == "0" && "$(last_decision "$log")" == "printed" && -s "$CANARY_FILE" ]] \
  && report PASS 'tool present, in git repo -> printed, invoked once' \
  || report FAIL 'tool present, in git repo -> printed, invoked once' "rc=$rc decision=$(last_decision "$log")"

if grep -qE '^[[:space:]]*exit[[:space:]]+2\b' "$HOOK"; then
  report FAIL 'script contains no `exit 2`' "found an exit 2 statement"
else
  report PASS 'script contains no `exit 2`'
fi

[[ -x "$HOOK" ]] && report PASS 'hook script is executable' || report FAIL 'hook script is executable' "chmod +x $HOOK"

echo
echo "== $PASS passed, $FAIL failed =="
[[ "$FAIL" -eq 0 ]]
