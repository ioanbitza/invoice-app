---
name: stack-javascript
user-invocable: false
description: How a plain browser JavaScript app is built in this kit, as checkable rules with MDN, nodejs.org, web.dev and WHATWG sources: ES modules with no bundler and no framework, a domain of pure functions on frozen data, integer money, localStorage behind one module with quota and parse errors shown to the user, versioned stored data with migrations, DOM rendering without innerHTML, event delegation, crypto.randomUUID(), no globals, strict equality, Intl for every formatted value, node --test conventions, no dependency without an ADR. Rules JS-01 to JS-18. Read by the architect, the planner, the builder, the tester, the devops role, the finders and the verifier.
x-tags: [javascript, node, browser, localstorage]
x-roles: [architect, planner, builder, tester, devops, finder-correctness, finder-security, finder-contract, verifier]
---

# Stack: plain browser JavaScript

## What this covers
The shape of a small browser app the kit produces without a bundler, a framework or a dependency: ES modules loaded by the browser as they are written, a domain of pure functions, one storage module over `localStorage`, a UI layer that renders with DOM APIs, and tests that run with `node --test` and nothing else. The rules below are the kit's choices among what MDN and nodejs.org document; where the platform offers two ways, the rule picks one and says how the pick is checked. A rule in a file binds the architect, the builder and the review alike, and a reviewer cites it by id. The discipline skills (`discipline-layering`, `discipline-testing`, `discipline-errors-observability`) still apply; this file adds the JavaScript names, APIs and commands. The UI rules (`skills/ui-ux/SKILL.md`) and the design contract (`docs/UI-SPEC.md`) say what the screens look like; this file says how the code behind them is written.

## Rules
Rule ids are `JS-nn`. A finding cites one of them; the review scripts refuse an id that is not here.

### JS-01 Every file is an ES module loaded with `<script type="module">`, and every import is a relative path with its `.js` extension
Why: a classic script shares one global scope with every other script and loads in document order; a module has its own scope, is strict by default, defers until the document is parsed, and declares what it needs with `import`. The browser resolves module specifiers as URLs, so a bare name (`import x from 'money'`) or a path without the extension fails at runtime even though Node would accept it; writing `./money.js` makes the same file work in the browser and under `node --test` without a loader. One `<script type="module" src="src/ui/main.js">` in `index.html` is the whole entry; no inline script, no second classic script.
Source: MDN, JavaScript modules, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules; MDN, import, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import; MDN, The script element, https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script
Applies to: code

### JS-02 `package.json` at the root carries `"type": "module"`, `"private": true`, a `"scripts": { "test": "node --test" }` entry and no `dependencies` or `devDependencies` key
Why: without `"type": "module"` Node reads `.js` files as CommonJS and every test file would need the `.mjs` extension that the browser does not care about; the field makes `.js` mean the same thing in both runtimes. `private` keeps the app from being published by accident. The absence of dependency keys is what JS-18 and the gate check; a `node_modules` folder in the repository is a finding.
Source: nodejs.org, Modules: Packages, "Determining module system", https://nodejs.org/api/packages.html; nodejs.org, Modules: ECMAScript modules, https://nodejs.org/api/esm.html
Applies to: config

### JS-03 Three folders with a one-way dependency: `src/domain/` imports nothing outside itself and never names `document`, `window` or `localStorage`; `src/storage/` is the only module that touches `localStorage`; `src/ui/` imports both and holds no business rule
Why: a domain function that reads the DOM cannot be tested under Node and cannot be reused behind another screen; a UI handler that computes a total duplicates a rule the domain already owns and the two drift. The import graph is the proof: `grep -rn "localStorage\|document\.\|window\." src/domain` returns nothing, and no file under `src/domain/` imports from `../ui/` or `../storage/`. This is the layer rule `finder-contract` checks (its item 4) and `discipline-layering` states in general.
Source: MDN, JavaScript modules, "Exporting module features" and "Importing features into your script", https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules; MDN, export, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export
Applies to: design

### JS-04 Domain functions are pure: they take plain data and return new data, never mutate an argument, and constants and lookup tables are `Object.freeze`d
Why: a function that mutates its input makes the caller's variable change behind its back, and a test that passes once passes by accident. Returning a new object (`{ ...order, lines: [...order.lines, line] }`, `toSorted`, `with`) keeps every earlier value valid, so undo, comparison and re-rendering are trivial. `Object.freeze` on a table of VAT rates or statuses turns a stray assignment into a thrown `TypeError` in strict mode, which modules are.
Source: MDN, Object.freeze(), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze; MDN, Array.prototype.toSorted(), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted; MDN, Array.prototype.with(), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/with
Applies to: code

