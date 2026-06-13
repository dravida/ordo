"use strict"
// Builds a downloadable PDF of the published Kalendar using the vendored jsPDF +
// jspdf-autotable libraries (loaded as UMD globals via <script> in index.html;
// jsPDF is exposed at window.jspdf.jsPDF and autotable registers itself onto it).
import {buildPublication} from './publish_model.js';

const MARGIN = 40;

export function downloadPdf(year, k, epactTable, monthNotes) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library failed to load (js/jspdf.umd.min.js).");
    return;
  }
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({orientation: "portrait", unit: "pt", format: "letter"});
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("times", "bold").setFontSize(16);
  doc.text("Liturgical Kalendar " + year, pageWidth / 2, MARGIN + 6, {align: "center"});

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
    for (const day of month.days) {
      const celes = day.celebrations.length
        ? day.celebrations
        : [{feast: "", rank: ""}];
      celes.forEach((c, i) => {
        const first = i === 0;
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
      styles: {font: "times", fontSize: 8, cellPadding: 1.5, overflow: "linebreak"},
      headStyles: {fillColor: [60, 60, 60], halign: "center"},
      columnStyles: {
        0: {cellWidth: 44, halign: "center"},
        1: {cellWidth: 30, halign: "center"},
        2: {cellWidth: 28, halign: "center"},
        3: {cellWidth: "auto"},
        4: {cellWidth: 56, halign: "center"}
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

  doc.save("Liturgical_Kalendar_" + year + ".pdf");
}
