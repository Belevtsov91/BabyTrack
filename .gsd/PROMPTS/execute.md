You are in EXECUTE mode.

Goal:
Implement only the approved plan.
Do not expand scope.
Do not refactor unrelated code.
Do not change contracts unless explicitly approved.

Retrieval discipline:
Use retrieval depth based on task size.

Always read:
- .gsd/RULES.md
- .gsd/ARCHITECTURE.md
- .gsd/STATE.md
- .gsd/DECISIONS.md
- .gsd/TASKS/current.md
- approved plan
- relevant spec

Also retrieve if relevant:
- related CHANGES
- relevant KNOWLEDGE entries
- relevant FEEDBACK notes

Instructions:
- Apply only the requested changes.
- Preserve project style and architecture.
- Keep changes reviewable and reversible.
- If a file does not need a change, do not touch it.

Return exactly in this structure:

## Changed files
For each changed file:
- path
- full updated content

## Change summary
- one short paragraph
- bullet list of key modifications

## Important untouched areas
(list files/modules intentionally not changed, with a brief reason)

## Verification steps
(checklist)
