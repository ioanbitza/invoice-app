# UI spec: Invoice app

Status: approved
Date: 2026-10-30. Author: ux-designer (proposed). Approved by: Ioan Bita, 2026-10-30.
Reads: docs/BRIEF.md, docs/REQUIREMENTS.md (approved), docs/decisions/*.md, sdlc/skills/ui-ux/SKILL.md.

The builder copies the values below into `styles.css` (`:root`) and builds each screen as sketched. A value that is not here is a `NEEDS HUMAN`, not a guess. Line 3 is the human's: it stays a draft until the human approves it on that line and commits; from then on this file is a contract like the plan, and the guards refuse every change by an agent.

Limits from the accepted decisions, which apply to every section:
- CSP (ADR-008): no `style=""` attribute, no inline script, no inline event handler, no `data:` image, no external font or image. Styling goes through classes in `styles.css`.
- User text goes in with `textContent` or DOM APIs only (R-22). SVG icons come from `<template>` blocks in `index.html` (section 6, Icons).
- The URL, the page title and every error message hold no customer data and no search text (R-31). The h1 of a detail screen may show the customer's name: it is page content, not the page title.

## 1. Product and audience
One person running a small business, alone, at a desk, in a current desktop browser; a phone must also work, because the page must hold at 320 px. They come back several times a week to look up a customer, start an order and enter its lines. In under a minute they must find a customer or order by typing a few letters, and add an order with one line. All interface text is in English (`AGENTS.md`). The product name on screen is `Invoice app` (ADR-005).

## 2. Visual direction
Style: quiet ledger.
Why: a repeat-use tool for one person is read for names and amounts, so the page stays neutral, with ruled rows, right-aligned money and one teal accent that marks what can be pressed. This rules out decoration: no gradients, no illustrations, no dashboard cards, no filled red button sitting on a page until the moment of confirmation.
Density: regular leaning compact: 16 px text in rows of 44 px, with little vertical padding. Tone of the text: plain and short.

## 3. Color tokens
Every pair that shows text carries its WCAG contrast ratio. Text 4.5:1 or more, large text (24 px, or 19 px bold) and borders 3:1 or more. Ratios are rounded down to two decimals. They were worked out by hand from the WCAG formula, because the kit's hook refused the `node -e` and `python3 -c` one-liners (see Open for the human).

Add `color-scheme: light;` to `:root`.

| Token | Value | Used for | Contrast |
|---|---|---|---|
| `--color-bg` | `#F6F6F3` | page background, table header row, read-only input | |
| `--color-surface` | `#FFFFFF` | panels, inputs, secondary button, dialog | |
| `--color-text` | `#1F2933` | body text, button text on secondary | on `--color-bg`: 13.62:1, on `--color-surface`: 14.75:1, on `--color-surface-hover`: 12.75:1, on `--color-surface-active`: 11.51:1, on `--color-info-bg`: 12.72:1, on `--color-success-bg`: 12.87:1, on `--color-warning-bg`: 13.04:1, on `--color-danger-bg`: 12.69:1 |
| `--color-text-muted` | `#52606D` | helper text, table header text, empty-value text, disabled text | on `--color-bg`: 5.96:1, on `--color-surface`: 6.45:1, on `--color-surface-hover`: 5.58:1 |
| `--color-primary` | `#0B6464` | primary button, links, current nav underline, info banner icon and border | as text on `--color-bg`: 6.41:1, on `--color-surface`: 6.95:1, on `--color-surface-hover`: 6.01:1, on `--color-info-bg`: 5.99:1 |
| `--color-primary-text` | `#FFFFFF` | text on primary and destructive buttons | on `--color-primary`: 6.95:1, on `--color-primary-hover`: 8.97:1, on `--color-primary-active`: 11.24:1, on `--color-danger`: 6.57:1, on `--color-danger-hover`: 8.34:1, on `--color-danger-active`: 10.57:1 |
| `--color-border` | `#7B8794` | input borders, secondary button border, table rules | on `--color-bg`: 3.38:1, on `--color-surface`: 3.66:1, on `--color-surface-hover`: 3.16:1 |
| `--color-danger` | `#B42318` | error text, destructive buttons, danger banner icon and border | as text on `--color-bg`: 6.07:1, on `--color-surface`: 6.57:1, on `--color-danger-bg`: 5.65:1 |
| `--color-success` | `#1B6E3C` | success banner icon and border | as text on `--color-bg`: 5.80:1, on `--color-surface`: 6.28:1, on `--color-success-bg`: 5.48:1 |
| `--color-warning` | `#855400` | warning banner icon and border | as text on `--color-bg`: 5.93:1, on `--color-surface`: 6.43:1, on `--color-warning-bg`: 5.68:1 |
| `--color-focus` | `#1D4ED8` | focus ring | on `--color-bg`: 6.18:1, on `--color-surface`: 6.70:1, on `--color-surface-hover`: 5.79:1, on `--color-info-bg`: 5.77:1, on `--color-success-bg`: 5.84:1, on `--color-warning-bg`: 5.92:1, on `--color-danger-bg`: 5.76:1 |

Tokens this spec adds to the skill's list, because a state needs a value and no raw color may appear outside `:root`:

| Token | Value | Used for | Contrast |
|---|---|---|---|
| `--color-primary-hover` | `#095252` | primary button hover, link hover | as text on `--color-bg`: 8.28:1, on `--color-surface`: 8.97:1, on `--color-surface-hover`: 7.75:1 |
| `--color-primary-active` | `#074242` | primary button active | see `--color-primary-text` |
| `--color-danger-hover` | `#962018` | destructive button hover | see `--color-primary-text` |
| `--color-danger-active` | `#7A1A14` | destructive button active | see `--color-primary-text` |
| `--color-surface-hover` | `#EDEFEC` | row hover, secondary button hover, disabled button background | see `--color-text`, `--color-text-muted` |
| `--color-surface-active` | `#E1E4E1` | secondary button active | see `--color-text` |
| `--color-info-bg` | `#E3F1F0` | info banner, the table row being edited | see `--color-text`, `--color-primary` |
| `--color-success-bg` | `#E5F3E9` | success banner | see `--color-text`, `--color-success` |
| `--color-warning-bg` | `#FBF0D9` | warning banner | see `--color-text`, `--color-warning` |
| `--color-danger-bg` | `#FCEAE7` | danger banner, quiet destructive button hover and active | see `--color-text`, `--color-danger` |
| `--color-backdrop` | `rgba(31, 41, 51, 0.5)` | the area behind a dialog | no text sits on it |

Lowest ratio in this table: 3.16:1 (`--color-border` on `--color-surface-hover`, a secondary button on hover). Lowest for text: 5.58:1 (`--color-text-muted` on `--color-surface-hover`, a disabled button and the email in a hovered row). Lowest for a status icon: 5.48:1 (`--color-success` on `--color-success-bg`). Dark mode: none; no requirement asks for it and one palette keeps the checks to one set of ratios.

## 4. Typography
Font stack: `--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; `--font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace` for order numbers (`ORD-0001`) and the stored-text area of the blocked screen. Money stays in `--font-sans` with `font-variant-numeric: tabular-nums`.
Web font: none: system fonts (no ADR allows a font fetch; ADR-001 and ADR-008 forbid one).
Scale (rem): `--text-xs` 0.75, `--text-sm` 0.875, `--text-base` 1, `--text-lg` 1.125, `--text-xl` 1.25, `--text-2xl` 1.5.
Weights and line heights, added tokens: `--weight-normal` 400, `--weight-bold` 600, `--leading-body` 1.5, `--leading-heading` 1.25.
Body: `--text-base`, `--leading-body`, 16 px minimum. Headings: h1 `--text-2xl`, h2 `--text-xl`, h3 `--text-lg`, all `--weight-bold` and `--leading-heading`. Table cells: `--text-base` (the skill's 16 px body rule wins over the template's `--text-sm`, because the rows are the main content), numbers with `tabular-nums`. Table header, helper text, the data note and the search count: `--text-sm`. `--text-xs` is defined for the scale and not used by any screen.
Long text: every text from the user wraps with `overflow-wrap: anywhere`, except the desktop table cells, which truncate (section 6). Multi-line text (address, notes) keeps its line breaks with `white-space: pre-wrap`.

Dates show through `formatDate` with `Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' })`, for example `30 Oct 2026`. Money shows through `formatMoney` (ADR-006).

## 5. Spacing and radius
Base 4 px. `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 24px, `--space-6` 32px, `--space-7` 48px, `--space-8` 64px.
Radius: `--radius-sm` 4px, `--radius-md` 6px, `--radius-lg` 8px. Shadow: `--shadow-sm` `0 1px 2px rgba(31, 41, 51, 0.12)`, `--shadow-md` `0 8px 24px rgba(31, 41, 51, 0.18)`.
Sizes, added tokens: `--control-height` 2.75rem, `--row-height` 2.75rem, `--row-height-touch` 3rem, `--icon-size` 1.25rem, `--width-page` 72rem, `--width-form` 40rem, `--width-dialog` 28rem, `--border-width` 1px, `--focus-width` 2px, `--focus-offset` 2px, `--press-offset` 1px, `--enter-offset` 0.25rem.
Page: max width `--width-page`, centred, side padding `--space-4` at 320 px and `--space-6` from 64rem. Between form sections `--space-6`; label to field `--space-2`; between fields `--space-4`; between panels `--space-5`; between buttons `--space-2`.
One breakpoint only: `@media (min-width: 64rem)`. Below it is the 320 px layout, stretched; from it is the desktop layout. All sizes are in rem so 200% zoom reflows.
Radius use: `--radius-sm` for buttons and inputs, `--radius-md` for panels and banners, `--radius-lg` for the dialog.

## 6. Components and states
Only the components the screens below use. Every interactive one has hover, focus-visible (a `--focus-width` outline in `--color-focus`, `--focus-offset` offset, written with `outline`, never removed), active and disabled, unless the row says otherwise. No hover is required to reach anything. A control that goes to a route is an `<a href="#/...">` styled as a button; a control that acts is a `<button type="button">`, or `type="submit"` for Save. Only a `<button>` is ever disabled.

| Component | Variants | States and how each looks |
|---|---|---|
| Button | primary, secondary, destructive, destructive-quiet, link | All: height `--control-height`, padding 0 `--space-4`, `--text-base`, `--weight-bold`, `--radius-sm`. Primary: `--color-primary` fill, `--color-primary-text`. Secondary: `--color-surface` fill, `--color-border` border, `--color-text`. Destructive (only inside a dialog): `--color-danger` fill, `--color-primary-text`. Destructive-quiet (on a page, opens a dialog or the R-04 banner): `--color-surface` fill, `--color-danger` border and text. Link: no fill, no border, `--color-primary` text, underlined. Hover: primary `--color-primary-hover`, secondary `--color-surface-hover`, destructive `--color-danger-hover`, destructive-quiet `--color-danger-bg`, link `--color-primary-hover`. Focus-visible: ring. Active: `transform: translateY(var(--press-offset))`, primary `--color-primary-active`, secondary `--color-surface-active`, destructive `--color-danger-active`, destructive-quiet `--color-danger-bg`. Disabled (`disabled` attribute): `--color-surface-hover` fill, `--color-border` border, `--color-text-muted` text, `cursor: not-allowed`, no hover change. Working: only `Copy stored text` has it, disabled with the label `Copying...`. Saving is synchronous (ADR-004), so Save has no working state |
| Input, select, textarea | label above, helper under, error under helper | Height `--control-height` (textarea by `rows`, padding `--space-2` `--space-3`), padding 0 `--space-3`, `--color-surface` fill, `--color-border` border, `--radius-sm`, `--text-base`. Label: `--weight-bold`, `--text-base`, with ` (required)` or ` (optional)` as part of the label text. Helper: `--text-sm`, `--color-text-muted`. Default as above. Hover: no change. Focus: border `--color-primary` plus the ring. Filled: same as default. Error: border `--color-danger`, `aria-invalid="true"`, an error line under the helper in `--color-danger`, `--text-sm`, starting with the text `Error: `. Read-only (`readonly`): `--color-bg` fill, `--color-text`, no focus border change, ring still shown. Disabled: not used. `aria-describedby` lists the helper id and the error id, whichever exist. No hint text inside a field: nothing but the value goes there |
| Table | divider rule | `border-collapse: separate`, `border-spacing: 0`, width 100%. Every row has a bottom rule of `--border-width` in `--color-border`. Header row: `--color-bg`, `--color-text-muted`, `--text-sm`, `--weight-bold`; from 64rem `position: sticky`, `top: 0`, `z-index: 1`. Rows: `height: var(--row-height)`, cell padding `--space-2` `--space-3`, `vertical-align: middle`. Text left, numbers and money right. A row that opens something: the first cell holds an `<a>` styled as a link, whose `::after` is `position: absolute; inset: 0`, with `position: relative` on the `<tr>`, so the whole row is the link; hover `--color-surface-hover`. Row being edited: `--color-info-bg` and the text `Editing` as its action cell. Every table has a `<caption>` in the `.visually-hidden` class. Desktop text cells: `table-layout: fixed`, `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`, and a `title` with the full text. Money and number cells never truncate: they use `overflow-wrap: anywhere`. Quantity shows as plain digits. Column widths are given per screen |
| Stacked rows (a table below 64rem) | none | The same `<table>`, with `display: block` on `table`, `tbody`, `tr` and `td`, `thead` in `.visually-hidden`, and explicit `role` attributes on every part (`table`, `rowgroup`, `row`, `columnheader`, `cell`) so screen readers keep the table. Row: `min-height: var(--row-height-touch)`, padding `--space-3`, bottom rule as above; layout per screen. Text wraps, nothing truncates, no `title` |
| Panel | form panel, detail panel, table panel | `--color-surface`, `--radius-md`, `--shadow-sm`, no border, padding `--space-5` (at 320 px `--space-4`). Table panel: padding 0, the first and last header cells get the top corners `--radius-md` |
| Tabs | none | The screens use the main nav instead (below) |
| Main nav | two links | `Customers`, `Orders`, each `--control-height` tall, padding 0 `--space-4`, `--color-text`, no underline. Current (`aria-current="page"`): `--weight-bold` and a `--focus-width` bottom border in `--color-primary`, so it is marked by more than color. Others keep a transparent bottom border of the same width, so nothing shifts. Hover: `--color-surface-hover`. Focus-visible: ring. Active: no change. Never disabled |
| Banner | info, success, warning, danger | `--radius-md`, padding `--space-3` `--space-4`, border `--border-width` in the status color, fill in the status `-bg` token, text `--color-text`, icon `--icon-size` in the status color at the start, `--space-2` gap, at most one action as a link button at the end (below the text at 320 px). Danger and warning have `role="alert"`, info and success `role="status"`. Not dismissible: a banner leaves when its cause is gone or the user moves to another screen |
| Empty state | list, search with no result | Inside the panel of the list, centred text, padding `--space-6` `--space-4`, one sentence in `--color-text`, one button under it, `--space-3` gap |
| Confirmation dialog | delete, erase, start empty, discard | One native `<dialog>` in `index.html`, opened with `showModal()`, which gives the focus trap and Esc. `aria-labelledby` the h2, `aria-describedby` the text. `--color-surface`, `--radius-lg`, `--shadow-md`, padding `--space-5`, `width: min(var(--width-dialog), 100% - var(--space-5))`, `::backdrop` `--color-backdrop`. Contents: h2, one short paragraph, buttons. Buttons at the end of the row at desktop, stacked full width at 320 px, safe button first in the DOM and focused on open. Esc equals the safe button. Texts per use are in section 7 |
| Search | one per list | Label above: `Search customers` or `Search orders`. `type="search"`, full width at 320 px, `--width-form` at most on desktop. Under it one `role="status"` line in `--text-sm`, `--color-text-muted`, with a reserved `min-height` of `--leading-body` times `--text-sm` so the list does not jump: empty when the search is empty, otherwise `Showing 3 of 12`. Filtering runs on the `input` event and re-renders only the results region, never the input, so focus and caret stay |

Utility class `.visually-hidden`: `position: absolute; width: var(--border-width); height: var(--border-width); overflow: hidden; clip-path: inset(50%); white-space: nowrap`.

Row height is 44 px on desktop, not the skill's 40 px: the skill's 44 px target rule outranks its density default, and a row is a target here.

Validation runs on submit only (the skill allows blur or submit). ADR-003 keeps checks out of the views, and a form-wide domain call on each blur would flag fields not yet reached. Messages change only at the next Save.

### Icons
Inline SVG, drawn for this project from plain shapes (no icon set, so nothing to name under A-15). Four only, each in a `<template>` in `index.html` and cloned into the banner, `aria-hidden="true"`, `class="icon"`. CSS for `.icon`: `width` and `height` `--icon-size`, `flex: none`. Every one has `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`.

| Id | Banner | Content |
|---|---|---|
| `icon-info` | info | `<circle cx="12" cy="12" r="10"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="12" y1="7" x2="12" y2="7"/>` |
| `icon-success` | success | `<circle cx="12" cy="12" r="10"/><polyline points="7 12 11 16 17 8"/>` |
| `icon-warning` | warning | `<polygon points="12 3 22 21 2 21"/><line x1="12" y1="10" x2="12" y2="15"/><line x1="12" y1="18" x2="12" y2="18"/>` |
| `icon-danger` | danger | `<circle cx="12" cy="12" r="10"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/>` |

### App frame (every screen except the blocked screen)
`<html lang="en">`, then `<header>` with the app name and `<nav aria-label="Main">`, then `<main>`. The header has no fill; it sits on `--color-bg`, with a bottom rule of `--border-width` in `--color-border`.
320 px:
```
+------------------------------+
| Invoice app                  |
| [ Customers ]  [  Orders  ]  |
+------------------------------+
```
Desktop:
```
+----------------------------------------------------------------+
| Invoice app     Customers   Orders                             |
+----------------------------------------------------------------+
```
App name: plain text, `--text-lg`, `--weight-bold`, not a link. At 320 px the two nav links share the row in equal widths. `Customers` is current on every `#/customers...` route, `Orders` on every `#/orders...` route, neither on the not-found screen.

Each screen's `<main>` starts with its h1 (`tabindex="-1"`), then the page banner region, then the content, with `--space-5` between them.

### Banners and storage messages
Two places, one rule: with a form open, a banner goes at the top of that form's panel; with none open, it goes in the page banner region under the h1. Failure texts end with the code (ADR-007). The code table in `src/ui/main.js` holds these words.

| Code | Variant | Text | Action |
|---|---|---|---|
| `STO-01` | danger | `Your browser's storage is full, so this was not saved. Deleting data frees space. (STO-01)` | none; press Save again. With no form open, repeat the action |
| `STO-02` | danger | `Your browser's storage is unavailable, so this was not saved. Allow storage for this site, or delete data to free space, then try again. (STO-02)` | none, as above |
| `STO-05` | danger | `Changes are locked because the saved data could not be read. Reload the page. (STO-05)` | `Reload` |
| `APP-01` | danger | `Something went wrong and the last action may not have finished. Reload the page. (APP-01)` | `Reload` |

`Reload` calls `location.reload()`. `STO-03` and `STO-04`, and `STO-02` at load, are on the blocked screen (7.8).

## 7. Screens
One subsection per screen. Screen names here are the names the plan uses in a UI slice's steps. There are eight; the add and edit line form is part of the order view (ADR-005), and the dialogs are one component.

| Screen | Routes | Serves |
|---|---|---|
| 7.1 Customer list | `#/customers` | R-03, R-05, R-18, R-19, R-22, R-28, R-32 |
| 7.2 Customer form | `#/customers/new`, `#/customers/<id>/edit` | R-01, R-02, R-17, R-21 |
| 7.3 Customer detail | `#/customers/<id>` | R-03, R-04, R-18, R-28, R-29 |
| 7.4 Order list | `#/orders` | R-09, R-10, R-16, R-18, R-28 |
| 7.5 Order form | `#/orders/new`, `#/customers/<id>/orders/new`, `#/orders/<id>/edit` | R-06, R-07, R-17, R-18, R-21 |
| 7.6 Order view | `#/orders/<id>` | R-08, R-11, R-12, R-13, R-14, R-15, R-16, R-17, R-18, R-21, R-28 |
| 7.7 Not found | any other hash, or an unknown `id` | R-28, R-31 |
| 7.8 Blocked screen | no route (R-20) | R-20, R-31, R-32 |

R-22 and R-31 hold on every screen. No MUST is left without a screen.

### 7.1 Customer list serves R-03, R-05, R-18, R-19, R-22, R-28, R-32
Page title: `Customers - Invoice app`. h1: `Customers`.
320 px:
```
+------------------------------+
| Customers                    |
| [ New customer ]             |
| Search customers             |
| [...........................]|
| Showing 3 of 12              |
| +--------------------------+ |
| | Ana Pop                  | |
| | ana@example.com          | |
| |--------------------------| |
| | Bogdan Ionescu           | |
| | No email                 | |
| +--------------------------+ |
| Your data lives only in      |
| this browser and is lost     |
| when the browser's site data |
| is cleared.                  |
| [ Erase all data ]           |
+------------------------------+
```
Desktop (from 64rem):
```
+----------------------------------------------------------------+
| Customers                                     [ New customer ] |
| Search customers                                               |
| [...........................]                                  |
| Showing 3 of 12                                                |
| +------------------------------------------------------------+ |
| | Name                    | Email                            | |
| | Ana Pop                 | ana@example.com                  | |
| | Bogdan Ionescu          | No email                         | |
| +------------------------------------------------------------+ |
| Your data lives only in this browser and is   [Erase all data] |
| lost when the browser's site data is cleared.                  |
+----------------------------------------------------------------+
```
Columns and alignment: Name 40% left, Email 60% left. Empty email: `No email` in `--color-text-muted`. Sort: by name (ADR-007). Row action: the row opens the customer detail. Stacked rows: name in `--weight-bold`, email under it in `--color-text-muted`. Primary action: `New customer`, full width at 320 px, at the end of the h1 row on desktop.
Note (R-19): `Your data lives only in this browser and is lost when the browser's site data is cleared.`, `--text-sm`, `--color-text-muted`, always shown, also in the empty state. Erase (R-32): destructive-quiet `Erase all data`, always shown, because it also resets the numbering after every record is gone. There is no settings screen: ADR-005 has no route for one and this is the one list that holds the data note.
Erase dialog: h2 `Erase all data?`, text `All customers and orders on this device will be gone for good, and order numbers start again at ORD-0001.`, buttons `Cancel`, `Erase all data` (destructive). After it: `#/customers` with `location.replace`, showing the empty state.
Empty state: `No customers yet. Add the first one.` + `New customer` (primary). The search and the top `New customer` are not shown then. Search with no match: `No customers match this search.` + `Clear search` (secondary), which empties the text and returns focus to the search box.
Error state: the erase can fail: banner `STO-02` in the page region. A failure at load is the blocked screen.

### 7.2 Customer form serves R-01, R-02, R-17, R-21
Page title: `New customer - Invoice app` or `Edit customer - Invoice app`. h1: `New customer` or `Edit customer`.
`<form novalidate autocomplete="off">` in a form panel of width `--width-form`, on the left of the page. No `maxlength` (ADR-007).

| Field | Control | Required | Helper | Validation message |
|---|---|---|---|---|
| Name | `<input type="text">` | yes | none | `Name must be 1 to 100 characters.` |
| Email | `<input type="email">` | no | none | `Email must have one @ with text on both sides and a dot after it.` or `Email must be at most 200 characters.` |
| Phone | `<input type="tel">` | no | none | `Phone must be at most 200 characters.` |
| Address | `<textarea rows="3">` | no | none | `Address must be at most 200 characters.` |

Message text lives in `src/domain/validation.js` (ADR-007), in these words. Primary action: `Save customer`, secondary: `Cancel`. Save lands and Cancel lands as ADR-005 says. All invalid fields show at once; the first gets focus (R-17). A failed save: the form stays filled, banner at the top of the panel (R-21).
320 px:
```
+------------------------------+
| New customer                 |
| +--------------------------+ |
| | Name (required)          | |
| | [......................] | |
| | Email (optional)         | |
| | [......................] | |
| | Phone (optional)         | |
| | [......................] | |
| | Address (optional)       | |
| | [......................] | |
| | [ Save customer ]        | |
| | [ Cancel ]               | |
| +--------------------------+ |
+------------------------------+
```
Desktop: two columns inside the panel, gap `--space-4`:
```
+------------------------------------------+
| Name (required)                          |
| [......................................] |
| Email (optional)    | Phone (optional)   |
| [.................] | [................] |
| Address (optional)                       |
| [......................................] |
| [ Save customer ] [ Cancel ]             |
+------------------------------------------+
```
Buttons: at 320 px stacked and full width, on desktop in one row at the start.
Empty state: the form opens empty on new, filled on edit. Error state: field errors and banners as above. An unknown `id` on edit is the not-found screen.

### 7.3 Customer detail serves R-03, R-04, R-18, R-28, R-29
Page title: `Customer - Invoice app`. h1: the customer's name.
320 px:
```
+------------------------------+
| Ana Pop                      |
| [ Edit customer ]            |
| [ Export data ]              |
| [ Delete customer ]          |
| +--------------------------+ |
| | Email                    | |
| | ana@example.com          | |
| | Phone                    | |
| | Not given                | |
| | Address                  | |
| | Str. Exemplu 1           | |
| +--------------------------+ |
| Orders                       |
| [ New order ]                |
| +--------------------------+ |
| | ORD-0002         €120.00 | |
| | 30 Oct 2026              | |
| +--------------------------+ |
+------------------------------+
```
Desktop:
```
+----------------------------------------------------------------+
| Ana Pop      [Edit customer] [Export data] [Delete customer]   |
| +------------------------------------------------------------+ |
| | Email              Phone             Address               | |
| | ana@example.com    Not given         Str. Exemplu 1        | |
| +------------------------------------------------------------+ |
| Orders                                           [ New order ] |
| +------------------------------------------------------------+ |
| | Number              | Date               |           Total | |
| | ORD-0002            | 30 Oct 2026        |         €120.00 | |
| +------------------------------------------------------------+ |
+----------------------------------------------------------------+
```
Amounts in the sketches are examples; the real text comes from `formatMoney` and follows the browser's locale (R-16).

Details: a `<dl>`, term `--text-sm` `--weight-bold` `--color-text-muted`, value `--color-text`; one column at 320 px, three equal columns on desktop. Empty value: `Not given` in `--color-text-muted`.
Actions: `Edit customer` (secondary), `Export data` (secondary), `Delete customer` (destructive-quiet); stacked full width at 320 px, at the end of the h1 row on desktop. Primary action of the screen: `New order` (primary), full width at 320 px, at the end of the `Orders` h2 row on desktop, to `#/customers/<id>/orders/new`.
Orders table: Number 40% left in `--font-mono`, Date 30% left, Total 30% right. Same sort as the order list (R-09). The row opens the order. Stacked rows: a grid of `1fr auto`, Number at the start and Total at the end on the first line, Date under Number in `--color-text-muted`, gap `--space-1` `--space-3`.
Export (R-29): downloads `customer-<id>.json` (ADR-007) with no dialog and no banner; the browser shows the download.
Delete, no orders (R-04): dialog with h2 `Delete this customer?`, text `This customer will be gone for good.`, buttons `Cancel`, `Delete customer` (destructive). Then ADR-005's landing.
Delete, with orders (R-04): no dialog, nothing changes, warning banner in the page region: `This customer has 3 orders, so it cannot be deleted. No legal retention applies. Delete those orders, then the customer, and all of this customer's data is erased.` With one order the words are `has 1 order`. Focus stays on the button.
Empty state: `No orders for this customer yet. Create the first one.` + `New order` (primary); the h2 row's `New order` is not shown then. Error state: a failed delete: banner `STO-01` or `STO-02` in the page region.

### 7.4 Order list serves R-09, R-10, R-16, R-18, R-28
Page title: `Orders - Invoice app`. h1: `Orders`.
320 px:
```
+------------------------------+
| Orders                       |
| [ New order ]                |
| Search orders                |
| [...........................]|
| Showing 2 of 9               |
| +--------------------------+ |
| | ORD-0002         €120.00 | |
| | Ana Pop                  | |
| | 30 Oct 2026              | |
| |--------------------------| |
| | ORD-0001          €40.00 | |
| | Bogdan Ionescu           | |
| | 12 Oct 2026              | |
| +--------------------------+ |
+------------------------------+
```
Desktop (from 64rem):
```
+----------------------------------------------------------------+
| Orders                                           [ New order ] |
| Search orders                                                  |
| [...........................]                                  |
| Showing 2 of 9                                                 |
| +------------------------------------------------------------+ |
| | Number     | Customer           | Date        |      Total | |
| | ORD-0002   | Ana Pop            | 30 Oct 2026 |    €120.00 | |
| | ORD-0001   | Bogdan Ionescu     | 12 Oct 2026 |     €40.00 | |
| +------------------------------------------------------------+ |
+----------------------------------------------------------------+
```
Columns and alignment: Number 20% left in `--font-mono`, Customer 40% left, Date 20% left, Total 20% right. Sort: newest date first, then highest number (ADR-007). Row action: the row opens the order view. Stacked rows: a grid of `1fr auto`, Number at the start and Total at the end on the first line, Customer and Date each on a line of their own, spanning both columns, Date in `--color-text-muted`.
Primary action: `New order`, as `New customer` in 7.1, to `#/orders/new`.
Empty states, three of them:
- No customers: `Add a customer first. Every order belongs to one.` + `New customer` (primary, to `#/customers/new`). No `New order`, no search (R-18).
- Customers, no orders: `No orders yet. Create the first one.` + `New order` (primary). No search, no top `New order`.
- Search with no match: `No orders match this search.` + `Clear search` (secondary), as in 7.1.
Error state: a failure at load is the blocked screen; this screen writes nothing.

### 7.5 Order form serves R-06, R-07, R-17, R-18, R-21
Page title: `New order - Invoice app` or `Edit order - Invoice app`. h1: `New order` or `Edit order`.
Form setup as in 7.2. Three forms of one screen:

| Field | `#/orders/new` | `#/customers/<id>/orders/new` | `#/orders/<id>/edit` |
|---|---|---|---|
| Number | not shown, assigned on save | not shown | read-only |
| Customer | select | read-only | read-only |
| Date | date | date | date |
| Notes | textarea | textarea | textarea |

| Field | Control | Required | Helper | Validation message |
|---|---|---|---|---|
| Number | `<input type="text" readonly>`, `--font-mono` | no | `The number does not change.` | none |
| Customer, select | `<select>`, first option `Choose a customer` with an empty value, then every customer in the R-03 order as `Ana Pop (ana@example.com)`, or `Ana Pop (no email)` | yes | none | `Choose a customer.` |
| Customer, read-only | `<input type="text" readonly>` showing the same text | no | on edit only: `To move an order, delete it and create a new one.` | none |
| Date | `<input type="date">`, today by default on new | yes | none | `Date must be a real calendar date.` |
| Notes | `<textarea rows="4">` | no | `Up to 500 characters. Keep details about other people out of this field.` | `Notes must be at most 500 characters.` |

Primary action: `Save order`, secondary: `Cancel`. Landings as ADR-005 says.
320 px: one column, buttons stacked as in 7.2. Desktop: also one column, in a panel of `--width-form`, with the buttons in one row, because a long customer name needs the full width. The sketch shows the desktop form on `#/orders/new`.
```
+------------------------------------------+
| Customer (required)                      |
| [ Choose a customer                  v ] |
| Date (required)                          |
| [ 30/10/2026 ]                           |
| Notes (optional)                         |
| [......................................] |
| Up to 500 characters. Keep details ...   |
| [ Save order ] [ Cancel ]                |
+------------------------------------------+
```
Empty state: on `#/orders/new` with no customers, no form: the panel shows `Add a customer first. Every order belongs to one.` + `New customer` (primary) (R-18, ADR-005). Error state: as in 7.2.

### 7.6 Order view serves R-08, R-11, R-12, R-13, R-14, R-15, R-16, R-17, R-18, R-21, R-28
Page title: `Order - Invoice app`. h1: the order number, in `--font-mono`.
320 px:
```
+------------------------------+
| ORD-0002                     |
| [ Edit order ]               |
| [ Delete order ]             |
| +--------------------------+ |
| | Customer                 | |
| | Ana Pop                  | |
| | Date                     | |
| | 30 Oct 2026              | |
| | Notes                    | |
| | No notes                 | |
| +--------------------------+ |
| Lines                        |
| [ Add line ]                 |
| +--------------------------+ |
| | Blue widget              | |
| | Quantity               3 | |
| | Unit price        €19.99 | |
| | Line total        €59.97 | |
| | [ Edit ]  [ Remove ]     | |
| +--------------------------+ |
| Order total           €59.97 |
+------------------------------+
```
Desktop:
```
+----------------------------------------------------------------+
| ORD-0002                        [ Edit order ] [ Delete order ]|
| +------------------------------------------------------------+ |
| | Customer           Date               Notes                | |
| | Ana Pop            30 Oct 2026        No notes             | |
| +------------------------------------------------------------+ |
| Lines                                             [ Add line ] |
| +------------------------------------------------------------+ |
| | Description | Quantity | Unit price | Line total |   Actions | |
| | Blue widget |        3 |     €19.99 |     €59.97 | Edit Remove | |
| +------------------------------------------------------------+ |
|                                        Order total     €59.97  |
+----------------------------------------------------------------+
```
Details: the `<dl>` of 7.3. Customer is a link to `#/customers/<id>`, showing the name only (R-28). Empty notes: `No notes` in `--color-text-muted`.
Actions: `Edit order` (secondary), `Delete order` (destructive-quiet), placed as in 7.3. Primary action of the screen: `Add line` (primary), placed as `New order` in 7.3.
Lines table, in the order added (A-08): Description 30% left, Quantity 10% right, Unit price 18% right, Line total 20% right, Actions 22% right. The widths leave room for the two buttons and for the largest line total at the 64rem breakpoint. Action cell: two link buttons in one row, `--space-2` apart, `Edit` with `aria-label="Edit line 2"` and `Remove` with `aria-label="Remove line 2"`, the number being the position; its vertical padding is 0, so the row stays at `--row-height`. These rows do not open anything and have no hover.
Stacked rows: Description in `--weight-bold` on its own line, then a line each for Quantity, Unit price and Line total, label at the start from a `data-label` attribute through `td::before { content: attr(data-label) }` in `--color-text-muted`, value at the end, then the two buttons at the start.
Order total: one line under the table, in the page flow, `Order total` in `--text-lg` `--weight-bold`, the amount in `--text-xl` `--weight-bold` with `tabular-nums`, at the end of the row. Always shown, `€0.00` or the locale's form with no lines (R-15). It updates with the render after each change (R-12, R-13).
Remove (R-13): no dialog; the line goes at once, as the requirement says. A failed save: the line stays, banner in the page region.
Delete order (R-08): dialog with h2 `Delete this order?`, text `The order and all its lines will be gone for good.`, buttons `Cancel`, `Delete order` (destructive).

Line form, no route (ADR-005). `Add line` opens it as a form panel after the `Order total` line, heading h3 `Add a line`. `Edit` opens the same form with h3 `Edit line 2`, filled in, with the price from `priceInputText` (R-11), and that row turns to the editing state (section 6). One form at a time: while it is open, `Add line` and every row's `Edit` and `Remove` are disabled.

| Field | Control | Required | Helper | Validation message |
|---|---|---|---|---|
| Description | `<input type="text">` | yes | none | `Description must be 1 to 200 characters.` |
| Quantity | `<input type="text" inputmode="numeric">` | yes | none | `Quantity must be a whole number from 1 to 9999.` |
| Unit price | `<input type="text" inputmode="decimal">` (ADR-006), label `Unit price in EUR (required)` | yes | `Use a dot or a comma for decimals, no thousands separators, for example 19.99.` | `Unit price must be 0.00 to 1000000.00, with at most two decimals.` For `line.total.too-large`: `This would make the order total too large. Lower the price or the quantity.` |

Primary action: `Save line`, secondary: `Cancel`. Save closes the form and the total updates. Cancel closes it and discards (R-17).
320 px: one column. Desktop: Description full width, then Quantity and Unit price side by side, gap `--space-4`, buttons in one row.
Empty state: `No lines yet. Add the first one.` + `Add line` (primary), inside the table panel; the h2 row's `Add line` is not shown then, and the order total line stays. Error state: field errors next to the fields; a failed save keeps the form open with a banner at the top of its panel (R-21).

### 7.7 Not found serves R-28, R-31
Page title: `Not found - Invoice app`. h1: `Page not found`.
The app frame, then a panel of width `--width-form`: `This page does not exist, or the record was deleted.`, then link buttons `Go to customers` and `Go to orders`, in one row, stacked at 320 px. Primary action: none; it writes nothing and never shows the text of the hash (ADR-005).
```
+------------------------------+
| Page not found               |
| +--------------------------+ |
| | This page does not exist,| |
| | or the record was        | |
| | deleted.                 | |
| | Go to customers          | |
| | Go to orders             | |
| +--------------------------+ |
+------------------------------+
```
Desktop: the same panel, at `--width-form`, on the left. Empty state: none, the screen is itself the message. Error state: none.

### 7.8 Blocked screen serves R-20, R-31, R-32
Page title: `Data problem - Invoice app`. No app frame and no nav: only the text `Invoice app` as in the header, then a panel of width `--width-form`. It replaces everything, whatever the hash says (ADR-005).

| Reason | h1 | Text | Actions |
|---|---|---|---|
| `corrupt` | `The saved data cannot be read` | `Nothing has been changed. Copy the stored text to keep it, or start with empty data. (STO-03)` | `Copy stored text` (primary), `Start with empty data` (destructive-quiet) |
| `newer` | `This data is from a newer version` | `It was saved by a newer version of the app, and nothing has been changed. Copy the stored text to keep it, or start with empty data. (STO-04)` | as above |
| `unavailable` | `Browser storage cannot be used` | `Your browser's storage is unavailable. Allow storage for this site, then reload the page. (STO-02)` | `Reload` (primary), `Start with empty data` (destructive-quiet); no copy, as there is no text (ADR-004) |

320 px:
```
+------------------------------+
| Invoice app                  |
| +--------------------------+ |
| | The saved data cannot    | |
| | be read                  | |
| | Nothing has been changed.| |
| | Copy the stored text ... | |
| | [ Copy stored text ]     | |
| | [ Start with empty data ]| |
| +--------------------------+ |
+------------------------------+
```
Desktop: the same panel on the left, buttons in one row.
Copy: `navigator.clipboard.writeText`, working state on the button. Success banner: `Stored text copied. Keep it somewhere safe before you start with empty data.` Failure banner (danger): `Copying failed: the browser did not allow it.` with the action `Show stored text`. Only that click shows a read-only `<textarea rows="8">` labelled `Stored text`, in `--font-mono`, under the banner, focused with its text selected (ADR-004). The stored text is never shown otherwise.
Start empty: dialog with h2 `Start with empty data?`, text `The old data will be lost for good. Copy the stored text first if you may need it.`, buttons `Cancel`, `Start with empty data` (destructive). After it: `#/customers` with `location.replace` and the normal app. In the `unavailable` case the dialog text is only `The old data will be lost for good.` A failed erase: banner `STO-02` in the panel, the screen stays.
Empty state: none. Error state: the screen is the error state.

## 8. Navigation and focus order
Moving: the main nav from every screen except the blocked one; the row links; `Customer` on the order view; the browser's Back and Forward, which work through the hash (ADR-005). There is no in-page Back button. The current place is marked in the nav (section 6). Search texts stay in the UI state, so Back to a list shows the same filter (ADR-005).

Leaving an open form by a link or by Back (proposal, ADR-005 leaves this to this spec):
- A form is dirty when a field's value differs from its value when the form opened. The view keeps that snapshot.
- When the hash changes while a route form or the line form is dirty, the one `hashchange` listener does not re-render. It opens the dialog with h2 `Discard your changes?`, text `What you typed has not been saved.`, buttons `Keep editing`, `Discard changes` (destructive).
- `Keep editing`: the listener sets the hash back to the form's hash, skips that one render, and focus returns to the field that had it. The form is untouched. `Discard changes`: the new route renders.
- A form that is not dirty leaves with no question. `Cancel` never asks (R-17). A page reload or a closed tab is not caught.

Focus after a change:

| Event | Focus lands on |
|---|---|
| A route renders a list, detail or not-found screen, or the blocked screen | its h1 |
| A route renders a form | the first editable field (customer form: Name; new order: Customer select, or Date when the customer is set; edit order: Date) |
| Save or Cancel on a route form | the h1 of the screen it lands on |
| Failed Save, field errors | the first invalid field (R-17) |
| Failed Save, storage | stays on Save, ready to retry; the banner has `role="alert"` |
| Line form opens | Description |
| Save line | `Add line` |
| Cancel on the line form | the button that opened it |
| Remove line | `Add line` |
| Dialog opens | its safe button |
| Dialog closed by the safe button or Esc | the button that opened it |
| Delete, Erase or Start empty confirmed | the h1 of the landing screen |
| Confirmed action failed | the banner, with `tabindex="-1"` |
| `Clear search` | the search box |
| R-04 banner | stays on `Delete customer` |

Tab order, always the visual order. A banner's action comes where the banner sits. Every screen but the blocked one starts with `Customers`, `Orders`:
- 7.1: `New customer`, search, rows in order (or the empty state's button), `Erase all data`.
- 7.2: Name, Email, Phone, Address, `Save customer`, `Cancel`.
- 7.3: `Edit customer`, `Export data`, `Delete customer`, `New order`, rows in order.
- 7.4: `New order`, search, rows in order.
- 7.5: its fields in order, `Save order`, `Cancel`.
- 7.6: `Edit order`, `Delete order`, the Customer link, `Add line`, each row's `Edit` and `Remove`, then the line form when open: Description, Quantity, Unit price, `Save line`, `Cancel`.
- 7.7: `Go to customers`, `Go to orders`.
- 7.8: the actions in order, then `Show stored text` and the text area when they exist.

## 9. Motion
`--duration-fast` 120ms for the button press, `--duration-base` 200ms for banners, the line form and the dialog, `--easing` `ease-out`.
Moves, `transform` and `opacity` only:
- Button active: `transform` to `translateY(var(--press-offset))` over `--duration-fast`.
- A banner or the line form appearing: a keyframe from `opacity: 0; transform: translateY(calc(-1 * var(--enter-offset)))` to none, over `--duration-base`. It says something arrived here.
- The dialog and its backdrop: `opacity` from 0 to 1 over `--duration-base`.
Hover and focus colors change at once, with no transition, because a color transition would break the `transform` and `opacity` rule. Nothing else moves: not the routes, not the rows, not the total.
`@media (prefers-reduced-motion: reduce)`: both durations 0ms, set in `:root`.
No loading state exists: the data is read before the first render and no call leaves the browser.

## 10. Manual design checks
Added by every UI slice to `docs/MANUAL-CHECKS.md`, unticked, after the six `UX:` checks of the ui-ux skill:
```
- [ ] UX: design tokens only: no raw color, size or spacing outside :root in styles.css (grep for "#", "rgb(", "px" outside the token block)
- [ ] UX: every button, link, input and tab shows hover, focus-visible, active and disabled as docs/UI-SPEC.md describes
- [ ] UX: type and spacing scales respected: every font-size and every margin, padding and gap is a token
- [ ] UX: each screen of the slice matches its sketch in docs/UI-SPEC.md at 320 px and at desktop width
```
Per screen, one more line each, added by the slice that builds the screen:
```
- [ ] UX: customer list: type in search, the caret stays and the list narrows; a 100-character name wraps at 320 px and truncates with a title on desktop
- [ ] UX: customer form: Save with a bad email and an empty name, both errors show, focus lands on Name, nothing is saved
- [ ] UX: customer detail: Delete with orders shows the warning with the count and no dialog; Export data downloads customer-<id>.json under the CSP
- [ ] UX: order list: with no customers only the "Add a customer first" message shows; with customers, Back from an order keeps the search
- [ ] UX: order form: the picker shows name and email for two customers of the same name; the date field opens with today
- [ ] UX: order view: add, edit and remove a line by keyboard, the total updates each time; while the line form is open the row buttons are disabled
- [ ] UX: not found: an invented hash shows the screen and no part of the hash
- [ ] UX: blocked screen: with invalid JSON under the invoice-app key, no list and no nav show; copy works; Start with empty data asks first
- [ ] UX: leaving a form: type in a form, click Orders, then Keep editing: the text is still there; repeat with the browser's Back
- [ ] UX: all colors: the contrast ratios of section 3 match the browser devtools
```

## Open for the human
- Decided (Ioan Bita, 2026-10-30): leaving an open form by a link or by Back asks `Discard your changes?` as in section 8; no draft is stored.
- Decided (Ioan Bita, 2026-10-30): the R-19 note stays as approved; Safari's seven-day eviction is accepted for the demo and is revisited only if real data is kept in Safari.
- Decided (Ioan Bita, 2026-10-30): the contrast ratios were recomputed with a script at approval time (thirteen pairs, all above their threshold, lowest 3.16:1 for a border and 5.58:1 for text); the first UI slice repeats the check in the browser's devtools.
