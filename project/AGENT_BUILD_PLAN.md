# Ordo Digitization — Agent Build Plan

You are an autonomous coding agent working on the Ordo digitization project.
Read this file in full before doing anything. Re-read it at the start of each phase.
Execute one Phase at a time. After a phase is complete, mark it as complete so that a subsequent execution knows exactly where to pick up.
Recommended approach:
Day 1 (D1+D2): Phase D1 is mostly mechanical file moves; GLM will handle it cleanly. Phase D2 is the riskiest port — keep the regression suite tight and the agent will self-correct. Demo at end of D2: "look, the new engine produces identical output to the legacy one for years 2017–2027."
Day 2 (D3): PDF rendering with Paged.js is where you might burn 2–3 iterations on CSS. That's fine and normal.
Day 3 (D4): Web SPA. This is the demo. You can show it to the Editor and Developer without any of the Google plumbing yet, and they'll see exactly what the public will see. That's the most persuasive artifact you can put in front of them at this stage.
Then pause. Take the demo to the review meeting before doing D5+. The Editor workflow involves credentials, Apps Script deployment, and a Google Cloud service account — don't invest in that until everyone has agreed on the demo direction.

## Project context (one paragraph)

The Ordo is a Western Rite (Benedictine) liturgical calendar published annually
by a non-technical Editor. The repository already contains a working JavaScript
rubric engine (in `legacy/`) that computes the calendar from rubrics, Easter
computus, and a metadata table of fixed/moveable feasts. Our job is to modernize
that engine into reusable ES modules, externalize its data to JSON, and build a
publishing pipeline that produces authorized JSON/HTML/PDF/DOCX outputs per
year, plus a public web calendar that consumes those outputs (with an in-browser
engine fallback for un-authorized years). Editors will eventually drive the
workflow from Google Sheets + Google Docs; for the demo phases below, we are
NOT touching Google yet — we want a CLI-only demo running locally first.

## Architecture (five layers, top to bottom)

1. **Sources of Truth** — engine code + JSON data + jurisdiction configs (Git);
   later, Editor content in Google Drive (Sheets + Docs).
2. **Compute & Merge** — engine output + jurisdiction rules + overrides + prose;
   runs in GitHub Actions for authoritative publication AND in the browser for
   un-authorized years and parish overlays.
3. **Published Artifacts** — `ordo-YYYY.{json,html,pdf,docx}` + `manifest.json`
   in `published/`, also attached to GitHub Releases.
4. **Distribution** — GitHub Pages (web), GitHub Releases (downloads),
   static JSON URL (API).
5. **Consumers** — public, parish priests, third parties.

The engine must be reusable in **both Node and browser** runtimes.

## Phases and Definition of Done

Execute one phase at a time. After each phase, run all tests, commit with a
conventional commit message, and STOP. Wait for the human to instruct the next
phase. Do not start the next phase autonomously.

If anything in a phase is ambiguous, STOP and ask the human a focused question
rather than guessing.

### Phase D1 — Repo reorganization

**Goal:** establish the new directory layout without changing engine behavior.

Steps:
1. Create the directory structure as documented in `docs/architecture.md`
   (you will need to create that file too, summarizing this build plan's
   architecture section).
2. Move all existing root-level engine files into `legacy/` unchanged.
   Files to move: `kalendar.html`, `kalendar.js`, `kalendar_data.js`,
   `kalendar_old.js`, `kalendar_view.js`, `kalendar_wix.html`, `kalendar.css`,
   `date_calcs.js`, `roman_numeral.js`, `tests.js`, `test.html`,
   `webserver.sh`, `fish.svg`, `fish2.svg`.
3. Move `about_ordo.md` and `quality_review.md` into `docs/`.
4. Create an npm workspace root `package.json` declaring workspaces
   `engine`, `tools`, `web`.
5. Create `engine/package.json` with `"type": "module"` and minimal deps.
6. Add `.gitignore` for `node_modules`, `published/*.tmp`, `.DS_Store`.
7. Create a stub `README.md` describing the project and pointing to docs.
8. Pick license: **MIT** unless told otherwise. Create `LICENSE`.

**Definition of Done:**
- [ ] All legacy files present under `legacy/` and runnable via
      `cd legacy && bash webserver.sh` (verify by opening `kalendar.html`).
- [ ] Empty but valid `engine/`, `tools/`, `web/` workspaces install cleanly
      with `npm install` at root.
