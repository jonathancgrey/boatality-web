import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  Film,
  Mic2,
  FileText as FileTextIcon,
  Layers,
  Search,
  Filter,
  Upload as UploadIcon,
} from "lucide-react";

type LibraryItem = {
  id: string;
  title: string;
  content_type: "video" | "podcast" | "article" | string;
  status: string | null;
  created_at: string;
  channels_v2?: { name?: string | null } | null;
};

export default async function ContentLibraryPage() {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="w-full max-w-3xl mx-auto py-16 text-center text-slate-100">
        You must be logged in to view your content.
      </div>
    );
  }

  const { data: content } = await supabase
    .from("content_v2")
    .select(
      `
      id,
      title,
      content_type,
      status,
      created_at,
      channels_v2 ( name )
    `
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const items: LibraryItem[] = content ?? [];

  const total = items.length;
  const videos = items.filter((i) => i.content_type === "video").length;
  const podcasts = items.filter((i) => i.content_type === "podcast").length;
  const articles = items.filter((i) => i.content_type === "article").length;

  const renderTypeBadge = (type: string) => {
    if (type === "video") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-100 border border-sky-500/30">
          <Film className="h-3 w-3" />
          Video
        </span>
      );
    }
    if (type === "podcast") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-100 border border-emerald-500/30">
          <Mic2 className="h-3 w-3" />
          Podcast
        </span>
      );
    }
    if (type === "article") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-100 border border-amber-500/30">
            <FileTextIcon className="h-3 w-3" />
          Article
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-100 border border-white/20">
        Other
      </span>
    );
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto py-10 bg-transparent">
      {/* Ambient background like dashboard */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#127AB2]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-[#C84121]/20 blur-3xl" />
      </div>

      <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#001522] via-[#012C44] to-[#000910] px-8 pb-9 pt-7 shadow-2xl shadow-black/40 backdrop-blur-2xl space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-200/70">
              Library
            </p>
            <h1 className="mt-2 text-3xl md:text-[32px] font-semibold tracking-tight text-slate-50">
              Your content on Boatality
            </h1>
            <p className="mt-2 text-sm text-slate-200/80 max-w-xl">
              Every video, podcast, and logbook entry you&apos;ve launched.
              Fine-tune your catalog and keep your fleet organized.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 rounded-full bg-[#C84121] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/50 transition-all hover:-translate-y-0.5 hover:bg-[#a3321c]"
            >
              <UploadIcon className="h-4 w-4" />
              Upload new content
            </Link>
          </div>
        </header>

        {/* Stat row */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.16em] text-slate-200/70">
                Total
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20">
                <Layers className="h-4 w-4 text-sky-100" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-50">
                {total}
              </span>
              <span className="text-xs text-slate-200/80">
                published & drafts
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-200/70">
              Videos
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">
              {videos}
            </p>
            <p className="text-xs text-slate-200/80 mt-1">
              Long-form, walkthroughs, and more.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-200/70">
              Podcasts
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">
              {podcasts}
            </p>
            <p className="text-xs text-slate-200/80 mt-1">
              Conversations from the waterline.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-200/70">
              Articles
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">
              {articles}
            </p>
            <p className="text-xs text-slate-200/80 mt-1">
              Logbook entries & write-ups.
            </p>
          </div>
        </section>

        {/* Controls */}
        <section className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                className="w-full rounded-full border border-white/15 bg-black/30 pl-10 pr-4 py-2 text-xs text-slate-50 placeholder:text-slate-400 shadow-inner shadow-black/40 outline-none focus:ring-1 focus:ring-sky-400/70"
                placeholder="Search your titles (visual only for now)"
              />
            </div>
          </div>

          <button className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-medium text-slate-100 shadow-sm shadow-black/30">
            <Filter className="h-3 w-3" />
            Filters coming soon
          </button>
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-white/10 bg-black/20 shadow-lg shadow-black/30 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Recent voyages
              </h2>
              <p className="text-[11px] text-slate-200/80">
                The latest episodes, logs, and uploads you&apos;ve shared.
              </p>
            </div>
            <Link
              href="/dashboard/upload"
              className="text-[11px] font-semibold text-sky-300 hover:text-sky-200"
            >
              New upload →
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-200/90">
              <p>No uploads yet — your next adventure begins with your first post.</p>
              <div className="mt-2">
                <Link
                  href="/dashboard/upload"
                  className="inline-flex text-[11px] font-semibold text-sky-300 hover:text-sky-200"
                >
                  Upload your first piece →
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-left text-[11px] uppercase tracking-[0.16em] text-slate-200/70">
                  <tr>
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Channel</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/8 bg-transparent transition hover:bg-white/5"
                    >
                      <td className="px-6 py-3 align-middle">
                        <div className="flex flex-col">
                          <Link
                            href={`/dashboard/content/${item.id}`}
                            className="line-clamp-1 font-medium text-slate-50 hover:text-sky-200"
                          >
                            {item.title}
                          </Link>
                          <span className="mt-0.5 text-[11px] text-slate-300/70">
                            {item.channels_v2?.name || "No channel assigned"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        {renderTypeBadge(item.content_type)}
                      </td>

                      <td className="px-4 py-3 align-middle text-slate-200/85">
                        {item.channels_v2?.name || "—"}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span className="inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-slate-100 capitalize">
                          {item.status ?? "unknown"}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle text-[11px] text-slate-300/80">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 align-middle text-right text-[11px]">
                        <Link
                          href={`/dashboard/content/${item.id}`}
                          className="text-sky-300 hover:text-sky-200 font-semibold"
                        >
                          View details →
                        </Link>
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