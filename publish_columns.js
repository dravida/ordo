"use strict"
// Generators for the traditional "Epact" and "D. L." (Day Letter) columns, plus
// the publication "Rank" string. The live engine (kalendar.js) no longer needs
// these manual-computation aids to determine feasts, but a published Kalendar
// must still display them, so we regenerate them here for the publish/preview
// and export flows.
import {romanNumeral} from './roman_numeral.js';
import {leapYear} from './date_calcs.js';

// Cumulative day count at the START of each month in a common (non-leap) year.
// Used to give every (month, day) a STABLE perpetual day-letter, independent of
// the year -- this matches the perpetual printed template where Jan 1 is always
// "A". (Leap-year Feb 29 / bissextile handling is a documented approximation;
// see getDayLetter.)
const PERPETUAL_CUMDAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

const DAY_LETTERS = ["A", "b", "c", "d", "e", "f", "g"];
const SUNDAY_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

// Lowercase Roman numeral (the Epact column is printed in minuscule).
export function lowerRoman(n) {
  return romanNumeral(n).toLowerCase();
}

// D. L. (Day Letter) for a given (month, day), 1-based.
// Reproduces the reference PDF's perpetual template: letters cycle A-G with
// Jan 1 = A, and the letter "A" is ALWAYS capitalized, every other letter
// lowercase. NOTE: this is intentionally a perpetual template -- for most years
// the capital A does NOT fall on the actual Sundays (e.g. in 2027 the true
// Sunday letter is C). Use getSundayLetter(year) when you need the real
// dominical letter (e.g. Ordo title pages).
// TODO(leap): Feb 29 currently shares Mar 1's letter; the traditional bissextus
// doubles Feb 24/25 instead. Reference data is a common year (2027), so this
// only affects Feb 29 display in leap years.
export function getDayLetter(month, day) {
  const idx = (PERPETUAL_CUMDAYS[month - 1] + (day - 1)) % 7;
  return DAY_LETTERS[idx];
}

// True dominical (Sunday) letter for a year, e.g. 2027 -> "C". Leap years carry
// two letters (Jan-Feb, then Mar-Dec), returned concatenated e.g. "CB".
// Provided for future Ordo use; not used by the perpetual D. L. column above.
export function getSundayLetter(year) {
  const jan1dow = new Date(year, 0, 1).getDay(); // 0 = Sunday .. 6 = Saturday
  const idx = (7 - jan1dow) % 7;                 // 0-based index of first Sunday
  const sl = SUNDAY_LETTERS[idx];
  if (leapYear(year)) {
    const earlier = SUNDAY_LETTERS[(idx + 1) % 7];
    return earlier + sl;
  }
  return sl;
}

// Epact string for a (month, day) from the perpetual table loaded from
// data/epacts.json. Returns "" when the table has no entry.
export function getEpact(epactTable, month, day) {
  const m = epactTable && epactTable[String(month)];
  if (!m) return "";
  const v = m[String(day)];
  return v == undefined ? "" : v;
}

// Publication "Rank" string for a celebration: the office/class plus an octave
// suffix when the celebration carries an octave, e.g. Epiphany (class "D1",
// octave "2") -> "D1, O2"; Circumcision (class "D2", octave "N") -> "D2".
// Accepts a KalendarCelebration (uses .office/.octave getters) or any object
// exposing { office, octave } / { klass, octave }.
export function formatRank(cele) {
  let klass = cele.office != undefined ? cele.office : cele.klass;
  klass = (klass == undefined ? "" : String(klass)).trim();
  // The engine uses "&nbsp;" as a blank office (commemorations, parentheticals);
  // render it as an empty Rank cell across all output formats.
  if (klass === "&nbsp;") klass = "";
  const oct = cele.octave == undefined ? "N" : String(cele.octave);
  if (oct === "1" || oct === "2" || oct === "3" || oct === "C") {
    return klass + ", O" + oct;
  }
  return klass;
}
