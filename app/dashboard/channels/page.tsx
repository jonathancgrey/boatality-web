import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { RadioTower, Plus, CalendarDays, Layers } from "lucide-react";

type ChannelRow = {
  id: string;
  name: string;
  type: string | null;
  created_at: string;
  status: string | null;
};

export default async function ChannelsPage() {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: channels } = await supabase
    .from("channels_v2")
    .select("id, name, type, created_at, status")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ChannelRow[]>();

  const hasChannels = !!channels && channels.length > 0;

  return (
    <div className="relative max-w-6xl mx-auto py-10">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-10 h-64 w-64 rounded-full bg-[#127AB2]/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#C84121]/25 blur-3xl" />
      </div>

      {/* Header card */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#021521]/95 via-[#012C44]/90 to-[#050816]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="px-6 py-6 md:px-10 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-sky-200/90 border border-white/10">
                <RadioTower className="h-3 w-3" />
                Channels
              </p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Your Boatality channels
              </h1>
              <p className="text-sm text-slate-200/85 max-w-xl">
                Channels are how you organize your videos, podcasts, and
                articles across Boatality. Think of them like shows or series
                your audience can follow.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/45 hover:bg-sky-500 hover:-translate-y-0.5 transition"
              >
                <Plus className="h-4 w-4" />
                Create new content
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* List / empty state */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 px-6 py-6 md:px-8 md:py-7 shadow-2xl shadow-black/40">
        {hasChannels ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-50">
                Active channels
              </h2>
              <p className="text-[11px] text-slate-400">
                {channels!.length}{" "}
                {channels!.length === 1 ? "channel" : "channels"}
              </p>
            </div>

            <div className="divide-y divide-white/5">
              {channels!.map((ch) => {
                const created = new Date(ch.created_at);
                return (
                  <div
                    key={ch.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 border border-sky-400/40">
                        <RadioTower className="h-4 w-4 text-sky-300" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-50">
                            {ch.name}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-100 border border-white/10 capitalize">
                            {ch.type || "channel"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 flex items-center gap-2">
                          <CalendarDays className="h-3 w-3" />
                          Started{" "}
                          {created.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-300">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 border border-white/10">
                        <Layers className="h-3 w-3 text-slate-200" />
                        {ch.status || "active"}
                      </span>
                      {/* Placeholder for future actions */}
                      <span className="text-slate-500">
                        Channel management tools coming soon
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-50">
              No channels yet
            </h2>
            <p className="text-sm text-slate-200/80 max-w-xl">
              Once you publish your first video, podcast, or article, Boatality
              will help you group them into channels so your audience can follow
              the stories you’re telling on the water.
            </p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/45 hover:bg-sky-500 hover:-translate-y-0.5 transition"
            >
              <Plus className="h-4 w-4" />
              Upload your first piece
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}