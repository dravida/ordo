# Ordo Digitization — Architecture

This document describes the target architecture for the modernized Ordo
publishing system. It is the canonical reference for agents executing the
phases in `project/AGENT_BUILD_PLAN.md`. Read it before starting any phase,
and update it whenever an architectural decision changes.

For the narrative project context, scope, and phase-by-phase build steps,
see `project/AGENT_BUILD_PLAN.md`. For the workflow as Editors experience it,
see `project/workflow_overview.md` and `project/workflow_details.md`.

---

## 1. Goals and non-goals

**Goals**

- One rubric engine that runs unchanged in Node (CI publishing) and in the
  browser (provisional years and parish overlays).
- Authoritative artifacts (`json`, `html`, `pdf`, `docx`) versioned per year
  and published as static files — no servers, no database, no hosting bill.
- A workflow the non-technical Editor can drive entirely from Google Sheets
  and Google Docs once the Editor track (D5+) is in place.
- A clean separation between *engine* (deterministic computation), *data*
  (JSON), *merge* (overrides + jurisdiction + prose), and *render* (HTML/
  PDF/DOCX).

**Non-goals**

- No TypeScript, React, Tailwind, ORM, database, or backend service.
- No rewriting of rubric logic during the D2 port. Mechanical translation
  only; behavior must remain byte-identical to `legacy/`.
- No network calls inside tests.

---

## 2. The five-layer model

```
  ┌──────────────────────��─────────────────────────────────────┐
  │ 1. SOURCES OF TRUTH                                        │
  │    Engine code + JSON data + jurisdiction configs  (Git)   │
  │    Editor content: Calendar Sheet, Prose Doc,              │
  │      Necrology, Lectionaries, Votives           (G. Drive) │
  └────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────────┐
  │ 2. COMPUTE & MERGE                                         │
  │    engine output                                           │
  │      + jurisdiction rules                                  │
  │      + editor overrides                                    │
  │      + prose (marker substitution)                         │
  │      + reference tables                                    │
  │    = validated, merged year                                │
  │    Runs in: GitHub Actions (CI) and the browser            │
  │             (provisional years, parish overlays)           │
  └────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────────┐
  │ 3. PUBLISHED ARTIFACTS                                     │
  │    ordo-YYYY.json   authoritative data + JSON API          │
  │    ordo-YYYY.html   rendered with anchor TOC               │
  │    ordo-YYYY.pdf    rendered with page-number TOC          │
  │    ordo-YYYY.docx   rendered with Word TOC field           │
  │    manifest.json    list of authorized years               │
  │    Lives in: published/ in the repo + GitHub Releases      │
  └────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────────┐
  │ 4. DISTRIBUTION                                            │
  │    Web calendar (GitHub Pages, iframe-embeddable in Wix)   │
  │    Direct downloads (GitHub Release assets)                │
  │    JSON API (static JSON URL, no auth)                     │
  └────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────────┐
  │ 5. CONSUMERS                                               │
  │    Public · Parish priests · Third parties                 │
  └────────────────────────────────────────────────────────────┘
```

### Layer responsibilities at a glance

| Layer | Owns | Tech |
|---|---|---|
| 1. Sources of truth | rubric logic, fixed/moveable feast data, jurisdiction & parish configs, Editor prose & overrides | Git, Google Drive |
| 2. Compute & merge | deterministic year computation, override layering, schema validation | Node.js engine + merge step |
| 3. Artifacts | versioned per-year JSON / HTML / PDF / DOCX + manifest | static files |
| 4. Distribution | hosting + download + API surface | GitHub Pages, GitHub Releases |
| 5. Consumers | reading the calendar, generating parish overlays, integrating data | browsers, third-party scripts |

---

## 3. Repository layout

The repo is an npm workspace root with three workspaces (`engine`, `tools`,
`web`) plus `legacy/`, `docs/`, `published/`, and (later) `.github/`.

