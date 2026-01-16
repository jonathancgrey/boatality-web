import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  Film,
  Mic2,
  FileText,
  ArrowLeft,
  CalendarDays,
  Layers,
  Pencil,
  Save,
} from "lucide-react";

type ContentRow = {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  status: string | null;
  created_at: string;
  media_url: string | null;
  thumbnail_url: string | null;
  category_id: string | null;
  channels_v2: { name: string | null; type: string | null } | null;
  categories: { name: string | null } | null;
};

type CategoryRow = { id: string; name: string | null };

type UpdateState =
  | { ok: true }
  | { ok: false; error: string };

async function updateContentAction(formData: FormData): Promise<UpdateState> {
  "use server";

  const supabase = supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return { ok: false, error: "Not logged in." };

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryIdRaw = String(formData.get("category_id") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!id) return { ok: false, error: "Missing content id." };
  if (!title) return { ok: false, error: "Title is required." };

  const payload: Record<string, any> = {
    title,
    description: description.length ? description : null,
  };

  // Only set if provided; keeps schema stable.
  payload.category_id = categoryIdRaw ? categoryIdRaw : null;
  if (status) payload.status = status;

  // Safety: only allow updating rows owned by the signed-in creator.
  const { error } = await supabase
    .from("content_v2")
    .update(payload)
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/content");
  revalidatePath(`/dashboard/content/${id}`);
  return { ok: true };
}

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
      type,
      status,
      created_at,
      media_url,
      thumbnail_url,
      category_id,
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

  const { data: allCategories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true })
    .returns<CategoryRow[]>();

  const badge = (() => {
    switch (item.type) {
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

  const type = (item.type || "").toLowerCase();
  const isVideo = type === "video";
  const isPodcast = type === "podcast";
  const isArticle = type === "article";

  const mediaUrl = item.media_url || null;
  const thumbUrl = item.thumbnail_url || null;

  return (
    <div className="relative max-w-5xl mx-auto py-8">
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

            <div className="flex flex-col items-start gap-3 text-xs text-slate-200/80 md:items-end">
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

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/content/${item.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-[11px] font-semibold text-white shadow-lg shadow-black/45 hover:bg-sky-500 transition"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Advanced editor
                </Link>

                <Link
                  href="/dashboard/upload"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-semibold text-slate-50 shadow-lg shadow-black/40 hover:bg-white/20 transition"
                >
                  Replace media
                </Link>
              </div>
            </div>
          </div>

          {/* Studio layout */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            {/* LEFT: Preview + Description */}
            <div className="space-y-6">
              {/* Preview */}
              <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/40">
                <div className="flex items-center justify-between px-5 py-4 md:px-6 border-b border-white/10">
                  <h2 className="text-sm font-semibold text-slate-50">Preview</h2>
                  {mediaUrl ? (
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-sky-300 hover:text-sky-200 transition"
                    >
                      Open media URL
                    </a>
                  ) : (
                    <span className="text-xs text-slate-300/70">No media URL</span>
                  )}
                </div>

                <div className="p-4 md:p-6">
                  {isVideo && mediaUrl ? (
                    <video
                      className="w-full rounded-xl border border-white/10 bg-black/40"
                      controls
                      preload="metadata"
                      src={mediaUrl}
                      poster={thumbUrl || undefined}
                    />
                  ) : isPodcast && mediaUrl ? (
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <audio className="w-full" controls preload="metadata" src={mediaUrl} />
                    </div>
                  ) : thumbUrl ? (
                    // Article (or fallback) preview
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl}
                      alt="Thumbnail"
                      className="w-full rounded-xl border border-white/10 bg-black/40 object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm text-slate-200/70">
                      Preview will appear here
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-[11px] text-slate-300/80">Views</div>
                      <div className="mt-1 text-lg font-semibold text-white">—</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-[11px] text-slate-300/80">Engagement</div>
                      <div className="mt-1 text-lg font-semibold text-white">—</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-[11px] text-slate-300/80">Watch/Listen</div>
                      <div className="mt-1 text-lg font-semibold text-white">—</div>
                    </div>
                  </div>

                </div>
              </section>

            </div>

            {/* RIGHT: Metadata + Edit */}
            <div className="space-y-6">
              {/* Metadata */}
              <section className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 md:px-6 md:py-6 shadow-lg shadow-black/40">
                <h2 className="text-sm font-semibold text-slate-50">Details</h2>
                <dl className="mt-4 space-y-3 text-sm text-slate-200/85">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-300/90">Channel</dt>
                    <dd className="font-medium text-sky-200">{item.channels_v2?.name || "Unassigned"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-300/90">Primary category</dt>
                    <dd className="font-medium text-amber-200">{item.categories?.name || "None"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5 mt-3">
                    <dt className="text-slate-300/90">Status</dt>
                    <dd className="font-medium text-slate-100 capitalize">{item.status || "Unknown"}</dd>
                  </div>
                </dl>

                {/* URLs */}
                <div className="mt-5 border-t border-white/10 pt-4">
                  <details className="group">
                    <summary className="cursor-pointer list-none text-[11px] font-semibold text-slate-200/80 inline-flex items-center gap-2">
                      Links
                      <span className="text-slate-300/60 font-normal group-open:hidden">(show)</span>
                      <span className="text-slate-300/60 font-normal hidden group-open:inline">(hide)</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div className="text-[11px] text-slate-300/80">Media</div>
                        <div className="mt-1 break-all text-xs text-slate-100">{mediaUrl ? mediaUrl : "—"}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div className="text-[11px] text-slate-300/80">Thumbnail</div>
                        <div className="mt-1 break-all text-xs text-slate-100">{thumbUrl ? thumbUrl : "—"}</div>
                      </div>
                    </div>
                  </details>
                </div>
              </section>

              {/* Edit metadata */}
              <section className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 md:px-6 md:py-6 shadow-lg shadow-black/40">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-50 inline-flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-sky-200" />
                    Edit metadata
                  </h2>
                  <span className="text-[11px] text-slate-300/70">Update title, description, category, and status</span>
                </div>

                <form
                  action={async (fd) => {
                    "use server";
                    const res = await updateContentAction(fd);
                    if (!res.ok) {
                      // Minimal: surface error via querystring to avoid client components.
                      redirect(`/dashboard/content/${params.id}?error=${encodeURIComponent(res.error)}`);
                    }
                    redirect(`/dashboard/content/${params.id}?saved=1`);
                  }}
                  className="mt-4 space-y-4"
                >
                  <input type="hidden" name="id" value={item.id} />

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-200/80">Title</label>
                    <input
                      name="title"
                      defaultValue={item.title}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      placeholder="Add a title"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-200/80">Description</label>
                    <textarea
                      name="description"
                      defaultValue={item.description || ""}
                      rows={5}
                      className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      placeholder="Tell viewers what this is about…"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-200/80">Primary category</label>
                      <select
                        name="category_id"
                        defaultValue={(item as any).category_id || ""}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      >
                        <option value="">None</option>
                        {(allCategories || []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name || "(untitled)"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-200/80">Status</label>
                      <select
                        name="status"
                        defaultValue={item.status || "draft"}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/45 hover:bg-sky-500 transition"
                  >
                    <Save className="h-4 w-4" />
                    Save changes
                  </button>
                </form>

                {/* Simple querystring banners */}
                {(() => {
                  // Server component can read search params via request URL in Next, but not available here.
                  // Keep UI minimal; errors/saved are still visible via the URL for now.
                  return null;
                })()}
              </section>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}