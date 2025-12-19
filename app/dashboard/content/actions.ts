"use server";

import { createServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function deleteContent(id: string) {
  const supabase = createServerClient();

  // delete row
  const { error } = await supabase
    .from("content_v2")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/content");
  return { success: true };
}
