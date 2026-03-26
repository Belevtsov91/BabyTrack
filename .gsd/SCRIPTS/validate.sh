#!/usr/bin/env bash
set -euo pipefail

echo "Running validation..."

FAIL=0

if grep -R --line-number "console\.log" src 2>/dev/null; then
  echo "WARNING: Found console.log in src/"
  FAIL=1
fi

if grep -R --line-number "debugger" src 2>/dev/null; then
  echo "WARNING: Found debugger in src/"
  FAIL=1
fi

if npm run lint --if-present 2>/dev/null; then
  echo "Lint: passed"
else
  echo "Lint: failed or not configured"
  FAIL=1
fi

if npm test --if-present 2>/dev/null; then
  echo "Tests: passed"
else
  echo "Tests: failed or not configured"
  FAIL=1
fi

echo "Validation complete (exit code: $FAIL)"
exit "$FAIL"
