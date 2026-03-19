"use client";

/**
 * /auth/reset — Password-reset landing page
 *
 * Supabase's recovery links redirect here after the OTP is verified.
 * Depending on the project's auth flow settings, tokens may arrive either:
 *   a) as a PKCE code  →  ?code=XXXX  (query param, exchangeable server-side)
 *   b) as hash tokens  →  #access_token=...&type=recovery  (client-side only)
 *
 * This client component handles both cases, then hands off to /set-password
 * once a valid session is established.
 */

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function AuthReset() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout>;

    async function handle() {
      // ── Case A: PKCE code in query param ──────────────────────────────────
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace("/set-password");
          return;
        }
        // If exchange failed fall through and try hash-token path
      }

      // ── Case B: Hash-fragment tokens (implicit flow) ───────────────────────
      // The Supabase client automatically detects and processes hash tokens on
      // initialisation, firing a PASSWORD_RECOVERY (or SIGNED_IN) event.
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") &&
          session
        ) {
          clearTimeout(fallbackTimer);
          router.replace("/set-password");
        }
      });
      unsubscribe = data.subscription.unsubscribe;

      // ── Already has session (e.g. user navigates back) ────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        clearTimeout(fallbackTimer);
        router.replace("/set-password");
        return;
      }

      // ── Fallback: nothing fired after 6 seconds → back to login ───────────
      fallbackTimer = setTimeout(() => {
        router.replace("/login");
      }, 6000);
    }

    handle();

    return () => {
      unsubscribe?.();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#020b16]">
      <div className="w-6 h-6 border-2 border-white/20 border-t-[#C84121] rounded-full animate-spin" />
      <p className="text-xs text-white/30">Verifying your reset link…</p>
    </div>
  );
}