### JS-05 Money is an integer number of minor units (cents) with its currency code; arithmetic stays in integers, rounding happens once with `Math.round` on an integer scaled value, and every amount is checked with `Number.isSafeInteger`
Why: `0.1 + 0.2` is not `0.3` in a binary double, so a total built from `19.99` style values is wrong by a cent after a few lines and the accountant notices. Integers below `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991) are exact, so `{ amount: 1999, currency: 'EUR' }` with `amount * quantity` is exact too; a percentage is applied as `Math.round(amount * rate / 10000)` with the rate in basis points, and the `isSafeInteger` check refuses a value that would have lost precision. Division to a decimal happens only in the formatter (JS-15). `toFixed` is a display function, never an arithmetic one.
Source: MDN, Number.MAX_SAFE_INTEGER, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER; MDN, Number.isSafeInteger(), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger; MDN, Math.round(), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
Applies to: code

### JS-06 An instant is stored as an ISO 8601 UTC string from `toISOString()`, and the clock is a parameter (`now = () => Date.now()`) of every domain function that needs it
Why: a `Date` object does not survive `JSON.stringify` as a date, a local-time string means a different instant on each machine, and a function that calls `Date.now()` inside cannot be tested at "one second before the due date". The storage module keeps the string; the domain compares strings or `Date.parse` values; a test passes a fixed `now`. This is `TimeProvider` for JavaScript.
Source: MDN, Date.prototype.toISOString(), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString; MDN, Date.now(), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
Applies to: code

### JS-07 `localStorage` is reached only through `src/storage/`, every `getItem` and `setItem` runs inside a `try`, and a thrown `QuotaExceededError` or `SecurityError` becomes a result the UI shows, never an empty `catch`
Why: `setItem` throws a `DOMException` named `QuotaExceededError` when the origin's budget (about 5 MB in most browsers) is full, and touching `localStorage` at all throws `SecurityError` in a private window or when storage is blocked; an unhandled throw leaves the user with a form that looks saved and is not. The storage function returns `{ ok: true, value }` or `{ ok: false, reason: 'quota' | 'unavailable' | 'corrupt' }`, and the UI tells the user what happened and what to do (export, delete old records, allow storage). The scope guard refuses an empty `catch` under `src/`.
Source: MDN, Window: localStorage property, "Exceptions", https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage; MDN, Storage: setItem() method, https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem; MDN, Storage quotas and eviction criteria, https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria; MDN, DOMException, https://developer.mozilla.org/en-US/docs/Web/API/DOMException
Applies to: code

### JS-08 `JSON.parse` of stored text runs inside a `try`, and a `SyntaxError` or a value of the wrong shape is reported as `corrupt` and shown; the app never overwrites data it could not read
Why: a stored string can be truncated by a crash, edited by an extension or written by an older build; `JSON.parse` throws `SyntaxError` on it, and a parse that succeeds can still return a number where an array was expected. Replacing the value with an empty default would destroy the user's records silently. The storage module validates the shape (an object with a numeric `version` and the expected `data` type) after parsing, keeps the raw text under a `<key>.corrupt` entry for recovery, and returns `corrupt`; the UI shows a banner with an export action.
Source: MDN, JSON.parse(), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse; MDN, SyntaxError: JSON.parse: bad parsing, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/JSON_bad_parse
Applies to: code

### JS-09 Every stored document is `{ "version": n, "data": ... }`, `src/storage/migrations.js` holds one pure function per step (`1 -> 2`, `2 -> 3`), each with a test, and a version newer than the code knows is refused, not guessed
Why: `localStorage` keeps strings for years; the build that reads them is never the one that wrote them. Without a version number a field rename is a silent `undefined` across every old record; with one, the storage module runs the migration chain up to the current version, writes the result back once, and a record from a newer build (the user opened a newer deploy in another tab) is left untouched with a message instead of being downgraded. The migration functions are domain-free data transforms, tested with a fixture of each historical shape.
Source: MDN, Window: localStorage property, https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage; web.dev, Storage for the web, https://web.dev/articles/storage-for-the-web; WHATWG HTML Standard, Web storage, https://html.spec.whatwg.org/multipage/webstorage.html
Applies to: both

### JS-10 User text reaches the page only through `textContent` or an attribute set with `setAttribute`; structure comes from `document.createElement` or a `<template>` cloned with `importNode`; `innerHTML`, `insertAdjacentHTML` and `document.write` do not appear
Why: a customer name with `<img onerror=...>` in it runs as code the moment it is assigned to `innerHTML`; `textContent` renders the same string as text, whatever it contains. A `<template>` in `index.html` keeps the markup readable while the clone stays inert until it is inserted; `importNode(tpl.content, true)` then `querySelector` and `textContent` fill it. A URL from user data goes into `href` only after its scheme is checked (`http:` or `https:`). The scope guard refuses the three sinks on write; this rule says what to use instead.
Source: MDN, Element: innerHTML property, "Security considerations", https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations; MDN, Node: textContent property, https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent; MDN, The template element, https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template; MDN, Document: importNode() method, https://developer.mozilla.org/en-US/docs/Web/API/Document/importNode; web.dev, Prevent DOM-based cross-site scripting vulnerabilities with Trusted Types, https://web.dev/articles/trusted-types
Applies to: code

### JS-11 Events are handled by delegation: one `addEventListener` on the view's container, the action read from `event.target.closest('[data-action]')`, and no `onclick` attribute or per-row listener
Why: a listener attached to every row is lost when the list re-renders and leaks when it does not; a handler in an HTML attribute runs in the global scope that JS-13 forbids and cannot be removed. One listener per container survives any re-render, costs the same for one row or a thousand, and makes the mapping from `data-action="delete-line"` to a function one `switch` the reviewer can read. A listener added for a view is removed when the view goes away (`AbortSignal` passed to `addEventListener`, or `remove()` of the container).
Source: MDN, Event bubbling, "Event delegation", https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling; MDN, EventTarget: addEventListener() method, https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener; MDN, Element: closest() method, https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
Applies to: code

### JS-12 Identifiers are `crypto.randomUUID()` strings made where the record is created; never `Date.now()`, a counter or `Math.random()`
Why: two records created in the same millisecond, or in two tabs, collide on a timestamp id; a counter kept in storage is itself a record that can be lost; `Math.random()` is not unique enough and not a standard format. `randomUUID()` gives a version 4 UUID from a cryptographic source, is available in every current browser (on `https:` and `localhost`) and as `globalThis.crypto` in Node, so the same domain function runs in the app and in a test. A test that needs a known id passes an `id` or an `ids` function as a parameter, like the clock in JS-06.
Source: MDN, Crypto: randomUUID() method, https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID; nodejs.org, Global objects, "crypto", https://nodejs.org/api/globals.html
Applies to: code

### JS-13 No globals: nothing is assigned to `window.*` or `globalThis.*`, no `var`, `const` by default and `let` only for a binding that is reassigned, state lives in the module that owns it and is passed as an argument
Why: a value on `window` can be read and overwritten by any script, extension or console session and cannot be found by following imports; `var` hoists to the function or global scope and lets a loop variable leak. Modules are strict by default, so an assignment to an undeclared name already throws; this rule adds that nothing is published on purpose either. The UI state is one object owned by `src/ui/main.js` and handed to `render(state)`; the domain gets what it needs as parameters.
Source: MDN, Strict mode, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode; MDN, JavaScript modules, "Other differences between modules and classic scripts", https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules; MDN, const, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const
Applies to: code

### JS-14 Comparisons use `===` and `!==` only; an absent value is tested with `=== undefined`, `=== null` or `??`, never with `==`
Why: `==` converts types first, so `'' == 0`, `'0' == false` and `null == undefined` are all true, and a customer id `'10'` read from a `data-` attribute compares equal to the number `10` in one branch and not in the next. Strict equality compares type and value, and `??` says "default only when null or undefined" without also catching `0` or `''` the way `||` does.
Source: MDN, Strict equality (===), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality; MDN, Nullish coalescing operator (??), https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
Applies to: code

### JS-15 Every number, amount, date and plural the user sees goes through `Intl` (`NumberFormat` with `style: 'currency'`, `DateTimeFormat`, `PluralRules`) from one `src/ui/format.js`, with the locale set in one place
Why: a hand-made `amount / 100 + ' EUR'` prints `19.9 EUR`, uses the wrong decimal separator for a Romanian or German user and breaks when a currency has zero or three minor digits. `Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR' }).format(1999 / 100)` prints `19,99 EUR` and knows the digits of every currency; the division by 100 happens here and nowhere else (JS-05). One module means one locale decision, recorded in an ADR when it is not the browser's default.
Source: MDN, Intl.NumberFormat, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat; MDN, Intl.DateTimeFormat, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat; MDN, Intl.PluralRules, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules
Applies to: code

