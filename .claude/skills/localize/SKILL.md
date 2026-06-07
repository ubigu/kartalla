---
name: localize
description: This skill should be used when the user asks to "localize", "add a translation", "translate hardcoded text", "add missing translation", or replace a hardcoded UI string with a `tr.*` lookup. Covers the client/src/locales/{fi,en,se}.json locale files and the useTranslations() pattern.
version: 0.1.0
---

# Localize hardcoded UI text

Replace a hardcoded user-facing string in the client with a translation key, and add
that key to all three locale files.

## Project facts

- Locale files live in `client/src/locales/`: `fi.json`, `en.json`, `se.json`.
- **`fi.json` (Finnish) is the source of truth.** Hardcoded strings in the code are
  almost always Finnish. `en.json` (English) and `se.json` (Swedish) mirror its key
  structure exactly — same nesting, same keys.
- Translation types are **inferred from the JSON imports** in
  `client/src/stores/TranslationContext.tsx`. There is **no `.d.ts` to update** — adding
  a key to the JSON makes `tr.<Section>.<key>` immediately type-valid.
- Components read translations via the hook:
  ```ts
  const { tr } = useTranslations(); // from '@src/stores/TranslationContext'
  ```
  and reference strings as `tr.<Section>.<key>` (e.g. `tr.EditSurveyInfo.address`).

## Procedure

For each hardcoded string:

1. **Locate the string** and the component's surrounding `tr.*` usage to learn which
   section it belongs to (e.g. a field in `EditSurveyBasicSettings` uses
   `tr.EditSurveyInfo.*`). Reuse the existing section — do not invent a new top-level
   section unless none fits.
2. **Choose a key name**: short, camelCase, descriptive of meaning (not the value).
   Check the section first — the key may already exist and just needs wiring up.
3. **Add the key to all three locale files** in the same section, keeping it at the same
   position in each file so the three stay in sync:
   - `fi.json`: the original Finnish string verbatim.
   - `en.json`: the English translation.
   - `se.json`: the Swedish translation.
4. **Replace the hardcoded usage** with `tr.<Section>.<key>`. Confirm the component
   already has `const { tr } = useTranslations();` — add it if missing.

## Rules

- Never leave a Finnish value sitting in `en.json` or `se.json` — translate it.
- All three files must end up with the exact same set of keys.
- Don't touch unrelated keys or reorder existing ones.

## Running this on Haiku

This is mechanical, low-risk work, so run the actual edits on a fast/cheap model.
Spawn a Haiku subagent and give it the target string(s) plus this procedure:

```
Agent(
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Localize hardcoded string",
  prompt: "<file:line and the exact string to localize>. Follow .claude/skills/localize/SKILL.md exactly."
)
```

For a single trivial string you may just do it inline; for several, delegate the batch.
