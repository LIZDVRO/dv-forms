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

- FL-150 when child support (O24), spousal support (O25) or lawyer's fees (O26) is requested,
  with three steps: `Your income`, `Your expenses`, and `Child support details` (O24 only).
  FL-155 (simplified) is not offered: FL-150 is accepted in every case, so the wizard never
  has to choose. DV-570 is therefore not needed.

- DV-160 with the proposed DV-165 and DV-170 when the person asks to keep a protected child's
  information private (PR14, its own step). DV-175 is pre-filled for later filings.

Every form the petitioner touches is now produced in one session. The finish screen (and the
zip) sorts them into three groups:

| Group | Forms |
| --- | --- |
| File now | DV-100, DV-101, DV-105, DV-105(A), DV-108, DV-109, DV-110, DV-140, DV-145, DV-900, FL-150, INT-300, DV-160, DV-165, DV-170, CLETS-001 (to the clerk, not filed) |
| Bring to your court date | DV-130, DV-150 (with custody) |
| Keep for later | SER-001, DV-200, DV-250 (with FL-150), DV-901 (with DV-900; confidential), DV-175, DV-210 |

These are orders or proofs the court, a server or the phone company completes; the wizard fills
only the parts the petitioner knows. The case number is left blank everywhere unless the person
is updating an existing case. FL-155 and FL-351 are not used (see the build-decisions doc).

## Fewer questions, fewer repeats

- Guns and body armor are asked once, on "The other person". Each incident asks only
  "No / A gun / Another weapon".
- Earlier answers are offered as one-tap choices: the move-out home (their address or your
  mailing address), where the children live now, which earlier cases involve the children,
  and the children's insurance address (your employer's).
- Parents default to "parent" for both people; a "Change" link opens the question.
- Item 23 always starts with the LIZ Break Free document-assistance fee ($250), locked, with
  the LIZ invoice (`public/forms/LIZ-invoice.pdf`) appended behind DV-100 and counted in item 32.
- A drawn signature (and the lawyer's, if any) is placed on DV-100, FL-150, DV-160, INT-300
  and SER-001 (`signatures` in each form spec). Blank means sign by hand.
- The finish page can be printed or saved as PDF; only the instructions print.

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
