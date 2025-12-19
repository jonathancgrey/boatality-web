import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

import {
  Video,
  Mic,
  FileText,
  MonitorPlay,
  Layers,
  BarChart,
  Film,
  Mic2,
  FileText as FileTextIcon,
  Upload as UploadIcon,
  LibraryBig,
} from "lucide-react";

type RecentItem = {
  id: string;
  title: string;
  content_type: "video" | "podcast" | "article" | string;
  created_at: string;
  channels_v2?: { name?: string | null } | null;
};

export default async function DashboardHome() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recentContent: RecentItem[] = [];
  let hasVideo = false;
  let hasPodcast = false;
  let hasArticle = false;
  let totalContent = 0;
  let channelCount = 0;

  if (user) {
    const { data: contentData } = await supabase
      .from("content_v2")
      .select(`
        id,
        title,
        content_type,
        created_at,
        channels_v2 ( name )
      `)
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (contentData) {
      recentContent = contentData as RecentItem[];
      for (const item of recentContent) {
        if (item.content_type === "video") hasVideo = true;
        if (item.content_type === "podcast") hasPodcast = true;
        if (item.content_type === "article") hasArticle = true;
      }
    }

    const { count: contentCount } = await supabase
      .from("content_v2")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id);

    totalContent = contentCount ?? 0;

    const { count: chCount } = await supabase
      .from("channels_v2")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id);

    channelCount = chCount ?? 0;
  }

  const latest = recentContent[0];

  return (
    <div className="relative w-full max-w-7xl mx-auto py-10 bg-transparent">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#127AB2]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-[#C84121]/20 blur-3xl" />
      </div>

      <div className="space-y-8 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#001522] via-[#012C44] to-[#000910] px-8 pb-9 pt-7 shadow-2xl shadow-black/40 backdrop-blur-2xl">
      {/* ========================================================= */}
{/* TOP: CREATOR IDENTITY CARD — CLEAN PREMIUM VERSION         */}
{/* ========================================================= */}
<section className="flex flex-col gap-8">
  <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#021824] via-[#032B3F] to-[#000D14] px-10 py-12 shadow-xl shadow-black/40 backdrop-blur-2xl">

    {/* Soft ambient gradients */}
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-[#127AB2]/15 blur-[90px]" />
      <div className="absolute -bottom-40 -right-10 h-[28rem] w-[28rem] rounded-full bg-[#C84121]/15 blur-[110px]" />
      <div className="absolute inset-0 bg-noise opacity-[0.15]" />
    </div>

    {/* TOP ROW: Avatar + Identity */}
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-4">

        {/* Avatar */}
        <div className="h-16 w-16 rounded-full bg-[#010E18] ring-2 ring-white/20 shadow-lg shadow-black/40 flex items-center justify-center text-[#F5F7FA]/90 text-xl font-semibold">
          {user?.email?.[0]?.toUpperCase() ?? "C"}
        </div>

        {/* Identity Text */}
        <div className="space-y-1">
          <p className="text-lg font-semibold text-[#F5F7FA]">
            {user?.user_metadata?.full_name || "Creator"}
          </p>
          <p className="text-sm text-[#F5F7FA]/70">
            Creating content built for the water
          </p>

          {/* Badges — simplified premium style */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hasVideo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-[#F5F7FA]/80 border border-white/10">
                <Film className="h-3 w-3" />
                Video Captain
              </span>
            )}
            {hasPodcast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-[#F5F7FA]/80 border border-white/10">
                <Mic2 className="h-3 w-3" />
                Podcast Skipper
              </span>
            )}
            {hasArticle && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-[#F5F7FA]/80 border border-white/10">
                <FileTextIcon className="h-3 w-3" />
                Logbook Writer
              </span>
            )}
            {!hasVideo && !hasPodcast && !hasArticle && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-[#F5F7FA]/60 border border-white/10">
                Earn badges by uploading your first voyage
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right-side brand tag */}
      <div className="hidden md:flex flex-col items-end text-right text-[11px] text-[#F5F7FA]/70">
        <span className="rounded-full bg-white/5 px-4 py-1 font-medium border border-white/10">
          Boatality Studio
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.14em]">
          Built for the water
        </span>
      </div>
    </div>

    {/* HEADLINE AREA */}
    <div className="mt-10 max-w-2xl">
      <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
        Welcome aboard, Captain.
      </h1>

      <p className="mt-4 text-base text-[#F5F7FA]/75 leading-relaxed max-w-lg">
        This is your creator command center — upload new voyages, manage
        channels, and keep an eye on how your content is performing.
      </p>
    </div>

    {/* SNAPSHOT ROW — simplified for premium clarity */}
    <div className="mt-12 grid gap-5 md:grid-cols-3">
      {/* Total content */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/30">
        <p className="text-[11px] uppercase tracking-wide text-white/60">
          Total content
        </p>
        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-white">
              {totalContent}
            </span>
            <span className="text-xs text-white/60">pieces</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-[#127AB2]/20 flex items-center justify-center">
            <Layers className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/30">
        <p className="text-[11px] uppercase tracking-wide text-white/60">
          Active channels
        </p>
        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-white">
              {channelCount}
            </span>
            <span className="text-xs text-white/60">live</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Mic className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Monetization */}
      <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 shadow-inner shadow-black/30">
        <p className="text-[11px] uppercase tracking-wide text-amber-100/80">
          Monetization
        </p>
        <div className="mt-3 flex items-end justify-between">
          <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-medium text-amber-100 border border-amber-400/40">
            Coming soon
          </span>
          <div className="h-9 w-9 rounded-full bg-black/30 flex items-center justify-center">
            <BarChart className="h-5 w-5 text-amber-200" />
          </div>
        </div>
      </div>
    </div>

    {/* CTA ROW */}
    <div className="mt-10 flex flex-wrap gap-4">
      <Link
        href="/dashboard/upload"
        className="inline-flex items-center gap-2 rounded-full bg-[#C84121] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-black/50 transition-all hover:-translate-y-0.5 hover:bg-[#a3321c]"
      >
        <UploadIcon className="w-4 h-4" />
        Upload new content
      </Link>

      <Link
        href="/dashboard/content"
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-black/20 transition hover:bg-white/10 hover:-translate-y-0.5"
      >
        <LibraryBig className="w-4 h-4" />
        Open your library
      </Link>
    </div>
  </div>
</section>

        {/* ========================================================= */}
        {/* MIDDLE STAT CARDS                                         */}
        {/* ========================================================= */}
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {/* Total content */}
          <div className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#F5F7FA]/70">
                Total content
              </p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#127AB2]/20">
                <Layers className="h-4 w-4 text-[#F5F7FA]" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#F5F7FA]">
                {totalContent}
              </span>
              <span className="text-xs text-[#F5F7FA]/75">
                videos, podcasts &amp; articles
              </span>
            </div>
          </div>

          {/* Latest upload */}
          <div className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#F5F7FA]/70">
                Latest upload
              </p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#C84121]/20">
                <MonitorPlay className="h-4 w-4 text-[#C84121]" />
              </span>
            </div>
            {latest ? (
              <div className="mt-3 space-y-1.5">
                <p className="line-clamp-2 text-sm font-medium text-[#F5F7FA]">
                  {latest.title}
                </p>
                <p className="flex items-center gap-2 text-[11px] text-[#F5F7FA]/80 capitalize">
                  <span className="rounded-full bg-white/5 px-2 py-0.5">
                    {latest.content_type}
                  </span>
                  <span className="opacity-60">•</span>
                  <span className="truncate">
                    {latest.channels_v2?.name ?? "No channel assigned"}
                  </span>
                </p>
                <p className="text-[11px] text-[#F5F7FA]/70">
                  {new Date(latest.created_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#F5F7FA]/80">
                Nothing here yet — your most recent uploads will show up here.
              </p>
            )}
          </div>

          {/* Channels */}
          <div className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#F5F7FA]/70">
                Channels
              </p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
                <Mic className="h-4 w-4 text-[#F5F7FA]" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#F5F7FA]">
                {channelCount}
              </span>
              <span className="text-xs text-[#F5F7FA]/75">active</span>
            </div>
            <Link
              href="/onboarding/channel"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#127AB2] hover:text-[#0f6a99]"
            >
              <span>Manage channels</span>
              <span>↗</span>
            </Link>
          </div>

          {/* Analytics placeholder */}
          <div className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#F5F7FA]/70">
                Analytics
              </p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#127AB2]/15 text-[#127AB2]">
                <BarChart className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-sm text-[#F5F7FA]/80">
              Channel stats &amp; trends are coming soon.
            </p>
            <p className="mt-1 text-[11px] text-[#F5F7FA]/75">
              You&apos;ll see views, watch time, and top-performing content
              here.
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RECENT CONTENT TABLE                                      */}
        {/* ========================================================= */}
        <section className="rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#F5F7FA]">
                Recent voyages
              </h2>
              <p className="text-[11px] text-[#F5F7FA]/70">
                The latest episodes, logs, and uploads you&apos;ve shared.
              </p>
            </div>
            <Link
              href="/dashboard/content"
              className="text-[11px] font-semibold text-[#127AB2] hover:text-[#0f6a99]"
            >
              Open full library →
            </Link>
          </div>

          {recentContent.length === 0 ? (
            <div className="px-6 py-5 text-sm text-[#F5F7FA]/88">
              No uploads yet — your next adventure begins with your first post.
              <div className="mt-2">
                <Link
                  href="/dashboard/upload"
                  className="inline-flex text-[11px] font-semibold text-[#127AB2] hover:text-[#0f6a99]"
                >
                  Upload your first piece →
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-left text-[11px] uppercase tracking-[0.16em] text-[#F5F7FA]/60">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContent.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/8 bg-transparent transition hover:bg-white/5"
                    >
                      <td className="px-6 py-2.5">
                        <div className="flex flex-col">
                          <span className="line-clamp-1 font-medium text-[#F5F7FA]/90">
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[11px] capitalize text-[#F5F7FA]/85">
                          {item.content_type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[#F5F7FA]/80">
                        {item.channels_v2?.name || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-[#F5F7FA]/75">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}