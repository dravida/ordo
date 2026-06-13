"use strict"
// Builds a downloadable PDF of the published Kalendar using the vendored jsPDF +
// jspdf-autotable libraries (loaded as UMD globals via <script> in index.html;
// jsPDF is exposed at window.jspdf.jsPDF and autotable registers itself onto it).
import {buildPublication} from './publish_model.js';

const MARGIN = 40;

export function downloadPdf(year, k, epactTable, monthNotes) {
  const doc = buildPdfDoc(year, k, epactTable, monthNotes);
  if (doc) doc.save("Liturgical_Kalendar" + (year != null ? "_" + year : "") + ".pdf");
}

// Builds and returns the jsPDF document (without saving) so it can be exercised
// headlessly in tests. Returns null if the PDF library is unavailable.
export function buildPdfDoc(year, k, epactTable, monthNotes) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    if (typeof alert === "function") alert("PDF library failed to load (js/jspdf.umd.min.js).");
    return null;
  }
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({orientation: "portrait", unit: "pt", format: "letter"});
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("times", "bold").setFontSize(16);
  doc.text("Liturgical Kalendar" + (year != null ? " " + year : ""),
           pageWidth / 2, MARGIN + 6, {align: "center"});

  const months = buildPublication(year, k, epactTable, monthNotes);
  let y = MARGIN + 26;

  for (const month of months) {
    // Month heading (start a new page if there is not enough room for it).
    if (y > pageHeight - 80) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFont("times", "bold").setFontSize(13);
    doc.text(month.name, pageWidth / 2, y, {align: "center"});
    y += 6;

    const body = [];
    // dayFirst[i] marks the first body row of each calendar day, so the table
    // hook can draw a horizontal rule only between days (grouping a day's feasts).
    const dayFirst = [];
    for (const day of month.days) {
      const celes = day.celebrations.length
        ? day.celebrations
        : [{feast: "", rank: ""}];
      celes.forEach((c, i) => {
        const first = i === 0;
        dayFirst.push(first);
        body.push([
          first ? day.epact : "",
          first ? day.dl : "",
          first ? String(day.day) : "",
          c.feast,
          c.rank
        ]);
      });
    }

    doc.autoTable({
      head: [["Epact", "D. L.", "Day", "Feast", "Rank"]],
      body: body,
      startY: y + 4,
      margin: {left: MARGIN, right: MARGIN},
      theme: "grid",
      tableLineWidth: 0.1,
      tableLineColor: [221, 221, 221],
      styles: {font: "times", fontSize: 8, cellPadding: 1.5, overflow: "linebreak",
               lineColor: [221, 221, 221]},
      headStyles: {fillColor: [60, 60, 60], halign: "center"},
      columnStyles: {
        0: {cellWidth: 44, halign: "center"},
        1: {cellWidth: 30, halign: "center"},
        2: {cellWidth: 28, halign: "center"},
        3: {cellWidth: "auto"},
        4: {cellWidth: 56, halign: "center"}
      },
      // Keep only column (vertical) rules within the body and a single rule
      // above each new day; feasts of the same day share one borderless block.
      didParseCell: function(data) {
        if (data.section !== "body") return;
        const top = dayFirst[data.row.index] ? 0.1 : 0;
        data.cell.styles.lineWidth = {top: top, bottom: 0, left: 0.1, right: 0.1};
      }
    });
    y = doc.lastAutoTable.finalY + 8;

    // Month-end notes.
    if (month.notes && month.notes.length) {
      doc.setFont("times", "italic").setFontSize(8);
      for (const note of month.notes) {
        const text = "Note: " + note;
        const lines = doc.splitTextToSize(text, pageWidth - 2 * MARGIN);
        const needed = lines.length * 10 + 6;
        if (y + needed > pageHeight - MARGIN) {
          doc.addPage();
          y = MARGIN;
        }
        doc.text(lines, MARGIN, y);
        y += needed;
      }
    }
    y += 8;
  }

  return doc;
}
