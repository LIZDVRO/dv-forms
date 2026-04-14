import { z } from "zod";

/** One row in DV-100 Section 28 wireless grid (Page 12). */
export const dv100WirelessAccountRowSchema = z.object({
  isMyNumber: z.boolean(),
  isChildNumber: z.boolean(),
  phoneNumber: z.string().max(15),
});

/** Exactly four Section 28 wireless rows (matches the PDF grid a–d). */
export const dv100WirelessAccountsSchema = z.tuple([
  dv100WirelessAccountRowSchema,
  dv100WirelessAccountRowSchema,
  dv100WirelessAccountRowSchema,
  dv100WirelessAccountRowSchema,
]);

/** Page 12 (Sections 27–28) fields for optional runtime validation. */
export const dv100Page12Schema = z.object({
  requestBattererIntervention: z.boolean(),
  requestWirelessTransfer: z.boolean(),
  wirelessAccounts: dv100WirelessAccountsSchema,
});

export type Dv100Page12Values = z.infer<typeof dv100Page12Schema>;
