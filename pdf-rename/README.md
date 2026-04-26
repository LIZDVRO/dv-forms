# pdf-rename

Rename Acrobat-auto-detected form fields to clean `snake_case` names without touching field positions or types. Built for the Judicial Council "flatten and re-field" workflow (DV-100, DV-105, FL-150, etc.) but works on any AcroForm PDF.

## Why

Acrobat is great at *placing* form fields and terrible at *naming* them. You end up with names like `b Age give estimate if you do not k now exact age`. This tool reads the fielded PDF, infers a clean name for each field from nearby text, writes the proposals to a JSON mapping you review, then applies the reviewed mapping back to the PDF.

The pipeline is **extract → review → apply → verify**. The "review" step is just opening the JSON in your editor.

## Install

```bash
cd pdf-rename
npm install
```

Requires Node 20+.

## Usage

```bash
# 1. Extract: read PDF, propose names, write reviewable JSON
npm run extract -- ./DV-105.pdf ./DV-105.mapping.json

# 2. Review: open DV-105.mapping.json in your editor.
#    Edit the `proposed` field for any name you want to change.
#    Lines with status: "skip" are already clean and won't be touched.

# 3. Apply: rewrite the PDF with the reviewed names
npm run apply -- ./DV-105.pdf ./DV-105.mapping.json ./DV-105.renamed.pdf

# 4. Verify: confirm the new PDF actually has the expected names
npm run verify -- ./DV-105.renamed.pdf ./DV-105.mapping.json
```

## Mapping JSON shape

Each entry looks like:

```json
{
  "id": "p3_0042",
  "page": 3,
  "rect": [80.64, 536.16, 90.12, 545.64],
  "type": "checkbox",
  "current": "The county of list",
  "proposed": "q4_county_yes",
  "rationale": "right of box: \"Yes The county of\" | section 4",
  "confidence": 0.7,
  "status": "propose"
}
```

- `current`: what's in the PDF today
- `proposed`: what we'd rename it to — **edit this**
- `rationale`: why we picked it (where the label was found)
- `confidence`: 0..1; sort the JSON by confidence and start with the lowest
- `status`:
  - `"propose"` — apply will rename
  - `"skip"`    — name is already clean snake_case; apply leaves it alone
  - `"manual"`  — set this yourself if you want apply to skip an entry without it being clean (rarely needed)

## Naming convention produced by the extractor

`q{section}_{label_slug}`, with stop-words removed and capped at 6 words.

Examples:
- Section 4 checkbox labeled "Yes" → `q4_yes`
- Section 6 text labeled "Date of birth" → `q6_date_birth` (stop-words dropped)
- A field with no detectable section → bare `{label_slug}`

If you want a different convention (camelCase, dot-paths, form-prefixed), tweak `proposeName` in `src/lib.ts` — that's the only place name shape is decided.

## What it preserves

- Field positions (`/Rect`)
- Field types and flags (text vs checkbox vs radio)
- Field default values, appearance streams, parent-child grouping
- Already-clean snake_case names (status `"skip"`)

## What it doesn't do

- Doesn't change checkbox `/V` or `/AS` values (those are option *values*, not field names — leave them alone)
- Doesn't restructure radio groups (if Acrobat made siblings instead of a proper parent group, that's a manual fix)
- Doesn't touch annotations that aren't widgets (signatures, comments, etc.)

## Heuristics, in plain English

1. **Already clean** → leave it (status: skip).
2. **Checkboxes/radios** → label is the text immediately to the right of the box, on the same horizontal line.
3. **Text/choice fields** → label is the text to the left, on the same line; if nothing, look directly above.
4. **Section number** → look for a short numeric heading (`1`, `2`, `12.`) in the left margin above the widget; prefix with `q{n}_`.
5. **Nothing found** → fall back to slugifying Acrobat's existing garbage name. These will be low-confidence; review them.
6. **Duplicate proposed names** → suffix with `_2`, `_3`. Reviewer will see them.

## Mapping fields to your Zustand store

Once apply has run, the field name in the PDF == the key in your store. So:

```ts
// Zustand
const useDV105 = create((set) => ({
  q4_yes: false,
  q4_county_list: '',
  // ...
}));

// pdf-lib fill
form.getCheckBox('q4_yes').check();
form.getTextField('q4_county_list').setText(state.q4_county_list);
```

If you want a flat map of `name -> default value` for store init, you can grab it from the mapping JSON directly:

```ts
import mapping from './DV-105.mapping.json' assert { type: 'json' };
const initial = Object.fromEntries(
  mapping.map(e => [e.proposed, e.type === 'checkbox' || e.type === 'radio' ? false : ''])
);
```
