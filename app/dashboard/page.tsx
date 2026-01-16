import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import { Upload, PlusCircle } from "lucide-react";

export default async function DashboardHome() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: channels } = await supabase
    .from("channels_v2")
    .select("id, name, type")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: true });

  let totalAssets = 0;
  let totalDrafts = 0;

  const channelStats = await Promise.all(
    (channels || []).map(async (ch) => {
      const { count: assetCount } = await supabase
        .from("content_v2")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", ch.id);

      const { count: draftCount } = await supabase
        .from("content_v2")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", ch.id)
        .eq("status", "draft");

      const { data: latest } = await supabase
        .from("content_v2")
        .select("created_at")
        .eq("channel_id", ch.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      totalAssets += assetCount || 0;
      totalDrafts += draftCount || 0;

      return {
        ...ch,
        assetCount: assetCount || 0,
        draftCount: draftCount || 0,
        latestAt: latest?.created_at || null,
      };
    })
  );

  return (
    <div className="mx-auto max-w-7xl py-10 space-y-10">
      {/* TOP SUMMARY */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
          <p className="text-xs uppercase text-white/60">Channels</p>
          <p className="text-3xl font-semibold text-white">
            {channels?.length || 0}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
          <p className="text-xs uppercase text-white/60">Total assets</p>
          <p className="text-3xl font-semibold text-white">{totalAssets}</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
          <p className="text-xs uppercase text-white/60">Drafts</p>
          <p className="text-3xl font-semibold text-white">{totalDrafts}</p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4">
        <Link
          href="/onboarding/channel"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm text-white hover:bg-white/20"
        >
          <PlusCircle className="w-4 h-4" />
          Create channel
        </Link>
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm text-white hover:bg-blue-500"
        >
          <Upload className="w-4 h-4" />
          Upload content
        </Link>
      </div>

      {/* CHANNELS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/10 text-xs uppercase text-white/60">
            <tr>
              <th className="px-6 py-4 text-left">Channel</th>
              <th className="px-4 py-4 text-left">Type</th>
              <th className="px-4 py-4 text-left">Assets</th>
              <th className="px-4 py-4 text-left">Drafts</th>
              <th className="px-4 py-4 text-left">Last upload</th>
              <th className="px-4 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {channelStats.map((ch) => (
              <tr
                key={ch.id}
                className="border-t border-white/10 hover:bg-white/5"
              >
                <td className="px-6 py-4 font-medium text-white">{ch.name}</td>
                <td className="px-4 py-4 capitalize text-white/80">{ch.type}</td>
                <td className="px-4 py-4 text-white/80">{ch.assetCount}</td>
                <td className="px-4 py-4 text-white/80">{ch.draftCount}</td>
                <td className="px-4 py-4 text-white/60 text-xs">
                  {ch.latestAt ? new Date(ch.latestAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/dashboard/channel/${ch.id}`}
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {channelStats.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-white/60">
                  No channels yet — create your first channel to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}