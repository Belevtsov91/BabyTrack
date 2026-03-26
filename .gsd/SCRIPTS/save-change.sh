#!/usr/bin/env bash
set -euo pipefail

SUMMARY="${1:-}"
if [ -z "$SUMMARY" ]; then
  echo 'Usage: ./.gsd/SCRIPTS/save-change.sh "Short summary" [--commit]'
  exit 1
fi

DO_COMMIT="false"
if [ "${2:-}" = "--commit" ] || [ "${1:-}" = "--commit" ]; then
  DO_COMMIT="true"
fi

TS="$(date +%Y%m%d-%H%M%S)"
CHANGE_DIR=".gsd/CHANGES"
CHANGE_FILE="${CHANGE_DIR}/${TS}.md"
TEMPLATE_CHANGE=".gsd/TEMPLATES/change-template.md"

mkdir -p "$CHANGE_DIR"

if [ -f "$TEMPLATE_CHANGE" ]; then
  cp "$TEMPLATE_CHANGE" "$CHANGE_FILE"
else
  cat > "$CHANGE_FILE" <<EOF
# Change Record ${TS}

## Summary
${SUMMARY}

## Reason

## Files changed
-

## Contracts touched
-

## Risks checked
-

## Verification
-

## Follow-up
-
EOF
fi

python3 - <<PY
from pathlib import Path
p = Path("${CHANGE_FILE}")
text = p.read_text(encoding="utf-8")
text = text.replace("## Summary\n...", "## Summary\n${SUMMARY}")
p.write_text(text, encoding="utf-8")
PY

echo "Created change record: ${CHANGE_FILE}"

if [ -f ".gsd/SCRIPTS/update-index.sh" ]; then
  bash ".gsd/SCRIPTS/update-index.sh"
fi

if [ "$DO_COMMIT" = "true" ]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git add .
    git commit -m "$SUMMARY"
    echo "Committed with message: $SUMMARY"
  else
    echo "Not a git repository; skipping commit"
  fi
fi
