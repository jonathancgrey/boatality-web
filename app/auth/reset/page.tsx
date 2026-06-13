"use client";

/**
 * /auth/reset — Password-reset landing page
 *
 * Supabase's generateLink({type:"recovery"}) redirects here with hash-fragment
 * tokens: #access_token=...&refresh_token=...&type=recovery
 *
 * createBrowserClient from @supabase/ssr runs in PKCE mode and ignores hash
 * tokens entirely, so we must parse them manually and call setSession().
 *
 * Also handles the PKCE ?code= path as a fallback, just in case.
 */

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function Spinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="w-6 h-6 border-2 border-white/20 border-t-brand-orange rounded-full animate-spin" />
      <p className="text-xs text-white/30">Verifying your reset link…</p>
    </div>
  );
}

function ResetHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout>;

    async function handle() {
      // ── Path A: Hash-fragment tokens from generateLink() recovery redirect ──
      // e.g. /auth/reset#access_token=xxx&refresh_token=xxx&type=recovery
      const hash = window.location.hash.slice(1); // strip leading #
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            // Clear the hash so tokens aren't sitting in the URL
            window.history.replaceState(null, "", window.location.pathname);
            router.replace("/set-password");
            return;
          }
        }
      }

      // ── Path B: PKCE code in query param (fallback) ────────────────────────
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace("/set-password");
          return;
        }
      }

      // ── Path C: Session already exists (user navigated back) ───────────────
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/set-password");
        return;
      }

      // ── Fallback: nothing worked → back to login ───────────────────────────
      fallbackTimer = setTimeout(() => {
        router.replace("/login");
      }, 5000);
    }

    handle();

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  return <Spinner />;
}

// Suspense boundary required by Next.js 14 for useSearchParams()
export default function AuthReset() {
  return (
    <Suspense fallback={<Spinner />}>
      <ResetHandler />
    </Suspense>
  );
}
