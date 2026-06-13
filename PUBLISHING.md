# Publishing an Annual Kalendar

This feature renders a full-year Western Rite Orthodox **Kalendar** in the
traditional printed layout and exports it as **PDF** or **CSV**.

## Using it (browser)

1. Serve the repo: `bash webserver.sh` (or `python3 -m http.server`).
2. Open `index.html` and click **Publish**.
3. Choose **Which Year?** and **What to publish** (Kalendar; *Ordo* is coming
   soon and disabled). Leave **Which Year?** blank to publish the perpetual
   **master Kalendar**.
4. Click **Preview** to render the Kalendar in the page.
5. Click **Download** and pick **PDF** or **CSV** (*Word doc* is coming soon and
   disabled).

The publication table has five columns: **Epact · D. L. · Day · Feast · Rank**.

## How the special columns are produced (`publish_columns.js`)

- **Epact** — a *perpetual* lunar table (the same every year), stored in
  `data/epacts.json` and looked up by `getEpact(table, month, day)`.
- **D. L. (Day Letter)** — `getDayLetter(month, day)` reproduces the reference
  template where letters cycle A–G (Jan 1 = A) and the letter **A is always
  capitalized**. NOTE: this perpetual template does *not* mark the true Sundays
  for most years. `getSundayLetter(year)` returns the real dominical letter
  (e.g. 2027 → C) for future Ordo title pages.
- **Rank** — `formatRank(celebration)` is the office class plus an octave suffix
  when present, e.g. Epiphany (`D1` + octave `2`) → `D1, O2`.

## Master (perpetual) Kalendar

With **Which Year?** left blank, the publish flow builds `new Kalendar(y, true)`,
which adds only the **fixed** (perpetual) feasts and skips moveable/derived
feasts and year-specific precedence. This is driven by the data (the `fixed`
feast set) — not by text matching — so octave days and the "Day II–VII within
the Octave" entries are kept, while weekday-derived feasts (Saturday Office of
the B.V.M., Sunday within the Octave, Sundays after Epiphany/Trinity, Ferias,
the floating Holy Names) are absent. The title drops the year and the day-of-week
is unused. Master days are read with `Kalendar.getByMonthDay(m, d)`.

Note: the `fixed` data contains a bracketed `[The Most Holy Name of Jesus]`
(Aug 7) that will surface in master mode with its literal brackets — a pre-existing
data entry to clean up separately if undesired.

## Month-end notes

Master notes live in `data/monthnotes.json` (keyed by month number → list of
note strings). A per-year file `data/<year>/monthnotes.json` overrides the
master **per month** (`loadMonthNotes` in `publish.js`).

## Data / verification tooling (`tools/`)

- `tools/pdf_to_csv.py <kalendar.pdf> [year]` — bootstraps `data/epacts.json`,
  `data/monthnotes.json`, and a per-year reference CSV
  (`data/<year>/kalendar_<year>_reference.csv`) from a published PDF.
  Requires `pip install pdfplumber`. Run once / when the source PDF changes.
- `tools/verify.mjs [year]` — runs the **real engine headlessly** (Node), writes
  the engine's CSV (`kalendar_<year>_engine.csv`), diffs it against the
  reference CSV into `diff_report.md`, and runs structural assertions on the new
  column generators. Exit code is non-zero only on a structural failure.

```
node tools/verify.mjs 2027
```

The same column assertions also run in the browser QUnit suite (`test.html`).

## Known engine-vs-PDF differences (report-only)

Per project decision the engine is **not** changed to match the PDF (the PDF may
contain errors); differences are reported in `data/<year>/diff_report.md`.
Observed categories for 2027:

- **Abbreviations / wording** — engine spells names out
  (`St. Titus, Bishop & Confessor`) where the PDF abbreviates (`St Titus, B.C.`);
  `within` vs `Within`; `Circumcision` vs `The Circumcision`.
- **Specific items the editor flagged** — e.g. the PDF's
  `Octave Day of St. Stephen, Protomartyr` vs the engine's
  `Octave Day of St. Stephen`; St. Vincent wording.
- **Octave suffixes** — engine octave metadata produces `D1, O2` etc.; confirm
  these match the intended publication.
- **Engine-inserted observances** — the engine lists moveable Sundays after the
  Epiphany / Pentecost and the Saturday Office of the B.V.M. that the printed
  template arranges differently.
- **Leap years** — Feb 29 day-letter and the `xxv bis` epact intercalation are
  approximated (the 2027 reference is a common year); revisit before publishing
  a leap year.
