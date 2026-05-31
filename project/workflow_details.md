============================================================
  AROUND OCTOBER: Time to prepare next year's Ordo (2027)
============================================================

────────────────────────────────────────────────────────────
  PREFILL  (one-time per year, automated)
────────────────────────────────────────────────────────────

  [1] Maintainer clicks "Seed Year 2027"
       └─ tool: Google Sheets menu + Apps Script

  [2] Apps Script calls webhook to trigger automation
       └─ tool: GitHub Actions (repository_dispatch)

  [3] Run rubric engine for 2027
       └─ tool: Node.js ordo engine (modernized kalendar.js)

  [4a] Create Calendar Sheet, pre-fill 366 days from engine
        └─ tool: Google Sheets API
  [4b] Clone prior year's Prose Doc, update year stamps
        └─ tool: Google Drive API + Google Docs API
  [4c] Create "Section Approval" control tab
        └─ tool: Google Sheets API

  [5] Auto-flag rows/sections needing attention
       └─ Calendar Sheet: yellow rows where conflicts/translations exist
       └─ Section Approval tab: status = "inherited" for unchanged prose
       └─ tool: Google Sheets conditional formatting + Apps Script

────────────────────────────────────────────────────────────
  REVIEW  (Editors work here for several weeks)
────────────────────────────────────────────────────────────

  Inputs the Editor touches:

    A. Calendar Sheet (Ordo 2027 - Calendar.gsheet)
        - Review yellow-flagged days
        - Edit override cells; pick reason code from dropdown
        - Tick "Approved" checkbox per day
        - tool: Google Sheets

    B. Prose Doc (Ordo 2027 - Prose.gdoc)
        - Edit prose between {{INSERT:}} markers
        - Heading styles drive the TOC automatically
        - tool: Google Docs

    C. Necrology Sheet (shared, year-independent)
        - Append rows for newly reposed
        - tool: Google Sheets

  Automation while they work:

    [6] Audit columns auto-fill: who approved, when
         └─ tool: Apps Script onEdit trigger (Sheet + Doc bound)

    [7] Doc edits flip a section's status from
         "inherited" → "edited" on the Section Approval tab
         └─ tool: Apps Script Docs trigger

  Final action:

    [8] Lead editor clicks "Publish 2027"
         └─ tool: Google Sheets menu + Apps Script

────────────────────────────────────────────────────────────
  PUBLISH  (automated, runs on demand)
────────────────────────────────────────────────────────────

  [9]  Apps Script pings automation
        └─ tool: GitHub Actions webhook

  [10] Pull all inputs
        ├─ Calendar Sheet overrides   (Google Sheets API)
        ├─ Prose Doc as HTML          (Google Docs API export)
        ├─ Necrology Sheet            (Google Sheets API)
        ├─ Lectionary Sheets x2       (Google Sheets API)
        └─ Votive Masses Sheet        (Google Sheets API)

  [11] Merge in this order:
        engine output
          + jurisdiction rules (antiochian-wro.json)
          + editor overrides (from Calendar Sheet)
        └─ tool: Node.js merge step

  [12] Substitute {{INSERT:}} markers in the Prose HTML:
        ├─ {{INSERT: moveable_feasts_table}}
        ├─ {{INSERT: votive_masses_table}}
        ├─ {{INSERT: calendar_january_through_december}}
        ├─ {{INSERT: necrology}}
        ├─ {{INSERT: lectionary_english_office}}
        └─ {{INSERT: lectionary_lectio_divina_1945}}
        └─ tool: Node.js template step

  [13] Validate merged result against schema
        └─ tool: JSON Schema validator

  [14] Generate four output files with auto-built TOC:
        ├─ ordo-2027.json   (authoritative data + API)
        ├─ ordo-2027.html   (anchor TOC, no page numbers)
        ├─ ordo-2027.pdf    (Paged.js inside Puppeteer,
        │                    real TOC with real page numbers)
        └─ ordo-2027.docx   (TOC field, resolved by Word)
        └─ tools: Puppeteer + Paged.js + docx npm package

  [15] Attach files to public GitHub Release
        └─ tagged: ordo-2027-v1
        └─ tool: GitHub Releases (free CDN)

  [16] Update manifest of authorized years
        └─ tool: manifest.json on GitHub Pages

  [17] Auto-file GitHub Issue for any "engine_bug" overrides
        └─ feeds engine improvement loop
        └─ tool: GitHub Issues API

────────────────────────────────────────────────────────────
  CONSUME  (everyone else; Editors don't think about this)
────────────────────────────────────────────────────────────

  [C1] Public web calendar reads manifest, renders the day
        └─ tool: GitHub Pages (iframe-embeddable in Wix)

  [C2] If year is not yet authorized:
        engine runs in browser with "Provisional" banner
        └─ tool: same engine JS, reused client-side

  [C3] Public users download PDF or DOCX
        └─ tool: GitHub Release assets

  [C4] Parish priests load parish config (JSON),
        engine re-runs precedence, parish PDF generated
        └─ tool: client-side; no server needed

  [C5] Third parties consume ordo-2027.json directly
        └─ tool: static JSON URL; no auth required

============================================================
