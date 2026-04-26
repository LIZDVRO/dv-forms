import {
  PDFDocument,
  StandardFonts,
  type PDFForm,
} from "pdf-lib";

import { useFormStore, type PersonInfo } from "@/store/useFormStore";

export const TIER2_PDF_URL = "/tier2.pdf";

/** DV-105 page 1 — drawn left of the `your_name` section marker (checkbox). Tune with real printouts. */
const DV105_PAGE1_PETITIONER_NAME_X = 97;
const DV105_PAGE1_PETITIONER_NAME_Y = 598;
/** DV-105 page 1 — drawn left of `person_you_want_protection_from_name` section marker. */
const DV105_PAGE1_RESPONDENT_NAME_X = 97;
const DV105_PAGE1_RESPONDENT_NAME_Y = 524;
const DV105_PAGE1_NAME_FONT_SIZE = 10;

const MARK = "\u2713";

function personDisplayName(p: PersonInfo): string {
  return [p.firstName, p.middleName, p.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

function safeSetText(form: PDFForm, fieldName: string, value: string): void {
  try {
    form.getTextField(fieldName).setText(value);
  } catch {
    /* missing or wrong field type */
  }
}

function safeSetCheck(
  form: PDFForm,
  fieldName: string,
  checked: boolean,
): void {
  try {
    const box = form.getCheckBox(fieldName);
    if (checked) box.check();
    else box.uncheck();
  } catch {
    /* missing or not a checkbox */
  }
}

function applyPetitionerChildRelationship(
  form: PDFForm,
  rel: "" | "parent" | "legalGuardian" | "other",
  otherDescription: string,
): void {
  if (rel === "parent") {
    safeSetCheck(form, "your_relationship_to_children_parent", true);
  } else if (rel === "legalGuardian") {
    safeSetCheck(form, "your_relationship_to_children_legal_guardian", true);
  } else if (rel === "other") {
    safeSetCheck(form, "your_relationship_to_children_other", true);
    safeSetText(
      form,
      "your_relationship_to_children_other_description",
      otherDescription.trim(),
    );
  }
}

function applyRespondentChildRelationship(
  form: PDFForm,
  rel: "" | "parent" | "legalGuardian" | "other",
  otherDescription: string,
): void {
  if (rel === "parent") {
    safeSetCheck(form, "person_in_item_2_relationship_to_children_parent", true);
  } else if (rel === "legalGuardian") {
    safeSetCheck(
      form,
      "person_in_item_2_relationship_to_children_legal_guardian",
      true,
    );
  } else if (rel === "other") {
    safeSetCheck(form, "person_in_item_2_relationship_to_children_other", true);
    safeSetText(
      form,
      "person_in_item_2_relationship_to_children_other_description",
      otherDescription.trim(),
    );
  }
}

function fillDv105Page1ChildrenAndResidence(
  form: PDFForm,
  children: ReturnType<typeof useFormStore.getState>["children"],
): void {
  applyPetitionerChildRelationship(
    form,
    children.petitionerRelationship,
    children.petitionerRelationshipDescription,
  );
  applyRespondentChildRelationship(
    form,
    children.respondentRelationship,
    children.respondentRelationshipDescription,
  );

  const list = children.children.slice(0, 4);
  const rows: { nameField: string; dobField?: string }[] = [
    { nameField: "child_a_name", dobField: "child_a_date_of_birth" },
    { nameField: "child_b_name", dobField: "child_b_date_of_birth" },
    { nameField: "child_c_name", dobField: "child_c_date_of_birth" },
    { nameField: "child_d_name" },
  ];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const child = list[i];
    const name = child?.fullName?.trim() ?? "";
    const dob = child?.dateOfBirth?.trim() ?? "";
    safeSetText(form, row.nameField, name);
    if (row.dobField) safeSetText(form, row.dobField, dob);
  }

  if (children.children.length > 4) {
    safeSetCheck(form, "children_need_more_space_attachment", true);
  }

  const lived = children.allChildrenLivedTogether;
  if (lived === "yes") {
    safeSetText(form, "all_children_lived_together_five_years_yes", "Yes");
    safeSetCheck(form, "all_children_lived_together_five_years_no", false);
  } else if (lived === "no") {
    safeSetText(form, "all_children_lived_together_five_years_yes", "");
    safeSetCheck(form, "all_children_lived_together_five_years_no", true);
  }

  const hist = children.residenceHistory.slice(0, 6);
  for (let idx = 0; idx < hist.length; idx++) {
    const row = hist[idx]!;
    const n = idx + 1;
    const prefix = `residence_history_row_${n}`;
    safeSetText(form, `${prefix}_city_state`, row.cityState.trim());
    safeSetText(form, `${prefix}_date_from`, row.dateFrom.trim());
    if (n > 1) {
      safeSetText(form, `${prefix}_date_until`, row.dateUntil.trim());
    }
    if (row.livedWithMe) {
      safeSetText(form, `${prefix}_lived_with_me`, MARK);
    }
    if (row.livedWithPersonInItem2) {
      safeSetText(form, `${prefix}_lived_with_person_in_item_2`, MARK);
    }
    if (n === 1) {
      safeSetCheck(form, `${prefix}_lived_with_other`, row.livedWithOther);
      if (row.addressConfidential) {
        safeSetText(form, `${prefix}_address_confidential`, MARK);
      }
    } else if (row.livedWithOther) {
      safeSetText(form, `${prefix}_lived_with_other`, MARK);
    }
    if (n <= 5) {
      safeSetText(
        form,
        `${prefix}_other_caregiver_relationship`,
        row.otherCaregiverRelationship.trim(),
      );
    }
  }
}

function fillDv105Page4CustodyVisitation(
  form: PDFForm,
  custody: ReturnType<typeof useFormStore.getState>["custodyOrders"],
): void {
  safeSetCheck(form, "q9_yes_yes", true);

  const legal = custody.legalCustody;
  if (legal === "soleToMe") {
    safeSetCheck(form, "q9_sole_me", true);
  } else if (legal === "soleToThem") {
    safeSetCheck(form, "q9_sole_person", true);
  } else if (legal === "joint") {
    safeSetCheck(form, "q9_jointly_shared", true);
    if (custody.legalCustodyOther.trim()) {
      safeSetText(form, "q9_jointly", custody.legalCustodyOther.trim());
    }
  } else if (legal === "other") {
    safeSetCheck(form, "undefined_24", true);
    safeSetText(form, "q9_jointly", custody.legalCustodyOther.trim());
  }

  const phys = custody.physicalCustody;
  if (phys === "soleToMe") {
    safeSetCheck(form, "q9_sole_me_2", true);
  } else if (phys === "soleToThem") {
    safeSetCheck(form, "q9_sole_person_2", true);
  } else if (phys === "joint") {
    safeSetCheck(form, "q2_jointly_shared", true);
    if (custody.physicalCustodyOther.trim()) {
      safeSetText(form, "q2_jointly", custody.physicalCustodyOther.trim());
    }
  } else if (phys === "other") {
    safeSetCheck(form, "undefined_25", true);
    safeSetText(form, "q2_jointly", custody.physicalCustodyOther.trim());
  }

  const vt = custody.visitationType;
  const sup = custody.wantsSupervised;
  if (vt === "none") {
    safeSetCheck(form, "q10_no_i_ask_judge", true);
  } else if (vt === "virtualOnly") {
    safeSetCheck(form, "q10_yes_but_only_virtual", true);
  } else if (vt === "yes" && sup === "yes") {
    safeSetCheck(form, "q10_yes_go_1_1", true);
    safeSetCheck(form, "q11_yes_go_1_2", true);
  } else if (vt === "yes" && sup === "no") {
    safeSetCheck(form, "q10_yes_go_1_1", true);
    safeSetCheck(form, "q11_no_go_1_3", true);
  }
}

function fillDv108AbductionRequest(
  form: PDFForm,
  petitionerName: string,
  respondentName: string,
): void {
  safeSetText(form, "q1_your_name", petitionerName);
  safeSetText(form, "q1_person_you_want_protection", respondentName);
}

function fillDv140CustodyOrderOverlap(
  form: PDFForm,
  args: {
    petitionerName: string;
    respondentName: string;
    petitionerRel: "" | "parent" | "legalGuardian" | "other";
    children: ReturnType<typeof useFormStore.getState>["children"]["children"];
  },
): void {
  const { petitionerName, respondentName, petitionerRel, children } = args;
  safeSetCheck(form, "dv_110", true);
  safeSetText(form, "q1_name_protected_person", petitionerName);
  safeSetText(form, "q1_2_name_restrained_person", respondentName);
  if (petitionerRel === "parent") {
    safeSetCheck(form, "q1_parent", true);
    safeSetCheck(form, "q2_parent", true);
  }
  const c = children.slice(0, 4);
  const nameFields = ["q3_name", "q3_b_name", "q3_c_name", "q3_d_name"] as const;
  const dobFields = [
    "q3_date_birth",
    "q18_date_birth",
    "q18_date_birth_2",
    "q18_date_birth_3",
  ] as const;
  for (let i = 0; i < 4; i++) {
    const ch = c[i];
    safeSetText(form, nameFields[i]!, ch?.fullName?.trim() ?? "");
    safeSetText(form, dobFields[i]!, ch?.dateOfBirth?.trim() ?? "");
  }
}

function fillDv145AbductionOrderOverlap(
  form: PDFForm,
  args: {
    petitionerName: string;
    respondentName: string;
    petitionerRel: "" | "parent" | "legalGuardian" | "other";
  },
): void {
  safeSetText(form, "q1_name_protected_person_2", args.petitionerName);
  safeSetText(form, "q1_2_name_restrained_person_2", args.respondentName);
  if (args.petitionerRel === "parent") {
    safeSetCheck(form, "q1_parent_2", true);
    safeSetCheck(form, "q2_parent_2", true);
  }
}

/**
 * Fills Tier 2 custody packet (`public/tier2.pdf` — DV-105, DV-108, DV-140, DV-145).
 * Maps wizard-backed fields on DV-105 p1 & p4, DV-108 p1, DV-140 p1, DV-145 p1 only.
 */
export async function generateTier2PDF(): Promise<Uint8Array | null> {
  try {
    const { petitioner, respondent, children, custodyOrders } =
      useFormStore.getState();

    const petitionerName = personDisplayName(petitioner);
    const respondentName = personDisplayName(respondent.person);

    let res: Response;
    try {
      res = await fetch(TIER2_PDF_URL);
    } catch {
      return null;
    }
    if (!res.ok) return null;

    const doc = await PDFDocument.load(await res.arrayBuffer(), {
      ignoreEncryption: true,
    });
    const form = doc.getForm();

    try {
      const page0 = doc.getPages()[0];
      if (page0) {
        const font = await doc.embedFont(StandardFonts.Helvetica);
        if (petitionerName) {
          page0.drawText(petitionerName, {
            x: DV105_PAGE1_PETITIONER_NAME_X,
            y: DV105_PAGE1_PETITIONER_NAME_Y,
            size: DV105_PAGE1_NAME_FONT_SIZE,
            font,
          });
        }
        if (respondentName) {
          page0.drawText(respondentName, {
            x: DV105_PAGE1_RESPONDENT_NAME_X,
            y: DV105_PAGE1_RESPONDENT_NAME_Y,
            size: DV105_PAGE1_NAME_FONT_SIZE,
            font,
          });
        }
      }
    } catch {
      /* drawText / font embed must not abort generation */
    }

    try {
      fillDv105Page1ChildrenAndResidence(form, children);
    } catch {
      /* page 1 AcroForm */
    }

    try {
      fillDv105Page4CustodyVisitation(form, custodyOrders);
    } catch {
      /* DV-105 custody / visitation */
    }

    try {
      fillDv108AbductionRequest(form, petitionerName, respondentName);
    } catch {
      /* DV-108 */
    }

    try {
      fillDv140CustodyOrderOverlap(form, {
        petitionerName,
        respondentName,
        petitionerRel: children.petitionerRelationship,
        children: children.children,
      });
    } catch {
      /* DV-140 */
    }

    try {
      fillDv145AbductionOrderOverlap(form, {
        petitionerName,
        respondentName,
        petitionerRel: children.petitionerRelationship,
      });
    } catch {
      /* DV-145 */
    }

    try {
      form.updateFieldAppearances();
    } catch {
      /* appearance update is best-effort */
    }

    return await doc.save();
  } catch {
    return null;
  }
}
