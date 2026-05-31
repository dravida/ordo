# Quality Review — Ordo Project

## Summary

The Ordo project is a specialized liturgical calendar application with substantial domain complexity. The core logic in `kalendar.js` correctly implements intricate rubrical rules, but the codebase carries significant technical debt from its organic evolution. Below is a detailed review organized by severity.

---

## Critical Issues

### 1. Use of `eval()` — Security & Correctness Risk
**File:** `kalendar.js`, `Kalendar.getMoveable()` (line ~12)

```js
return(addDays(eval("Kalendar.get" + m["basis"].substr(0, 1).toUpperCase() + 
                    m["basis"].substr(1))(y), m["diff"]));
```

`eval()` is used to dynamically resolve method names like `getEaster`, `getAdvent`, `getEmber` from the `basis` field in the `moveable` data. This is a security risk (arbitrary code execution if data is tampered with) and a debugging nightmare. The same result can be achieved with a simple lookup object:

```js
const basisFunctions = { easter: Kalendar.getEaster, advent: Kalendar.getAdvent, ember: Kalendar.getEmber };
return addDays(basisFunctions[m["basis"]](y), m["diff"]);
```

### 2. `removeMatch()` Returns Inverted Logic
**File:** `kalendar.js`, `KalendarDate.removeMatch()`

```js
removeMatch(pattern) {
    var i = this.celes.findIndex( c => c.name.search(pattern) !== -1 );
    if(i != -1) { // not found  ← COMMENT IS WRONG
        this.celes = this.celes.slice(0, i).concat(this.celes.slice(i + 1));
    }
    return(i);
}
```

The comment says "not found" but `i != -1` means the item **was** found. The comment is backwards. While the code logic happens to be correct (removes when found), the misleading comment makes maintenance dangerous. The same inverted comment pattern appears in `addOctaveSunday()`:

```js
if(i != -1) { // not found - i.e., the Octave Day itself
```

This reads as if `i != -1` means "not found," which is the opposite of JavaScript's `findIndex` semantics.

### 3. `isAbstinence()` Has Operator Precedence Bug
**File:** `kalendar.js`, `Kalendar.isAbstinence()`

```js
isAbstinence(date) {
    return((date.getDay() == 5) && (!(date.getMonth() == 11 && date.getDate() == 25)) || this.isFast(date));
}
```

Due to JavaScript operator precedence, this evaluates as:

```
(Friday && not Christmas) || isFast
```

This means **every fast day is also an abstinence day**, regardless of whether it's a Friday. This may or may not be the intended rubrical result. If the intent is "Friday abstinence (except Christmas) OR fast day abstinence," it should be parenthesized explicitly for clarity. If the intent is "Friday abstinence (except Christmas) and also check fast days separately," the logic is wrong.

### 4. `isFast()` Ember Day Logic Is Always Truthy
**File:** `kalendar.js`, `Kalendar.isFast()`

```js
var d = this.getDate(date);
if(d.search(/Ember/)) {
    return(true);
}
```

`KalendarDate.search()` returns a boolean (`this.celes.some(...)`). When **no** Ember day is found, `search()` returns `false`, which is falsy — correct. When an Ember day **is** found, `search()` returns `true`, which is truthy — also correct. However, this means any day with a celebration whose name contains "Ember" will be marked a fast day. More importantly, the check `d.search(...)` on a `KalendarDate` object calls the method on the date object, not the string — and if `getCelebrations()` is empty or the date has no celebrations at all, this still works. The real issue is that `search()` returns a boolean, not a match index, so the semantics differ from the standard `String.search()`, which is confusing.

### 5. `diffDays()` Missing Parentheses — Incorrect Calculation
**File:** `date_calcs.js`

```js
export function diffDays(date2, date1) {
  return(Math.round(date2 - date1)/(24 * 60 * 60 * 1000));
}
```

The closing parenthesis for `Math.round()` is in the wrong place. This divides the **rounded millisecond difference** by the day-in-milliseconds constant, rather than computing the day difference and then rounding. The correct version:

```js
return Math.round((date2 - date1) / (24 * 60 * 60 * 1000));
```

For small date ranges this may produce the same result due to rounding, but for larger ranges the rounding-before-dividing will produce incorrect results. For example, `Math.round(1.5) / 1 = 2`, but `Math.round(1.5 / 1) = 2` also — however, `Math.round(2.5) / 2 = 1.5` vs `Math.round(2.5 / 2) = 1`. This is a real bug that could cause off-by-one errors in week counting.

