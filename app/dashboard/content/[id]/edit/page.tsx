"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ArrowLeft, Loader2, Save } from "lucide-react";

type ContentRow = {
  title: string;
  description: string | null;
  status: string | null;
};

export default function EditContentPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | string>("draft");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("content_v2")
        .select("title, description, status")
        .eq("id", params.id)
        .maybeSingle<ContentRow>();

      if (!isMounted) return;

      if (error) {
        console.error("Error loading content for edit", error);
        setError("We couldn’t load this content. Please try again.");
      } else if (data) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setStatus((data.status as any) || "draft");
      } else {
        setError("Content not found.");
      }

      setLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [params.id, supabase]);

  async function saveChanges() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("content_v2")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        status: status || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    setSaving(false);

    if (error) {
      console.error("Error saving content", error);
      setError("We couldn’t save your changes. Please try again.");
      return;
    }

    router.push(`/dashboard/content/${params.id}`);
  }

  return (
    <div className="relative max-w-6xl mx-auto py-10">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-10 h-64 w-64 rounded-full bg-[#127AB2]/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#C84121]/25 blur-3xl" />
      </div>

      <Link
        href={`/dashboard/content/${params.id}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300 hover:text-sky-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to details
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#021521]/95 via-[#012C44]/90 to-[#050816]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="px-6 py-6 md:px-10 md:py-8">
          <header className="space-y-2">
            <p className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-sky-200/90 border border-white/10">
              Edit content
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Update your piece
            </h1>
            <p className="text-sm text-slate-200/80 max-w-xl">
              Adjust the title, description, and status for this content. Changes
              will be reflected across your Boatality Studio dashboards.
            </p>
          </header>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-10 flex items-center gap-3 text-sm text-slate-200/80">
              <Loader2 className="h-5 w-5 animate-spin text-sky-300" />
              Loading content…
            </div>
          ) : (
            <form
              className="mt-8 space-y-8"
              onSubmit={(e) => {
                e.preventDefault();
                void saveChanges();
              }}
            >
              <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                {/* left column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-200">
                      Title
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/70"
                      placeholder="Title your voyage…"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-200">
                      Description
                    </label>
                    <textarea
                      rows={8}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/70"
                      placeholder="Give viewers a sense of what this episode, video, or article is about."
                    />
                  </div>
                </div>

                {/* right column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-200">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-3 text-sm text-white capitalize outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/70"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-xs text-slate-200/80">
                    <p className="font-semibold text-slate-100 mb-1">
                      Pro tip
                    </p>
                    <p>
                      Keep your title tight and descriptive. The description is
                      where you can add links, references, and extra context for
                      your viewers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-black/45 hover:bg-sky-500 hover:-translate-y-0.5 transition disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/content/${params.id}`)
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-xs font-semibold text-slate-50 shadow-lg shadow-black/30 hover:bg-white/20 hover:-translate-y-0.5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}