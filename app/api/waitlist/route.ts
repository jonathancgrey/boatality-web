import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(v: string) {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeString(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function normalizeRole(roleRaw: string | null) {
  const r = (roleRaw ?? "viewer").trim().toLowerCase();
  if (r === "creator" || r === "viewer" || r === "both" || r === "brand") return r;
  return "viewer";
}

// The static landing page at boatality.com posts here cross-origin.
const ALLOWED_ORIGINS = [
  "https://boatality.com",
  "https://www.boatality.com",
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
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
  const cors = corsHeaders(req);
  try {
    // Support both JSON fetch() and <form> FormData submissions
    const contentType = req.headers.get("content-type") || "";
    const isFormPost =
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded");

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

    // Referral attribution: creator referral code from ?ref= links
    const referred_by_code = safeString(body?.ref) ?? safeString(body?.referredBy);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400, headers: cors });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Server misconfigured" },
        { status: 500, headers: cors }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studio.boatality.com";

    // Resubmitting an existing email must not reset its status (e.g. back to
    // "pending" after an invite) or re-trigger emails.
    const { data: existing } = await supabase
      .from("beta_signups")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      if (isFormPost) {
        return NextResponse.redirect(`${siteUrl}/waitlist/thanks`, 303);
      }
      return NextResponse.json({ ok: true, already: true }, { headers: cors });
    }

    const { error } = await supabase.from("beta_signups").insert({
      email,
      name,
      role,
      platform,
      device_type,
      creator_links,
      source,
      referred_by_code,
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: cors });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send branded confirmation email to the signup
    try {
      const templatePath = path.join(
        process.cwd(),
        "supabase/email-templates/waitlist-sequence/01-confirmation.html"
      );
      const emailHtml = fs.readFileSync(templatePath, "utf-8");

      await resend.emails.send({
        from: "Jonathan at Boatality <jonathan@boatality.com>",
        to: email,
        subject: "You're in. Welcome aboard. — Boatality",
        html: emailHtml,
      });
    } catch {
      // Don't fail the signup if the email errors — the row is already saved
    }

    // Ping Jonathan so he can review and approve quickly
    try {
      const roleLabel = role === "creator" ? "🎬 Creator" : role === "both" ? "🎬👀 Creator + Viewer" : "👀 Viewer";
      const creatorLinksHtml = creator_links?.length
        ? `<p style="margin:8px 0 0;"><strong>Links:</strong> ${creator_links.map((l: any) => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.url)}</a>`).join(", ")}</p>`
        : "";

      await resend.emails.send({
        from: "Boatality Signups <jonathan@boatality.com>",
        to: "jonathan.c.greviskis@gmail.com",
        subject: `New waitlist signup — ${name ?? email}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;padding:24px;background:#0f3a50;color:#fff;border-radius:12px;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.4);">New signup</p>
            <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;">${escapeHtml(name ?? "(no name)")}</h2>
            <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,.75);"><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,.75);"><strong>Role:</strong> ${roleLabel}</p>
            ${source ? `<p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,.75);"><strong>Source:</strong> ${escapeHtml(source)}</p>` : ""}
            ${creatorLinksHtml}
            <div style="margin-top:24px;">
              <a href="https://studio.boatality.com/admin" style="display:inline-block;background:#C84021;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;">
                Review in admin →
              </a>
            </div>
          </div>
        `,
      });
    } catch {
      // Notification failure is silent — never block the signup
    }

    if (isFormPost) {
      return NextResponse.redirect(`${siteUrl}/waitlist/thanks`, 303);
    }
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500, headers: cors }
    );
  }
}