### JS-16 Tests are `tests/**/*.test.js` run by `node --test`, written with `node:test` and `node:assert/strict`, one requirement id at the start of every title, and the domain tests import only from `src/domain/`
Why: the Node test runner needs no dependency, finds `*.test.js` on its own and prints a TAP report the gate can read; `assert/strict` makes `deepEqual` strict so `1` and `'1'` differ. The requirement id in the title is what `tools/trace.mjs` joins to `docs/REQUIREMENTS.md`; a title without it is an orphan test. A domain test that imports from `src/ui/` would need a DOM and proves the layers are crossed (JS-03). Tests do not mock what they can call; a failing test fails on a value, not on a stub.
Source: nodejs.org, Test runner, https://nodejs.org/api/test.html; nodejs.org, Assert, https://nodejs.org/api/assert.html; nodejs.org, Command-line API, "--test", https://nodejs.org/api/cli.html
Applies to: both

### JS-17 Storage tests run against an in-memory fake with the `Storage` interface (`getItem`, `setItem`, `removeItem`, `clear`, `length`, `key`) injected into the storage module; no `localStorage` global under Node, no DOM test library
Why: Node has no `localStorage` (nothing to patch, and a polyfill package would break JS-18), and a storage module that reaches for the global cannot be tested at all. `createStorage(backing)` takes the `Storage`-shaped object; the app passes `window.localStorage`, the test passes a `Map`-backed fake, and a second fake whose `setItem` throws a `DOMException('...', 'QuotaExceededError')` proves JS-07 without filling a real browser. Migration tests (JS-09) feed each historical fixture through the same fake.
Source: WHATWG HTML Standard, The Storage interface, https://html.spec.whatwg.org/multipage/webstorage.html; MDN, Storage: getItem() method, https://developer.mozilla.org/en-US/docs/Web/API/Storage/getItem; nodejs.org, Test runner, "Mocking", https://nodejs.org/api/test.html
Applies to: both