```
ordo/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # lint + tests + schema validation on PR
│       ├── seed-year.yml          # manual dispatch: seed a year into Sheet
│       └── publish-year.yml       # repository_dispatch from Apps Script
│
├── docs/
│   ├── about_ordo.md              # reference (moved from root)
│   ├── quality_review.md          # reference (moved from root)
│   ├── architecture.md            # this file
│   ├── editor_handbook.md         # written for non-technical Editors
│   └── developer_guide.md         # onboarding for future maintainers
│
├── legacy/                        # untouched regression oracle
│   ├── kalendar.html
│   ├── kalendar.js
│   ├── kalendar_data.js
│   ├── kalendar_old.js
│   ├── kalendar_view.js
│   ├── kalendar_wix.html
│   ├── kalendar.css
│   ├── date_calcs.js
│   ├── roman_numeral.js
│   ├── tests.js
│   ├── test.html
│   ├── webserver.sh
│   ├── fish.svg
│   └── fish2.svg
│
├── engine/                        # the rubric engine, modernized
│   ├── package.json               # "type": "module", Node + browser safe
│   ├── src/
│   │   ├── index.js               # public API: computeOrdo(year, options)
│   │   ├── kalendar.js
│   │   ├── kalendar-year.js
│   │   ├── kalendar-date.js
│   │   ├── kalendar-celebration.js
│   │   ├── precedence.js          # demote, translate, rank
│   │   ├── date-calcs.js
│   │   ├── roman-numeral.js
│   │   ├── merge.js               # overrides + jurisdiction + parish
│   │   └── schema/
│   │       ├── day-record.schema.json
│   │       ├── override.schema.json
│   │       ├── jurisdiction.schema.json
│   │       └── parish-config.schema.json
│   ├── data/
│   │   ├── fixed.json             # extracted from legacy/kalendar_data.js
│   │   ├── moveable.json
│   │   ├── meta.json
│   │   └── ranks.json
│   ├── jurisdictions/
│   │   └── antiochian-wro.json    # AWRV additions/renames/elevations
│   ├── parishes/
│   │   └── example-parish.json    # contribution model + demo
│   └── test/
│       ├── regression.test.js     # vs legacy for 2017–2027
│       ├── engine.test.js         # unit tests
│       ├── merge.test.js
│       └── schema.test.js
│
├── tools/                         # CLI scripts (Node-only)
│   ├── package.json
│   ├── extract-legacy-data.mjs    # one-shot: vm-eval legacy → JSON
│   ├── publish-year.mjs           # the publish pipeline entry point
│   ├── render-html.mjs            # Handlebars assembly
│   ├── render-pdf.mjs             # Puppeteer + Paged.js
│   ├── render-docx.mjs            # (D6)  docx npm package
│   ├── seed-year.mjs              # (D5)  writes to Google Sheets
│   └── templates/
│       ├── ordo.html              # Handlebars; {{INSERT: …}} markers
│       └── ordo.css               # print stylesheet, Paged.js-aware
│
├── web/                           # public SPA (Vite)
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   ├── main.js                # hash routing, engine fallback
│   │   └── view.js                # renders a single day
│   └── public/
│       └── embed.html             # minimal iframe target
│
├── published/                     # versioned artifacts
│   ├── manifest.json
│   ├── ordo-2026.json
│   ├── ordo-2026.html
│   ├── ordo-2026.pdf
│   ├── ordo-2026.docx
│   └── ordo-2027.*
│
├── package.json                   # workspace root
├── LICENSE                        # MIT
└── README.md
```

---

## 4. The engine (Layer 2, deterministic core)

### 4.1 Runtime constraints

- ES modules only (`"type": "module"`). No CommonJS.
- No Node-only APIs in `engine/src/`. The engine must bundle for the
  browser without polyfills. (Node-only code lives in `tools/`.)
- Zero runtime dependencies for `engine/` if at all possible. `ajv` is the
  only approved dev/test dep for the engine.
- Modern ES2022. Two-space indent, semicolons, single quotes.

### 4.2 Public API

`engine/src/index.js` exposes a single function:

```js
export function computeOrdo(year, options = {}) {
  // returns { year, days: DayRecord[] }
}
```

`options` is reserved for future use (jurisdiction id, parish overlay,
locale). For D2 it is accepted and ignored.

### 4.3 DayRecord shape

Each element of `days` matches `engine/src/schema/day-record.schema.json`:

```json
{
  "date": "YYYY-MM-DD",
  "weekday": "Sunday|Monday|...",
  "season": "string",
  "isAbstinence": false,
  "isFast": false,
  "celebrations": [
    {
      "name": "string",
      "klass": "string",
      "office": "string|null",
      "octave": "string|null",
      "obligation": false,
      "devotion": false,
      "rank": 0,
      "secondary": false,
      "transferred": false,
      "nothing": false
    }
  ]
}
```

