---
name: create-icon
description: This skill should be used when the user asks to "make an icon", "create an icon", "add an icon", or convert a raw SVG (often pasted from Figma) into a reusable icon component in client/src/components/icons/. Covers the MUI SvgIcon wrapper pattern used across the project.
version: 0.1.0
---

# Create an icon component from a raw SVG

Turn a pasted `<svg>` (usually copied from Figma) into a `*Icon.tsx` component in
`client/src/components/icons/` that matches the existing icon convention.

## Project facts

- Icon components live in `client/src/components/icons/`, one file per icon, named
  `<Name>Icon.tsx` with a matching default-exported component `<Name>Icon`.
- Every icon wraps its paths in MUI's `SvgIcon`, so the icon inherits color via
  `currentColor` and sizing via the MUI `fontSize` prop. The boilerplate is:
  ```tsx
  import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

  export default function <Name>Icon(props: SvgIconProps) {
    return (
      <SvgIcon {...props} viewBox="0 0 12 12">
        <path
          d="..."
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </SvgIcon>
    );
  }
  ```

## Procedure

1. **Check it doesn't already exist** — look for `client/src/components/icons/<Name>Icon.tsx`.
   If it does, ask whether to overwrite rather than duplicating.
2. **Copy the `viewBox`** from the source `<svg>` onto `SvgIcon` (e.g. `viewBox="0 0 12 12"`).
   Drop the outer `<svg>` wrapper, its `width`/`height`/`xmlns`/`fill` — `SvgIcon`
   supplies those.
3. **Keep the `<path>` `d` value(s) verbatim.** Preserve all paths from the source.
4. **Normalize colors to theme-driven values:**
   - A stroked icon: replace the hardcoded `stroke="#..."` with `stroke="currentColor"`
     and keep `fill="none"`.
   - A filled icon: replace the hardcoded `fill="#..."` with `fill="currentColor"`.
   - **Delete the `style="..."` attribute** entirely (Figma emits `display-p3`/
     `stroke-opacity` inline styles — these override `currentColor` and must be removed).
   - Drop redundant `stroke-opacity="1"` / `fill-opacity="1"`.
5. **Convert SVG attributes to JSX camelCase:** `stroke-linecap` → `strokeLinecap`,
   `stroke-linejoin` → `strokeLinejoin`, `stroke-width` → `strokeWidth`,
   `fill-rule` → `fillRule`, `clip-rule` → `clipRule`.
6. **Do not hardcode `width`/`height` or `strokeWidth`** unless the design needs a fixed
   stroke — let MUI control the size. Match a sibling icon if unsure (e.g.
   `PadlockIcon.tsx` for a stroked icon, `PersonIcon.tsx` for a filled one).

## Rules

- One icon per file; filename, component name, and default export must all match.
- Never leave a hardcoded hex color or a Figma `style` attribute in the output.
- Preserve the source `viewBox` exactly — getting it wrong distorts the icon.
