# ADR-004: Persistence and schema versioning

Date: 2026-10-30. Status: accepted. Author: architect, accepted by Ioan Bita.
Tags: javascript, browser, localstorage, storage

## Context
The brief mandates `localStorage`, and R-19, R-20, R-21 and R-32 say what must happen when it works and when it does not. The approved data model sketch fixes one key, `invoice-app`, and the record shapes. Still open: the storage interface, what counts as unreadable, how nothing is ever written over unreadable data, and how a later format change is read. Where the sketch and the stack skill differ, the approved sketch wins and the difference is named below.

## Decision

### Format
- One key, `invoice-app`, held in the constant `STORAGE_KEY`. Its value is the JSON text of `{ version: 1, nextOrderNumber, customers, orders }`, with the fields of the data model sketch and nothing added.
- This is flat, not the `{ version, data }` envelope of JS-09: the approved sketch fixes it.
- `id` values come from `crypto.randomUUID()`, the one identifier rule of the project (DA-06, JS-12), passed to the domain as `newId`.
- An order number is `ORD-` plus `nextOrderNumber` padded to four digits; after `ORD-9999` the number simply gets longer (`ORD-10000`). `nextOrderNumber` starts at 1, is raised only by creating an order, in the same write as that order, and goes back to 1 only through erasing (R-06, R-32).
- Deletes are real deletes (A-09, DA-13). The delete rules: a customer with orders is refused (R-04), an order takes its lines with it (R-08).

### Interface
`createStorage(backing)` in `src/storage/storage.js` takes a `Storage`-shaped object and returns `load()`, `save(data)` and `erase()`. `openBrowserStorage()` in the same file wraps the access to `window.localStorage`; if that access throws, it returns a storage whose calls answer `unavailable`.

| Call | Result |
|---|---|
| `load()` | `{ ok: true, data }`; `{ ok: false, reason: 'corrupt' or 'newer', text }` with the stored text; `{ ok: false, reason: 'unavailable' }` |
| `save(data)` | `{ ok: true }`; `{ ok: false, reason: 'quota' or 'unavailable' or 'blocked' }` |
| `erase()` | `{ ok: true, data }` with empty data; `{ ok: false, reason: 'unavailable' }` |

- Every `getItem`, `setItem`, `removeItem` and `JSON.parse` runs inside a `try` (JS-07, JS-08). `QuotaExceededError` maps to `quota`; any other write error maps to `unavailable`.

### Reading
- No stored value (`getItem` returns `null`) is a first run: `load()` returns empty data, `{ nextOrderNumber: 1, customers: [], orders: [] }`, and writes nothing.
- Text that does not parse is `corrupt`.
- `version` is checked first. An integer above 1 is `newer`. Anything else that is not 1 is `corrupt`.
- A version 1 document then goes through `src/storage/shape.js`. It is `corrupt` unless all of these hold: every field of the sketch is there with its type; `quantity`, `unitPriceCents` and `nextOrderNumber` are safe integers; `id` values and order numbers are unique; every `customerId` names a customer; `nextOrderNumber` is above the number of every order. Types and links are checked, not the form rules (lengths, ranges), so a later change of a form rule cannot lock a user out of their data.

### Writing
- Each save writes the whole document with one `setItem`. A `setItem` that throws leaves the old text in place, so a failed save loses nothing (R-21).
- Storage refuses to write unless the last `load()` or `erase()` succeeded: `save` answers `blocked` until then. This makes R-20 true at the storage layer, not only because the UI hides its buttons, and a test can prove it.
- After `corrupt` or `newer` the text stays under `invoice-app`, untouched. There is no `invoice-app.corrupt` copy as JS-08 describes: a second key would break the one-key rule of the sketch, would need quota at the moment storage may be full, and would keep personal data that R-32 must then also find.

### Ways out (R-20, R-32)
- `erase()` calls `removeItem('invoice-app')` and nothing else, in any state, also when the data is unreadable. It never calls `clear()`, because other pages can share the origin (ADR-008).
- Copying the stored text uses `navigator.clipboard.writeText(text)`. The text is not displayed on the error screen, because R-31 keeps personal data out of error messages. If the clipboard call fails, the error says so and only then, on the user's click, a read-only text area shows the text for manual copying.
- With reason `unavailable` there is no text, so the copy action is not offered.

### Later format changes
- Any change of the stored shape is a data model change: it needs a new accepted ADR, raises `version` by one and adds `src/storage/migrations.js` with one pure function per step and one test per step (JS-09, DA-15). Older shapes are converted once, never tolerated in the reading code.
- Version 1 has no migration file (CP-07).

### Rules of the data access skill that do not apply
- DA-10: no version per record, because A-01 rules out a second tab. A second tab would win or lose silently; A-01 accepts that.
- DA-14: no backup exists until R-25 (A-11).
- DA-01 to DA-03, DA-07, DA-08, DA-11: no database. Their purpose is served by the version number, `shape.js` and the delete rules above.

## Consequences
- A broken or newer document can never be overwritten by a normal action, and the proof is a storage test, not a manual check.
- The file is written whole on every change. At the roughly 5 MB a browser allows this is fast enough, and it makes each save all or nothing.
- `shape.js` is strict: a hand-edited document with a dangling `customerId` is refused rather than repaired, and the user is left with copy or erase.
- The user must have one tab open; a stale tab overwrites a newer one without warning (A-01).
- An agent that hits the edge of this decision writes NEEDS HUMAN and stops.

## Not decided here
- Backup, import and whole-data export: R-25.
- A warning before the quota is reached: not required, R-21 handles the failure itself.
- Browser eviction: Safari's tracking prevention can remove script-written storage for a site not visited for seven days, which is a loss A-11 and the R-19 note do not name in those words. Whether the note should say so, or the app should ask for persistent storage, is a question for the human; the requirements stay as approved until then.
- Which origin holds the key: ADR-008.

## Answered
