# Editor Handbook — Ordo

> **Status: stub.** This handbook is written *for the non-technical
> Editor* and will be fleshed out when the Editor workflow ships in
> Phase D5. Until then it captures the intended shape so future agents
> (and reviewers) can see where each piece will go.

## Who this is for

You are the Editor or co-Editor of the Ordo. You work in Google Sheets
and Google Docs. You do not need to know anything about code, GitHub,
or how the calendar is computed under the hood. Everything you need
lives in a shared Google Drive folder called **Ordo Library**.

## What you do in a year

The yearly cycle has three moments where you are involved.

### 1. Around October — a new year appears

The Maintainer clicks "Seed Year YYYY" once. A few minutes later, two
new files appear inside `Ordo Library/Years/YYYY/`:

- **`Ordo YYYY - Calendar.gsheet`** — one row per day, pre-filled by
  the rubric engine. Days that may need your attention are highlighted
  in yellow.
- **`Ordo YYYY - Prose.gdoc`** — a copy of last year's front and back
  matter, with the year stamps updated. Sections you have already
  approved in a prior year start out marked "inherited"; sections you
  edit flip automatically to "edited".

You will get an email when these are ready.

### 2. Review — several weeks of normal editing

You work in three places.

**A. The Calendar Sheet.** Skim the yellow rows. For each:

- Read the engine's suggestion in the pre-filled cells.
- If it's correct, tick **Approved**.
- If it needs an override, type the corrected value into the override
  cell and pick a reason code from the dropdown:
  - `editorial` — Editor preference (e.g. a different commemoration order).
  - `local_custom` — jurisdictional or parish custom.
  - `engine_bug` — the engine got it wrong. Pick this when you are
    confident the rubric was misapplied. The Developer will see it.
- The audit columns (who approved, when) fill in automatically.

**B. The Prose Doc.** Edit prose between the `{{INSERT: …}}` markers.

- Do **not** delete or rename the `{{INSERT: …}}` markers. They are
  how the publishing system knows where to drop in the auto-generated
  tables (calendar, lectionary, votives, necrology).
- Use the **Heading 1 / Heading 2 / Heading 3** styles for section
  titles. Those headings become the Table of Contents automatically.
  Do not hand-type a TOC.
- Anything you can do in Google Docs (bold, italic, lists, footnotes)
  carries through to the published PDF and DOCX.

**C. The shared Necrology Sheet.** Append a row for each newly reposed
person. This sheet is *shared across all years* — you do not need to
re-enter old entries.

### 3. Publish

When you and the co-Editor agree the year is ready, the lead Editor
opens the Calendar Sheet and clicks **Publish YYYY** in the custom menu.

A few minutes later, four files appear on the project's public
downloads page:

- `ordo-YYYY.json` — the data (for developers and integrations)
- `ordo-YYYY.html` — for reading in a browser
- `ordo-YYYY.pdf` — for printing
- `ordo-YYYY.docx` — for editing in Word, if anyone needs to

You will get an email with the link.

## The Google Drive layout

```
Ordo Library/
├── References/
│   ├── Lectionary - English Office.gsheet
│   ├── Lectionary - Lectio Divina 1945.gsheet
│   ├── Votive Masses.gsheet
│   └── Necrology.gsheet            ← append-only across years
├── Templates/
│   └── Prose Template.gdoc         ← master prose template
└── Years/
    ├── 2026/
    │   ├── Ordo 2026 - Calendar.gsheet
    │   └── Ordo 2026 - Prose.gdoc
    ├── 2027/
    │   ├── Ordo 2027 - Calendar.gsheet
    │   └── Ordo 2027 - Prose.gdoc
    └── ...
```

Files in `References/` and `Templates/` are touched rarely; ask the
Maintainer if you think one needs to change.

## What to do when something is wrong

- **A yellow row is wrong.** Override it; pick the right reason code.
- **A non-yellow row is wrong.** Override it anyway, same way. The
  engine simply didn't know it was a question.
- **The Prose Doc is missing a section the published Ordo needs.** Add
  a heading and the prose for it. If it needs a generated table,
  insert a `{{INSERT: …}}` marker on its own line and tell the
  Maintainer which table you need.
- **Publish fails or the output looks broken.** Don't try to fix it in
  the Sheet. Tell the Maintainer; they can re-run publish.

## Glossary

- **Rubric engine.** The program that computes which feasts fall on
  which day according to the Ordo's rules.
- **Override.** A cell in the Calendar Sheet where you have replaced
  the engine's suggestion with your own value.
- **Marker.** A `{{INSERT: something}}` placeholder in the Prose Doc
  that the publishing system replaces with a generated table.
- **Authorized year.** A year that has been published. Until you click
  Publish, the public site shows the engine's provisional view with a
  "Provisional" banner.
- **Manifest.** The list of authorized years. The public site reads
  this to decide whether to use the official JSON or fall back to the
  in-browser engine.

## Sections still to be written

These will be filled in during Phase D5:

- Screenshots of the Calendar Sheet, including the yellow flagging,
  the override and reason-code cells, and the Section Approval tab.
- Screenshots of the Prose Doc showing the `{{INSERT: …}}` markers and
  the Heading-driven TOC.
- The exact list of menu items added by Apps Script and what each one
  does.
- The full list of reason codes and when to use each.
- The full list of `{{INSERT: …}}` markers the publishing system
  understands.
- The "what to do when you receive an Editor invitation" first-time
  setup walkthrough.
- A one-page printable cheat-sheet.

---

For the workflow as the *system* sees it, see
`project/workflow_details.md`. For the architecture, see
`docs/architecture.md`.