- [ ] `docs/architecture.md` exists and reflects the 5-layer model.
- [ ] Single commit: `chore: reorganize repo into workspaces, move legacy/`.

### Phase D2 — Engine port to ES modules + data externalization

**Goal:** make the engine importable from Node and the browser, with data
in JSON files rather than top-level JS globals. Behavior must be **byte-
identical** to legacy.

Steps:
1. Port `legacy/kalendar.js` to `engine/src/` as ES modules:
   - `kalendar.js` (entry / static helpers)
   - `kalendar-year.js`
   - `kalendar-date.js`
   - `kalendar-celebration.js`
   - `precedence.js` (extract demote/translate/rank logic)
   - `date-calcs.js`, `roman-numeral.js`
   Keep class shapes and method signatures the same wherever practical.
2. Write `tools/extract-legacy-data.mjs` that parses `legacy/kalendar_data.js`
   and emits:
   - `engine/data/fixed.json`
   - `engine/data/moveable.json`
   - `engine/data/meta.json`
   - `engine/data/ranks.json` (the rank precedence list from `about_ordo.md`)
   Use a tolerant parser (e.g. a temporary `vm` context that evaluates the
   legacy file and serializes the globals). Do NOT hand-translate.
3. Update the new engine modules to import the JSON data instead of relying
   on globals.
4. Expose a single public function from `engine/src/index.js`:
   ```js
   export function computeOrdo(year, options = {}) {
     // returns { year, days: DayRecord[] }
   }
   ```
   `DayRecord` shape (also written as JSON Schema in
   `engine/src/schema/day-record.schema.json`):
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
5. Write `engine/test/regression.test.js` (vitest or node:test, your choice —
   prefer `node:test` to keep deps minimal). For each year 2017–2027:
   - Load `legacy/kalendar.js` + `legacy/kalendar_data.js` via `vm` in Node.
   - Compare every day's celebration names and klass values against the new
     engine. They must match exactly.
6. Write `engine/test/schema.test.js`: every DayRecord for 2027 must validate
   against `day-record.schema.json` (use `ajv`).

**Definition of Done:**
- [ ] `npm test --workspace=engine` passes.
- [ ] `node -e "import('./engine/src/index.js').then(m => console.log(m.computeOrdo(2027).days.length))"` prints `365` (or `366` in leap years).
- [ ] No code path in `engine/src/` reads from `legacy/`.
- [ ] Single commit: `feat(engine): port to ES modules, externalize data to JSON`.

### Phase D3 — Local publish pipeline producing HTML and PDF

**Goal:** `node tools/publish-year.mjs 2027 --local` produces
`published/ordo-2027.{json,html,pdf}` from the engine alone, no Google,
no GitHub Actions. (DOCX is deferred to D5.)

Steps:
1. Implement `tools/publish-year.mjs`:
   - Args: `<year>` plus `--local` to skip remote inputs.
   - Pipeline: `computeOrdo(year)` → write `published/ordo-<year>.json` →
     render HTML → render PDF → update `published/manifest.json`.
2. Implement `templates/ordo.html` as a Handlebars template with the TOC
   structure mirroring the official Ordo's table of contents (see
   `docs/architecture.md` — copy the TOC list from the existing 2026 PDF
   if available, else stub the prose sections with `Lorem ipsum`).
   Use `{{INSERT: ...}}` markers; for D3 just substitute the calendar marker.
3. Implement `tools/render-html.mjs` using Handlebars to assemble the HTML.
4. Implement `tools/render-pdf.mjs` using Puppeteer + Paged.js:
   - Launch headless Chrome.
   - Load the HTML with Paged.js script tag included.
   - Wait for `window.PagedConfig.after` callback.
   - `page.pdf()` to file.
   - TOC must render with real page numbers via `target-counter`.
5. Style `templates/ordo.css`:
   - Print: Letter size, generous margins, two-column calendar pages.
   - Headings drive the TOC.
   - Sundays bold; top celebration on Sundays uppercase (matches legacy view).
   - Struck-through gray for `nothing: true` celebrations.

**Definition of Done:**
- [ ] `node tools/publish-year.mjs 2027 --local` exits 0.
- [ ] `published/ordo-2027.json` validates against the schema.
- [ ] `published/ordo-2027.html` opens in a browser and is readable.
- [ ] `published/ordo-2027.pdf` opens with a working TOC whose page numbers
      match the section locations.
