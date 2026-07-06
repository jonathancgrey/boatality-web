import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public spots-remaining counter for boatality.com/founding.
// Reads the founding_spots view (anon-readable, no creator details).
const ALLOWED_ORIGINS = [
  "https://boatality.com",
  "https://www.boatality.com",
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from("founding_spots")
    .select("spots_remaining, founding_signed")
    .single();

  if (error || !data) {
    // Fail soft — the landing page falls back to the static "25"
    return NextResponse.json(
      { ok: false, spots_remaining: 25, founding_signed: 0 },
      { headers: { ...corsHeaders(req), "Cache-Control": "public, max-age=300" } }
    );
  }

  return NextResponse.json(
    { ok: true, ...data },
    { headers: { ...corsHeaders(req), "Cache-Control": "public, max-age=300" } }
  );
}
