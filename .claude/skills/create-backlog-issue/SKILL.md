---
name: create-backlog-issue
description: This skill should be used when the user asks to "create an issue", "file an issue", "add a backlog item", "add this to the project backlog", or otherwise wants a new backlog item filed on a GitHub Project board with a given status. Creates a project **draft issue** (not a repo issue) so the item lives only on the board, not in any codebase repo. Covers writing the item's content and wiring it into the project board via `gh`.
version: 0.2.0
---

# Create a backlog item on a project board

Create a GitHub Project (v2) **draft issue** — an item that lives only on the
board, with no associated repo — and set it to a chosen status column (e.g.
"Backlog"), using the `gh` CLI end to end.

Draft issues are used deliberately here instead of real repo issues: the
project board is a separate, cross-cutting space, and filing real issues in a
codebase repo would clutter it with items that aren't yet ready for
implementation. Do not use `gh issue create` for this — if the user wants an
actual repo issue instead of a board-only draft, confirm that explicitly
before falling back to it.

## Step 1: Write the content

- If a relevant repo has an issue template (check its `.github/ISSUE_TEMPLATE/`),
  follow its structure and section headings exactly rather than inventing a new
  shape, even though the result won't be a repo issue.
- Match the language and tone of existing issues/templates (e.g. if the
  template and existing issues are in Finnish, write the new one in Finnish
  too).
- Make it readable by a coding agent later, not just a human:
  - Scope it to a single concern.
  - Write acceptance criteria as a markdown checkbox list (`- [ ]`), not prose —
    checkboxes are both human- and machine-trackable.
  - Reference concrete file paths (and line numbers or function names where it
    helps) for anything you already know needs to change. Look at the actual
    code before writing these — don't guess paths.
  - Note explicit out-of-scope items or risks (e.g. "this is a breaking change
    for external links") if relevant.
  - If a similar change was already made elsewhere in the codebase, reference
    that commit/PR as a pattern to follow.

## Step 2: Find the right project

List the org/user's projects and ask the user which one to use if it isn't
obvious from context:

```bash
gh project list --owner <owner>
```

This prints `<number> <title> <state> <id>` rows. Note the project **number**.

## Step 3: Create the draft issue on the project

```bash
gh project item-create <project-number> --owner <owner> \
  --title "<title>" \
  --body "<body>" \
  --format json
```

The JSON response's `.id` is the **item ID**, needed in step 4.

## Step 4: Set the status field

Project field/option IDs are per-project and per-org — never hardcode them.
Look them up each time:

```bash
gh project field-list <project-number> --owner <owner> --format json
```

Parse the JSON for the field named `Status` (type `ProjectV2SingleSelectField`)
to get its `id`, and find the option whose `name` matches the target status
(e.g. `"Backlog"`) to get that option's `id`. Also fetch the project's node ID:

```bash
gh project view <project-number> --owner <owner> --format json   # → .id
```

Then, with the item ID from step 3, set the field:

```bash
gh project item-edit \
  --id <item-id> \
  --project-id <project-node-id> \
  --field-id <status-field-id> \
  --single-select-option-id <target-option-id>
```

## Notes

- All of the IDs in steps 3-4 (project node ID, field ID, option ID, item ID)
  are opaque GraphQL node IDs specific to one project — always derive them live
  with the commands above rather than reusing IDs from a previous run or a
  different project.
- If the target status name doesn't exist as an option on the project's Status
  field, tell the user instead of picking the closest match.
- If any `gh project` command fails with `error: your authentication token is
  missing required scopes [project]`, the local `gh` token needs the `project`
  scope. This requires an interactive browser/device auth flow, so **ask the
  user to run it themselves** (e.g. `gh auth refresh -s project`) rather than
  attempting it — don't retry until they confirm it's done.
