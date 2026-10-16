/**
 * Daily Vercel cron (vercel.json) that makes one tiny query so the free
 * Supabase project for statistics isn't paused for inactivity.
 */
import { supabase } from "@/stats/supabase";

export async function GET(req: Request) {
  // Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return new Response(null, { status: 401 });
  try {
    await supabase("sheriff_sends?select=id&limit=1", { method: "GET" });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Keepalive failed:", e instanceof Error ? e.message : "unknown error");
    return Response.json({ ok: false }, { status: 500 });
  }
}