### 4.4 Data files

The legacy engine reads everything from top-level globals in
`legacy/kalendar_data.js`. D2 externalizes those into JSON under
`engine/data/`:

- `fixed.json`    — fixed-date feasts keyed by `MM-DD`
- `moveable.json` — moveable feasts (Easter-relative, etc.)
- `meta.json`     — class/office/octave metadata
- `ranks.json`    — the rank precedence list from `docs/about_ordo.md`

`tools/extract-legacy-data.mjs` performs the one-time extraction by
`vm`-evaluating `legacy/kalendar_data.js` and serializing the globals.
The legacy file itself is **not** modified.

### 4.5 Regression contract

`engine/test/regression.test.js` is the non-negotiable safety net. For
each year 2017–2027 it:

1. Loads `legacy/kalendar.js` + `legacy/kalendar_data.js` via `vm`.
2. Runs the new engine for the same year.
3. Asserts that every day's celebration names and `klass` values match
   exactly.

The regression suite must stay green across every phase. If the new
engine diverges from legacy for any reason, it is the new engine that is
wrong.

---

## 5. Merge step (Layer 2, jurisdictional + editorial)

`engine/src/merge.js` is the seam between the deterministic engine and
the Editor / jurisdiction inputs. The merge order is fixed and total:

```
engine output
  + jurisdiction rules   (e.g. jurisdictions/antiochian-wro.json)
  + editor overrides     (from Calendar Sheet, D5+)
  + parish overlay       (client-side, D7)
  → validated merged year
```

Every input is validated against its JSON Schema (`override.schema.json`,
`jurisdiction.schema.json`, `parish-config.schema.json`). Malformed
inputs fail loudly with a clear error — **no silent fallbacks**.

For the D2–D4 demo, the merge step is essentially a passthrough: there
are no overrides, the jurisdiction file is optional, and parish overlay
is not wired up yet.

---

## 6. Publishing pipeline (`tools/publish-year.mjs`)

```
  computeOrdo(year)
        │
        ▼
  write published/ordo-YYYY.json
        │
        ▼
  render-html.mjs  (Handlebars assembly with templates/ordo.html)
        │
        ▼
  write published/ordo-YYYY.html
        │
        ▼
  render-pdf.mjs   (Puppeteer + Paged.js)
        │
        ▼
  write published/ordo-YYYY.pdf
        │
        ▼
  render-docx.mjs  (D6 — docx npm package; deferred)
        │
        ▼
  update published/manifest.json
```

CLI:

```
node tools/publish-year.mjs <year> [--local]
```

`--local` skips any remote (Google) inputs and runs the engine-only path,
which is the D3 demo mode.

### 6.1 HTML and PDF

- `templates/ordo.html` is a Handlebars template whose TOC structure
  mirrors the official Ordo's table of contents. For D3 the prose
  sections are stubbed with `Lorem ipsum` between `{{INSERT: …}}`
  markers.
- HTML rendering is pure Handlebars; no headless browser involved.
- PDF rendering loads the rendered HTML in headless Chrome with the
  Paged.js script tag, waits for `window.PagedConfig.after`, then calls
  `page.pdf()`. The TOC must use `target-counter` so page numbers are
  real.
- `templates/ordo.css` targets Letter, generous margins, two-column
  calendar pages. Headings drive the TOC. Sundays are bold; top
  celebration on Sundays is uppercase (mirrors `legacy/kalendar_view.js`).
  `nothing: true` celebrations render as struck-through gray.

### 6.2 DOCX (D6)

Produced from the same JSON via the `docx` npm package, with a Word
`TOC` field so Word resolves page numbers on open. Not implemented in
D3.

### 6.3 Manifest

`published/manifest.json` is the index of authorized years. Minimum
shape:

```json
{ "years": [2026, 2027], "updatedAt": "ISO-8601" }
```

---

## 7. Web SPA (Layer 4 + 5)

The `web/` workspace is a Vite-built static SPA. It is the demo-ready
artifact at the end of D4.

- Hash routing (no server). `#/2027-04-04` deep-links to a date; root
  defaults to today.
