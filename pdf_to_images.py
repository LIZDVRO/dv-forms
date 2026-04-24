#!/usr/bin/env python3
"""Render each page of a PDF to PNG images using PyMuPDF (fitz)."""

from pathlib import Path

import fitz  # pymupdf

PDF_NAME = "Tier 2- Situational - Children.pdf"
OUTPUT_DIR = "pdf_images"
ZOOM = 2.0


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    pdf_path = script_dir / PDF_NAME
    out_dir = script_dir / OUTPUT_DIR

    if not pdf_path.is_file():
        raise SystemExit(f"PDF not found: {pdf_path}")

    out_dir.mkdir(exist_ok=True)
    matrix = fitz.Matrix(ZOOM, ZOOM)

    with fitz.open(pdf_path) as doc:
        page_count = len(doc)
        for i in range(page_count):
            page = doc[i]
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            out_path = out_dir / f"page_{i + 1}.png"
            pix.save(out_path.as_posix())

    print(
        f"Success: exported {page_count} page(s) to {out_dir}/ "
        f"(page_1.png … page_{page_count}.png)."
    )


if __name__ == "__main__":
    main()
