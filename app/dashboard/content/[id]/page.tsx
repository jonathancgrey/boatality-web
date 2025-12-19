import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  Film,
  Mic2,
  FileText,
  ArrowLeft,
  CalendarDays,
  RadioTower,
  Layers,
} from "lucide-react";

type ContentRow = {
  id: string;
  title: string;
  description: string | null;
  content_type: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
  channels_v2: { name: string | null; type: string | null } | null;
  categories: { name: string | null } | null;
};

export default async function ContentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();

  const { data: item, error } = await supabase
    .from("content_v2")
    .select(
      `
      id,
      title,
      description,
      content_type,
      status,
      created_at,
      updated_at,
      channels_v2 ( name, type ),
      categories ( name )
    `
    )
    .eq("id", params.id)
    .maybeSingle<ContentRow>();

  if (error) {
    console.error("Error loading content details", error);
  }

  if (!item) {
    return notFound();
  }

  const badge = (() => {
    switch (item.content_type) {
      case "video":
        return {
          label: "Video",
          className: "bg-sky-500/10 text-sky-100 border-sky-500/40",
          icon: Film,
        };
      case "podcast":
        return {
          label: "Podcast",
          className: "bg-emerald-500/10 text-emerald-100 border-emerald-500/40",
          icon: Mic2,
        };
      case "article":
        return {
          label: "Article",
          className: "bg-amber-500/10 text-amber-100 border-amber-500/40",
          icon: FileText,
        };
      default:
        return {
          label: "Content",
          className: "bg-white/10 text-slate-100 border-white/30",
          icon: Layers,
        };
    }
  })();

  const BadgeIcon = badge.icon;

  const created = new Date(item.created_at);
  const updated = item.updated_at ? new Date(item.updated_at) : null;

  return (
    <div className="relative max-w-6xl mx-auto py-10">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-10 h-64 w-64 rounded-full bg-[#127AB2]/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#C84121]/25 blur-3xl" />
      </div>

      {/* Back link */}
      <Link
        href="/dashboard/content"
        className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300 hover:text-sky-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to library
      </Link>

      {/* Main card */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#021521]/95 via-[#012C44]/90 to-[#050816]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="px-6 py-6 md:px-10 md:py-8">
          {/* Header row */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-sky-200/90 border border-white/10">
                Content details
              </p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {item.title}
              </h1>

              <div className="flex flex-wrap gap-2">
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold border",
                    badge.className,
                  ].join(" ")}
                >
                  <BadgeIcon className="h-3 w-3" />
                  {badge.label}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-100 border border-white/20 capitalize">
                  {item.status || "status unknown"}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 text-xs text-slate-200/80 md:items-end">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 border border-white/10">
                <CalendarDays className="h-3 w-3 text-slate-300" />
                <span>
                  Created{" "}
                  <span className="font-semibold text-white">
                    {created.toLocaleDateString()}{" "}
                    <span className="text-slate-300">
                      {created.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </span>
              </div>
              {updated && (
                <div className="inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 border border-white/5">
                  <RadioTower className="h-3 w-3 text-slate-300" />
                  <span>
                    Last updated{" "}
                    <span className="font-medium text-slate-100">
                      {updated.toLocaleDateString()}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Two-column info grid */}
          <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            {/* Description */}
            <section className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 md:px-6 md:py-6 shadow-lg shadow-black/40">
              <h2 className="text-sm font-semibold text-slate-50">
                Description
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-200/85 whitespace-pre-line">
                {item.description || "No description has been added yet."}
              </p>
            </section>

            {/* Metadata */}
            <section className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 md:px-6 md:py-6 shadow-lg shadow-black/40">
              <h2 className="text-sm font-semibold text-slate-50">
                Content details
              </h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-200/85">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-300/90">Channel</dt>
                  <dd className="font-medium text-sky-200">
                    {item.channels_v2?.name || "Unassigned"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-300/90">Channel type</dt>
                  <dd className="font-medium text-slate-100 capitalize">
                    {item.channels_v2?.type || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-300/90">Primary category</dt>
                  <dd className="font-medium text-amber-200">
                    {item.categories?.name || "None"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5 mt-3">
                  <dt className="text-slate-300/90">Status</dt>
                  <dd className="font-medium text-slate-100 capitalize">
                    {item.status || "Unknown"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/content/${item.id}/edit`}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/45 hover:bg-sky-500 hover:-translate-y-0.5 transition"
            >
              Edit content
            </Link>

            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-xs font-semibold text-slate-50 shadow-lg shadow-black/40 hover:bg-white/20 hover:-translate-y-0.5 transition"
            >
              Replace or re-upload
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}