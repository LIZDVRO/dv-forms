/**
 * Builds statistics records from the two sample cases, runs them through the
 * endpoint's column rules, and checks that nothing identifying slips through.
 *
 *   npx tsx scripts/check-stats.ts [out.json]
 *
 * Writes the cleaned payloads (the exact shape /api/stats sends to Supabase).
 */
import fs from "node:fs";

import { buildStatsRecord } from "../src/stats/record";
import { clean, cleanRows, INCIDENT, PERSON, SESSION, STEP } from "../src/stats/schema";
import { sampleAnswers, sampleAnswersB } from "../src/wizard/sample";

const out = process.argv[2];
let failed = false;
const payloads: unknown[] = [];

for (const [name, a] of Object.entries({ a: sampleAnswers(), b: sampleAnswersB() })) {
  const now = Date.parse("2026-10-16T18:00:00Z");
  const rec = buildStatsRecord(a, {
    version: "test",
    agreementVersion: "1.0",
    startedAt: now - 42 * 60_000,
    now,
    trigger: "left_page",
    completed: true,
    lastStep: "finish",
    steps: [
      { step: "start", seq: 1, seconds: 30, visits: 1, edits: 0, errors: 1 },
      { step: "court", seq: 2, seconds: 45, visits: 2, edits: 1, errors: 0 },
    ],
    forms: ["DV-100", "CLETS-001", "DV-105(A)", "FL-150", "LIZ-INVOICE"],
    zipDownloaded: true,
    instructionsPrinted: false,
    device: { device_type: "phone", os: "iOS", browser: "Safari", screen_w: 390, screen_h: 844, connection_type: "unknown" },
  });

  const session = clean(SESSION, rec.session);
  const payload = {
    session,
    incidents: cleanRows(INCIDENT, rec.incidents, ["card"], 100),
    people: cleanRows(PERSON, rec.people, ["person"], 50),
    steps: cleanRows(STEP, rec.steps, ["step"], 60),
  };
  payloads.push(payload);

  // Values the builder produced that the rules rejected (null after cleaning).
  const dropped = Object.entries(rec.session).filter(([k, v]) => v !== null && v !== undefined && v !== "" && !(k in session));
  if (dropped.length) {
    console.log(`${name}: values rejected by the column rules:`, dropped);
    failed = true;
  }

  // No names, street addresses, phone numbers, emails, case numbers or plates.
  const json = JSON.stringify(payload).toLowerCase();
  const secrets = [a.P1, a.R1, a.P6.street, a.R14.street, a.P7, a.P8.email, a.R11.plate, a.R9.number, a.R2, ...a.roster.map((p) => p.name), ...a.C2.map((c) => c.caseNumber), ...a.cards.map((c) => c.A6)]
    .map((x) => String(x ?? "").trim().toLowerCase())
    .filter((x) => x.length > 3);
  const leaks = secrets.filter((x) => json.includes(x));
  if (leaks.length) {
    console.log(`${name}: identifying text found in the record:`, leaks);
    failed = true;
  }

  console.log(
    `${name}: ${Object.keys(session).length} session columns, ${payload.incidents.length} incidents, ${payload.people.length} people, ${payload.steps.length} steps`,
  );
}

if (out) fs.writeFileSync(out, JSON.stringify(payloads, null, 2));
process.exit(failed ? 1 : 0);
