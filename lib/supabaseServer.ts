import { cookies } from "next/headers";
import { createServerClient as _createServerClient } from "@supabase/ssr";

// @supabase/ssr 0.5+ uses getAll/setAll. The old get/set/remove interface does
// not read chunked cookies (sb-*-auth-token.0, .1, …) so getUser() returned
// null in server actions, blocking every authenticated upload/insert.
export function createServerClient() {
  const cookieStore = cookies();

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignore. Middleware handles refresh.
          }
        },
      },
    }
  );
}

// Backwards-compat alias
export const supabaseServer = createServerClient;
