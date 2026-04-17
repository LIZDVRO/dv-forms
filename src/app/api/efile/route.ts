import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

type EfileBody = {
  petitionerName?: unknown;
  dv100?: unknown;
  clets001?: unknown;
  dv109?: unknown;
  dv110?: unknown;
};

function isPresentPdfField(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatTodayMmDdYyyy(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export async function POST(request: NextRequest) {
  try {
    let body: EfileBody;
    try {
      body = (await request.json()) as EfileBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { dv100, clets001, dv109, dv110 } = body;
    if (
      !isPresentPdfField(dv100) ||
      !isPresentPdfField(clets001) ||
      !isPresentPdfField(dv109) ||
      !isPresentPdfField(dv110)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing one or more PDF attachments: dv100, clets001, dv109, and dv110 are required.",
        },
        { status: 400 },
      );
    }

    const petitionerName =
      typeof body.petitionerName === "string"
        ? body.petitionerName.trim()
        : "";
    const today = new Date();
    const dateStr = formatTodayMmDdYyyy(today);

    const fromAddress =
      process.env.EFILE_EMAIL_FROM?.trim() || "onboarding@resend.dev";
    const toAddress =
      process.env.EFILE_EMAIL_TO?.trim() || "chris@lizbreakfree.org";

    const from = `LIZ Break Free <${fromAddress}>`;
    const subject = `DVRO Filing Packet - ${petitionerName || "Petitioner"} - ${dateStr}`;

    const formLines = [
      "- DV-100 Request for DVRO (DV-100_Request_for_DVRO.pdf)",
      "- CLETS-001 Confidential Information (CLETS-001_Confidential_Information.pdf)",
      "- DV-109 Notice of Court Hearing (DV-109_Notice_of_Court_Hearing.pdf)",
      "- DV-110 Temporary Restraining Order (DV-110_Temporary_Restraining_Order.pdf)",
    ].join("\n");

    const text = [
      `Petitioner: ${petitionerName || "(not provided)"}`,
      `Date: ${dateStr}`,
      "",
      "Attached forms:",
      formLines,
      "",
      "Filed via LIZ Break Free (lizbreakfree.org) - A 501(c)(3) nonprofit.",
    ].join("\n");

    const attachments = [
      {
        filename: "DV-100_Request_for_DVRO.pdf",
        content: dv100,
      },
      {
        filename: "CLETS-001_Confidential_Information.pdf",
        content: clets001,
      },
      {
        filename: "DV-109_Notice_of_Court_Hearing.pdf",
        content: dv109,
      },
      {
        filename: "DV-110_Temporary_Restraining_Order.pdf",
        content: dv110,
      },
    ];

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from,
      to: toAddress,
      subject,
      text,
      attachments,
    });

    if (error) {
      console.error(error);
      const message =
        typeof error.message === "string" && error.message.length > 0
          ? error.message
          : "Failed to send email";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (!data?.id) {
      console.error("Resend returned success without message id");
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, messageId: data.id });
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error && err.message
        ? err.message
        : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
