# About Ordo

## Overview

Ordo is a JavaScript web application that computes and displays a **liturgical calendar (kalendar)** according to the **Western Rite (Benedictine) tradition** based on the 1925 edition of the General Rubrics of the Monastic Breviary, as translated for use with the Monastic Diurnal and Monastic Breviary Matins (Lancelot Andrewes Press, 2008).

The name "Ordo" refers to the liturgical directory (ordo) that specifies which office and Mass texts are to be used on each day of the year, resolving the complex interactions between fixed feast days, moveable feasts, octaves, vigils, ferias, and precedence rules.

## Purpose

The application automates the traditionally manual and error-prone process of determining the liturgical observance for every day of the year. It handles:

- **Moveable feasts** computed relative to Easter and Advent
- **Fixed feast days** (saints' days, Marian feasts, etc.) with their liturgical ranks
- **Precedence and concurrence** resolution when multiple observances fall on the same day
- **Translation** of impeded feasts to the next available day
- **Demotion** of lower-ranked celebrations to commemorations or omission
- **Octave** computation and removal during penitential seasons
- **Ember days**, **vigils**, and **ferias**
- **Days of fasting and abstinence** determination
- **Saturday Office of the B.V.M.** insertion on eligible Saturdays

The calendar appears to be tailored for a specific **Benedictine Vicariate** (as indicated by the elevation of St. Benedict's feast to Double I Class status and various Eastern-rite and Western-rite saints included in the calendar).

## Architecture

### File Structure

| File | Lines | Purpose |
|------|-------|---------|
| `kalendar.html` | 33 | Main HTML page; loads scripts and bootstraps the app |
| `kalendar.js` | 932 | Core logic: `Kalendar`, `KalendarYear`, `KalendarDate`, `KalendarCelebration` classes |
| `kalendar_data.js` | 1035 | Data: fixed feasts, moveable feasts, metadata (class, octave, obligation, rank) |
| `kalendar_view.js` | 78 | View layer: renders the calendar as an HTML table with navigation |
| `kalendar.css` | 95 | Styling for the calendar table, fonts, and navigation controls |
| `date_calcs.js` | 33 | Date utility functions (add/subtract days, weeks, leap year) |
| `roman_numeral.js` | 12 | Converts integers to Roman numeral strings |
| `tests.js` | 80 | QUnit tests comparing new vs. old kalendar and testing key date calculations |
| `test.html` | 20 | Test runner page using QUnit |
| `kalendar_old.js` | 932 | Previous version of kalendar.js (kept for regression testing) |
| `kalendar_wix.html` | 2206 | Self-contained single-file version for deployment on Wix |
| `webserver.sh` | 1 | Launches `python3 -m http.server` for local development |
| `fish.svg`, `fish2.svg` | — | Ichthys SVG icons (likely for abstinence indicators, currently unused in markup) |

### Core Classes

#### `Kalendar` (entry point)
- Manages a dictionary of `KalendarYear` objects keyed by year
- Provides static methods to compute key moveable dates: `getEaster()`, `getAdvent()`, `getEpiphany()`, `getSeptuagesima()`, `getAshWednesday()`, `getTrinity()`, `getTheKing()`, `getEmber()`
- Public instance methods: `getDate(date)`, `isAbstinence(date)`, `isFast(date)`

#### `KalendarYear`
- Initialized for a given year and builds the complete calendar through a multi-phase pipeline:
  1. Add moveable feasts (computed from Easter/Advent/Ember offsets)
  2. Add fixed feasts (from the `fixed` data object)
  3. Add Holy Name feasts (Jesus and Mary)
  4. Add Sundays after Epiphany (with anticipation/resumption logic)
  5. Add Sundays after Trinity/Pentecost (with month-based naming)
  6. Add Octave Sundays (Ascension, Corpus Christi, Nativity)
  7. Add Ferias (Septuagesimatide and Advent)
  8. Add Greater Litanies
  9. Determine anticipation (vigils moved to Saturday)
  10. Add Saturday Office of the B.V.M.
  11. Determine precedence (resolve conflicts, translate impeded feasts, demote lower celebrations)
  12. Special demotions (Easter week omissions per rubric #613)
  13. Remove octaves during Lent and penitential seasons

#### `KalendarDate`
- Represents a single day with zero or more `KalendarCelebration` objects
- Handles ranking, sorting, searching, and removal of celebrations
- `demoteToCommOrNothing()` implements the complex rubrical precedence rules
- `needsTranslation()` identifies feasts that must be transferred to another day

#### `KalendarCelebration`
- Represents a single liturgical observance with properties:
  - `name`: The feast/observance name
  - `klass`: Liturgical rank (e.g., D1, D2, Sd1, Sd2, Gd, F2, V, M, etc.)
  - `office`: Office type override
  - `octave`: Octave category (N=none, 1/2/3/C/S=octave class)
  - `obligation`: Day of obligation
  - `devotion`: Day of devotion
  - `rank`: Numeric rank within class for ordering
  - `secondary`: Whether this is a secondary celebration
  - `transferred`: Whether this feast was translated from another day
  - `nothing`: Whether this celebration is entirely omitted

### Data Model (`kalendar_data.js`)

Three global data objects:

- **`moveable`**: Feasts whose dates depend on Easter, Advent, or Ember days. Each entry has a `basis` (which static method to call) and `diff` (day offset from the basis date).
- **`fixed`**: Feasts on fixed calendar dates. Each entry has `m` (month 1–12), `d` (day), and optional `addleap` (shift date by 1 in leap years, used for St. Peter Damian, Vigil of St. Matthias, etc.).
- **`meta`**: Metadata for every celebration name including `class` (liturgical rank), `office`, `octave`, `obligation`, `devotion`, `secondary`, `rank`, and `feast` (parent feast for octave days).

### Liturgical Rank System

The ranks in descending precedence order:

1. **Sd1** – Sunday I Class
2. **F1** – Privileged Feria I Class
3. **V1** – Vigil I Class
4. **DiO1** – Day in Octave, Class I
5. **OD2** – Octave Day, Class II
6. **D1** – Double I Class
7. **Sd2** – Sunday II Class
8. **DiO2** – Day in Octave, Class II
9. **D2** – Double II Class
10. **F2** – Privileged Feria II Class
11. **Sd3** – Lesser Sunday
12. **OD3** – Octave Day, Class III
13. **ODC** – Common Octave Day
14. **V2** – Vigil II Class
15. **Gd** – Greater Double
16. **iv** – Feria
17. **D** – Double
18. **Sd** – Semidouble
19. **F2b** – Friday after Octave of Ascension
20. **DiO3** – Day in Octave, Class III
21. **DiOC** – Day in Common Octave
22. **Comm** – Commemoration
23. **F3** – Privileged Feria III Class
24. **V** – Vigil
25. **ODS** – Simple Octave Day
26. **BVM** – Saturday Office of the B.V.M.
27. **M** – Memorial

### Easter Calculation

Easter is computed using a **tabular method** based on the Paschal Full Moon (PFM) table indexed by the golden number (`year % 19`). The algorithm then applies corrections for the dominical letter and century-based epact adjustments. This follows the Western (Gregorian) computus.

### View Layer (`kalendar_view.js`)

Renders a 366-day scrolling table with:
- **Time navigation** buttons: ← Year, ← 28 days, ← 1 day, Today, → 1 day, → 28 days, → Year
- **Month and year headers** (Cinzel font)
- **Date, day-of-week, abstinence (L), fasting (§)** indicators
- **Celebration table** per day showing name, class, obligation (†), devotion (‡), and transferred/nothing status
- Sundays shown in bold; top celebration on Sundays shown in uppercase
- Struck-through gray text for omitted ("nothing") celebrations

### Deployment

- **Local development**: Run `webserver.sh` (launches Python's `http.server`) and open `kalendar.html`
- **Wix deployment**: `kalendar_wix.html` is a self-contained single-file version with all JS and CSS inlined
- Requires jQuery (loaded from local `js/jquery-2.2.4.min.js`) for the view layer

### Testing

- Uses **QUnit** for browser-based testing
- `test.html` loads both `kalendar.js` and `kalendar_old.js` for regression comparison
- Tests cover:
  - **Regression**: Full-year comparison of celebration names between new and old kalendar for 2017–2022
  - **Advent**: Date verification for 2015–2023
  - **Easter**: Date verification for 2015–2023
  - **Weeks in Pentecost**: Count verification for 2015–2023
  - **Weeks in Epiphany**: Count verification for 2015–2023

### Notable Rubrical Decisions

- **St. Benedict** is elevated to Double I Class (D1) for the Vicariate, as documented in a comment: "we are, especially, a Benedictine sub-order"
- **Greater Litanies** are transferred to the Tuesday after Easter when they fall during Holy Week or Easter Week, following a precedent from a 19th-century Ordo approved by Fr. Ed
- **St. Tikhon of Moscow** and **St. George** have full octave cycles (7 days + octave day) at the Common octave level
- Eastern and Western saints are combined in a single calendar (e.g., St. Raphael of Brooklyn, St. Sergius of Radonezh, St. John Climacus alongside Latin saints)
- Several uniquely English saints are included (St. Aidan, St. Cuthbert, St. Etheldreda, St. Winifred, Our Lady of Walsingham)
