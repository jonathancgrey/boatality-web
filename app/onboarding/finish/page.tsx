"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowRight, Video, Mic, FileText } from "lucide-react";

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  video: <Video size={14} />,
  podcast: <Mic size={14} />,
  article: <FileText size={14} />,
};

type Channel = {
  name: string;
  type: string;
};

export default function OnboardingFinish() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: creator }, { data: channelData }] = await Promise.all([
        supabase
          .from("creators_v2")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("channels_v2")
          .select("name, type")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      setName(creator?.display_name ?? null);
      setChannels((channelData as Channel[]) ?? []);
      setLoaded(true);
    }

    load();
  }, []);

  return (
    <div
      className={[
        "space-y-8 text-center transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {/* Success icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-green-400"
            >
              <circle
                cx="18"
                cy="18"
                r="16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />
              <path
                d="M10 18.5L15.5 24L26 13"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {/* Subtle glow ring */}
          <div className="absolute inset-0 rounded-full bg-green-500/10 blur-xl -z-10" />
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {name ? `You're all set, ${name}!` : "You're all set!"}
        </h1>
        <p className="text-white/50 text-sm">
          Your Boatality Studio is live and ready to publish.
        </p>
      </div>

      {/* Channels summary */}
      {channels.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Your channels
          </p>
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => (
              <div
                key={ch.type}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300"
              >
                <span className="text-blue-400/80">{CHANNEL_ICONS[ch.type]}</span>
                {ch.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What's next */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
          What's next
        </p>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 text-blue-400 flex-shrink-0">→</span>
            Upload your first piece of content
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 text-blue-400 flex-shrink-0">→</span>
            Customize your channel names and descriptions
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 text-blue-400 flex-shrink-0">→</span>
            Add more channels as your content grows
          </li>
        </ul>
      </div>

      {/* CTA */}
      <Link
        href="/dashboard"
        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-colors tap-scale glow-hover"
      >
        Go to your dashboard
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
