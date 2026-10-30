---
name: feature-spec
description: Start the next roadmap phase of AgentClinic. Find the next phase in specs/roadmap.md, create a git branch for it, interview the user with AskUserQuestion, and then write specs/YYYY-MM-DD-feature-name/ with requirements.md, plan.md and validation.md. Use this whenever the user wants to spec, plan, scope or "start" the next phase or feature (for example "spec the next phase", "what's next on the roadmap, let's plan it", "write the feature spec", "set up Phase 14"), even if they don't say "feature spec". Don't use it to implement a phase that already has a spec. That's "implement the plan".
---

# Feature spec

Turn the next roadmap phase into a feature spec that a student (or Claude) can implement in one sitting. The spec has three files, and the user shapes it through one grouped interview before anything is written.

The project's constitution lives in `specs/`:
- `specs/mission.md`: why we build, who for (course students), and the "small phases" rule.
- `specs/tech-stack.md`: the stack and its conventions, choices for the next features, and known gaps.
- `specs/roadmap.md`: the phases in order. A finished phase has `✅ Done` in its heading.

## 1. Find the next phase

Read `specs/roadmap.md`. The next phase is the first `### Phase N: ...` heading without `✅ Done`. Also skip any phase that already has a spec directory under `specs/`, because it's already been specced and is waiting to be implemented.

- If every phase is done, say so and stop. Suggest picking something from the roadmap's "Later" section or from `TODO.md`.
- Tell the user which phase you picked, in one line, before going further.

## 2. Make a branch

- Check `git status`. If there are uncommitted changes, ask the user what to do before switching branches, because they might be in the middle of something.
- Branch from the current branch (normally `main`). Name it `phase-<N>-<feature-name>`, where `<feature-name>` is the phase title in kebab-case, for example `phase-13-store-feedback`.
- If that branch already exists, check it out instead of creating a new one, and say so.

## 3. Gather context before asking

Good questions come from knowing the code. Before the interview:

- Read `specs/mission.md` and `specs/tech-stack.md`.
- Look at the most recent spec directory under `specs/` (`YYYY-MM-DD-*`) to match its tone and level of detail.
- Look at the code this phase touches: for example `src/db/schema.sql`, the matching `src/db/*.ts` module, `src/types.ts`, `src/validation.ts`, the routes in `src/app.tsx` / `src/staff.tsx`, the views, the seed and the tests. Note the existing patterns the new code should follow, and anything the roadmap entry leaves open.

## 4. Interview: one AskUserQuestion call, grouped on the 3 files

Before writing anything to disk, call **AskUserQuestion once** with three questions, one for each file:

| Header | File | What to ask |
| --- | --- | --- |
| `Scope` | requirements.md | What's in and out, and the key data or behaviour decisions the roadmap leaves open (fields, rules, edge cases). |
| `Plan` | plan.md | How far this phase goes and how to slice it, for example strictly the roadmap entry, a smaller slice, or merged with the next phase. |
| `Validation` | validation.md | How we'll know it's mergeable: which tests, manual browser/curl/sqlite checks, and what the scope check forbids. |

How to write the questions well:
- Put the phase number and name in each question, because the user may only see the question dialog.
- Give 2–4 concrete options based on what you found in the code: real table, route and function names, not generic choices.
- Put your recommendation first, with "(Recommended)" after its label, and fit it to the mission and tech stack (small phases, no new dependencies unless needed, rules in the database).
- Wait for the answers. They are the decisions the spec records. The interview is the point of this skill, so don't skip it, even if the answers seem obvious.

## 5. Write the spec

Create `specs/<today YYYY-MM-DD>-<feature-name>/` (same `<feature-name>` as the branch, without the `phase-N-` prefix) with these three files. Use the user's answers. Wherever you decide something they didn't ask about, write it down as a decision.

### requirements.md

```markdown
# Phase N — <Title>: Requirements

## Context
Why this phase exists (link it to the mission), where it sits among nearby phases, and what changes for the user.

## Scope
### In scope
### Out of scope
(name the later phases that cover the excluded items)

## Data / Behaviour
Tables, types, routes or rules, in concrete terms (a table of columns, a type, or a list of routes).

## Decisions
- **Short decision.** One or two sentences on why.

## References
Links to specs/mission.md, specs/tech-stack.md and specs/roadmap.md, each with the part that applies.
```

### plan.md

Numbered task groups with numbered sub-tasks (`## 1. Schema`, then `1.1.`, `1.2.`, ...). Name the real files and functions. Each group should include its own tests, not leave them all to the end. The last group always does three things: run `npm run validate`, go through `validation.md`, and mark the phase `✅ Done` in `specs/roadmap.md` before committing.

### validation.md

```markdown
# Phase N — <Title>: Validation

The phase is ready to merge when every check below passes.

## Automated
- [ ] `npm run validate` exits 0
- [ ] (each specific test that must exist and pass)

## Manual <browser | curl | database> check
- [ ] (concrete steps with commands or URLs, and what you should see)

## Scope guard
- [ ] (what must not have been added: later-phase features, new dependencies, convention breaks)
```

Write checklist items as facts someone can check, not as hopes.

## 6. Hand off

Don't implement the phase or commit. The user reviews the spec first and usually commits it separately. Finish with a short summary:
- the branch name and the spec directory
- a line or two for each file covering the key decisions
- any decision you made that the user didn't explicitly choose, so they can correct it