---

## High-Severity Issues

### 6. Global Mutable State via `kalendar_data.js`
**File:** `kalendar_data.js`

All data (`moveable`, `fixed`, `meta`, `daysofweek`, `months`, `ranknames`) is declared as global `var` variables in a non-module script. These are mutable from any scope and create implicit coupling across all files. Any script can accidentally overwrite `meta` or `fixed`.

### 7. `kalendar_old.js` Is a 932-Line Dead Weight
**File:** `kalendar_old.js`

This is an identical copy of `kalendar.js` from an earlier version, kept solely for regression testing. It should be:
- Moved to a `test/` directory
- Marked clearly as test-only code
- Not shipped in production builds

### 8. jQuery Dependency for Minimal DOM Manipulation
**File:** `kalendar_view.js`

The view layer uses jQuery (`$("#kalendar").append(...)`) for basic DOM operations. jQuery (2.2.4) is loaded from a local file but is not included in the repository. The DOM manipulation is straightforward and could easily use vanilla `document.getElementById()` and `element.insertAdjacentHTML()`, eliminating the jQuery dependency entirely.

### 9. No Build System, Bundler, or Dependency Management
There is no `package.json`, no build step, no bundler, and no dependency version pinning. jQuery is expected at `js/jquery-2.2.4.min.js` but that file is not in the repository (likely gitignored or missing). The project relies on global script loading order, which is fragile.

### 10. `addOctaveSunday()` Has Confusing Control Flow
**File:** `kalendar.js`, `KalendarYear.addOctaveSunday()`

The method mixes multiple conditions for the Nativity octave with special-case logic that is difficult to follow. The variable `d` is reassigned in different branches, and the `i != -1` check (with its misleading comment) makes it unclear whether an octave day was found or not.

---

## Medium-Severity Issues

### 11. Inconsistent Module Systems
`kalendar_data.js` uses no module system (global vars). `kalendar.js`, `kalendar_view.js`, `date_calcs.js`, and `roman_numeral.js` use ES modules (`import`/`export`). The HTML loads `kalendar_data.js` as a regular script and the rest as `type="module"`. This creates a split where data is global but logic is modular.

### 12. `alert()` Used for Error Reporting
**File:** `kalendar.js`, `addSundaysAfterTrinity()`

```js
if(osun > 30) alert("Unexpected error: more than 30 Epiphany + Pentecost Sundays");
if(osun < 29) alert("Unexpected error: less than 29 Epiphany + Pentecost Sundays");
```

Using `alert()` for error reporting is user-hostile and blocks the UI thread. These should be `console.error()` or thrown exceptions.

### 13. No Input Validation
`Kalendar` constructor and static methods accept year values but perform no validation. Passing a non-numeric year or an extreme value could produce nonsensical results.

### 14. `var` Used Throughout Instead of `let`/`const`
All JavaScript files use `var` exclusively despite using ES module syntax. This leads to function-scoped variable hoisting bugs and reduces readability. Loop variables, constants, and block-scoped temporaries should use `const`/`let`.

### 15. `findDate()` Uses `search()` Incorrectly
**File:** `kalendar.js`, `KalendarYear.findDate()`

```js
if(dates[dateslen] != undefined && dates[dateslen].search("^" + name + "$")) {
```

This calls `.search()` on a `KalendarDate` object, which delegates to its `search()` method that uses `this.celes.some(c => c.search(pattern) !== -1)`. This then calls `.search()` on `KalendarCelebration` objects, which delegates to `this.name.search(pattern)`. The regex `"^" + name + "$"` is constructed by string concatenation — if `name` contains regex special characters (`.`, `(`, etc.), this will break. For example, `findDate("St. John")` would match any saint whose name contains "St" followed by any character and "John".

### 16. `getCelebrations()` Has Side Effects
**File:** `kalendar.js`, `KalendarDate.getCelebrations()`

```js
getCelebrations() {
    var o = this.celes.sort(this.ranksorter);
    ...
}
```

`.sort()` mutates the array in place. Every call to `getCelebrations()` re-sorts the internal `celes` array. While this works, it means a read-only getter has a side effect, which is surprising and could cause subtle bugs if the sort comparator ever behaves differently based on array state.

### 17. Missing jQuery File in Repository
`kalendar.html` references `js/jquery-2.2.4.min.js` but the `js/` directory is not in the repository. The `.gitignore` only contains `.pi`. The application will not run without this file.

