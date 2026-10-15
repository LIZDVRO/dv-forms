#!/usr/bin/env python3
"""Measure printed ruled lines inside multi-line text fields.

Writes src/wizard/fill/rulings.json: { formId: { fieldName: [offsets] } },
where each offset is the distance in points from the top of the field to a
printed rule. The fill engine places one line of text just above each rule,
so long answers sit on the form's lines instead of across them.

Usage: python3 scripts/measure-rulings.py public/forms src/wizard/fill/rulings.json
Requires: pymupdf
"""
import json, os, sys
import pymupdf

def measure(path):
    out = {}
    doc = pymupdf.open(path)
    for page in doc:
        lines = []
        for dr in page.get_drawings():
            for it in dr["items"]:
                if it[0] == "l" and abs(it[1].y - it[2].y) < 0.6:
                    x0, x1 = sorted((it[1].x, it[2].x)); lines.append((x0, x1, it[1].y))
                elif it[0] == "re" and it[1].height < 1.6:
                    r = it[1]; lines.append((r.x0, r.x1, (r.y0 + r.y1) / 2))
        for w in page.widgets():
            if w.field_type != pymupdf.PDF_WIDGET_TYPE_TEXT or not (w.field_flags & 4096):
                continue
            r = w.rect
            ys = sorted({round(y - r.y0, 1) for (x0, x1, y) in lines
                         if r.y0 + 4 <= y <= r.y1 + 3 and min(x1, r.x1) - max(x0, r.x0) >= 0.6 * r.width})
            kept = []
            for y in ys:  # drop box edges and double rules closer than 6pt to the previous rule
                if not kept or y - kept[-1] >= 6: kept.append(y)
            if len(kept) >= 2:
                out[w.field_name] = kept
    return out

def main(folder, dst):
    res = {}
    for name in sorted(os.listdir(folder)):
        if name.endswith(".pdf") and "INFO" not in name:
            m = measure(os.path.join(folder, name))
            if m: res[name[:-4]] = m
    with open(dst, "w") as f: json.dump(res, f, indent=0, sort_keys=True)
    print({k: len(v) for k, v in res.items()})

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