### JS-18 No dependency, CDN script, web font or external fetch without an accepted ADR that names it, its licence and why the platform API is not enough; `package.json` stays without dependency keys and `index.html` loads only same-origin files
Why: a package brings its transitive tree, its licence and its supply chain into an app that otherwise has none; a `<script src="https://cdn...">` makes the page depend on a third party being up and honest, and a web font fetch sends every visitor's IP to the font host, which the legal skill flags as a personal-data transfer. The browser platform already has modules, `Intl`, `crypto`, `<template>` and `<dialog>`; when it is not enough, the plan marks `NEEDS HUMAN` and the human writes `docs/decisions/ADR-nnn-<package>.md` from `templates/ADR.md`. The gate checks the dependency keys and `grep -n "src=\"http" index.html`.
Source: nodejs.org, Modules: Packages, https://nodejs.org/api/packages.html; MDN, The script element, "src", https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script; MDN, Subresource Integrity, https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
Applies to: config

## The project layout the planner uses
`<app>` is the product name from `docs/REQUIREMENTS.md`, lower-case.

```
index.html                 one <script type="module" src="src/ui/main.js">, <template> elements for repeated markup
styles.css                 tokens in :root (docs/UI-SPEC.md), then components; no raw color outside :root
package.json               "type": "module", "private": true, "scripts": { "test": "node --test" }, no dependency keys
src/
  domain/                  pure functions, frozen tables, money as integer cents; imports nothing outside this folder
    money.js, <entity>.js, validation.js
  storage/                 the only localStorage user; createStorage(backing), load/save with { version, data }
    storage.js, migrations.js
  ui/                      main.js (state, render, one delegated listener per view), format.js (Intl), views/<screen>.js
tests/
  <entity>.test.js         domain tests, import only ../src/domain/
  storage.test.js          the in-memory Storage fake, quota and corrupt cases, every migration step
docs/
  REQUIREMENTS.md, PLAN.md, UI-SPEC.md, MANUAL-CHECKS.md, decisions/
```

