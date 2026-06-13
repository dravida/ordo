"use strict"
// Builds a structured, render-agnostic representation of a published Kalendar.
// The preview view, CSV exporter, and PDF exporter all consume this same model
// so the three outputs stay in lock-step.
//
// Pass a numeric `year` for a year-specific Kalendar, or `null` for the master
// (perpetual) Kalendar built with `new Kalendar(y, true)` -- in master mode the
// days come from k.getByMonthDay() and there is no day-of-week.
import {getEpact, getDayLetter, formatRank} from './publish_columns.js';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November",
                     "December"];
// Day counts for the master Kalendar (a common/non-leap year; the leap-day
// adjustments live in February's month-end note).
const COMMON_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function daysInMonth(year, m) {
  return new Date(year, m, 0).getDate();
}

// Returns: [{ m, name, days: [ { day, dow, epact, dl, celebrations: [
//   { feast, rank, transferred, obligation, devotion } ] } ], notes: [str] }]
// dow is -1 in master mode (no calendar year, so no weekday).
export function buildPublication(year, k, epactTable, monthNotes) {
  const master = (year == null);
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const dim = master ? COMMON_DAYS[m - 1] : daysInMonth(year, m);
    const month = {
      m: m,
      name: MONTH_NAMES[m - 1],
      days: [],
      notes: (monthNotes && monthNotes[String(m)]) || []
    };
    for (let d = 1; d <= dim; d++) {
      const kd = master ? k.getByMonthDay(m, d) : k.getDate(new Date(year, m - 1, d));
      const dow = master ? -1 : new Date(year, m - 1, d).getDay();
      const celebrations = kd.getCelebrations()
        .filter(c => !c.nothing)
        .map(c => ({
          feast: c.name + (c.transferred ? " (transferred)" : ""),
          rank: formatRank(c),
          transferred: !!c.transferred,
          obligation: !!c.obligation,
          devotion: !!c.devotion
        }));
      month.days.push({
        day: d,
        dow: dow,                  // 0 = Sunday, -1 = master (no weekday)
        epact: getEpact(epactTable, m, d),
        dl: getDayLetter(m, d),
        celebrations: celebrations
      });
    }
    months.push(month);
  }
  return months;
}
