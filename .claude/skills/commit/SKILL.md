---
name: commit
description: This skill should be used when the user asks to "commit", "commit changes", "commit the diff", or otherwise wants the current working-tree changes turned into a git commit with an appropriate message. Covers inspecting the diff and writing a concise commit message in this project's style.
version: 0.1.0
---

# Commit the current changes

Inspect the working tree and create a single git commit with a short, descriptive message.

## Steps

1. Review what changed before writing anything:
   - `git status --short` to see tracked + untracked files.
   - `git diff` (and `git diff --stat`) for staged/unstaged content. Read large diffs
     in full so the message reflects the actual intent, not just file names.
   - Include relevant untracked files (new components, icons, skills) when they belong
     with the change.

2. Stage everything with `git add -A` unless the user scoped the commit to specific
   files.

3. Write the commit message:
   - One concise summary line in the imperative mood (e.g. "Redesign survey list cards").
     Keep it short — no scope prefixes, no ticket numbers unless the user gives them.
   - Optionally add a brief body of bullet points for multi-part changes, one line per
     logical change.
   - **Never** add `Co-Authored-By: Claude` or any other Claude/AI attribution trailer.

4. Commit with `git commit -m "..."`. A `lint-staged` pre-commit hook runs prettier;
   if it modifies files, the commit still succeeds with the formatted content.

5. Confirm with `git log --oneline -1`.

## Project facts

- Do **not** push or open a
  PR unless the user explicitly asks — this skill only creates the local commit.
- The repo has a `lint-staged` hook (prettier on `*.{js,jsx,ts,tsx,json}`). Expect its
  output during commit; it is not an error.
- Keep messages short and factual. Match the existing history style: a capitalized
  imperative summary line, optional `-` bullet body.