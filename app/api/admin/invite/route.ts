import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const ADMIN_EMAILS = ["jonathan.c.greviskis@gmail.com"];

async function getCallerEmail(): Promise<string | null> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email ?? null;
}

export async function POST(req: Request) {
  // 1. Auth guard — only admin emails
  const callerEmail = await getCallerEmail();
  if (!callerEmail || !ADMIN_EMAILS.includes(callerEmail)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  // 2. Parse body
  const { email, signupId } = await req.json().catch(() => ({}));
  if (!email || !signupId) {
    return NextResponse.json({ ok: false, error: "Missing email or signupId" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // 3. Service-role client
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 4. Generate invite link via admin — does NOT send an email, just returns the link.
  //    For new users this creates the auth account. For existing users it falls back
  //    to a magic link. Either way we send the branded email ourselves via Resend so
  //    it comes from boatality.com and never hits spam.
  let linkType: "invite" | "magiclink" = "invite";
  let { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  // If the user already exists, generateLink("invite") returns an error — fall back
  // to a magic link so they can still sign in.
  const alreadyExists =
    linkErr &&
    (linkErr.message.toLowerCase().includes("already") ||
      (linkErr as any).status === 422);

  if (linkErr && !alreadyExists) {
    return NextResponse.json({ ok: false, error: linkErr.message }, { status: 500 });
  }

  if (alreadyExists) {
    linkType = "magiclink";
    const fallback = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    linkData = fallback.data;
    linkErr  = fallback.error;
  }

  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { ok: false, error: `Could not generate link: ${linkErr?.message ?? "no link returned"}` },
      { status: 500 }
    );
  }

  // Send the branded invite email via Resend from boatality.com
  const templatePath = path.join(process.cwd(), "supabase/email-templates/invite-user.html");
  const rawHtml = fs.readFileSync(templatePath, "utf-8");
  const emailHtml = rawHtml.replaceAll("{{ .ConfirmationURL }}", linkData.properties.action_link);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailErr } = await resend.emails.send({
    from: "Jonathan at Boatality <jonathan@boatality.com>",
    to: email,
    subject: "You're in — Boatality Studio",
    html: emailHtml,
  });

  if (emailErr) {
    return NextResponse.json(
      { ok: false, error: `Link generated but email failed: ${emailErr.message}` },
      { status: 500 }
    );
  }

  // 5. Mark as invited in beta_signups
  const { error: updateErr } = await adminClient
    .from("beta_signups")
    .update({ status: "invited", invited_at: new Date().toISOString() })
    .eq("id", signupId);

  if (updateErr) {
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    note: linkType === "magiclink" ? "User already had an account — sent magic link instead" : "Invite sent",
  });
}
