# ADR-003: Module layout and layering

Date: 2026-10-30. Status: accepted (2026-10-30, D1 and CRI-3 answered). Author: architect, accepted by Ioan Bita.
Tags: javascript, browser, web-ui

## Context
`AGENTS.md` fixes three folders (`src/domain/`, `src/storage/`, `src/ui/`) and forbids others, but it does not say which module owns what, what may import what, or how a user action becomes a saved change. R-21 demands one behaviour for every failed save, and R-04, R-08, R-14 and R-15 are rules that must not leak into the UI. This ADR draws those lines so the slices can be cut along them.

## Decision
- Imports run one way: `src/ui/` may import `src/domain/` and `src/storage/`; `src/storage/` may import `src/domain/`; `src/domain/` imports only `src/domain/` (LY-01, JS-03). Nothing imports from `src/ui/` except `src/ui/`.
- There is no separate application folder. A use case is a domain command: a pure function that takes the current data and raw input and returns the next data or the failure (LY-04, JS-04). This is the one place the project is simpler than `discipline-layering`, because `AGENTS.md` allows no fourth folder and one screen is the only caller.
- The domain works on one plain value, `{ nextOrderNumber, customers, orders }`. `version` belongs to storage: storage adds it on save and removes it on load, so the domain never sees it (LY-09).
- Module map:

| Module | Owns |
|---|---|
| `src/domain/money.js` | `CURRENCY`, the price parser, line and order totals, the price text for the edit field (ADR-006) |
| `src/domain/dates.js` | real-date check, today as `YYYY-MM-DD` |
| `src/domain/validation.js` | checks for customer, order and line input (ADR-007) |
| `src/domain/customers.js` | create, update, delete, list and search customers |
| `src/domain/orders.js` | create, update, delete, list and search orders; order numbers |
| `src/domain/lines.js` | add, update and remove order lines |
| `src/domain/export.js` | build the export object of one customer (R-29) |
| `src/storage/storage.js` | the only `localStorage` code (ADR-004) |
| `src/storage/shape.js` | the check that a parsed document has the expected shape |
| `src/ui/main.js` | composition root, UI state, the `commit` function, global error display |
| `src/ui/router.js` | hash to route and route to hash, pure, no DOM (ADR-005) |
| `src/ui/format.js` | every `Intl` call, pure, no DOM (JS-15) |
| `src/ui/views/<screen>.js` | rendering and events of one screen |

- A command has the shape `command(data, input, deps)`. `deps` carries what the outside supplies, `newId` and `today`, as parameters (CP-05, JS-06, JS-12). It returns `{ ok: true, data, ...result }` with new objects, or `{ ok: false, ... }` as ADR-007 defines. A command never mutates `data`.
- A user action flows one way (LY-08): a view reads raw strings from the form, calls a domain command, and passes the result to `commit` in `src/ui/main.js`. `commit` calls `storage.save(result.data)`; only when that succeeds does it replace the state, navigate and render. Otherwise the view stays as it is and shows the error (R-21). Every write in the app goes through `commit`; views never call storage.
- `src/ui/main.js` is the composition root (LY-10). It alone calls `openBrowserStorage()` from `src/storage/storage.js`, supplies `crypto.randomUUID`, the clock and `navigator.language`, and hands them on as parameters. `window.localStorage` itself is touched only inside `openBrowserStorage()`, because the access alone can throw (JS-07).
- UI state is one object owned by `src/ui/main.js`: the data, the current route, the two search texts and the form error, if any. Nothing is on `window` (JS-13).
- A view has the shape `render(container, viewModel, actions)` and one delegated listener per container (JS-11). A view holds no arithmetic on amounts, no sort, no filter and no check on input; it gets those from the domain (LY-05).
- Tests follow the layers (LY-12): `tests/<module>.test.js` for each domain and storage module, values only for the domain, an in-memory `Storage` fake for storage (JS-17). `src/ui/format.js` and `src/ui/router.js` have no DOM, so they also get `tests/format.test.js` and `tests/router.test.js`. Views are covered by `docs/MANUAL-CHECKS.md`.

## Consequences
- Every rule of the requirements can be proved under Node; only rendering is left to manual checks.
- R-21 is implemented once, in `commit`, and a new write cannot forget it.
- A domain command rebuilds arrays on each change, which is more copying than an in-place edit; at the size `localStorage` allows this does not matter.
- The domain imports nothing from `src/ui/`, so a domain rule that needs the locale receives it as an argument.
- An agent that hits the edge of this decision writes NEEDS HUMAN and stops.

## Not decided here
- The list of screens and their markup: `docs/UI-SPEC.md`, with the routes in ADR-005.
- How the slices are cut: `docs/PLAN.md`.

## Answered
Q: D1. May the screens share one extra file for what they all show the same way (banners, the confirmation dialog, form fields, empty states)?  A (2026-10-30, Ioan Bita): "Yes. One file, src/ui/views/components.js, pure rendering helpers, no state, no business rules. It joins the module map."
Q: CRI-3. S3 puts Intl.Collator in the domain while the module map gives src/ui/format.js every Intl call; where does the collator live?  A (2026-10-30, Ioan Bita): "In src/ui/format.js: it builds the collator once from the locale and main.js passes its compare function to the domain list functions as a parameter. The domain imports no Intl."
