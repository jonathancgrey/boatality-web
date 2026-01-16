import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const emailRaw = String(body?.email || "").trim();
    const roleRaw = String(body?.role || "viewer").trim().toLowerCase();
    const sourceRaw = String(body?.source || "landing").trim();

    if (!emailRaw || !isValidEmail(emailRaw)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const role = ["creator", "viewer", "advertiser"].includes(roleRaw) ? roleRaw : "viewer";

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Server misconfigured (missing Supabase env vars)" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.from("waitlist").insert({
      email: emailRaw,
      role,
      source: sourceRaw,
      interest_tags: Array.isArray(body?.interest_tags) ? body.interest_tags : null,
    });

    if (error) {
      if ((error as any).code === "23505") {
        return NextResponse.json({ ok: true, already: true }, { status: 200 });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
