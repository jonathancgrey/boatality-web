import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Video, Mic, FileText, BarChart3 } from "lucide-react";

export default async function DashboardPage() {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: channels } = await supabase
    .from("channels_v2")
    .select("id, name, type")
    .eq("creator_id", user.id);

  const { data: content } = await supabase
    .from("content_v2")
    .select("id, type, status")
    .eq("creator_id", user.id);

  const stats = {
    total: content?.length ?? 0,
    video: content?.filter((c) => c.type === "video").length ?? 0,
    podcast: content?.filter((c) => c.type === "podcast").length ?? 0,
    article: content?.filter((c) => c.type === "article").length ?? 0,
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Creator dashboard</h1>
        <p className="text-sm text-white/60">
          Overview of all channels and performance
        </p>
      </header>

      {/* Top metrics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Total assets" value={stats.total} />
        <Metric label="Videos" value={stats.video} icon={<Video size={16} />} />
        <Metric label="Podcasts" value={stats.podcast} icon={<Mic size={16} />} />
        <Metric label="Articles" value={stats.article} icon={<FileText size={16} />} />
      </section>

      {/* Channels */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Channels</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels?.map((ch) => (
            <Link
              key={ch.id}
              href={`/dashboard/channels/${ch.id}`}
              className="group rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {ch.name}
                  </div>
                  <div className="text-xs text-white/50 capitalize">
                    {ch.type} channel
                  </div>
                </div>
                <BarChart3
                  size={18}
                  className="text-white/40 group-hover:text-white/70 transition"
                />
              </div>
            </Link>
          ))}
        </div>

        {!channels?.length && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            No channels yet. Finish onboarding to create your first channel.
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-wide text-white/50">
          {label}
        </div>
        <div className="text-2xl font-semibold text-white">{value}</div>
      </div>
      {icon && <div className="text-white/50">{icon}</div>}
    </div>
  );
}