- On load it fetches `/published/manifest.json`. If the requested year
  is listed, it fetches `ordo-YYYY.json` and renders. Otherwise it
  imports the engine and calls `computeOrdo(year)` in-browser, rendering
  with a "Provisional — not yet authorized for YYYY" banner.
- Navigation controls (porting the spirit of `legacy/kalendar_view.js`,
  dropping jQuery):
  `← Year`, `← 28d`, `← 1d`, `Today`, `→ 1d`, `→ 28d`, `→ Year`,
  plus a date picker.
- `web/public/embed.html` is a minimal iframe target for embedding in
  Wix.
- `npm run build --workspace=web` produces a static `web/dist/`
  deployable to GitHub Pages. A `publish-to-pages.sh` (or npm script)
  copies the `published/` tree into `web/dist/published/` so the SPA
  can fetch it via a relative URL.

---

## 8. Editor workflow (Layers 1–3, D5+)

This is described in full in `project/workflow_details.md`. The short
version:

1. **Seed** (October each year). Maintainer clicks "Seed Year YYYY" in
   a Google Sheets menu. Apps Script calls a GitHub Actions webhook.
   The engine runs, the Calendar Sheet is created and prefilled, and
   last year's Prose Doc is cloned.
2. **Review** (weeks). Editors work in the Calendar Sheet (per-day
   approval), the Prose Doc (front/back matter between `{{INSERT: …}}`
   markers), and the shared Necrology Sheet. Only flagged rows and
   edited sections need signoff.
3. **Publish**. Lead editor clicks "Publish YYYY". Apps Script pings
   GitHub Actions, which pulls all inputs, runs the merge, validates,
   renders the four artifacts, attaches them to a tagged GitHub
   Release, and updates `manifest.json`. Any `engine_bug` overrides
   auto-file GitHub Issues.

The Google Drive layout is documented in
`project/google_drive_organization.md`.

---

## 9. Distribution (Layer 4)

| Channel | Source | Notes |
|---|---|---|
| Web calendar | GitHub Pages serving `web/dist/` | iframe-embeddable in Wix |
| Direct downloads | GitHub Release assets | free CDN |
| JSON API | static `ordo-YYYY.json` URL | no auth |

There is no API server. The JSON file *is* the API.

---

## 10. Cross-cutting concerns

- **Triggering.** Apps Script → GitHub Actions `repository_dispatch`.
- **Authorization.** Membership in the shared Google Drive folder is
  the entire access-control system for Editors.
- **Versioning.** Git for code; Release tags (`ordo-YYYY-v1`,
  `ordo-YYYY-v2`, …) for artifacts.
- **Validation.** JSON Schema at every merge boundary, via `ajv`.
- **Feedback loop.** Editor overrides flagged `engine_bug` auto-file
  GitHub Issues; engine fixes flow back to the engine module.
- **Logging.** Plain `console.log` / `console.error`. No logging libs.
- **Failure mode.** Loud and immediate. No silent fallbacks.

---

## 11. Conventions

- **Commits.** Conventional Commits (`feat:`, `fix:`, `chore:`,
  `docs:`). One commit per phase unless explicitly told otherwise.
- **Dependencies.** Justify any new runtime dep in the commit message.
  Pre-approved deps: `ajv`, `handlebars`, `puppeteer`, `pagedjs`,
  `vite`. Anything else, ask first.
- **Style.** ES2022, two-space indent, semicolons, single quotes. No
  TypeScript.
- **Tests.** Prefer `node:test`. Snapshot tests are acceptable for
  renderer output. The regression test against `legacy/` is
  non-negotiable.
- **Never modify `legacy/`.** It is the regression oracle, including
  `kalendar_old.js`.
- **Tests run offline.** No external network calls during tests.

---

## 12. Phase status

The phase list and Definition-of-Done checklists live in
`project/AGENT_BUILD_PLAN.md`. Update that file (not this one) to mark
phases complete. This document changes when *architecture* changes.

| Phase | Title | Status |
|---|---|---|
| D1 | Repo reorganization | pending |
| D2 | Engine port to ES modules + data externalization | pending |
| D3 | Local publish pipeline (HTML + PDF) | pending |
| D4 | Web calendar with engine fallback | pending |
| D5 | Google Sheets seed (Editor workflow) | not started |
| D6 | DOCX rendering + GitHub Actions publishing | not started |
| D7 | Parish overlay | not started |