Commands the gate runs, in this order: `node --test`, then `grep -rln "localStorage\|document\.\|window\." src/domain` (must print nothing), then a check that `package.json` has no `dependencies` or `devDependencies` key and `index.html` has no `src="http` or `href="http` in a `<script>` or `<link rel="stylesheet">`.

A slice's `**Files:**` line names at most six files. A domain slice, a storage slice and a UI slice look like this in `docs/PLAN.md`:

```
**Files:** `src/domain/money.js`, `src/domain/lines.js`, `tests/money.test.js`, `tests/lines.test.js`

**Files:** `src/storage/storage.js`, `src/storage/migrations.js`, `tests/storage.test.js`

**Files:** `index.html`, `styles.css`, `src/ui/main.js`, `src/ui/views/orders.js`, `src/ui/format.js`
```

The `package.json` the init slice writes, so JS-02 and JS-18 hold from the first commit:

```json
{ "name": "<app>", "private": true, "type": "module", "scripts": { "test": "node --test" } }
```

## What a reviewer checks
- Open `index.html` and `package.json`: one `<script type="module">`, no inline script, no `src="http`; `"type": "module"`, `"private": true`, the `test` script, no dependency keys, no `node_modules` in the tree (JS-01, JS-02, JS-18).
- Read every `import` in the diff: relative, with `.js`; nothing under `src/domain/` imports from `ui/` or `storage/`; `grep -rn "localStorage\|document\.\|window\." src/domain` prints nothing; `grep -rln localStorage src` prints only files under `src/storage/` (JS-01, JS-03, JS-07).
- Search the domain for `.push(`, `.splice(`, `.sort(`, `delete ` and `=` on a parameter's property: each one is a mutation of an argument unless the object was created in the same function; look for `Object.freeze` on every exported table (JS-04).
- Search for `parseFloat`, `toFixed(` outside `src/ui/format.js`, `* 1.`, `/ 100` outside the formatter, and any amount typed as a decimal literal; confirm `isSafeInteger` guards the money constructor and `Math.round` is applied to an integer-scaled value (JS-05, JS-15).
- Search for `new Date(` and `Date.now()` inside `src/domain/`: each must be a default parameter, not a call in the body; stored dates are `toISOString()` strings (JS-06).
- Read `src/storage/`: every `getItem`, `setItem` and `JSON.parse` inside a `try`; the `catch` names the error and returns a reason, never empty; `{ version, data }` on every write; a migration function per version step with a test per step; a newer version is refused (JS-07, JS-08, JS-09).
- Search `src/ui/` for `innerHTML`, `insertAdjacentHTML`, `document.write`, `on[a-z]+=` in `index.html`, `href=` set from data without a scheme check; count `addEventListener` calls, one per view container, and `closest('[data-action')` in the handler (JS-10, JS-11).
- Search for `Date.now()` or `Math.random()` used as an id, `window.` or `globalThis.` on the left of `=`, `var `, `==` and `!=` not followed by `=` (JS-12, JS-13, JS-14).
- Open `tests/`: every title starts with `R-nn`; `node:test` and `node:assert/strict` are the only imports besides `../src/`; storage tests use the in-memory fake and have a quota case and a corrupt case (JS-16, JS-17).

## Scenarios the tester writes
- Given a line of 3 items at 1999 cents with a 19 % rate in basis points, when the total is computed, then it is 7136 cents and `Number.isSafeInteger` holds; given an amount of `19.99`, when the money constructor runs, then it throws (JS-05).
- Given a fake `Storage` whose `setItem` throws a `DOMException` named `QuotaExceededError`, when the app saves an order, then `save` returns `{ ok: false, reason: 'quota' }` and the previous value is unchanged (JS-07, JS-17).
- Given the stored text `{"version":1,"data":[` (truncated), when the app loads, then `load` returns `{ ok: false, reason: 'corrupt' }`, the raw text is kept under `orders.corrupt`, and nothing is written to `orders` (JS-08).
- Given a fixture written as version 1, when the app loads with code at version 3, then the record is migrated through 2 to 3, written back once as version 3, and the test for each step passes alone; given a record at version 4, when the app loads, then it is refused with `reason: 'newer'` (JS-09).
- Given a customer named `<img src=x onerror=alert(1)>`, when the list renders, then `document.querySelector('[data-field=name]').textContent` is that literal string and the list contains no `img` element (JS-10).
- Given a `now` fixed at one second before an order's due date, when `isOverdue(order, now)` runs, then it is false, and at one second after it is true (JS-06).
