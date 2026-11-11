/**
 * Adds one form as a confidential filing entry. One form per request
 * keeps each request small (Vercel caps a request at about 4.5 MB). The PDF passes
 * straight through to Rhetoric; only the form name, size and timing are logged.
 */
import { NextRequest, NextResponse } from "next/server";

import { addForm } from "@/efile/rhetoric";

/** Rhetoric slows as a filing grows; one step has taken over a minute. */
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    sessionToken?: string;
    form?: string;
    fileName?: string;
    contentBase64?: string;
    copy?: number;
  };
  if (!body.sessionToken || !body.form || !body.fileName || !body.contentBase64) {
    return NextResponse.json({ error: "Missing session or form" }, { status: 400 });
  }
  try {
    const out = await addForm(
      body.sessionToken,
      { form: body.form, fileName: body.fileName, contentBase64: body.contentBase64 },
      body.copy ?? 1,
    );
    console.log(
      `[efile] ${body.form}${(body.copy ?? 1) > 1 ? ` (copy ${body.copy})` : ""}: ${out.added ? "added" : "already there"}, ` +
        `${Math.round(out.bytes / 1024)} KB, upload ${(out.ms.upload / 1000).toFixed(1)} s, ` +
        `processing ${(out.ms.processing / 1000).toFixed(1)} s, total ${(out.ms.total / 1000).toFixed(1)} s`,
    );
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : `Could not add ${body.form}` }, { status: 502 });
  }
}
