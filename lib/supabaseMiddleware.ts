import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export function createMiddlewareSupabaseClient({
  req,
  res,
}: {
  req: NextRequest;
  res: NextResponse;
}) {
  return createMiddlewareClient({ req, res });
}
