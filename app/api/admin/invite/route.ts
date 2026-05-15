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

  // 4. Try invite first (works for new users — sends branded email via Resend SMTP)
  const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
  });

  const alreadyExists =
    inviteErr &&
    (inviteErr.message.toLowerCase().includes("already") ||
      (inviteErr as any).status === 422);

  if (inviteErr && !alreadyExists) {
    // A real error — surface it
    return NextResponse.json({ ok: false, error: inviteErr.message }, { status: 500 });
  }

  if (alreadyExists) {
    // User already has an account — generate a magic link and send it via Resend directly
    // (generateLink does NOT auto-send email; we must send it ourselves)
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      return NextResponse.json(
        { ok: false, error: `User already exists and magic link failed: ${linkErr?.message ?? "no link returned"}` },
        { status: 500 }
      );
    }

    // Load the branded email template and substitute the magic link
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
        { ok: false, error: `Magic link generated but email failed to send: ${emailErr.message}` },
        { status: 500 }
      );
    }
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
    note: alreadyExists ? "User already had an account — sent magic link instead" : "Invite sent",
  });
}
