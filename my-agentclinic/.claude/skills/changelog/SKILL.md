---
name: changelog
description: Create or update CHANGELOG.md in the project root from git commits, grouped under date headings. Run manually before merging a branch.
disable-model-invocation: true
---

# Changelog

Keep `CHANGELOG.md` in the project root (the directory containing `package.json`, not the git root, which is the parent course repo) up to date with what changed, one dated section per day.

## Format

```markdown
# Changelog

## 2026-10-29

- Make the web UI responsive (mobile-first) (5e2d046)
- Validate phases through Vitest and `npm run validate` (87e2952)

## 2026-10-28

- Add AgentClinic project scaffold (606575b)
```

- `# Changelog` title, then one `## YYYY-MM-DD` heading per date, **newest date first**.
- Under each date, one bullet per commit, newest first, ending with the short hash in parentheses. The hash is how this skill knows a commit is already listed.
- Bullets are short, plain-language summaries of what changed for the project (rewrite the commit subject if it's vague or noisy; wrap code, file and script names in backticks). Don't paste commit bodies.
- Skip merge commits and commits that only touch `CHANGELOG.md`.

## Steps

1. **Collect commits for this project only**, from the project root:

   ```bash
   git log --no-merges --date=short --pretty='%ad%x09%h%x09%s' -- .
   ```

   The `-- .` limits history to this directory. Dates are author dates.

2. **If `CHANGELOG.md` doesn't exist**, create it with every commit from step 1, grouped by date using the format above.

3. **If `CHANGELOG.md` exists**, read it, collect the short hashes already listed, and add only the commits from step 1 whose hash isn't there:
   - Put each one under its date heading, creating the heading in the right (newest-first) position if it's missing.
   - Never rewrite or reorder existing bullets; the file may contain hand edits.
   - If nothing is new, say so and stop.

4. **Uncommitted work:** if `git status --short -- .` shows changes, don't add bullets for them. Tell the user the changelog only covers committed work and that they may want to commit first.

5. **Edit with the Edit/Write tools**, never with shell redirection or `sed`.

6. **Report and offer to commit:** show the bullets you added, then ask whether to commit `CHANGELOG.md` on the current branch (the one about to be merged) with the message `Update changelog`. Don't commit or merge without the user's go-ahead.
