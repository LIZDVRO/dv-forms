/**
 * Minimal server-side calls to the liz-dvro-stats Supabase project through its
 * REST API. Server only: the secret key must never reach the browser.
 *
 * Environment (Vercel → Settings → Environment Variables):
 *   STATS_SUPABASE_URL         https://<project-ref>.supabase.co
 *   STATS_SUPABASE_SECRET_KEY  the project's secret key (sb_secret_…) or legacy service_role key
 * Import this only from route handlers (src/app/api/…).
 */

export function statsConfig() {
  const url = process.env.STATS_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.STATS_SUPABASE_SECRET_KEY?.trim();
  return url && key ? { url, key } : null;
}

function headers(key: string): Record<string, string> {
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys go in apikey only.
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

export async function supabase(path: string, init: { method: "GET" | "POST"; body?: unknown; prefer?: string }) {
  const cfg = statsConfig();
  if (!cfg) throw new Error("Stats database is not configured");
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method: init.method,
    headers: { ...headers(cfg.key), ...(init.prefer ? { Prefer: init.prefer } : {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (!res.ok) {
    // Status and Postgres error code only: never log the record itself.
    let code = "";
    try {
      code = ((await res.json()) as { code?: string }).code ?? "";
    } catch {
      // No JSON body.
    }
    throw new Error(`Supabase ${res.status} ${code}`.trim());
  }
  return res;
}
