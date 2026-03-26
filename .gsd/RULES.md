# Rules

## Core behavior
- Default to read-only unless implementation is explicitly requested.
- Never perform opportunistic refactors.
- Change the fewest files possible.
- Change the fewest lines possible.
- Preserve folder structure, naming, contracts, and architecture unless explicitly asked to change them.

## Contract protection
- Preserve API paths.
- Preserve request/response shapes.
- Preserve response envelope: { status, message, data } unless explicitly approved.
- Preserve auth/session/token behavior unless explicitly requested.
- Preserve env variable names unless explicitly requested.

## Inspection discipline
- Before implementation, inspect directly related files and direct dependencies.
- For backend features, inspect as relevant: route → controller → service → model → validation → middleware → docs.
- For frontend-impacting backend work, check expected frontend contract if available.
- For docs changes, verify docs against implementation, not the other way around.

## Workflow order
- Always follow phases in this order:
  1. discuss
  2. plan
  3. execute
  4. critique (cold context — new chat, no execute history)
  5. verify
  6. learn
- Do not skip phases on medium/large/risky tasks.
- On small safe tasks, discuss may be brief but still explicit.
- For prod hotfixes use PROMPTS/hotfix.md — shortened path with explicit risk warning.

## Retrieval discipline
- Before every phase, retrieve only relevant context.
- Use retrieval depth based on task size:
  - small: focused context only
  - medium: focused context + recent related changes + relevant knowledge
  - large/risky: broader project state + roadmap + wider history

## Memory hygiene
- Save only high-signal lessons.
- Do not append duplicates.
- Before adding to patterns.md or anti-patterns.md, read the full existing file and quote any overlap found.
- Prefer updating an existing pattern over adding a near-duplicate.
- Do not store one-off trivia from a session in MEMORY or KNOWLEDGE.
- DECISIONS = why we chose X over Y (reasoning archive).
- MEMORY = what to remember during implementation (operative rules).

## Output discipline
- State what changed.
- State what remained untouched.
- State risks and verification steps.
- Be precise, conservative, and evidence-based.

## Git discipline
- Prefer atomic commits per task or per implementation step.
- Change logs should be created for meaningful modifications.
- Commit messages should reflect the actual change summary.

## Scope gate
- If a refined task touches more than 3 files or 2 subsystems, flag this explicitly and ask user to confirm or narrow before proceeding to plan.