### 18. No README or Documentation
There is no `README.md` in the repository. A new developer would have no way to understand how to run, test, or deploy the application without reading all the source code.

### 19. Inconsistent String Trailing Spaces as Disambiguators
**File:** `kalendar_data.js`

Multiple entries use trailing spaces in keys to differentiate celebrations with the same name (e.g., `"Commemoration of St. Paul"` vs `"Commemoration of St. Paul "` vs `"Commemoration of St. Paul  "`). This is extremely fragile — a `.trim()` call anywhere in the pipeline would silently break the lookup.

### 20. `kalendar_wix.html` Is a 2206-Line Unmaintainable Monolith
The Wix deployment file duplicates all CSS, JS, and data into a single HTML file. There is no build process to generate it from the source files, meaning it must be manually synchronized — a recipe for drift.

---

## Low-Severity Issues

### 21. `leapYear()` Uses Bitwise Tricks
**File:** `date_calcs.js`

```js
return (year & 3) == 0 && ((year % 25) != 0 || (year & 15) == 0);
```

This is correct but uses bitwise operations where `%` would be more readable. The intent (divisible by 4, not by 100 unless by 400) is obscured.

### 22. `ranksorter()` Silently Assigns Rank 100 to Unknown Classes
**File:** `kalendar.js`, `KalendarDate.ranksorter()`

If a `klass` value is not found in the rank array, it logs a message and assigns index 100, making it rank lower than everything else. This silent degradation should probably throw an error instead.

### 23. Unused SVG Files
`fish.svg` and `fish2.svg` are present in the repository but not referenced by any code. The commented-out SVG in `kalendar_view.js` suggests they were intended as abstinence indicators but were replaced with the letter "L".

### 24. No Linting or Formatting Configuration
There are no `.eslintrc`, `.prettierrc`, or similar configuration files. Code style is inconsistent (e.g., some `if` statements use braces, others don't; indentation varies between 2 and 4 spaces).

### 25. `String.prototype.substr()` Is Deprecated
`substr()` is used in `getMoveable()` and elsewhere. It has been deprecated in favor of `substring()` or `slice()`.

### 26. No Error Handling for Missing `meta` Entries
`KalendarCelebration.metasetter()` falls back to default values when a name is not found in `meta`, but there is no warning for potentially missing entries. Typos in feast names in the `fixed` or `moveable` objects would silently produce celebrations with default (lowest) rank.

### 27. Test Coverage Is Limited
Tests only cover 6 years (2017–2022) for regression, and specific date calculations for 2015–2023. There are no tests for:
- Precedence resolution logic
- Translation of impeded feasts
- Demotion to commemoration/nothing
- Fasting and abstinence calculations
- Edge cases (leap years, very early/late Easter)
- The view layer

### 28. `determineAnticipation()` Sets `.klass` on Date Objects
**File:** `kalendar.js`, `KalendarYear.determineAnticipation()`

```js
if (this.isDouble(d) || this.isOctaveDay(d)) {
    d.klass = "Comm"
}
```

`d` is a `Date` object being given a `klass` property. While JavaScript allows this, it's extremely confusing — `d` looks like a date, not a celebration.

---

## Recommendations (Prioritized)

| Priority | Recommendation |
|----------|---------------|
| **P0** | Fix the `diffDays()` parentheses bug — this could cause incorrect date calculations |
| **P0** | Replace `eval()` with a static method lookup object |
| **P0** | Fix or clarify the `isAbstinence()` operator precedence |
| **P1** | Fix the misleading comments in `removeMatch()` and `addOctaveSunday()` |
| **P1** | Add `package.json` and a basic build/dev setup |
| **P1** | Add a `README.md` with setup instructions |
| **P1** | Include jQuery in the repository or switch to vanilla DOM APIs |
| **P2** | Migrate `kalendar_data.js` to ES module exports |
| **P2** | Replace `var` with `const`/`let` throughout |
| **P2** | Replace trailing-space disambiguation with unique identifiers |
| **P2** | Move `kalendar_old.js` to a test directory |
| **P2** | Add unit tests for precedence, translation, demotion logic |
| **P3** | Create a build step to auto-generate `kalendar_wix.html` |
| **P3** | Add ESLint/Prettier configuration |
| **P3** | Replace `alert()` with proper error handling |
| **P3** | Remove unused SVG files or integrate them |
