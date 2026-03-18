import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", maxAge: 0, ...options });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("exchangeCodeForSession error", error);
      return NextResponse.redirect(new URL("/login", url.origin));
    }
  }

  // If a ?next= param was passed (e.g. from a password reset link), honour it
  const next = url.searchParams.get("next");
  if (next && next.startsWith("/")) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { data: creator } = await supabase
    .from("creators_v2")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  // New users (no creator row yet) need to set a password before onboarding
  const destination = creator ? "/dashboard/content" : "/set-password";

  return NextResponse.redirect(new URL(destination, url.origin));
}
