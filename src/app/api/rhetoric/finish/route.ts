/** Leaves the forms list, skips e-service, stops at payment. */
import { NextRequest, NextResponse } from "next/server";

import { finishCase } from "@/efile/rhetoric";
import { describeError } from "@/efile/rhetoric";

/** Rhetoric slows as a filing grows; one step has taken over a minute. */
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { sessionToken } = (await request.json().catch(() => ({}))) as { sessionToken?: string };
  if (!sessionToken) return NextResponse.json({ error: "Missing session" }, { status: 400 });
  try {
    return NextResponse.json(await finishCase(sessionToken));
  } catch (err) {
    return NextResponse.json({ error: describeError(err, "finish") }, { status: 502 });
  }
}
