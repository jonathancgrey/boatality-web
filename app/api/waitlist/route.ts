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

    try {
      const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const u = new URL(withProto);
      out.push({
        type: (safeString((item as any)?.type) ?? "other").toLowerCase(),
        url: u.toString(),
      });
    } catch {
      continue;
    }
  }

  return out.length ? out : null;
}

export async function POST(req: Request) {
  try {
    // Support both JSON fetch() and <form> FormData submissions
    const contentType = req.headers.get("content-type") || "";

    let body: any = {};
    if (contentType.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const fd = await req.formData().catch(() => null);
      if (fd) {
        const obj: Record<string, any> = {};
        for (const [k, v] of fd.entries()) {
          // Convert File -> name only, keep strings as-is
          obj[k] = typeof v === "string" ? v : (v as File).name;
        }
        body = obj;

        // If creatorLinks comes in as a JSON string, parse it.
        // (e.g. when a form submits a hidden input containing JSON)
        if (typeof body.creatorLinks === "string") {
          try {
            body.creatorLinks = JSON.parse(body.creatorLinks);
          } catch {
            // ignore
          }
        }
      }
    } else {
      // Fallback: try json, then formData
      body = await req.json().catch(async () => {
        const fd = await req.formData().catch(() => null);
        if (!fd) return {};
        const obj: Record<string, any> = {};
        for (const [k, v] of fd.entries()) {
          obj[k] = typeof v === "string" ? v : (v as File).name;
        }
        return obj;
      });
    }

    // Accept a few common field names (back-compat)
    const rawEmail =
      body?.email ?? body?.Email ?? body?.userEmail ?? body?.waitlistEmail ?? "";

    const email = String(rawEmail ?? "").trim().toLowerCase();
    const name =
      safeString(body?.name) ??
      safeString(body?.firstName) ??
      safeString(body?.fullName);

    const role = normalizeRole(String(body?.role ?? body?.signupRole ?? "viewer"));
    const platform = normalizePlatform(safeString(body?.platform) ?? safeString(body?.os));
    const device_type = normalizeDeviceType(
      safeString(body?.deviceType) ?? safeString(body?.device)
    );

    const creator_links = normalizeCreatorLinks(
      body?.creatorLinks ?? body?.channelLinks ?? body?.links
    );

    const source = safeString(body?.source) ?? "web";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

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
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
