"""
Python parallel for the TS extract step. Same heuristics, same output schema.
Lets us demonstrate the algorithm on real PDFs without needing npm.
Not the deliverable — the TS CLI is. This is here for review.
"""
import json, re, sys
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import IndirectObject
import pdfplumber

CLEAN = re.compile(r"^[a-z][a-z0-9_]*$")
STOP = set("""a an the of to in on for and or is are was were be been this that these those
with by at as from it its if when where how do does did will would should may might can
check all apply list describe explain give enter write fill complete section below above
page item form attach attached optional required""".split())

def slug(text, drop_stop=True, max_words=6):
    cleaned = re.sub(r"[^A-Za-z0-9]+", " ", text or "").strip().lower()
    if not cleaned:
        return ""
    words = cleaned.split()
    if drop_stop:
        trimmed = [w for w in words if w not in STOP]
        if trimmed:
            words = trimmed
    return "_".join(words[:max_words])

def split_suffix(name):
    m = re.match(r"^(.*?)(_\d+)$", name)
    return (m.group(1), m.group(2)) if m else (name, None)

def classify(ft, ff):
    if ft == "/Tx": return "text"
    if ft == "/Ch": return "choice"
    if ft == "/Sig": return "signature"
    if ft == "/Btn":
        if ff & (1 << 16): return "unknown"  # pushbutton
        if ff & (1 << 15): return "radio"
        return "checkbox"
    return "unknown"

def walk_widgets(reader):
    out = []
    for pi, page in enumerate(reader.pages):
        annots = page.get("/Annots")
        if not annots: continue
        if isinstance(annots, IndirectObject): annots = annots.get_object()
        for a in annots:
            o = a.get_object()
            if o.get("/Subtype") != "/Widget": continue
            parts, ft, ff = [], None, 0
            node, seen = o, set()
            while node is not None and id(node) not in seen:
                seen.add(id(node))
                t = node.get("/T")
                if t: parts.insert(0, str(t))
                if ft is None and node.get("/FT"): ft = str(node.get("/FT"))
                if node.get("/Ff") is not None and ff == 0:
                    try: ff = int(node.get("/Ff"))
                    except: pass
                p = node.get("/Parent")
                node = p.get_object() if p is not None else None
            current = ".".join(parts)
            rect = o.get("/Rect")
            if not (current and rect): continue
            out.append({
                "page": pi + 1,
                "rect": [float(rect[0]), float(rect[1]), float(rect[2]), float(rect[3])],
                "current": current,
                "type": classify(ft, ff),
                "suffix": split_suffix(current)[1],
                "id": f"p{pi+1}_{len(out):04d}",
            })
    return out

def extract_text_items(pdf_path):
    """Return list-of-list-of-text-items per page, each item {text, bbox} in PDF user space."""
    items_by_page = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_h = page.height
            items = []
            # pdfplumber gives bbox in (x0, top, x1, bottom) where top/bottom use top-left origin.
            # Convert to PDF user-space bottom-left.
            for w in page.extract_words(use_text_flow=False, keep_blank_chars=False):
                items.append({
                    "text": w["text"],
                    "bbox": [w["x0"], page_h - w["bottom"], w["x1"], page_h - w["top"]],
                })
            items_by_page.append(items)
    return items_by_page

def rects_overlap_x(a, b):
    return not (a[2] < b[0] or a[0] > b[2])

def find_section(rect, items):
    x1, y1, x2, y2 = rect
    cy = (y1 + y2) / 2
    cands = [
        t for t in items
        if re.match(r"^\d{1,2}\.?$", t["text"])
        and t["bbox"][0] < x1 - 8
        and t["bbox"][1] >= y2 - 4
        and t["bbox"][1] - cy < 200
    ]
    if not cands: return None
    cands.sort(key=lambda t: abs(t["bbox"][1] - y2))
    return cands[0]["text"].rstrip(".")

