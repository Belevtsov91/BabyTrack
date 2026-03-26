#!/usr/bin/env bash
set -euo pipefail

SIZE="medium"
if [ "${1:-}" = "--size" ] && [ -n "${2:-}" ]; then
  SIZE="$2"
fi

TMP_FILE="$(mktemp)"

{
  echo "# Quick Context [size: ${SIZE}]"
  echo

  echo "## PROJECT"
  [ -f .gsd/PROJECT.md ] && cat .gsd/PROJECT.md || echo "(missing)"
  echo

  echo "## RULES"
  [ -f .gsd/RULES.md ] && sed -n '1,120p' .gsd/RULES.md || echo "(missing)"
  echo

  echo "## ARCHITECTURE"
  [ -f .gsd/ARCHITECTURE.md ] && cat .gsd/ARCHITECTURE.md || echo "(missing)"
  echo

  echo "## MEMORY"
  [ -f .gsd/MEMORY.md ] && cat .gsd/MEMORY.md || echo "(missing)"
  echo

  echo "## CURRENT TASK"
  [ -f .gsd/TASKS/current.md ] && cat .gsd/TASKS/current.md || echo "(missing)"
  echo

  if [ "$SIZE" = "medium" ] || [ "$SIZE" = "large" ]; then
    echo "## STATE"
    [ -f .gsd/STATE.md ] && cat .gsd/STATE.md || echo "(missing)"
    echo

    echo "## DECISIONS"
    [ -f .gsd/DECISIONS.md ] && cat .gsd/DECISIONS.md || echo "(missing)"
    echo

    echo "## RECENT CHANGES"
    if [ -d .gsd/CHANGES ]; then
      ls -1 .gsd/CHANGES 2>/dev/null | sort | tail -n 3 | while read -r f; do
        echo "### $f"
        cat ".gsd/CHANGES/$f"
        echo
      done
    else
      echo "(missing)"
    fi
    echo

    echo "## PATTERNS / ANTI-PATTERNS"
    [ -f .gsd/KNOWLEDGE/patterns.md ] && tail -n 30 .gsd/KNOWLEDGE/patterns.md || true
    echo
    [ -f .gsd/KNOWLEDGE/anti-patterns.md ] && tail -n 30 .gsd/KNOWLEDGE/anti-patterns.md || true
    echo
  fi

  if [ "$SIZE" = "large" ]; then
    echo "## ROADMAP"
    [ -f .gsd/ROADMAP.md ] && cat .gsd/ROADMAP.md || echo "(missing)"
    echo

    echo "## INDEX"
    [ -f .gsd/INDEX.md ] && cat .gsd/INDEX.md || echo "(missing)"
    echo

    echo "## FEEDBACK"
    [ -f .gsd/FEEDBACK.md ] && cat .gsd/FEEDBACK.md || echo "(missing)"
    echo
  fi

} > "$TMP_FILE"

if command -v pbcopy >/dev/null 2>&1; then
  cat "$TMP_FILE" | pbcopy
  echo "Copied context to clipboard via pbcopy [size: ${SIZE}]"
elif command -v xclip >/dev/null 2>&1; then
  cat "$TMP_FILE" | xclip -selection clipboard
  echo "Copied context to clipboard via xclip [size: ${SIZE}]"
elif command -v wl-copy >/dev/null 2>&1; then
  cat "$TMP_FILE" | wl-copy
  echo "Copied context to clipboard via wl-copy [size: ${SIZE}]"
elif command -v clip.exe >/dev/null 2>&1; then
  cat "$TMP_FILE" | clip.exe
  echo "Copied context to clipboard via clip.exe [size: ${SIZE}]"
else
  echo "No clipboard tool found. Context saved at: $TMP_FILE"
  exit 0
fi

rm -f "$TMP_FILE"
