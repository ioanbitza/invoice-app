---
name: ui-ux
user-invocable: false
paths: ["src/ui/**", "index.html", "styles.css"]
description: The UI rules a builder reads before a UI slice (files under src/ui/, index.html, styles.css), the design system a UI slice applies from the approved docs/UI-SPEC.md (tokens, type scale, spacing, components and their states), and the UX and design manual checks the slice adds to docs/MANUAL-CHECKS.md. Adapted from UI UX Pro Max (MIT). Used by implement-slice, build-slices, the builder agent and the ux-designer.
---

# UI and UX rules for a slice

Adapted from UI UX Pro Max by nextlevelbuilder (https://github.com/nextlevelbuilder/ui-ux-pro-max-skill, MIT), reduced to what a small plain-JavaScript app needs: its ten priority categories, kept in its order, with one or two checks each. The full skill has a searchable database of styles, palettes, fonts and 119 UX guidelines; this file carries only the rules a slice must keep, and says when to use the full one.

## The checklist, run on every UI slice, in this order
1. **Accessibility.** Text against its background at least 4.5:1 (large text 3:1). A visible focus ring on every interactive element; never `outline: none` without a replacement. Every input has a `<label for>`; an icon-only button has an `aria-label`. Everything reachable and usable with the keyboard alone, in the visual order.
2. **Touch and interaction.** Targets at least 44 by 44 px with 8 px between them. A button that starts work shows it (disabled plus a visible state) until the work ends. Nothing depends on hover alone.
3. **Layout.** Mobile first: the page works at 320 px wide with no horizontal scroll, then widens. `<meta name="viewport" content="width=device-width, initial-scale=1">`, zoom never disabled.
4. **Typography and color.** Body text 16 px or more, line-height 1.5. Colors are semantic tokens defined once in `styles.css` (`--color-text`, `--color-surface`, `--color-error`, ...); no raw hex in a component or in `src/ui/`. Meaning never by color alone: an error has text or an icon too.
5. **Forms and feedback.** A visible label on every field, not a placeholder. The error next to the field it belongs to, saying what is wrong and how to fix it; helper text under a field that needs it. Validate on blur or submit, not on every keystroke.
6. **Empty, error and loading states.** Every list and every form has them: an empty list says what to do first, a failed save says what failed and what to do, a wait longer than a moment shows it.
7. **Navigation.** Back is predictable: it returns where the user came from and keeps what was typed or filtered. The current place is marked.
8. **Motion.** Short, with a meaning (what moved and why); `transform` and `opacity` only; nothing moves when `prefers-reduced-motion: reduce` is set.
9. **Icons.** No emoji as icons; inline SVG only, one set, decorative icons `aria-hidden="true"`.
10. **Performance.** No layout shift: images and async content get their space reserved; no work on the main thread the user has to wait for.

Rules 1, 3, 4 and 5 are the ones a user hits first; when a slice cannot keep one of them inside its files, stop and say so in the report (`NEEDS HUMAN`), do not widen the slice.

## The manual checks a UI slice adds
A unit test cannot cover these, so the slice adds them to `docs/MANUAL-CHECKS.md`, unticked, as `- [ ] UX: ...` lines next to its `- [ ] R-xx: ...` lines. Six lines, always:

```
- [ ] UX: keyboard only, from the first field to the outcome, focus visible at every step
- [ ] UX: 200% browser zoom, nothing cut off, no horizontal scroll
- [ ] UX: contrast 4.5:1 on text, 3:1 on large text and borders (browser devtools)
- [ ] UX: empty states: an empty list and an empty form say what to do
- [ ] UX: a validation error appears next to its field and says how to fix it
- [ ] UX: 320 px wide, every screen of the slice, no horizontal scroll
```

A `UX:` line carries no requirement id, so `tools/trace.mjs` and the gate count it neither as a requirement nor as an orphan; the human ticks it like the others before the pull request. A UI slice committed without these lines is a `contract` finding (advisory) in the review (`finder-contract` item 10). The four design checks of the next section are added in the same way, after these six.

## The design system a UI slice applies
A UI slice ships a finished interface, not bare HTML with default blue links and a grey button. What "finished" means is not the builder's taste: it is written in `docs/UI-SPEC.md`, the design contract the ux-designer proposes (`/sdlc:design-ui`, from `templates/UI-SPEC.md`) and the human approves (`Status: approved` on line 3; from then on it is frozen like the plan, and a UI slice is built against it). The builder reads it together with this file before the first UI slice and applies it as follows.

1. **Tokens, in one place.** Every design value is a custom property declared in the `:root` block at the top of `styles.css`, with the names and values `docs/UI-SPEC.md` gives: color (`--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-primary`, `--color-primary-text`, `--color-border`, `--color-danger`, `--color-success`, `--color-warning`, `--color-focus`), the type scale (`--text-xs` to `--text-2xl`), the spacing scale (`--space-1` to `--space-8`), radius (`--radius-sm`, `--radius-md`, `--radius-lg`), shadow (`--shadow-sm`, `--shadow-md`), and motion (`--duration-fast`, `--duration-base`, `--easing`). No raw color (`#`, `rgb(`, `hsl(`, a named color) appears outside the `:root` block; a component says `var(--color-border)` or nothing. A value the spec does not define is a `NEEDS HUMAN`, not a new token.
2. **Type scale and font stack.** One stack with system fallbacks, from the spec, for example `--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` and `--font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace` for numbers in tables. A ratio-based scale of six steps at most (`--text-xs` 0.75rem, `--text-sm` 0.875rem, `--text-base` 1rem, `--text-lg` 1.125rem, `--text-xl` 1.25rem, `--text-2xl` 1.5rem, or the spec's values); body at `--text-base`, 16 px or more, line-height 1.5; headings use the scale, never an ad hoc `font-size: 22px`. A web font only when an ADR allows the network fetch (JS-18); otherwise system fonts.
3. **Spacing rhythm on a 4 px base.** `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 24px, `--space-6` 32px, `--space-7` 48px, `--space-8` 64px. Margins, paddings and gaps use these and nothing else; related things sit closer (`--space-2` between a label and its field) than unrelated ones (`--space-6` between form sections). Page content has a max width (the spec says which, 72rem by default) and is centred.
4. **Components and their states.** The slice builds the components the spec names, with every state the spec lists:
   - buttons: primary (filled `--color-primary`), secondary (outlined), destructive (`--color-danger`), link (text only); each at the same height and padding;
   - inputs: a visible `<label>` above, optional helper text under, an error line under that in `--color-danger` with an icon or prefix, `aria-describedby` wiring the field to both; the same look for `<input>`, `<select>` and `<textarea>`;
   - tables: text left, numbers and money right (`font-variant-numeric: tabular-nums`), a header row that differs from the body, rows separated by a zebra tint or a divider rule (the spec picks one), a sticky header when the table scrolls;
   - cards or panels: forms and detail views sit on a `--color-surface` panel with `--radius-md`, a border or `--shadow-sm`, padding `--space-5`;
   - tabs: the selected tab marked by more than color (an underline or a filled background and `aria-selected="true"`);
   - banners: info, success, warning, danger, each with an icon, a text and, when there is one, one action; dismissible ones have a labelled close button;
   - empty states: a sentence that says what this list or screen is for and one primary action that starts it; never a blank area.
5. **Interactive states on every control.** Hover, `:focus-visible` (a 2 px ring in `--color-focus` with a 2 px offset, never `outline: none` alone), active (a slight darkening or translate), and disabled (`--color-text-muted`, `cursor: not-allowed`, `aria-disabled` or the `disabled` attribute, no hover change); a control that is doing work shows it (disabled plus a label change or a spinner) until it is done. Links in text are underlined, not color alone.
6. **Density in data tables.** Row height 40 px on desktop, 48 px on touch widths; cell padding `--space-2` by `--space-3`; at most seven columns at desktop width, the rest in the detail screen; a long text column truncates with an ellipsis and a `title`; actions in the last column as icon buttons with `aria-label`, or a single overflow menu.
7. **Responsive.** 320 px first: tables become stacked cards or gain horizontal scroll inside their own container (the spec says which per screen); the form is one column; the navigation collapses as the spec draws it. Desktop from 64rem: the layout the spec sketches.
8. **Motion.** `--duration-fast` 120ms for hover and focus, `--duration-base` 200ms for panels and banners, `transform` and `opacity` only, and a `@media (prefers-reduced-motion: reduce)` block that sets both durations to 0ms.

When `docs/UI-SPEC.md` is missing, or is present but not approved, the builder does not design by improvisation: it writes `NEEDS HUMAN: docs/UI-SPEC.md is missing or not approved; run /sdlc:design-ui and approve it before this slice` in its report and stops before touching `styles.css` or a file under `src/ui/`. A slice that was planned against an approved spec and finds a screen the spec does not describe writes `NEEDS HUMAN` naming the screen and builds the others.

### The design checks a UI slice adds
After the six `UX:` lines above, four more `- [ ] UX: ...` lines, so a UI slice adds ten lines in all:

```
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
```

## When the full UI UX Pro Max skill is installed
The full skill lives at `$HOME/.claude/skills/ui-ux-pro-max/` when installed; neither this file nor the ux-designer needs it. The ux-designer may use it while writing `docs/UI-SPEC.md`, for a decision this file does not settle, a style or a palette, with one search per question:

```sh
python3 "$HOME/.claude/skills/ui-ux-pro-max/scripts/search.py" "<query>" --domain ux
```

(`--design-system` for a whole direction, `--domain color`, `--domain typography` and `--domain style` for a palette, a font pairing, a style.) A style or palette choice is a design decision the human approves in `docs/UI-SPEC.md`, not the builder's: the tokens in `styles.css` follow the approved spec. The builder does not run the search inside a slice; where the spec is silent it writes `NEEDS HUMAN` and stops.
