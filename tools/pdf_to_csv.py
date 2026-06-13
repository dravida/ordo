#!/usr/bin/env python3
"""Extract reference data from a published Liturgical Kalendar PDF.

This is a one-time / maintenance tool used to bootstrap the perpetual Epact
table (data/epacts.json), the master month-end notes (data/monthnotes.json),
and a per-year reference CSV that the human editor can review for accuracy.

It is NOT part of the browser app runtime. It requires pdfplumber:

    pip install pdfplumber

Usage:
    python3 tools/pdf_to_csv.py <kalendar.pdf> [year]

Outputs (relative to repo root):
    data/epacts.json                              (perpetual; written once)
    data/monthnotes.json                          (master notes; written once)
    data/<year>/kalendar_<year>_reference.csv     (per-year reference)

The PDF column layout (x coordinates, 612pt page) is:
    Epact  < 100 | D. L. 100-140 | Day 140-175 | Feast 175-515 | Rank >= 515
"""
import sys
import os
import csv
import json
from collections import defaultdict

import pdfplumber

MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
          "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
PAGE_FOOTERS = {"(%d)" % i for i in range(1, 13)}
SKIP_TITLES = {"Liturgical Kalendar", "LITURGICAL KALENDAR"}

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def col_of(x):
    if x < 100:
        return "epact"
    if x < 140:
        return "dl"
    if x < 175:
        return "day"
    if x < 515:
        return "feast"
    return "rank"


def parse(pdf_path):
    """Return (csv_rows, epacts, notes).

    csv_rows: list of [epact, dl, day, feast, rank, month_number]
    epacts:   {month_number: {day_number: epact_string}}
    notes:    {month_number: [note_string, ...]}
    """
    pdf = pdfplumber.open(pdf_path)
    csv_rows = []
    epacts = defaultdict(dict)
    notes = defaultdict(list)
    cur_month = 0

    for page in pdf.pages:
        rows = defaultdict(list)
        for w in page.extract_words():
            rows[round(w["top"])].append(w)
        tops = sorted(rows)
        i = 0
        while i < len(tops):
            ws = sorted(rows[tops[i]], key=lambda w: w["x0"])
            text = " ".join(w["text"] for w in ws).strip()

            # skip page title + footers + the column header row
            if text in SKIP_TITLES or text in PAGE_FOOTERS or text.startswith("Epact"):
                i += 1
                continue

            # month header
            if text in MONTHS:
                cur_month = MONTHS.index(text) + 1
                i += 1
                continue

            # month-end note block (starts with Note/NOTE, may wrap lines)
            if text.lower().startswith("note"):
                block = [text]
                j = i + 1
                while j < len(tops):
                    ws2 = sorted(rows[tops[j]], key=lambda w: w["x0"])
                    t2 = " ".join(w["text"] for w in ws2).strip()
                    minx = min(w["x0"] for w in ws2)
                    has_day = any(140 < w["x0"] < 175 and w["text"].strip().isdigit()
                                  for w in ws2)
                    if t2 in MONTHS or t2 in PAGE_FOOTERS or has_day or minx > 175:
                        break
                    block.append(t2)
                    j += 1
                if cur_month:
                    notes[cur_month].append(" ".join(block))
                i = j
                continue

            # ordinary content row
            cols = defaultdict(list)
            for w in ws:
                cols[col_of(w["x0"])].append(w["text"])
            epact = " ".join(cols["epact"])
            dl = " ".join(cols["dl"])
            day = " ".join(cols["day"])
            feast = " ".join(cols["feast"])
            rank = " ".join(cols["rank"])
            if cur_month:
                csv_rows.append([epact, dl, day, feast, rank, cur_month])
                if day.strip().isdigit() and epact.strip():
                    epacts[cur_month][int(day)] = epact.strip()
            i += 1

    return csv_rows, epacts, notes


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    pdf_path = sys.argv[1]
    year = sys.argv[2] if len(sys.argv) > 2 else "2027"

    csv_rows, epacts, notes = parse(pdf_path)

    # per-year reference CSV
    ydir = os.path.join(REPO, "data", year)
    os.makedirs(ydir, exist_ok=True)
    csv_path = os.path.join(ydir, "kalendar_%s_reference.csv" % year)
    with open(csv_path, "w", newline="") as f:
        wr = csv.writer(f)
        wr.writerow(["Epact", "D.L.", "Day", "Feast", "Rank", "Month"])
        wr.writerows(csv_rows)

    # perpetual epact table (string keys for stable JSON)
    epact_out = {str(m): {str(d): epacts[m][d] for d in sorted(epacts[m])}
                 for m in sorted(epacts)}
    with open(os.path.join(REPO, "data", "epacts.json"), "w") as f:
        json.dump(epact_out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # master month-end notes; ensure every month key exists (empty list default)
    note_out = {}
    for m in range(1, 13):
        block = notes.get(m, [])
        # strip the leading "Note:"/"NOTE:" label for clean storage
        cleaned = []
        for s in block:
            for lbl in ("Note:", "NOTE:", "Note", "NOTE"):
                if s.startswith(lbl):
                    s = s[len(lbl):].strip()
                    break
            cleaned.append(s)
        note_out[str(m)] = cleaned
    with open(os.path.join(REPO, "data", "monthnotes.json"), "w") as f:
        json.dump(note_out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print("Wrote %s (%d rows)" % (csv_path, len(csv_rows)))
    print("Wrote data/epacts.json (%d months)" % len(epact_out))
    print("Wrote data/monthnotes.json (notes on months: %s)"
          % ", ".join(m for m in note_out if note_out[m]))


if __name__ == "__main__":
    main()
