"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ArrowRight } from "lucide-react";

export default function OnboardingProfile() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!displayName.trim()) return;
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Session expired. Please sign in again.");
        return;
      }

      // Check if a creator row already exists (resuming flow)
      const { data: existing } = await supabase
        .from("creators_v2")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (existing) {
        // Update name/bio in case they're rerunning setup
        await supabase
          .from("creators_v2")
          .update({ display_name: displayName.trim(), bio: bio.trim() || null })
          .eq("id", user.id);
      } else {
        const { error: insertErr } = await supabase.from("creators_v2").insert({
          id: user.id,
          display_name: displayName.trim(),
          bio: bio.trim() || null,
        });

        if (insertErr) {
          // Tolerate unique-constraint race; re-check is fine
          if (!insertErr.message.toLowerCase().includes("duplicate") &&
              !insertErr.message.toLowerCase().includes("unique")) {
            setError(insertErr.message);
            return;
          }
        }
      }

      router.push("/onboarding/channel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Create your profile
        </h1>
        <p className="text-white/50 text-sm">
          Tell your audience who you are.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-2">
            Display name{" "}
            <span className="text-red-400 font-normal normal-case tracking-normal">
              required
            </span>
          </label>
          <input
            className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
            placeholder="Captain Grey"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && displayName.trim()) handleContinue();
            }}
          />
          <p className="text-xs text-white/25 text-right mt-1">
            {displayName.length}/60
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/60 mb-2">
            Bio{" "}
            <span className="text-white/30 font-normal normal-case tracking-normal">
              optional
            </span>
          </label>
          <textarea
            className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition resize-none"
            placeholder="A few words about you or your content…"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
          />
          <p className="text-xs text-white/25 text-right mt-1">
            {bio.length}/280
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleContinue}
        disabled={!displayName.trim() || loading}
        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors tap-scale"
      >
        {loading ? "Saving…" : "Continue"}
        {!loading && <ArrowRight size={16} />}
      </button>
    </div>
  );
}
