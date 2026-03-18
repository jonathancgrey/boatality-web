import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studio.boatality.com";

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Generate the password reset link via admin — this does NOT send an email,
    // it just returns the link so we can send our own branded version via Resend.
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
      },
    });

    if (error || !data?.properties?.action_link) {
      // Don't reveal whether the email exists — return ok regardless
      console.error("generateLink error:", error?.message);
      return NextResponse.json({ ok: true });
    }

    const resetLink = data.properties.action_link;

    // Read branded template and inject the reset link
    const templatePath = path.join(
      process.cwd(),
      "supabase/email-templates/reset-password.html"
    );
    const rawHtml = fs.readFileSync(templatePath, "utf-8");
    const emailHtml = rawHtml.replaceAll("{{ .ConfirmationURL }}", resetLink);

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Jonathan at Boatality <jonathan@boatality.com>",
      to: email,
      subject: "Reset your Boatality password",
      html: emailHtml,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("reset-password route error:", err);
    // Always return ok — don't leak whether the account exists
    return NextResponse.json({ ok: true });
  }
}
