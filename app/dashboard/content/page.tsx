import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  Film,
  Mic2,
  FileText as FileTextIcon,
  Layers,
  Upload as UploadIcon,
} from "lucide-react";

type LibraryItem = {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  type: "video" | "podcast" | "article" | string;
  status: string | null;
  created_at: string;
  view_count?: number | null;
  channels_v2?: { name?: string | null }[] | null;
};

export default async function ContentLibraryPage({
  searchParams,
}: {
  searchParams?: { type?: string };
}) {
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

  const rawType = (searchParams?.type || "all").toLowerCase();
  const activeType =
    rawType === "video" || rawType === "podcast" || rawType === "article"
      ? rawType
      : "all";

  let q = supabase
    .from("content_v2")
    .select(
      `
      id,
      title,
      thumbnail_url,
      type,
      status,
      created_at,
      view_count,
      channels_v2 ( name )
    `
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (activeType !== "all") {
    q = q.eq("type", activeType);
  }

  const { data: content } = await q;

  const items: LibraryItem[] = content ?? [];

  const total = items.length;
  const videos = items.filter((i) => i.type === "video").length;
  const podcasts = items.filter((i) => i.type === "podcast").length;
  const articles = items.filter((i) => i.type === "article").length;

  const TypeBadge = ({ type }: { type: string }) => {
    if (type === "video") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-200 border border-sky-500/30">
        <Film className="h-3 w-3" /> Video
      </span>
    );
    if (type === "podcast") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200 border border-emerald-500/30">
        <Mic2 className="h-3 w-3" /> Podcast
      </span>
    );
    if (type === "article") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200 border border-amber-500/30">
        <FileTextIcon className="h-3 w-3" /> Article
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-100 border border-white/20">
        Other
      </span>
    );
  };

  const StatusBadge = ({ status }: { status: string | null }) => (
    <span className="inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-slate-100 capitalize">
      {status ?? "unknown"}
    </span>
  );

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand-ocean/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-brand-orange/20 blur-3xl" />
      </div>

      <div className="rounded-2xl md:rounded-[32px] border border-white/10 bg-gradient-to-br from-surface-recessed via-brand-navy to-surface-recessed px-4 md:px-8 pb-8 pt-6 shadow-2xl shadow-black/40 backdrop-blur-2xl space-y-6 md:space-y-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-200/70">Library</p>
            <h1 className="mt-1.5 text-2xl md:text-[32px] font-semibold tracking-tight text-slate-50">
              Your content
            </h1>
            <p className="mt-1.5 text-sm text-slate-200/70 max-w-xl">
              Every video, podcast, and article you've published.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="self-start inline-flex items-center gap-2 rounded-full bg-brand-orange px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/50 transition-all hover:-translate-y-0.5 hover:bg-brand-orange-hover flex-shrink-0"
          >
            <UploadIcon className="h-4 w-4" />
            Upload
          </Link>
        </header>

        {/* Stat row — 2 cols on mobile, 4 on desktop */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.14em] text-slate-200/60">Total</span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20">
                <Layers className="h-3.5 w-3.5 text-sky-200" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-slate-50">{total}</span>
              <span className="text-xs text-slate-200/60">items</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-200/60">Videos</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{videos}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-200/60">Podcasts</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{podcasts}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-200/60">Articles</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{articles}</p>
          </div>
        </section>

        {/* Filter tabs */}
        <section className="flex items-center gap-2 flex-wrap">
          {(["all", "video", "podcast", "article"] as const).map((t) => (
            <Link
              key={t}
              href={`/dashboard/content?type=${t}`}
              className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition border ${
                activeType === t
                  ? t === "video"   ? "bg-sky-500/10 border-sky-500/30 text-sky-100"
                  : t === "podcast" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100"
                  : t === "article" ? "bg-amber-500/10 border-amber-500/30 text-amber-100"
                  : "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90"
              }`}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
            </Link>
          ))}
        </section>

        {/* Content list */}
        <section className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 md:px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                {activeType === "all" ? "All content" : activeType.charAt(0).toUpperCase() + activeType.slice(1) + "s"}
              </h2>
              <p className="text-[11px] text-slate-200/60 mt-0.5">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            </div>
            <Link href="/dashboard/upload" className="text-[11px] font-semibold text-sky-300 hover:text-sky-200">
              New upload →
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="px-4 md:px-6 py-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-4">
                <UploadIcon className="h-5 w-5 text-white/30" />
              </div>
              <p className="text-sm text-slate-200/60">
                {activeType === "all"
                  ? "No uploads yet — your next adventure begins with your first post."
                  : `No ${activeType}s yet.`}
              </p>
              <Link
                href="/dashboard/upload"
                className="inline-block mt-3 text-[11px] font-semibold text-sky-300 hover:text-sky-200"
              >
                Upload your first piece →
              </Link>
            </div>
          ) : (
            <>
              {/* ── Mobile: card list (hidden on md+) ── */}
              <ul className="md:hidden divide-y divide-white/[0.06]">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/dashboard/content/${item.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        {item.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300/50">
                            <FileTextIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-50 leading-snug">
                          {item.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <TypeBadge type={item.type} />
                          <StatusBadge status={item.status} />
                          <span className="text-[11px] text-slate-300/60 tabular-nums">
                            {(item.view_count ?? 0).toLocaleString()} views
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <span className="text-white/25 text-xs flex-shrink-0">›</span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* ── Desktop: table (hidden on mobile) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5 text-left text-[11px] uppercase tracking-[0.16em] text-slate-200/50">
                    <tr>
                      <th className="px-6 py-3 font-medium">Asset</th>
                      {activeType === "all" && <th className="px-4 py-3 font-medium">Type</th>}
                      <th className="px-4 py-3 font-medium">Channel</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Views</th>
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
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                              {item.thumbnail_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.thumbnail_url}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-300/50">
                                  <FileTextIcon className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <Link
                                href={`/dashboard/content/${item.id}`}
                                className="line-clamp-1 font-medium text-slate-50 hover:text-sky-200"
                              >
                                {item.title}
                              </Link>
                              <span className="mt-0.5 line-clamp-1 text-[11px] text-slate-300/60">
                                {item.channels_v2?.[0]?.name || "No channel assigned"}
                              </span>
                            </div>
                          </div>
                        </td>
                        {activeType === "all" && (
                          <td className="px-4 py-3 align-middle">
                            <TypeBadge type={item.type} />
                          </td>
                        )}
                        <td className="px-4 py-3 align-middle text-slate-200/70 text-[13px]">
                          {item.channels_v2?.[0]?.name || "—"}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 align-middle text-right text-[13px] tabular-nums text-slate-200/70">
                          {(item.view_count ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 align-middle text-[11px] text-slate-300/60">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 align-middle text-right">
                          <Link
                            href={`/dashboard/content/${item.id}`}
                            className="text-[11px] font-semibold text-sky-300 hover:text-sky-200"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
