/**
 * While the filing waits on her (a choice the bot couldn't make, or a screen it
 * doesn't know): has she made it yet? True once that field has a value or she
 * has moved past the screen. Returns her choice so the bot can reuse it.
 * Session token only, no API key; changes nothing.
 */
import { NextRequest, NextResponse } from "next/server";

import { checkAnswered, describeError } from "@/efile/rhetoric";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const { sessionToken, screen, field } = (await request.json().catch(() => ({}))) as { sessionToken?: string; screen?: string; field?: string | null };
  if (!sessionToken || !screen) return NextResponse.json({ error: "Missing session or screen" }, { status: 400 });
  try {
    return NextResponse.json(await checkAnswered(sessionToken, screen, field ?? null));
  } catch (err) {
    return NextResponse.json({ error: describeError(err, "check") }, { status: 502 });
  }
}
