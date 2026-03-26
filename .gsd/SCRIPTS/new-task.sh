#!/usr/bin/env bash
set -euo pipefail

if [ $# -eq 0 ]; then
  echo 'Usage: ./.gsd/SCRIPTS/new-task.sh "Short task description"'
  exit 1
fi

DESC="$*"
TS="$(date +%Y%m%d-%H%M%S)"
SLUG="$(printf '%s' "$DESC" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\{2,\}/-/g' | sed 's/^-//' | sed 's/-$//')"

TASK_DIR=".gsd/TASKS"
SESSION_DIR=".gsd/SESSIONS"
SPEC_DIR=".gsd/SPECS"
TEMPLATE_TASK=".gsd/TEMPLATES/task-template.md"
TEMPLATE_SESSION=".gsd/TEMPLATES/session-template.md"
STATE_FILE=".gsd/STATE.md"
CURRENT_FILE=".gsd/TASKS/current.md"

TASK_FILE="${TASK_DIR}/active-${TS}-${SLUG}.md"
SESSION_FILE="${SESSION_DIR}/${TS}-session-${SLUG}.md"

mkdir -p "$TASK_DIR" "$SESSION_DIR" "$SPEC_DIR"

if [ -f "$TEMPLATE_TASK" ]; then
  cp "$TEMPLATE_TASK" "$TASK_FILE"
else
  cat > "$TASK_FILE" <<EOF
# Active Task: ${DESC}

## Original user request
${DESC}

## Refined task after DISCUSS

## Related spec
.gsd/SPECS/

## Roadmap alignment
- [ ] Now
- [ ] Next
- [ ] Later
- [ ] Not on roadmap

## Phase status
- [ ] discuss
- [ ] plan
- [ ] execute
- [ ] critique
- [ ] verify
- [ ] learn

## Current phase
discuss

## Cancelled
- [ ] No
- [ ] Yes — reason:

## Remaining concerns
- none yet
EOF
fi

if [ -f "$TEMPLATE_SESSION" ]; then
  cp "$TEMPLATE_SESSION" "$SESSION_FILE"
else
  cat > "$SESSION_FILE" <<EOF
# Session ${TS}-${SLUG}

## Goal
${DESC}

## Started
$(date -u +"%Y-%m-%d %H:%M UTC")

## Phase progress
- [ ] discuss
- [ ] plan
- [ ] execute
- [ ] critique
- [ ] verify
- [ ] learn

## Inspected
-

## Decisions
-

## Changes
-

## Verification
-

## Remaining concerns
-
EOF
fi

python3 - <<PY
from pathlib import Path

task_file = Path("${TASK_FILE}")
session_file = Path("${SESSION_FILE}")
state_file = Path("${STATE_FILE}")
current_file = Path("${CURRENT_FILE}")
desc = """${DESC}"""
branch = "feature/${SLUG}"

state_text = f"""# State

## Active area
{desc}

## Current branch
{branch}

## Current active task
{task_file.as_posix()}

## Known risks
- none recorded

## Last touched areas
- none recorded

## Notes
- update this file when starting a new task
- keep concise and current
"""
state_file.write_text(state_text, encoding="utf-8")

current_text = f"""# Current Task

## Active file
{task_file.as_posix()}

## Short description
{desc}

## Current phase
discuss

## Notes
- session: {session_file.as_posix()}
"""
current_file.write_text(current_text, encoding="utf-8")
PY

echo "Created task:    ${TASK_FILE}"
echo "Created session: ${SESSION_FILE}"
echo "Updated:         ${STATE_FILE}"
echo "Updated:         ${CURRENT_FILE}"

if [ -f ".gsd/SCRIPTS/update-index.sh" ]; then
  bash ".gsd/SCRIPTS/update-index.sh"
fi

echo "Next step: run DISCUSS"
