"use strict"
// Serializes the publication model to CSV with the same schema as the reference
// extraction (data/<year>/kalendar_<year>_reference.csv): Epact, D.L., Day,
// Feast, Rank, Month. Epact/D.L./Day appear only on the first row of each day,
// matching the printed layout. Also triggers a browser download.
import {buildPublication} from './publish_model.js';

function csvCell(s) {
  s = (s == undefined ? "" : String(s));
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCsv(year, k, epactTable, monthNotes) {
  const months = buildPublication(year, k, epactTable, monthNotes);
  const lines = [["Epact", "D.L.", "Day", "Feast", "Rank", "Month"].join(",")];
  for (const month of months) {
    for (const day of month.days) {
      const celes = day.celebrations.length
        ? day.celebrations
        : [{feast: "", rank: ""}];
      celes.forEach((c, i) => {
        const first = i === 0;
        lines.push([
          csvCell(first ? day.epact : ""),
          csvCell(first ? day.dl : ""),
          csvCell(first ? day.day : ""),
          csvCell(c.feast),
          csvCell(c.rank),
          csvCell(month.m)
        ].join(","));
      });
    }
  }
  return lines.join("\n") + "\n";
}

export function downloadCsv(year, k, epactTable, monthNotes) {
  const csv = toCsv(year, k, epactTable, monthNotes);
  const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
  triggerDownload(blob, "Liturgical_Kalendar" + (year != null ? "_" + year : "") + ".csv");
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
