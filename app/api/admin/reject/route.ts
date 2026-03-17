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
  const callerEmail = await getCallerEmail();
  if (!callerEmail || !ADMIN_EMAILS.includes(callerEmail)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  const { signupId } = await req.json().catch(() => ({}));
  if (!signupId) {
    return NextResponse.json({ ok: false, error: "Missing signupId" }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await adminClient
    .from("beta_signups")
    .update({ status: "rejected", rejected_at: new Date().toISOString() })
    .eq("id", signupId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
