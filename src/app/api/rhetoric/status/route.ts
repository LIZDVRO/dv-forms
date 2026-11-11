/** Where the filing session is, without changing it (is she logged in yet?). */
import { NextRequest, NextResponse } from "next/server";

import { sessionStep } from "@/efile/rhetoric";
import { describeError } from "@/efile/rhetoric";

/** Rhetoric slows as a filing grows; one step has taken over a minute. */
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const { sessionToken } = (await request.json().catch(() => ({}))) as { sessionToken?: string };
  if (!sessionToken) return NextResponse.json({ error: "Missing session" }, { status: 400 });
  try {
    return NextResponse.json(await sessionStep(sessionToken));
  } catch (err) {
    return NextResponse.json({ error: describeError(err, "status") }, { status: 502 });
  }
}
