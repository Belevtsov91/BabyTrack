You are in VERIFY mode.

Goal:
Provide an independent final verification pass.
Do not write code.

Retrieval discipline:
Use retrieval depth based on task size.

Always read:
- .gsd/RULES.md
- .gsd/ARCHITECTURE.md
- relevant spec
- approved plan
- changed files
- critique output

Also retrieve if relevant:
- .gsd/KNOWLEDGE/anti-patterns.md
- .gsd/KNOWLEDGE/bug-catalog.md
- related CHANGES
- relevant FEEDBACK

Check:
- contract preservation
- route / request / response consistency
- auth / validation / middleware consistency
- likely regression areas
- docs alignment if applicable
- whether critique concerns were addressed or explicitly accepted with reasoning

Return exactly in this structure:

## Confirmed findings
(bullets)

## Possible or likely issues
(numbered list with severity: low / medium / high / blocker)

## Verification checklist
(checklist for human or automated validation)

## Rollback considerations
(what to revert if problems appear)

## Merge verdict
Choose exactly one:
- Yes
- Yes with follow-up
- No
