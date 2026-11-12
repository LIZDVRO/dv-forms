/** After login: filing type, case type and parties. Session token only, no API key. */
import { NextRequest, NextResponse } from "next/server";

import { prepareCase, type CaseInput } from "@/efile/rhetoric";
import { describeError } from "@/efile/rhetoric";

/** Rhetoric slows as a filing grows; one step has taken over a minute. */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { sessionToken?: string; answers?: Record<string, string> } & Partial<CaseInput>;
  if (!body.sessionToken || !body.petitioner || !body.respondent) {
    return NextResponse.json({ error: "Missing session or names" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await prepareCase(body.sessionToken, { minorChildren: !!body.minorChildren, petitioner: body.petitioner, respondent: body.respondent }, body.answers),
    );
  } catch (err) {
    return NextResponse.json({ error: describeError(err, "prepare") }, { status: 502 });
  }
}
