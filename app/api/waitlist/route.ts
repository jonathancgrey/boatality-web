import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeString(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function normalizeRole(roleRaw: string | null) {
  const r = (roleRaw ?? "viewer").trim().toLowerCase();
  if (r === "creator" || r === "viewer" || r === "both") return r;
  // Back-compat: advertiser/brand -> brand
  if (r === "advertiser" || r === "brand" || r === "partner") return "brand";
  return "viewer";
}

function normalizePlatform(pRaw: string | null) {
  const p = (pRaw ?? "").trim().toLowerCase();
  if (p === "ios" || p === "android") return p;
  return null;
}

function normalizeDeviceType(dRaw: string | null) {
  const d = (dRaw ?? "").trim().toLowerCase();
  if (d === "phone" || d === "tablet") return d;
  return null;
}

type CreatorLink = { type?: string; url?: string };

function normalizeCreatorLinks(input: unknown): { type: string; url: string }[] | null {
  if (!Array.isArray(input)) return null;

  const out: { type: string; url: string }[] = [];
  for (const item of input as CreatorLink[]) {
    const url = safeString((item as any)?.url);
    if (!url) continue;

    // Basic URL sanity — allow bare domains but prefer http(s)
    let normalizedUrl = url;
    try {
      // If they pasted without protocol, add https:// for validation
      const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const u = new URL(withProto);
      normalizedUrl = u.toString();
    } catch {
      // skip obviously invalid URLs
      continue;
    }

    const type = (safeString((item as any)?.type) ?? "other").toLowerCase();
    out.push({ type, url: normalizedUrl });
  }

  return out.length ? out : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = String(body?.email ?? "").trim().toLowerCase();
    const name = safeString(body?.name) ?? safeString(body?.firstName) ?? safeString(body?.fullName);
    const role = normalizeRole(String(body?.role ?? body?.signupRole ?? "viewer"));

    // Viewer beta fields
    const platform = normalizePlatform(safeString(body?.platform) ?? safeString(body?.os));
    const device_type = normalizeDeviceType(safeString(body?.deviceType) ?? safeString(body?.device));

    // Creator beta fields
    const creator_links = normalizeCreatorLinks(body?.creatorLinks ?? body?.channelLinks ?? body?.links);

    const source = safeString(body?.source) ?? "marketing";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

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

    // Unified beta signups table
    // Expected columns (recommended):
    // email (unique), name, role, platform, device_type, creator_links (jsonb), source,
    // status (default 'pending'), approved_viewer (bool), approved_creator (bool), approved_at
    const { error } = await supabase
      .from("beta_signups")
      .upsert(
        {
          email,
          name,
          role,
          platform,
          device_type,
          creator_links,
          source,
          status: "pending",
        },
        { onConflict: "email" }
      );

    if (error) {
      // If the table isn't created yet, this error will be very explicit.
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
