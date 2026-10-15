# DVRO wizard (v1)

`/wizard` is the new guided wizard. It asks each question once and fills the official
Judicial Council PDFs directly. The old wizard is still at `/form`.

## What v1 produces

The stage-1 filing packet: DV-100, DV-109, DV-110, CLETS-001 (not filed; given to the clerk),
and DV-900 when a phone transfer is requested. Rows or text that don't fit go on attached
sheets appended to that form's PDF, and DV-100 item 32 counts the pages.

Not yet included (next branches): custody (DV-105/DV-140), abduction (DV-108/DV-145),
minor confidentiality (DV-160/DV-165), DV-101, financial forms, INT-300, SER-001, and the
stage-2/3 forms. Their field bindings are already specified in `docs/field-map`.

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
field in the map has no binding. `/wizard?sample` fills in a made-up case for testing.

## Known gaps

- Court street addresses exist only for Fresno, Kings and Tulare (`src/lib/courtAddresses.ts`);
  other counties print the county name only.
