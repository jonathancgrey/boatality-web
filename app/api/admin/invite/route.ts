import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

  // 3. Service-role client (admin operations only, never sent to browser)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 4. Send Supabase invite — creates their auth account + sends invite email
  const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`,
  });

  if (inviteErr) {
    // "User already registered" is fine — they may have been re-invited
    if (!inviteErr.message.toLowerCase().includes("already")) {
      return NextResponse.json({ ok: false, error: inviteErr.message }, { status: 500 });
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

  return NextResponse.json({ ok: true });
}
