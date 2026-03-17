"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Video, Mic, FileText, ArrowRight, Check } from "lucide-react";

type ChannelType = "video" | "podcast" | "article";

const CHANNEL_OPTIONS: {
  type: ChannelType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  defaultName: string;
}[] = [
  {
    type: "video",
    label: "Videos",
    desc: "Long or short form video content",
    icon: <Video size={20} />,
    defaultName: "Videos",
  },
  {
    type: "podcast",
    label: "Podcast",
    desc: "Audio episodes, interviews, and shows",
    icon: <Mic size={20} />,
    defaultName: "Podcast",
  },
  {
    type: "article",
    label: "Articles",
    desc: "Written posts, essays, and long-form content",
    icon: <FileText size={20} />,
    defaultName: "Articles",
  },
];

export default function OnboardingChannels() {
  const router = useRouter();
  const supabase = createClient();

  // Default: video pre-selected
  const [selected, setSelected] = useState<Set<ChannelType>>(
    new Set<ChannelType>(["video"])
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(type: ChannelType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        // Always keep at least one selected
        if (next.size === 1) return next;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  async function handleContinue() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setError("Session expired. Please sign in again.");
        return;
      }

      // Find which types already exist so we don't duplicate
      const { data: existing } = await supabase
        .from("channels_v2")
        .select("type")
        .eq("creator_id", user.id);

      const existingTypes = new Set(
        (existing || []).map((c: { type: string }) => c.type)
      );

      const toCreate = CHANNEL_OPTIONS.filter(
        (opt) => selected.has(opt.type) && !existingTypes.has(opt.type)
      ).map((opt) => ({
        creator_id: user.id,
        name: opt.defaultName,
        type: opt.type,
      }));

      if (toCreate.length > 0) {
        const { error: insertErr } = await supabase
          .from("channels_v2")
          .insert(toCreate);

        if (insertErr) {
          setError(insertErr.message);
          return;
        }
      }

      router.push("/onboarding/branding");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Choose your channels
        </h1>
        <p className="text-white/50 text-sm">
          Select the formats you'll publish to. You can add more later.
        </p>
      </div>

      {/* Channel toggle cards */}
      <div className="space-y-3">
        {CHANNEL_OPTIONS.map((opt) => {
          const active = selected.has(opt.type);
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => toggle(opt.type)}
              className={[
                "w-full flex items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all duration-200 tap-scale",
                active
                  ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/25"
                  : "border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20",
              ].join(" ")}
            >
              {/* Icon */}
              <div
                className={[
                  "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200",
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-white/50",
                ].join(" ")}
              >
                {opt.icon}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <div
                  className={[
                    "text-sm font-semibold transition-colors duration-200",
                    active ? "text-white" : "text-white/70",
                  ].join(" ")}
                >
                  {opt.label}
                </div>
                <div className="text-xs text-white/40 mt-0.5 truncate">
                  {opt.desc}
                </div>
              </div>

              {/* Checkbox */}
              <div
                className={[
                  "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                  active
                    ? "border-blue-500 bg-blue-500"
                    : "border-white/20 bg-transparent",
                ].join(" ")}
              >
                {active && <Check size={11} strokeWidth={3} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection hint */}
      <p className="text-center text-xs text-white/30">
        {selected.size} channel{selected.size !== 1 ? "s" : ""} selected
        {selected.size === 1 && (
          <> · <span className="text-white/40">select more to publish across formats</span></>
        )}
      </p>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleContinue}
        disabled={selected.size === 0 || loading}
        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors tap-scale"
      >
        {loading ? "Setting up your studio…" : "Continue"}
        {!loading && <ArrowRight size={16} />}
      </button>
    </div>
  );
}
