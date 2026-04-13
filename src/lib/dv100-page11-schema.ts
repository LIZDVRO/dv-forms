import { z } from "zod";

/** One row in DV-100 Section 23 (Page 11) expense grid. */
export const dv100RestitutionExpenseRowSchema = z.object({
  payTo: z.string(),
  forReason: z.string(),
  amount: z.string(),
});

/** Exactly four Section 23 expense rows (matches the PDF grid). */
export const dv100RestitutionExpensesSchema = z.tuple([
  dv100RestitutionExpenseRowSchema,
  dv100RestitutionExpenseRowSchema,
  dv100RestitutionExpenseRowSchema,
  dv100RestitutionExpenseRowSchema,
]);

/** Page 11 (Sections 23–26) fields for optional runtime validation. */
export const dv100Page11Schema = z.object({
  requestRestitution: z.boolean(),
  requestAbuserPayLizFee: z.boolean(),
  restitutionExpenses: dv100RestitutionExpensesSchema,
  requestChildSupport: z.boolean(),
  childSupportNoOrderWantOne: z.boolean(),
  childSupportHaveOrderWantChanged: z.boolean(),
  childSupportTANF: z.boolean(),
  requestSpousalSupport: z.boolean(),
  requestLawyerFees: z.boolean(),
});

export type Dv100Page11Values = z.infer<typeof dv100Page11Schema>;
