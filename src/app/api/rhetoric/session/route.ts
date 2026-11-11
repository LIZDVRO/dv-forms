/**
 * Starts a Rhetoric filing session and fills it up to the eFileCA login.
 * RHETORIC_API_KEY (a Vercel environment variable) stays here on the server; the
 * browser only gets the one-time session token, which Rhetoric designs to be
 * handed to the page. A live key files with real courts.
 */
import { NextRequest, NextResponse } from "next/server";
import { RhetoricClient } from "@rhetoriclabs/rhetoric";

import { EFILE_COURTS, isEfileCourt } from "@/efile/courts";
import { prefillToLogin, type PrefillInput } from "@/efile/rhetoric";
import { describeError } from "@/efile/rhetoric";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const key = process.env.RHETORIC_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "E-filing isn't available right now." }, { status: 503 });

  let p: PrefillInput;
  try {
    p = (await request.json()) as PrefillInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isEfileCourt(p.county, p.courtCode)) {
    return NextResponse.json({ error: `E-filing isn't set up for that courthouse in ${p.county || "this"} County.` }, { status: 400 });
  }
  const court = EFILE_COURTS[p.county].courts.find((c) => c.code === p.courtCode)!;

  try {
    const client = new RhetoricClient({ url: process.env.RHETORIC_API_URL || "https://api.rhetoric.law", token: key });
    const { filer } = await client.createFiler({});
    const { sessionToken } = await client.createFilingSession({ filerId: filer.id });
    const { step } = await prefillToLogin(sessionToken, p);
    return NextResponse.json({ sessionToken, step, court: `${p.county} — ${court.label}` });
  } catch (err) {
    return NextResponse.json({ error: describeError(err, "session") }, { status: 502 });
  }
}
