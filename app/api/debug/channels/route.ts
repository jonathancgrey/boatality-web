import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = createServerClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) return NextResponse.json({ ok: false, error: authErr.message }, { status: 500 });
  if (!auth.user) return NextResponse.json({ ok: false, error: "No user session" }, { status: 401 });

  const { data, error } = await supabase
    .from("channels_v2")
    .select("id,creator_id,type,name,created_at")
    .eq("creator_id", auth.user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    ok: !error,
    auth_uid: auth.user.id,
    error: error?.message ?? null,
    count: data?.length ?? 0,
    rows: data ?? [],
  });
}
