/**
 * Receives one statistics record from the wizard (or the sheriff page) and
 * saves it to the liz-dvro-stats Supabase project.
 *
 * - Unknown fields are dropped and bad values become null (src/stats/schema.ts).
 * - The visitor's IP address is used only in memory, for the rate limit, and is
 *   never stored or logged. City and region come from Vercel's location headers.
 * - A filled-in honeypot field ("website") is silently discarded.
 */
import { NextRequest } from "next/server";

import { clean, cleanRows, INCIDENT, PERSON, SESSION, SHERIFF, STEP } from "@/stats/schema";
import { statsConfig, supabase } from "@/stats/supabase";

const MAX_BYTES = 64_000;
const LIMIT = 10; // records per IP per hour, per server instance
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((x) => now - x < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    // Drop the oldest entries so memory stays small.
    for (const k of [...hits.keys()].slice(0, 1000)) hits.delete(k);
  }
  return recent.length > LIMIT;
}

function header(req: NextRequest, name: string): string | undefined {
  const v = req.headers.get(name);
  if (!v) return undefined;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

const done = (status = 204) => new Response(null, { status });

export async function POST(req: NextRequest) {
  if (!statsConfig()) {
    console.error("Stats: STATS_SUPABASE_URL or STATS_SUPABASE_SECRET_KEY is not set");
    return done(503);
  }

  const text = await req.text();
  if (text.length > MAX_BYTES) return done(413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return done(400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return done(400);

  // Honeypot: pretend success so bots don't learn anything.
  if (typeof body.website === "string" && body.website !== "") return done();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (limited(ip)) return done(429);

  try {
    if (body.kind === "sheriff") {
      const row = clean(SHERIFF, body.sheriff);
      if (!row.channel) return done(400);
      await supabase("sheriff_sends", { method: "POST", body: row, prefer: "return=minimal" });
      return done();
    }

    if (body.kind !== "session") return done(400);
    const session = clean(SESSION, {
      ...(body.session as object),
      geo_country: header(req, "x-vercel-ip-country"),
      geo_region: header(req, "x-vercel-ip-country-region"),
      geo_city: header(req, "x-vercel-ip-city"),
    });
    if (!session.session_date || !session.send_trigger) return done(400);

    await supabase("rpc/submit_stats", {
      method: "POST",
      body: {
        payload: {
          session,
          incidents: cleanRows(INCIDENT, body.incidents, ["card"], 100),
          people: cleanRows(PERSON, body.people, ["person"], 50),
          steps: cleanRows(STEP, body.steps, ["step"], 60),
        },
      },
    });
    return done();
  } catch (e) {
    console.error("Stats not saved:", e instanceof Error ? e.message : "unknown error");
    return done(500);
  }
}
