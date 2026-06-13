"use strict"
// Drives the Publish flow on index.html: choose a year + publication type,
// Preview the Kalendar in the browser, and Download it as PDF or CSV.
import Kalendar from './kalendar.js';
import renderPublication from './publish_view.js';
import {downloadCsv} from './csv_export.js';
import {downloadPdf} from './pdf_export.js';

async function loadJson(path) {
  try {
    const r = await fetch(path);
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

// Master month-end notes overlaid by an optional per-year override
// (data/<year>/monthnotes.json wins per month).
export async function loadMonthNotes(year) {
  const master = (await loadJson('data/monthnotes.json')) || {};
  const override = await loadJson('data/' + year + '/monthnotes.json');
  const merged = Object.assign({}, master);
  if (override) {
    for (const m in override) merged[m] = override[m];
  }
  return merged;
}

let epactTable = null;

async function getEpactTable() {
  if (!epactTable) epactTable = (await loadJson('data/epacts.json')) || {};
  return epactTable;
}

// Reads the UI, builds the calendar + data, and renders the preview.
async function preview() {
  const year = parseInt(document.getElementById('pub-year').value, 10);
  const what = document.getElementById('pub-what').value;
  if (what !== 'kalendar') return; // Ordo disabled
  const container = document.getElementById('pub-output');
  container.innerHTML = '<p class="pub-loading">Building ' + year + ' Kalendar…</p>';

  const [notes, epacts] = await Promise.all([loadMonthNotes(year), getEpactTable()]);
  const k = new Kalendar(year);
  renderPublication(container, year, k, epacts, notes);

  // remember the last-built context for downloads
  preview._ctx = {year, k, epacts, notes};
  document.getElementById('pub-download-row').style.display = '';
}

async function download() {
  const ctx = preview._ctx;
  if (!ctx) return;
  const fmt = document.getElementById('pub-format').value;
  if (fmt === 'pdf') {
    downloadPdf(ctx.year, ctx.k, ctx.epacts, ctx.notes);
  } else if (fmt === 'csv') {
    downloadCsv(ctx.year, ctx.k, ctx.epacts, ctx.notes);
  }
}

export function initPublish() {
  const yearInput = document.getElementById('pub-year');
  if (yearInput && !yearInput.value) yearInput.value = new Date().getFullYear();

  const panel = document.getElementById('pub-panel');
  const btn = document.getElementById('pub-open');
  if (btn) btn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
  });

  const previewBtn = document.getElementById('pub-preview');
  if (previewBtn) previewBtn.addEventListener('click', preview);

  const downloadBtn = document.getElementById('pub-download');
  if (downloadBtn) downloadBtn.addEventListener('click', download);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPublish);
} else {
  initPublish();
}
