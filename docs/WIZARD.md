# DVRO wizard (v1)

`/wizard` is the new guided wizard. It asks each question once and fills the official
Judicial Council PDFs directly. The old wizard is still at `/form`.

## What v1 produces

The stage-1 filing packet: DV-100, DV-109, DV-110, CLETS-001 (not filed; given to the clerk),
and DV-900 when a phone transfer is requested. Rows or text that don't fit go on attached
sheets appended to that form's PDF, and DV-100 item 32 counts the pages.

When custody is requested (DV-100 item 15, O15) the packet adds DV-105 and the proposed
DV-140 (parties and children only). If the children have not all lived in the same places
for five years (K1 = No), each pair of residence groups gets its own DV-105(A)
(`DV-105(A).pdf`, `DV-105(A)-2.pdf` …). If the petitioner fears abduction (K5 = Yes), it
adds DV-108 and the proposed DV-145 (parties only). These steps (`Your children`,
`Custody and visits`, `Preventing abduction`) appear only when they apply.

Also included when they apply:
- DV-101 for incidents 4 and 5; incident 6 onward goes in its item 5 and an attached sheet.
  DV-100 page 5's "more space" box and item 32's page count include it.
- INT-300, one per person who needs an interpreter (the petitioner, then each witness).
- SER-001 when the sheriff serves (not filed). The case number, court date and service
  deadline are left for the person to write in from the DV-109 the court returns.

Not yet included (next branches): minor confidentiality (DV-160/DV-165), financial forms
(support and fees), DV-200, and the stage-2/3 forms. Their field bindings
are already specified in `docs/field-map`.

## How it fits together

| Piece | Where |
| --- | --- |
| Questions, keyed by questionnaire-map IDs (P1, R5, O12 …) | `src/wizard/types.ts` |
| Calculated values (ages, captions, relationship phrase) | `src/wizard/derive.ts` |
| Fill engine (one generic loop for every form) | `src/wizard/fill/engine.ts` |
| Field bindings per form | `src/wizard/fill/forms/*.ts` |
| Screens | `src/wizard/steps/*.tsx`, `src/app/wizard/page.tsx` |
| Full field map for all 26 forms | `docs/field-map/` |

Safety decisions: Quick exit (button or Esc) clears answers and goes to https://us.shein.com/;
nothing is saved anywhere; the page warns before it is closed or refreshed.

## Templates

`public/forms/*.pdf` are the official PDFs, decrypted with the XFA layer and Reader usage
rights removed, field names unchanged. To refresh them after a Judicial Council revision:

```bash
python3 scripts/prepare-templates.py "<folder of official PDFs>" public/forms
python3 scripts/measure-rulings.py public/forms src/wizard/fill/rulings.json
npm run check-wizard -- tmp-packet   # fills a sample case and checks every binding
```

`check-wizard` fails if a binding names a field that doesn't exist, or if a petitioner
field in the map has no binding. It writes two sample packets: `a/` (supervised visits on
the weekly chart, abduction) and `b/` (children lived apart, so two DV-105(A) copies;
unsupervised visits with supervised exchanges). `/wizard?sample` fills in case `a` for testing.

## Checking filled PDFs

Preview filled pages with PDFium (what Chrome uses) or MuPDF. Poppler (`pdftoppm`) leaves
some INT-300 check boxes blank even though they are set; that is a poppler quirk, not a
fill problem.

## Known gaps

- Courthouse addresses exist for Fresno, Kings, Madera, Merced and Tulare (two branches) in
  `src/wizard/courthouses.ts`; other counties print the county name only.
