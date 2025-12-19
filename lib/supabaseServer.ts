import { cookies } from "next/headers";
import { createServerClient as _createServerClient } from "@supabase/ssr";

// This is the function all pages expect:
export function createServerClient() {
  const cookieStore = cookies();

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // no-op on server
        },
        remove() {
          // no-op on server
        },
      },
    }
  );
}

// Optional: keep backwards compatibility if anything still calls supabaseServer()
export const supabaseServer = createServerClient;