- [ ] `published/manifest.json` lists 2027.
- [ ] Single commit: `feat(tools): local publish pipeline producing JSON, HTML, PDF`.

### Phase D4 — Web calendar with engine fallback

**Goal:** static SPA in `web/` that renders any date, defaults to today,
loads authorized JSON when present, falls back to the in-browser engine
otherwise. This is the **demo-ready** milestone.

Steps:
1. Set up `web/` with Vite (or esbuild if you prefer fewer deps).
2. Import the engine as an ES module bundle (it should already work in browser
   — no Node-only APIs are used in `engine/src/`).
3. Routing: hash-based, no server needed. `#/2027-04-04` deep-links to a date.
4. On load:
   - Fetch `/published/manifest.json`.
   - If requested year is in `manifest.years`, fetch `ordo-YYYY.json` and
     render.
   - Else, call `computeOrdo(year)` in-browser and render with a banner:
     "Provisional — not yet authorized for YYYY".
5. UI controls (port the spirit of `legacy/kalendar_view.js`, drop jQuery):
   - ← Year, ← 28d, ← 1d, Today, → 1d, → 28d, → Year
   - Date picker for jump-to-date
6. Build `web/public/embed.html` as a minimal iframe target.
7. Add a `publish-to-pages.sh` or `npm run build` that copies the `published/`
   tree into `web/dist/published/` so the SPA can fetch it via a relative URL.

**Definition of Done:**
- [ ] `npm run dev --workspace=web` serves at `localhost:5173` and renders
      today's date correctly.
- [ ] Navigating to `#/2027-12-25` shows Christmas with correct rank.
- [ ] Navigating to `#/2030-01-01` (no authorized JSON exists) shows the
      engine fallback with the "Provisional" banner.
- [ ] `npm run build --workspace=web` produces a static `web/dist/` deployable
      to GitHub Pages.
- [ ] Single commit: `feat(web): public calendar with engine fallback`.

**STOP HERE for the first demo. D5 onwards is the Editor workflow.**

### Phase D5 — Google Sheets seed (Editor workflow, Track B)

[Specify when ready. Includes seed-year.mjs writing to a Google Sheet via
the Sheets API, Apps Script menu items, and the publish webhook.]

### Phase D6 — DOCX rendering + GitHub Actions publishing

[Specify when ready. DOCX via the `docx` npm package; GitHub Actions that
runs the same `publish-year.mjs` against Google Sheets/Docs and attaches
outputs to a GitHub Release.]

### Phase D7 — Parish overlay

[Specify when ready. Parish JSON config applied client-side; engine re-runs
precedence and emits a parish-specific PDF in-browser.]

## Conventions

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.).
  One commit per phase unless explicitly told otherwise.
- **Dependencies:** justify any new runtime dep in the commit message. Prefer
  zero deps for the engine; reasonable deps for `tools/` and `web/`.
  Approved deps without further discussion: `ajv`, `handlebars`, `puppeteer`,
  `pagedjs`, `vite`. Anything else, ask first.
- **Style:** modern ES2022. No TypeScript unless requested later. Two-space
  indent. Semicolons. Single quotes for strings.
- **Tests:** prefer `node:test` over external test runners. Snapshot tests are
  acceptable for renderer output. The regression test against legacy is
  non-negotiable — it must stay green.
- **Logging:** plain `console.log`/`console.error`. No logging libraries.
- **No** silent fallbacks. If override data is malformed, fail loudly with a
  clear error.

## What NOT to do

- Do NOT modify any file in `legacy/`. It is the regression oracle.
- Do NOT rewrite rubric logic during the D2 port. Mechanical translation only.
  If a rubric looks wrong, file a TODO comment and keep going.
- Do NOT introduce TypeScript, React, Tailwind, a database, an ORM, or a
  server. The whole point of this design is that there is none of those.
- Do NOT delete `kalendar_old.js` from `legacy/`. It is the regression peer
  to `kalendar.js`.
- Do NOT call external network resources during tests. Tests must run offline.
- Do NOT skip the Definition-of-Done checklist. If an item can't be satisfied,
  STOP and report.

## When you finish a phase

1. Run the full test suite from the repo root: `npm test`.
2. Verify every Definition-of-Done item explicitly.
3. Commit with the prescribed message.
4. Write a short phase report to the chat: what was done, any TODOs filed,
   any decisions taken that the human should confirm.
5. Wait for instructions for the next phase. Do not proceed.
