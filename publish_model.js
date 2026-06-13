"use strict"
// Builds a structured, render-agnostic representation of a published Kalendar
// for a year. The preview view, CSV exporter, and PDF exporter all consume this
// same model so the three outputs stay in lock-step.
import {addDays} from './date_calcs.js';
import {getEpact, getDayLetter, formatRank} from './publish_columns.js';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November",
                     "December"];

// Returns: [{ m, name, days: [ { day, dow, epact, dl, celebrations: [
//   { feast, rank, transferred, obligation, devotion } ] } ], notes: [str] }]
export function buildPublication(year, k, epactTable, monthNotes) {
  const months = [];
  let d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    const m = d.getMonth() + 1;
    if (!months[m - 1]) {
      months[m - 1] = {
        m: m,
        name: MONTH_NAMES[m - 1],
        days: [],
        notes: (monthNotes && monthNotes[String(m)]) || []
      };
    }
    const dayNum = d.getDate();
    const celebrations = k.getDate(d).getCelebrations()
      .filter(c => !c.nothing)
      .map(c => ({
        feast: c.name + (c.transferred ? " (transferred)" : ""),
        rank: formatRank(c),
        transferred: !!c.transferred,
        obligation: !!c.obligation,
        devotion: !!c.devotion
      }));
    months[m - 1].days.push({
      day: dayNum,
      dow: d.getDay(),           // 0 = Sunday
      epact: getEpact(epactTable, m, dayNum),
      dl: getDayLetter(m, dayNum),
      celebrations: celebrations
    });
    d = addDays(d, 1);
  }
  return months;
}
