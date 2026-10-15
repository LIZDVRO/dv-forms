#!/usr/bin/env python3
"""Prepare official Judicial Council PDFs as fill templates.

For each official form PDF:
  1. Decrypt (the files carry an owner password with an empty user password).
  2. Remove the XFA layer, so viewers show the AcroForm fields we fill.
  3. Remove Reader usage rights (/Perms), which filling would invalidate.
Field names are left exactly as published (no re-fielding).

Usage: python3 scripts/prepare-templates.py <folder-of-official-pdfs> public/forms
Requires: qpdf, pypdf
"""
import os, re, subprocess, sys, tempfile
import pypdf
from pypdf.generic import NameObject

FORM_ID = re.compile(r'^((?:CLETS|DV|FL|INT|SER)-\d+(?:\(A\))?(?:-INFO)?)(?=[\s_.])')

def prepare(src, dst):
    with tempfile.TemporaryDirectory() as td:
        dec = os.path.join(td, 'dec.pdf')
        subprocess.run(['qpdf', '--decrypt', src, dec], check=True)
        r = pypdf.PdfReader(dec)
        w = pypdf.PdfWriter(clone_from=r)
        root = w._root_object
        af = root.get('/AcroForm')
        if af is not None:
            af = af.get_object()
            if '/XFA' in af: del af['/XFA']
            af[NameObject('/NeedAppearances')] = pypdf.generic.BooleanObject(True)
        for k in ('/Perms', '/NeedsRendering'):
            if k in root: del root[k]
        with open(dst, 'wb') as f: w.write(f)

def main(src_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for name in sorted(os.listdir(src_dir)):
        if not name.lower().endswith('.pdf'): continue
        m = FORM_ID.match(name)
        if not m: continue
        out = os.path.join(out_dir, m.group(1).replace('(', '').replace(')', '') + '.pdf')  # DV-105(A) -> DV-105A
        prepare(os.path.join(src_dir, name), out)
        print(m.group(1), os.path.getsize(out))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
