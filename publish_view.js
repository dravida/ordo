"use strict"
// Renders the publication model (see publish_model.js) into the 5-column
// printed-Kalendar layout: Epact | D. L. | Day | Feast | Rank, with a month
// header and italic month-end notes after each month.
import {buildPublication} from './publish_model.js';

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// container: a DOM element (or jQuery-wrapped element) to render into.
export default function renderPublication(container, year, k, epactTable, monthNotes) {
  const months = buildPublication(year, k, epactTable, monthNotes);
  const out = [];
  out.push('<div class="pub-kalendar">');
  out.push('<h1 class="pub-title">Liturgical Kalendar ' + esc(year) + '</h1>');

  for (const month of months) {
    out.push('<table class="pub-month">');
    out.push('<caption class="pub-month-name">' + esc(month.name) + '</caption>');
    out.push('<thead><tr>' +
      '<th class="pub-epact">Epact</th>' +
      '<th class="pub-dl">D. L.</th>' +
      '<th class="pub-day">Day</th>' +
      '<th class="pub-feast">Feast</th>' +
      '<th class="pub-rank">Rank</th>' +
      '</tr></thead><tbody>');

    for (const day of month.days) {
      const celes = day.celebrations.length
        ? day.celebrations
        : [{feast: "", rank: "", transferred: false}];
      celes.forEach((c, i) => {
        const first = i === 0;
        const sunday = day.dow === 0;
        out.push('<tr class="' + (sunday ? 'pub-sunday' : '') +
                 (first ? ' pub-day-first' : '') + '">');
        out.push('<td class="pub-epact">' + (first ? esc(day.epact) : "") + '</td>');
        out.push('<td class="pub-dl">' + (first ? esc(day.dl) : "") + '</td>');
        out.push('<td class="pub-day">' + (first ? esc(day.day) : "") + '</td>');
        out.push('<td class="pub-feast">' + esc(c.feast) + '</td>');
        out.push('<td class="pub-rank">' + esc(c.rank) + '</td>');
        out.push('</tr>');
      });
    }
    out.push('</tbody></table>');

    if (month.notes && month.notes.length) {
      out.push('<div class="pub-notes">');
      for (const note of month.notes) {
        out.push('<p class="pub-note"><em>Note:</em> ' + esc(note) + '</p>');
      }
      out.push('</div>');
    }
  }
  out.push('</div>');

  const html = out.join("");
  if (container && container.jquery) {
    container.html(html);
  } else if (container) {
    container.innerHTML = html;
  }
  return html;
}