def propose(widget, items):
    x1, y1, x2, y2 = widget["rect"]
    cx, cy = (x1+x2)/2, (y1+y2)/2
    label, source, conf = None, "", 0.4

    if widget["type"] in ("checkbox", "radio"):
        cands = []
        for t in items:
            dx = t["bbox"][0] - x2
            dy = (t["bbox"][1] + t["bbox"][3])/2 - cy
            if -2 < dx < 80 and abs(dy) < 6:
                cands.append((dx, t))
        cands.sort(key=lambda c: c[0])
        if cands:
            line = []
            last_right = cands[0][1]["bbox"][0] - 1
            for _, t in cands:
                if t["bbox"][0] - last_right > 18: break
                line.append(t["text"])
                last_right = t["bbox"][2]
            label = " ".join(line)
            source, conf = "right of box", 0.7
    else:
        # text/choice/sig: left first, then above
        left = []
        for t in items:
            dx = x1 - t["bbox"][2]
            dy = (t["bbox"][1] + t["bbox"][3])/2 - cy
            if -2 < dx < 200 and abs(dy) < 8:
                left.append((dx, t))
        left.sort(key=lambda c: c[0])
        if left:
            line = []
            last_left = left[0][1]["bbox"][2] + 1
            for _, t in left:
                if last_left - t["bbox"][2] > 20 and line: break
                line.insert(0, t["text"])
                last_left = t["bbox"][0]
            label = " ".join(line)
            source, conf = "left of box", 0.65
        if not label:
            above = [
                (t["bbox"][1] - y2, t)
                for t in items
                if 0 < t["bbox"][1] - y2 < 25 and rects_overlap_x(t["bbox"], widget["rect"])
            ]
            above.sort(key=lambda c: c[0])
            if above:
                label = above[0][1]["text"]
                source, conf = "above box", 0.55

    section = find_section(widget["rect"], items)

    if not label:
        label = split_suffix(widget["current"])[0]
        source, conf = "acrobat name", 0.35

    s = slug(label) or "field"
    proposed = (f"q{section}_" if section else "") + s
    return {
        "proposed": proposed,
        "rationale": f"{source}: \"{label}\"" + (f" | section {section}" if section else ""),
        "confidence": conf,
    }

def dedupe(entries):
    counts = {}
    for e in entries:
        if e["status"] == "skip": continue
        base = e["proposed"]
        n = counts.get(base, 0)
        if n > 0:
            e["proposed"] = f"{base}_{n+1}"
            e["rationale"] += f" [+_{n+1} for uniqueness]"
        counts[base] = n + 1

def main(pdf_path, out_path):
    reader = PdfReader(pdf_path)
    widgets = walk_widgets(reader)
    text_pages = extract_text_items(pdf_path)
    entries = []
    for w in widgets:
        leaf = w["current"].split(".")[-1]
        if CLEAN.match(leaf):
            entries.append({
                **{k: w[k] for k in ("id", "page", "rect", "type", "current")},
                "proposed": w["current"],
                "rationale": "already clean — left alone",
                "confidence": 1.0,
                "status": "skip",
            })
            continue
        items = text_pages[w["page"]-1] if w["page"]-1 < len(text_pages) else []
        prop = propose(w, items)
        entries.append({
            **{k: w[k] for k in ("id", "page", "rect", "type", "current")},
            **prop,
            "status": "propose",
        })
    dedupe(entries)
    entries.sort(key=lambda e: (e["page"], -e["rect"][3], e["rect"][0]))
    Path(out_path).write_text(json.dumps(entries, indent=2))
    total = len(entries)
    skipped = sum(1 for e in entries if e["status"] == "skip")
    proposed = sum(1 for e in entries if e["status"] == "propose")
    low = sum(1 for e in entries if e["status"] == "propose" and e["confidence"] < 0.5)
    print(f"Wrote {out_path}")
    print(f"  total widgets : {total}")
    print(f"  already clean : {skipped}")
    print(f"  proposing     : {proposed}")
    print(f"  low-confidence: {low}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
