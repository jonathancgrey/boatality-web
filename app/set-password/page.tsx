"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Anchor, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function SetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // Guard: redirect to login if there's no active session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setChecking(false);
      }
    });
  }, []);

  const strong = password.length >= 8;
  const matches = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!strong) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!matches) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Password set — continue to onboarding
    router.push("/onboarding");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020b16]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020b16] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C84121]/20 border border-[#C84121]/30 flex items-center justify-center">
            <Anchor className="h-6 w-6 text-[#C84121]" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Welcome aboard</h1>
            <p className="text-sm text-white/40 mt-0.5 max-w-xs">
              Set a password for your Boatality Studio account
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
              New password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
            {/* Strength hint */}
            {password.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <div
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    strong ? "bg-green-500" : "bg-orange-500"
                  }`}
                />
                <span className={`text-[11px] ${strong ? "text-green-400" : "text-orange-400"}`}>
                  {strong ? "Good" : "Too short"}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/30 focus:bg-white/8 transition-colors"
              />
              {matches && (
                <CheckCircle2
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                />
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !strong || !matches}
            className="w-full bg-[#C84121] hover:bg-[#d94e2a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? "Saving…" : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
