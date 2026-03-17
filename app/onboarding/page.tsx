import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";
import { Video, Mic, FileText, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: <Video size={16} />,
    label: "Videos",
    desc: "Upload and manage long or short form video content",
  },
  {
    icon: <Mic size={16} />,
    label: "Podcasts",
    desc: "Publish audio episodes, interviews, and shows",
  },
  {
    icon: <FileText size={16} />,
    label: "Articles",
    desc: "Write and organize long-form posts and essays",
  },
];

export default async function OnboardingWelcome() {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Layout already handles unauthenticated users, but be explicit
  if (!user) redirect("/login");

  // Already onboarded — send straight to the dashboard
  const { data: creator } = await supabase
    .from("creators_v2")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (creator) redirect("/dashboard");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-1">
          <span className="text-3xl leading-none">⚓</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome to Boatality Studio
        </h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
          Your creator hub for publishing videos, podcasts, and articles — all
          in one place. Setup takes under a minute.
        </p>
      </div>

      {/* Feature list */}
      <div className="space-y-2.5">
        {FEATURES.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover-lift"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400">
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {item.label}
              </div>
              <div className="text-xs text-white/40 mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/onboarding/profile"
        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-colors tap-scale glow-hover"
      >
        Get started
        <ArrowRight size={16} />
      </Link>

      <p className="text-center text-xs text-white/25">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-white/50 hover:text-white/70 underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
