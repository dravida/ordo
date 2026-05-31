Existing files move to legacy/ so they remain available for regression tests but stop cluttering the working tree.

ordo/
├── .github/
│   └── workflows/
│       ├── ci.yml                       # lint + tests + schema validation on PR
│       ├── seed-year.yml                # manual dispatch: seed a year into Sheet
│       └── publish-year.yml             # repository_dispatch from Apps Script
│
├── docs/
│   ├── about_ordo.md                    # (moved from root — reference)
│   ├── quality_review.md                # (moved from root — reference)
│   ├── architecture.md                  # NEW — the 5-layer architecture
│   ├── editor_handbook.md               # NEW — written for non-technical Editors
│   └── developer_guide.md               # NEW — onboarding for future maintainers
│
├── engine/                              # the rubric engine, modernized
│   ├── package.json                     # ES modules, Node + browser builds
│   ├── src/
│   │   ├── index.js                     # public API: computeOrdo(year, options)
│   │   ├── kalendar.js                  # ported from legacy/kalendar.js
│   │   ├── kalendar-year.js             # extracted class
│   │   ├── kalendar-date.js             # extracted class
│   │   ├── kalendar-celebration.js      # extracted class
│   │   ├── precedence.js                # extracted: demote, translate, rank
│   │   ├── date-calcs.js                # ported
│   │   ├── roman-numeral.js             # ported
│   │   ├── merge.js                     # NEW — apply overrides + jurisdiction
│   │   └── schema/
│   │       ├── day-record.schema.json
│   │       ├── override.schema.json
│   │       ├── jurisdiction.schema.json
│   │       └── parish-config.schema.json
│   ├── data/
│   │   ├── fixed.json                   # extracted from kalendar_data.js
│   │   ├── moveable.json                # extracted
│   │   ├── meta.json                    # extracted
│   │   └── ranks.json                   # rank ordering + comparator metadata
│   ├── jurisdictions/
│   │   └── antiochian-wro.json          # AWRV additions/renames/elevations
│   ├── parishes/
│   │   └── example-parish.json          # contribution model + demo
│   └── test/
│       ├── regression.test.js           # vs legacy/kalendar_old.js for 2017-2027
│       ├── engine.test.js               # unit tests on classes
│       ├── merge.test.js                # override + jurisdiction + parish lay
