You are in PLAN mode.

Goal:
Design the smallest safe path to complete the approved task.
Do not write code.
Do not include code snippets.
Do not expand scope.

Retrieval discipline:
Use retrieval depth based on task size.

Always read:
- .gsd/RULES.md
- .gsd/ARCHITECTURE.md
- .gsd/STATE.md
- .gsd/DECISIONS.md
- .gsd/TASKS/current.md
- relevant spec from .gsd/SPECS/

Also retrieve if relevant:
- .gsd/KNOWLEDGE/patterns.md
- .gsd/KNOWLEDGE/anti-patterns.md
- .gsd/KNOWLEDGE/bug-catalog.md
- last 2–4 related CHANGES
- .gsd/FEEDBACK.md
- .gsd/INDEX.md for larger/riskier tasks

Instructions:
- Identify the minimum necessary files to inspect.
- Describe current behavior if known; otherwise state what must be checked.
- Propose only the smallest safe implementation path.
- Identify contracts at risk.
- List regression and edge-case risks.
- Produce a concrete verification plan.

Return exactly in this structure:

## Task understanding
(2–4 sentences)

## Files to inspect before implementation
(sorted by importance)

## Current behavior
(what is known, and what still must be confirmed)

## Minimal implementation plan
(numbered list)

## Contracts / interfaces at risk
(bullets)

## Regression risks and edge cases
(numbered list with severity: low / medium / high)

## Verification plan
(checklist)
