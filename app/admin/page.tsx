import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import AdminPanel, { type Signup } from "./AdminPanel";

const ADMIN_EMAILS = ["jonathan.c.greviskis@gmail.com"];

export default async function AdminPage() {
  // 1. Check the logged-in user via SSR cookie session
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

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    redirect("/login");
  }

  // 2. Fetch all signups using service role key — bypasses RLS
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await adminClient
    .from("beta_signups")
    .select("id,email,name,role,platform,source,creator_links,status,created_at,invited_at,rejected_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] failed to load beta_signups:", error.message);
  }

  return <AdminPanel initial={(data as Signup[]) ?? []} />;
}
