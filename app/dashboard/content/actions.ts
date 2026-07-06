"use server";

import { createServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function deleteContent(id: string) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // Scope to the caller's own content (RLS enforces this too — belt and suspenders)
  const { error } = await supabase
    .from("content_v2")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/content");
  return { success: true };
}
