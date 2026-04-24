#!/usr/bin/env python3
"""
Rename Acrobat-generated PDF form widgets on page 0 to match dv105_page1_fields.json.

Spatial ordering:
  - Sort widgets by vertical center (cy), then group into rows (cy within 12px of row
    anchor), then sort each row by horizontal center (cx) left to right, then flatten.

Requires: pymupdf (import fitz)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import fitz  # pymupdf

ROOT = Path(__file__).resolve().parent
PDF_IN = ROOT / "Acrobat_DV105.pdf"
JSON_BLUEPRINT = ROOT / "dv105_page1_fields.json"
PDF_OUT = ROOT / "Perfect_DV105.pdf"

ROW_Y_TOLERANCE_PX = 12.0


def load_clean_field_names(path: Path) -> list[str]:
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list) and data and all(isinstance(x, str) for x in data):
        return list(data)
    if not isinstance(data, list):
        msg = f"Expected a JSON array in {path}"
        raise TypeError(msg)
    names: list[str] = []
    for entry in data:
        if isinstance(entry, str):
            names.append(entry)
        elif isinstance(entry, dict) and (n := entry.get("name")) is not None:
            names.append(str(n))
    return names


def attach_center_coords(widgets: list[fitz.Widget]) -> None:
    for w in widgets:
        r = w.rect
        w.cy = (r.y0 + r.y1) / 2.0
        w.cx = (r.x0 + r.x1) / 2.0


def spatial_row_sort_reading_order(widgets: list[fitz.Widget], row_tol: float) -> list[fitz.Widget]:
    """
    1) Sort by cy. 2) Group into rows if cy is within `row_tol` of the first widget
    in the current row. 3) Sort each row by cx. 4) Return flattened 1D list.
    """
    if not widgets:
        return []
    by_cy = sorted(widgets, key=lambda w: w.cy)
    rows: list[list[fitz.Widget]] = []
    current: list[fitz.Widget] = []
    for w in by_cy:
        if not current:
            current.append(w)
        else:
            first_cy = current[0].cy
            if abs(w.cy - first_cy) <= row_tol:
                current.append(w)
            else:
                rows.append(current)
                current = [w]
    if current:
        rows.append(current)

    sorted_rows = [sorted(row, key=lambda ww: ww.cx) for row in rows]
    return [w for row in sorted_rows for w in row]


def main() -> None:
    if not PDF_IN.is_file():
        print(f"Error: input PDF not found: {PDF_IN}", file=sys.stderr)
        sys.exit(1)
    if not JSON_BLUEPRINT.is_file():
        print(f"Error: JSON blueprint not found: {JSON_BLUEPRINT}", file=sys.stderr)
        sys.exit(1)

    # 1. Load clean field names
    clean_names = load_clean_field_names(JSON_BLUEPRINT)

    # 2. Open PDF and all widgets on page[0]
    doc = fitz.open(PDF_IN)
    try:
        page0 = doc[0]
        raw_widgets: list[fitz.Widget] = list(page0.widgets() or ())

        # 3. Center coordinates on each widget
        attach_center_coords(raw_widgets)

        # 4. Initial sort by cy; 5–7. Row grouping, per-row cx sort, flatten
        sorted_widgets = spatial_row_sort_reading_order(raw_widgets, ROW_Y_TOLERANCE_PX)

        acrobat_count = len(raw_widgets)
        json_count = len(clean_names)
        print(f"Acrobat found {acrobat_count} field widget(s) on page 0.", flush=True)
        print(f"JSON blueprint has {json_count} field name(s).", flush=True)

        # 8. Count check — loud warning if mismatch
        if acrobat_count != json_count:
            print(file=sys.stderr)
            print("!" * 72, file=sys.stderr)
            print("!!! WARNING: FIELD COUNTS DO NOT MATCH !!!", file=sys.stderr)
            print(
                f"!!! Acrobat (page 0): {acrobat_count}  !=  JSON: {json_count}  !!!",
                file=sys.stderr,
            )
            print(
                "!!! zip() will pair only up to the shorter list; check mapping and PDF. !!!",
                file=sys.stderr,
            )
            print("!" * 72, file=sys.stderr)
            print(file=sys.stderr)

        # 9–11. zip, rename + update, print mapping (one pass)
        for w, new_name in zip(sorted_widgets, clean_names):
            w.field_name = new_name
            w.update()
            r = w.rect
            w.cy = (r.y0 + r.y1) / 2.0
            w.cx = (r.x0 + r.x1) / 2.0
            print(
                f"Mapped: {new_name} -> placed at (X:{int(w.cx)}, Y:{int(w.cy)})"
            )

        # 12. Save
        doc.save(PDF_OUT.as_posix(), garbage=4, deflate=True, no_new_id=True)
    finally:
        doc.close()

    print(f"\nSaved: {PDF_OUT}")


if __name__ == "__main__":
    main()
