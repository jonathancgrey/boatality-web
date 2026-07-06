"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Anchor, Eye, EyeOff, KeyRound } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSetupHint, setShowSetupHint] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("Incorrect email or password.");
        setShowSetupHint(true); // surface the setup prompt on bad credentials
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    // Redirect to dashboard on success
    router.push("/dashboard/content");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center">
            <Anchor className="h-6 w-6 text-brand-orange" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Boatality Studio</h1>
            <p className="text-sm text-white/40 mt-0.5">Welcome back, founding creator.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/30 focus:bg-white/8 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Password
              </label>
              <a
                href="/forgot-password"
                className="text-xs text-white/35 hover:text-white/60 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/30 focus:bg-white/8 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* First-time / no-password callout — always visible, elevated on failed login */}
        <div className={`mt-5 rounded-xl border px-4 py-3.5 transition-all ${
          showSetupHint
            ? "bg-brand-orange/10 border-brand-orange/30"
            : "bg-white/[0.03] border-white/10"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex-shrink-0 rounded-lg p-1.5 ${
              showSetupHint ? "bg-brand-orange/20" : "bg-white/5"
            }`}>
              <KeyRound className={`h-3.5 w-3.5 ${showSetupHint ? "text-brand-orange" : "text-white/40"}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${showSetupHint ? "text-white/90" : "text-white/55"}`}>
                {showSetupHint ? "Haven't set a password yet?" : "Just got approved?"}
              </p>
              <p className={`text-xs mt-0.5 leading-relaxed ${showSetupHint ? "text-white/60" : "text-white/35"}`}>
                {showSetupHint
                  ? "If you signed in via the approval email, you don't have a password yet."
                  : "If you received an approval email, you'll need to set a password before signing in here."}
              </p>
              <a
                href="/forgot-password"
                className={`inline-block mt-2 text-xs font-semibold underline underline-offset-2 transition-colors ${
                  showSetupHint
                    ? "text-brand-orange-soft hover:text-brand-orange"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                Set up your password →
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/25 mt-5">
          Don&apos;t have an account?{" "}
          <a
            href="https://form.boatality.com/?role=creator&source=creator-login"
            className="text-white/40 hover:text-white/60 underline underline-offset-2 transition-colors"
          >
            Apply for beta access
          </a>
        </p>

        <p className="text-center text-xs text-white/25 mt-2">
          Stuck? Email{" "}
          <a
            href="mailto:jonathan@boatality.com"
            className="text-white/40 hover:text-white/60 underline underline-offset-2 transition-colors"
          >
            jonathan@boatality.com
          </a>{" "}
          — real human, fast replies.
        </p>
      </div>
    </div>
  );
}
