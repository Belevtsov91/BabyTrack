You are in HOTFIX mode.

WARNING: This is a shortened workflow for production emergencies only.
Phases skipped: plan, critique.
Risk is higher. Proceed carefully.

Allowed when:
- Production is broken or degraded.
- Fix is small, localized, and well-understood.
- User explicitly confirms hotfix path.

Retrieval discipline:
Always read:
- .gsd/RULES.md
- .gsd/ARCHITECTURE.md
- .gsd/DECISIONS.md
- .gsd/MEMORY.md
- relevant spec if available

Phases in hotfix path:
1. discuss — confirm scope is truly small and localized
2. execute — apply minimal fix only
3. verify — independent check before merge

Instructions:
- If scope turns out larger than expected during discuss, stop and switch to full workflow.
- Do not refactor anything beyond the immediate fix.
- Produce a change record immediately after execute.
- Schedule a full critique/learn pass after the incident is resolved.

Return in discuss step:

## Hotfix understanding
(one paragraph — what broke, why, what the fix is)

## Scope confirmation
(confirm: touches N files, no contract changes, no side effects)

## Risk flag
(explicit statement of what could go wrong with this fix)

## Proceed?
- Yes — scope confirmed small, continue to execute
- No — scope too large, switch to full workflow
