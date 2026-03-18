"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { Anchor, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/set-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020b16] px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Check your email</h1>
            <p className="text-sm text-white/45 mt-2 leading-relaxed">
              We sent a password reset link to <span className="text-white/70 font-medium">{email}</span>.
              Click the link in that email to set your password.
            </p>
          </div>
          <p className="text-xs text-white/30">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-white/50 hover:text-white/70 underline underline-offset-2"
            >
              try again
            </button>.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to sign in
          </Link>
        </div>
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
            <h1 className="text-xl font-bold text-white">Reset your password</h1>
            <p className="text-sm text-white/40 mt-0.5">
              No password yet? This works for that too.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C84121] hover:bg-[#d94e2a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
