#!/usr/bin/env python3
"""
Add AcroForm widgets to a flattened California DV-105 (Children) page 1 PDF using
PyMuPDF (import fitz).

Expected inputs (project root):
- Tier 2- Situational - Children.pdf
- dv105_page1_fields.json   (array of { "name", "type" } with type in text|checkbox|radio)

Output: Fielded_DV105.pdf

Label positions are found with page.search_for(). The JSON does not list search text
for every field, so FIELD_LAYOUT maps each "name" to a search string, occurrence
index, and small placement template (tuned to the official 2026 form layout).

Optional JSON keys per object (override built-in anchor):
- "search":        text to pass to page.search_for()
- "search_index":  0-based hit index after sort (y, then x)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Literal, Tuple, Union

import fitz  # pymupdf

ROOT = Path(__file__).resolve().parent
PDF_IN = ROOT / "Tier 2- Situational - Children.pdf"
JSON_PATH = ROOT / "dv105_page1_fields.json"
PDF_OUT = ROOT / "Fielded_DV105.pdf"

# --- layout constants (points) ---

CB = 15
RA = 14
TEXT_H = 16
TEXT_FONT = 9

# (search, index, place) where `place` is a template code or tuple
Place = Union[str, Tuple[str, Any, ...]]


def _sorted_hits(page: fitz.Page, s: str) -> list[fitz.Rect]:
    h = page.search_for(s, quads=False)
    h.sort(key=lambda r: (r.y0, r.x0))
    return h


def _hit(page: fitz.Page, s: str, i: int) -> fitz.Rect:
    h = _sorted_hits(page, s)
    if not (0 <= i < len(h)):
        raise SystemExit(f"search_for{s!r}: need index {i}, found {len(h)} hit(s).")
    return h[i]


# --- small geometry helpers ---

def _tr(r: fitz.Rect, w: float) -> fitz.Rect:
    return fitz.Rect(r.x1 + 2, r.y0 - 0.5, r.x1 + 2 + w, r.y0 - 0.5 + TEXT_H + 1)


def _cl(r: fitz.Rect) -> fitz.Rect:
    cy = (r.y0 + r.y1) / 2
    return fitz.Rect(r.x0 - CB - 1, cy - CB / 2, r.x0 - 1, cy + CB / 2)


def _row1_dates(page: fitz.Page) -> fitz.Rect:
    a = _hit(page, "From:", 0)
    b = _hit(page, "To present", 0)
    return fitz.Rect(a.x1 + 1, a.y0 - 0.5, b.x0 - 2, a.y1 + 1.5)


def _row1_city(page: fitz.Page) -> fitz.Rect:
    a = _hit(page, "From:", 0)
    return fitz.Rect(200, a.y0 - 1.5, 360, a.y1 + 3.5)


def _priv_cb(page: fitz.Page) -> fitz.Rect:
    r = _hit(page, "Check here if this address is private", 0)
    return fitz.Rect(193, r.y0, 193 + CB, r.y0 + CB)


def _lived_box(page: fitz.Page, from_i: int, col: Literal["me", "p2", "o"]) -> fitz.Rect:
    f = _hit(page, "From:", from_i)
    yc = (f.y0 + f.y1) / 2
    x0 = 360.0 if col == "me" else (409.0 if col == "p2" else 470.0)
    return fitz.Rect(x0, yc - CB / 2, x0 + CB, yc + CB / 2)


def _from_until(page: fitz.Page, f_i: int, u_i: int, w: Literal["from", "until"]) -> fitz.Rect:
    fr = _hit(page, "From:", f_i)
    ur = _hit(page, "Until:", u_i)
    y0, y1 = min(fr.y0, ur.y0), max(fr.y1, ur.y1)
    if w == "from":
        return fitz.Rect(fr.x1 + 1, y0 - 0.5, ur.x0 - 2, y1 + 1.5)
    return fitz.Rect(ur.x1 + 1, y0 - 0.5, 198, y1 + 1.5)


def _ocity(page: fitz.Page, f_i: int) -> fitz.Rect:
    f = _hit(page, "From:", f_i)
    return fitz.Rect(200, f.y0 - 1.5, 360, f.y1 + 3.5)


def _octx(page: fitz.Page, f_i: int) -> fitz.Rect:
    f = _hit(page, "From:", f_i)
    return fitz.Rect(500, f.y0 - 1, 550, f.y1 + 3.5)


def _4a_n(page: fitz.Page) -> fitz.Rect:
    hs = [h for h in _sorted_hits(page, "No") if 415 < h.y0 < 430]
    r = hs[0] if hs else _hit(page, "No", 0)
    return fitz.Rect(r.x0 - 16, r.y0, r.x0 - 1, r.y1)


def _4a_y(page: fitz.Page) -> fitz.Rect:
    hs = [h for h in _sorted_hits(page, "Yes") if 483 < h.y0 < 492]
    r = hs[0] if hs else _hit(page, "Yes", 0)
    return fitz.Rect(r.x0 - 16, r.y0, r.x0 - 1, r.y1)


def _more_sp(page: fitz.Page) -> fitz.Rect:
    r = _hit(page, "Check here if you need more space", 0)
    return fitz.Rect(r.x0 - 18, r.y0, r.x0 - 2, r.y0 + 14)


def _odr(page: fitz.Page, s: str, i: int) -> fitz.Rect:
    r = _hit(page, s, i)
    return fitz.Rect(r.x1 + 2, r.y0 - 0.5, 535, r.y0 + 18)


# --- one rect from anchor + place template ---

def _rect(
    page: fitz.Page,
    search: str,
    idx: int,
    p: Place,
) -> fitz.Rect:
    if p == "4a_n":
        return _4a_n(page)
    if p == "4a_y":
        return _4a_y(page)
    if p == "r1_from":
        return _row1_dates(page)
    if p == "r1_city":
        return _row1_city(page)
    if p == "r1_priv":
        return _priv_cb(page)
    if p == "cl2":
        return _more_sp(page)
    r0 = _hit(page, search, idx)
    if p == "cl":
        return _cl(r0)
    if isinstance(p, tuple) and p[0] == "tr":
        return _tr(r0, float(p[1]))
    if isinstance(p, tuple) and p[0] == "odr":
        return _odr(page, search, idx)
    if isinstance(p, tuple) and p[0] == "lived":
        return _lived_box(page, int(p[1]), p[2])  # type: ignore[arg-type]
    if isinstance(p, tuple) and p[0] == "fp":
        return _from_until(page, int(p[1]), int(p[2]), p[3])  # type: ignore[misc]
    if isinstance(p, tuple) and p[0] == "city2":
        return _ocity(page, int(p[1]))
    if isinstance(p, tuple) and p[0] == "octx":
        return _octx(page, int(p[1]))
    raise SystemExit(f"Unknown place spec {p!r} (field anchor {search!r}[{idx}])")


# --- per-field default anchors (tuned to Rev. 2026-01-01 form) ---

def field_layout() -> dict[str, Tuple[str, int, Place]]:
    t: dict[str, Tuple[str, int, Place]] = {}

    def a(name: str, s: str, i: int, p: Place) -> None:
        t[name] = (s, i, p)

    a("case_number", "Case Number:", 0, ("tr", 200))
    a("your_name", "Name:", 0, ("tr", 200))
    a("your_relationship_to_children_parent", "Parent", 0, "cl")
    a("your_relationship_to_children_legal_guardian", "Legal Guardian", 0, "cl")
    a("your_relationship_to_children_other", "Other (describe):", 0, "cl")
    a("your_relationship_to_children_other_description", "Other (describe):", 0, ("odr", 200))
    a("person_you_want_protection_from_name", "Name:", 1, ("tr", 200))
    a("person_in_item_2_relationship_to_children_parent", "Parent", 1, "cl")
    a("person_in_item_2_relationship_to_children_legal_guardian", "Legal Guardian", 1, "cl")
    a("person_in_item_2_relationship_to_children_other", "Other (describe):", 1, "cl")
    a("person_in_item_2_relationship_to_children_other_description", "Other (describe):", 1, ("odr", 200))
    a("child_a_name", "a. Name:", 0, ("tr", 160))
    a("child_a_date_of_birth", "Date of birth:", 0, ("tr", 100))
    a("child_b_name", "b. Name:", 0, ("tr", 160))
    a("child_b_date_of_birth", "Date of birth:", 1, ("tr", 100))
    a("child_c_name", "c. Name:", 0, ("tr", 160))
    a("child_c_date_of_birth", "Date of birth:", 2, ("tr", 100))
    a("child_d_name", "Name:", 5, ("tr", 160))  # row d / last "Name:" on p.1
    a("child_d_date_of_birth", "Date of birth:", 3, ("tr", 100))
    a("children_need_more_space_attachment", "Check here if you need more space", 0, "cl2")
    a("all_children_lived_together_five_years_no", "No", 0, "4a_n")
    a("all_children_lived_together_five_years_yes", "Yes", 0, "4a_y")
    a("residence_history_row_1_date_from", "From:", 0, "r1_from")
    a("residence_history_row_1_city_state", "From:", 0, "r1_city")
    a("residence_history_row_1_address_confidential", "From:", 0, "r1_priv")
    a("residence_history_row_1_lived_with_me", "From:", 0, ("lived", 0, "me"))
    a("residence_history_row_1_lived_with_person_in_item_2", "From:", 0, ("lived", 0, "p2"))
    a("residence_history_row_1_lived_with_other", "From:", 0, ("lived", 0, "o"))
    a("residence_history_row_1_other_caregiver_relationship", "From:", 0, ("octx", 0))
    for k in range(2, 7):
        fi, ui = k - 1, k - 2
        a(f"residence_history_row_{k}_date_from", "From:", fi, ("fp", fi, ui, "from"))
        a(f"residence_history_row_{k}_date_until", "From:", fi, ("fp", fi, ui, "until"))
        a(f"residence_history_row_{k}_city_state", "From:", fi, ("city2", fi))
        a(f"residence_history_row_{k}_lived_with_me", "From:", fi, ("lived", fi, "me"))
        a(
            f"residence_history_row_{k}_lived_with_person_in_item_2",
            "From:",
            fi,
            ("lived", fi, "p2"),
        )
        a(f"residence_history_row_{k}_lived_with_other", "From:", fi, ("lived", fi, "o"))
        a(
            f"residence_history_row_{k}_other_caregiver_relationship",
            "From:",
            fi,
            ("octx", fi),
        )
    return t


def wtype(fld: str) -> int:
    m: dict[str, int] = {
        "text": fitz.PDF_WIDGET_TYPE_TEXT,
        "checkbox": fitz.PDF_WIDGET_TYPE_CHECKBOX,
        "radio": fitz.PDF_WIDGET_TYPE_RADIOBUTTON,
    }
    return m.get((fld or "text").lower(), fitz.PDF_WIDGET_TYPE_TEXT)


def rect_for_json_override(page: fitz.Page, s: str, i: int, jt: str) -> fitz.Rect:
    r = _hit(page, s, i)
    t = (jt or "text").lower()
    if t in ("checkbox", "radio"):
        if t == "checkbox":
            return _cl(r)
        return fitz.Rect(r.x0 - RA - 1, r.y0, r.x0 - 1, r.y0 + max(r.y1 - r.y0, 10))
    return _tr(r, 200)


def main() -> None:
    if not PDF_IN.is_file():
        raise SystemExit(f"Input PDF not found: {PDF_IN}")
    if not JSON_PATH.is_file():
        raise SystemExit(f"Blueprint not found: {JSON_PATH}")
    with open(JSON_PATH, encoding="utf-8") as f:
        rows: list[dict[str, Any]] = json.load(f)

    plan = field_layout()
    doc = fitz.open(PDF_IN)
    p0 = doc[0]
    n_ok, n_sk = 0, 0

    for e in rows:
        name = e.get("name")
        jt = (e.get("type") or "text").lower()
        if not name:
            n_sk += 1
            continue
        s_ov = (e.get("search") or "").strip()
        idx_ov = 0 if e.get("search_index", None) is None else int(e.get("search_index", 0))

        if s_ov:
            rect = rect_for_json_override(p0, s_ov, idx_ov, jt)
        else:
            block = plan.get(name)
            if not block:
                print(f"[!] No LAYOUT for {name!r} — add search/search_index or update field_layout().", file=sys.stderr)
                n_sk += 1
                continue
            s, idx, p = block
            rect = _rect(p0, s, int(idx), p)

        w = fitz.Widget()
        w.rect = rect
        w.field_name = str(name)
        w.field_type = wtype(jt)
        w.field_value = None if w.field_type == fitz.PDF_WIDGET_TYPE_TEXT else False
        w.border_color = (0, 0, 0)
        w.border_width = 1
        w.border_style = "S"
        w.text_color = (0, 0, 0)
        w.text_font = "Helv"
        w.text_fontsize = TEXT_FONT if w.field_type == fitz.PDF_WIDGET_TYPE_TEXT and rect.width > 110 else 0
        p0.add_widget(w)
        w.update()
        n_ok += 1

    out = str(PDF_OUT)
    doc.save(out, garbage=4, deflate=True, no_new_id=True)
    doc.close()
    print(f"Wrote {out!r} — {n_ok} field(s) on page 0. Skipped/invalid: {n_sk}.")


if __name__ == "__main__":
    main()
