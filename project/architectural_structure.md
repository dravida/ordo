============================================================
  ORDO DIGITIZATION — STRUCTURAL ARCHITECTURE
============================================================

┌──────────────────────────────────────────────────────────┐
│  LAYER 1:  SOURCES OF TRUTH                              │
│  (where data and content actually live)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Engine Code & Data          Editor Content             │
│   ─────────────────           ──────────────             │
│   - Rubric engine (JS)        - Calendar Sheet (yearly)  │
│   - Fixed feasts (JSON)       - Prose Doc (yearly)       │
│   - Moveable feasts (JSON)    - Necrology Sheet (shared) │
│   - Rank metadata (JSON)      - Lectionary Sheets x2     │
│   - Jurisdiction configs      - Votive Masses Sheet      │
│   - Parish configs                                       │
│                                                          │
│   Lives in: GitHub repo       Lives in: Google Drive     │
│   Owned by: Developer         Owned by: Editors          │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  LAYER 2:  COMPUTE & MERGE                               │
│  (the brains; runs only when triggered)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Rubric Engine                                          │
│      │                                                   │
│      ▼                                                   │
│   + Jurisdiction Rules                                   │
│      │                                                   │
│      ▼                                                   │
│   + Editor Overrides (from Calendar Sheet)               │
│      │                                                   │
│      ▼                                                   │
│   + Prose (from Prose Doc, marker-substituted)           │
│      │                                                   │
│      ▼                                                   │
│   + Reference Tables (Lectionary, Votives, Necrology)    │
│      │                                                   │
│      ▼                                                   │
│   = Validated, merged year                               │
│                                                          │
│   Runs in: GitHub Actions  (also runs in browser for     │
│                             un-authorized years and      │
│                             parish overlays)             │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  LAYER 3:  PUBLISHED ARTIFACTS                           │
│  (the official outputs; one set per authorized year)     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   ordo-YYYY.json    ← authoritative data + API           │
│   ordo-YYYY.html    ← rendered with anchor TOC           │
│   ordo-YYYY.pdf     ← rendered with page-number TOC      │
│   ordo-YYYY.docx    ← rendered with Word TOC field       │
│   manifest.json     ← list of authorized years           │
│                                                          │
│   Lives in: GitHub Releases + GitHub Pages               │
│   Versioned: ordo-YYYY-v1, v2, ...                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  LAYER 4:  DISTRIBUTION                                  │
│  (how artifacts reach the world)                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Web Calendar           Direct Downloads     JSON API   │
│   ────────────           ─────────────────    ────────   │
│   GitHub Pages           GitHub Release       Static     │
│   (iframe-embeddable     assets               JSON URL   │
│    in Wix site)          (free CDN)           (no auth)  │
│                                                          │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  LAYER 5:  CONSUMERS                                     │
│  (who uses the published outputs)                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   General Public      Parish Priests      Third Parties  │
│   ──────────────      ───────────────     ─────────────  │
│   Browse calendar,    Apply parish        Read JSON for  │
│   download PDF/DOCX   config overlay,     readings,      │
│                       generate parish-    saints, chant, │
│                       specific PDF        integrations   │
│                                                          │
└──────────────────────────────────────────────────────────┘

============================================================
  CROSS-CUTTING CONCERNS
============================================================

  Triggering        Apps Script → GitHub Actions webhook
  Authorization     Membership in shared Google Drive folder
  Versioning        Git for code; Release tags for artifacts
  Validation        JSON Schema at the merge boundary
  Feedback Loop     Editor "engine_bug" overrides →
                    auto-filed GitHub Issues → engine fixes

============================================================
  KEY ARCHITECTURAL PROPERTIES
============================================================

  - No database, no server, no hosting bill
  - Editor tools are off-the-shelf Google products
  - Engine is reusable: CI publish + in-browser fallback
                       + in-browser parish overlay
  - Rite-agnostic shape: Western Rite is one engine module;
    Eastern Rite could plug in later without changing
    Layers 2-5
  - Published JSON is both the public archive AND the API

============================================================
