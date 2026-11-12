/**
 * Adds one form as a confidential filing entry. One form per request
 * keeps each request small (Vercel caps a request at about 4.5 MB). The PDF passes
 * straight through to Rhetoric; only the form name, size and timing are logged.
 */
import { NextRequest, NextResponse } from "next/server";

import { addForm } from "@/efile/rhetoric";
import { describeError } from "@/efile/rhetoric";

/** Rhetoric slows as a filing grows; one step has taken over a minute. */
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    sessionToken?: string;
    form?: string;
    fileName?: string;
    contentBase64?: string;
    copy?: number;
    answers?: Record<string, string>;
    minorChildren?: boolean;
  };
  if (!body.sessionToken || !body.form || !body.fileName || !body.contentBase64) {
    return NextResponse.json({ error: "Missing session or form" }, { status: 400 });
  }
  try {
    const out = await addForm(
      body.sessionToken,
      { form: body.form, fileName: body.fileName, contentBase64: body.contentBase64 },
      body.copy ?? 1,
      body.answers,
      typeof body.minorChildren === "boolean" ? body.minorChildren : undefined,
    );
    const what = out.ok ? (out.added ? "added" : "already there") : "needs" in out ? `waiting on her: ${out.needs.field ?? out.needs.screen}` : `stopped: ${out.problem}`;
    console.log(`[efile] ${body.form}${(body.copy ?? 1) > 1 ? ` (copy ${body.copy})` : ""}: ${what}`);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: describeError(err, "add-form") }, { status: 502 });
  }
}
