#!/usr/bin/env bash
set -euo pipefail

# Bootstraps .gsd/ workflow system into any project directory.
# Usage: bash ~/.claude/gsd/SCRIPTS/bootstrap.sh
# Run from the project root.

GSD_GLOBAL="$HOME/.claude/gsd"
GSD_LOCAL=".gsd"

echo "Bootstrapping .gsd/ into $(pwd)..."

# Create directory structure
mkdir -p \
  "${GSD_LOCAL}/PROMPTS" \
  "${GSD_LOCAL}/TEMPLATES" \
  "${GSD_LOCAL}/SCRIPTS" \
  "${GSD_LOCAL}/KNOWLEDGE" \
  "${GSD_LOCAL}/TASKS" \
  "${GSD_LOCAL}/SESSIONS" \
  "${GSD_LOCAL}/CHANGES" \
  "${GSD_LOCAL}/SPECS" \
  "${GSD_LOCAL}/ARCHIVE/CHANGES" \
  "${GSD_LOCAL}/ARCHIVE/SESSIONS"

# Copy global RULES
cp "${GSD_GLOBAL}/RULES.md" "${GSD_LOCAL}/RULES.md"
echo "  Copied RULES.md"

# Copy PROMPTS
cp "${GSD_GLOBAL}/PROMPTS/"*.md "${GSD_LOCAL}/PROMPTS/"
echo "  Copied PROMPTS/"

# Copy TEMPLATES
cp "${GSD_GLOBAL}/TEMPLATES/"*.md "${GSD_LOCAL}/TEMPLATES/"
echo "  Copied TEMPLATES/"

# Copy SCRIPTS
cp "${GSD_GLOBAL}/SCRIPTS/"*.sh "${GSD_LOCAL}/SCRIPTS/"
chmod +x "${GSD_LOCAL}/SCRIPTS/"*.sh
echo "  Copied SCRIPTS/"

# Create project-specific stubs (only if they don't exist)
create_stub() {
  local file="$1"
  local content="$2"
  if [ ! -f "$file" ]; then
    echo "$content" > "$file"
    echo "  Created $file"
  else
    echo "  Skipped $file (already exists)"
  fi
}

create_stub "${GSD_LOCAL}/PROJECT.md" "# Project

## Name
$(basename "$(pwd)")

## Purpose
(describe what this project does and its primary goal)

## Live
(URL if deployed)

## Stack
(list tech stack)

## Current status
(active / maintenance / archived)
"

create_stub "${GSD_LOCAL}/ARCHITECTURE.md" "# Architecture

## Overview
(describe high-level structure)

## Directory structure
\`\`\`
(paste key folders/files)
\`\`\`

## Key constraints
(important architectural decisions and boundaries)
"

create_stub "${GSD_LOCAL}/MEMORY.md" "# Memory

Operative rules — what to remember during implementation.
For reasoning archive (why we chose X) see DECISIONS.md.

- (add project-specific operative rules here)
"

create_stub "${GSD_LOCAL}/DECISIONS.md" "# Decisions

Reasoning archive — why we chose X over Y.
For operative implementation rules see MEMORY.md.

- (add reasoning decisions here)
"

create_stub "${GSD_LOCAL}/KNOWLEDGE/patterns.md" "# Patterns

Reusable high-signal patterns observed in this project.

---
"

create_stub "${GSD_LOCAL}/KNOWLEDGE/anti-patterns.md" "# Anti-patterns

Patterns to avoid in this project.

---
"

create_stub "${GSD_LOCAL}/KNOWLEDGE/bug-catalog.md" "# Bug Catalog

Known bugs, past incidents, and their fixes.

---
"

create_stub "${GSD_LOCAL}/STATE.md" "# State

## Active area
(current focus)

## Current branch
(branch name)

## Current active task
(path to active task file)

## Known risks
- none recorded

## Last touched areas
- none recorded

## Notes
- update this file when starting a new task
"

echo ""
echo "Done. .gsd/ is ready in $(pwd)"
echo ""
echo "Next steps:"
echo "  1. Fill in .gsd/PROJECT.md"
echo "  2. Fill in .gsd/ARCHITECTURE.md"
echo "  3. Run: bash .gsd/SCRIPTS/new-task.sh \"Your first task\""
