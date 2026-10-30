# UI spec: <product name>

Status: draft
Date: <YYYY-MM-DD>. Author: ux-designer (proposed). Approved by: <human name, when line 3 is changed to approved>.
Reads: docs/BRIEF.md, docs/REQUIREMENTS.md (approved), docs/decisions/*.md, sdlc/skills/ui-ux/SKILL.md.

The builder copies the values below into `styles.css` (`:root`) and builds each screen as sketched. A value that is not here is a `NEEDS HUMAN`, not a guess. Line 3 is the human's: `Status: draft` until the human changes it to `Status: approved` and commits; from then on this file is a contract like the plan, and the guards refuse every change by an agent.

## 1. Product and audience
<Who uses it, how often, on what device and in what setting (a desk, a counter, a phone outdoors). What they must do in under a minute. Two to five lines, from the brief.>

## 2. Visual direction
Style: <a name in two or three words, for example "quiet data tool", "warm paper form">.
Why: <two sentences: what in the audience and setting leads to this direction, and what it rules out>.
Density: <compact | regular | spacious>. Tone of the text: <plain and short | friendly | formal>.

## 3. Color tokens
Every pair that shows text carries its WCAG contrast ratio, computed, not estimated. Text 4.5:1 or more, large text (24 px, or 19 px bold) and borders 3:1 or more.

| Token | Value | Used for | Contrast |
|---|---|---|---|
| `--color-bg` | `#......` | page background | |
| `--color-surface` | `#......` | cards, panels, table header | |
| `--color-text` | `#......` | body text | on `--color-bg`: <n>:1, on `--color-surface`: <n>:1 |
| `--color-text-muted` | `#......` | helper text, secondary labels | on `--color-bg`: <n>:1, on `--color-surface`: <n>:1 |
| `--color-primary` | `#......` | primary button, selected tab, links | as text on `--color-bg`: <n>:1 |
| `--color-primary-text` | `#......` | text on the primary button | on `--color-primary`: <n>:1 |
| `--color-border` | `#......` | input borders, dividers | on `--color-bg`: <n>:1 |
| `--color-danger` | `#......` | errors, destructive button | as text on `--color-bg`: <n>:1 |
| `--color-success` | `#......` | success banner | as text on `--color-bg`: <n>:1 |
| `--color-warning` | `#......` | warning banner | as text on `--color-bg`: <n>:1 |
| `--color-focus` | `#......` | focus ring | on `--color-bg`: <n>:1 |

Lowest ratio in this table: <n>:1 (<pair>). Dark mode: <none | the same tokens under `@media (prefers-color-scheme: dark)` with these values: ...>.

## 4. Typography
Font stack: `--font-sans: <stack with system fallbacks>`; `--font-mono: <stack>` for numbers in tables.
Web font: <none: system fonts (no ADR allows a font fetch) | name, allowed by ADR-nnn, loaded from the same origin>.
Scale (rem): `--text-xs` <0.75>, `--text-sm` <0.875>, `--text-base` <1>, `--text-lg` <1.125>, `--text-xl` <1.25>, `--text-2xl` <1.5>.
Body: `--text-base`, line-height 1.5, 16 px minimum. Headings: h1 `--text-2xl`, h2 `--text-xl`, h3 `--text-lg`, weight <600>. Table cells: `--text-sm`, numbers with `tabular-nums`.

## 5. Spacing and radius
Base 4 px. `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 24px, `--space-6` 32px, `--space-7` 48px, `--space-8` 64px.
Radius: `--radius-sm` <4px>, `--radius-md` <8px>, `--radius-lg` <12px>. Shadow: `--shadow-sm` <value>, `--shadow-md` <value>.
Page: max width <72rem>, side padding `--space-4` at 320 px and `--space-6` from 64rem. Between form sections `--space-6`; label to field `--space-2`; between fields `--space-4`.

## 6. Components and states
Only the components the screens below use. Every interactive one has hover, focus-visible (2 px ring in `--color-focus`, 2 px offset), active and disabled.

| Component | Variants | States and how each looks |
|---|---|---|
| Button | primary, secondary, destructive, link | default, hover <darken 8%>, focus-visible <ring>, active <translateY(1px)>, disabled <muted, not-allowed>, working <disabled + label "Saving..."> |
| Input, select, textarea | with label above, helper under, error under helper | default, focus <border --color-primary + ring>, filled, error <border and text --color-danger, icon or "Error:" prefix, aria-describedby>, read-only, disabled |
| Table | <zebra or divider rule, pick one> | header row on `--color-surface`, row hover <tint>, selected row, empty table (see empty states), row height 40 px desktop, 48 px touch |
| Card or panel | form panel, detail panel | `--color-surface`, `--radius-md`, <a border or --shadow-sm, pick one>, padding `--space-5` |
| Tabs | top of a screen | selected <underline 2 px --color-primary + aria-selected>, hover, focus-visible |
| Banner | info, success, warning, danger | icon + text + one action; dismissible with a labelled close button |
| Empty state | list, search with no result | one sentence saying what this is for + one primary action |

## 7. Screens
One subsection per screen. Each names the requirements it serves, sketches 320 px and desktop, lists the fields in order, the primary action, the empty state and the error state. Screen names here are the names the plan uses in a UI slice's steps.

### 7.1 <Screen name> (list) serves R-nn, R-nn
320 px:
```
+----------------------------+
| App name          [+ New]  |
| [search............]       |
| Card: name / total / date  |
| Card: ...                  |
+----------------------------+
```
Desktop (from 64rem):
```
+--------------------------------------------------------------+
| App name                                   [search] [+ New]  |
| Name            | Customer     | Date       |        Total   |
| ...             | ...          | ...        |        ...     |
+--------------------------------------------------------------+
```
Columns and alignment: <name left, customer left, date left, total right>. Sort: <by date, newest first>. Row action: <open the detail>.
Empty state: "<No orders yet. Create the first one.>" + [+ New]. Error state: <the storage banner from section 6 with "Export" as the action>.

### 7.2 <Screen name> (form) serves R-nn
Fields in order: <field: type, required, helper text, validation message>. Primary action: <Save>, secondary: <Cancel, returns to the list and keeps the filter>. Validation on blur and submit; the first invalid field receives focus.
320 px: one column. Desktop: <two columns for short fields, full width for notes>.

### 7.3 <Screen name> (detail) serves R-nn
<Layout, the actions and where they sit, the destructive action behind a confirmation.>

## 8. Navigation and focus order
<How the user moves between screens; what Back does; where the current place is marked. Per screen, the tab order from the first focusable element to the primary action; where focus lands after Save, Cancel, Delete, and after a banner appears.>

## 9. Motion
`--duration-fast` <120ms> for hover and focus, `--duration-base` <200ms> for panels and banners, `--easing` <ease-out>. Moves: <what moves, on what event>. `transform` and `opacity` only. `@media (prefers-reduced-motion: reduce)`: both durations 0ms.

## 10. Manual design checks
Added by every UI slice to `docs/MANUAL-CHECKS.md`, unticked, after the six `UX:` checks of the ui-ux skill:
```
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
```
Per screen, one more line each: `- [ ] UX: <screen>: <what to look at, what you should see>`.

## Open for the human
<`NEEDS HUMAN: <question>` lines, each with the recommended answer first; `none` when there are none. The human answers in an ADR or by editing this draft, then approves.>
