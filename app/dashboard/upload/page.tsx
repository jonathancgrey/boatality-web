"use client";

import { useEffect, useState, useRef } from "react";
import { uploadContent } from "./actions";
import { createClient } from "@/lib/supabaseClient";
import { uploadMediaToB2 } from "@/utils/upload/uploadMediaToB2";

export default function UploadPage() {
  const supabase = createClient();

  const [channels, setChannels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [contentType, setContentType] = useState<"video" | "podcast" | "article">("video");
  const [status, setStatus] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: userChannels, error: chErr } = await supabase
      .from("channels_v2")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: true });

    if (chErr) console.error("channels_v2 load error:", chErr);
    setChannels(userChannels || []);

    const { data: cats, error: catErr } = await supabase.from("categories").select("*");
    if (catErr) console.error("categories load error:", catErr);
    setCategories(cats || []);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsUploading(true);
    setStatus("Uploading…");

    try {
      if (!selectedChannel) {
        setStatus("Error: Please select a channel before uploading.");
        return;
      }

      const file = formData.get("file") as File | null;
      if (!file) {
        setStatus("Error: Missing file.");
        return;
      }

      // 1) Upload bytes to B2 (multipart)
      const { key, bucket } = await uploadMediaToB2({
        file,
        channelId: selectedChannel,
        contentType,
        onProgress: (pct) => setStatus(`Uploading… ${pct}%`),
      });

      // 2) Compute media URL (prefer configured public base; default to Cloudflare media hostname)
      const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "https://media.boatality.com";
      const baseLooksPlaceholder = base.includes("<") || base.includes("YOUR_") || base.includes("example");
      const safeBase = baseLooksPlaceholder ? "https://media.boatality.com" : base;
      const mediaUrl = `${safeBase.replace(/\/+$/, "")}/${key}`;

      // 3) Provide media info to server action so it can insert into content_v2
      formData.set("mediaUrl", mediaUrl);
      formData.set("mediaKey", key);
      formData.set("mediaBucket", bucket);

      const result: any = await uploadContent(formData);

      if (result?.error) {
        setStatus("Error: " + result.error);
      } else {
        setStatus("Upload successful!");
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (e: any) {
      console.error(e);
      setStatus("Error: " + (e?.message ?? String(e)));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 md:px-0 py-10 bg-[#020b16] bg-noise animate-fade-slide-up">
      <form
        action={handleSubmit}
        className="space-y-6 p-6 max-w-xl mx-auto rounded-3xl bg-white/5 border border-white/10 shadow-2xl shadow-black/40 backdrop-blur-2xl transition-all duration-500 hover:shadow-3xl"
      >
        <div className="rounded-2xl bg-white/5 border border-white/10 shadow-2xl shadow-black/40 p-8 backdrop-blur-xl space-y-8 hover:shadow-3xl transition-all duration-500">
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Upload Content</h1>
          <p className="text-slate-400 text-sm">Add a new video, podcast, or article to your library.</p>

          {/* Content Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">Content Type</label>
            <select
              name="contentType"
              className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60 transition-all duration-300 hover:bg-white/20"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as any)}
            >
              <option value="video">Video</option>
              <option value="podcast">Podcast</option>
              <option value="article">Article</option>
            </select>
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">Channel</label>
            <select
              name="channelId"
              required
              className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60 transition-all duration-300 hover:bg-white/20"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
            >
              <option value="">-- Select Channel --</option>
              {channels.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <input
            name="title"
            placeholder="Title"
            className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60 transition-all duration-300 hover:bg-white/20"
            required
          />

          {/* Description */}
          <textarea
            name="description"
            placeholder="Description"
            className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60 transition-all duration-300 hover:bg-white/20"
          />

          {/* Primary Category (content-level) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">Primary Category</label>
            <select
              name="primaryCategory"
              className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60 transition-all duration-300 hover:bg-white/20"
              value={primaryCategory}
              onChange={(e) => setPrimaryCategory(e.target.value)}
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">Content File</label>
            <div
              className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-8 text-sm text-slate-200/85 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 hover:border-sky-400/70 hover:bg-white/10 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-black/30"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = e.dataTransfer.files?.[0];
                if (f && fileInputRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(f);
                  fileInputRef.current.files = dt.files;
                  setFileName(f.name);
                }
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 drop-shadow-md">
                Drop your file here
              </p>
              <p className="text-[11px] text-slate-400">or click to browse from your device</p>
              <p className="mt-2 text-xs text-slate-300/90">
                {fileName ? (
                  <>
                    Selected: <span className="font-semibold text-sky-200">{fileName}</span>
                  </>
                ) : (
                  "No file selected yet"
                )}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              required
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </div>

          {/* Thumbnail (still goes to Supabase for now, we’ll move next) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">Thumbnail (optional)</label>
            <input
              type="file"
              name="thumbnail"
              className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60 transition-all duration-300 hover:bg-white/20"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full rounded-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 shadow-xl shadow-black/40 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
          >
            {isUploading ? "Uploading…" : "Upload Content"}
          </button>

          {status && <p className="text-center text-slate-300 text-sm pt-2">{status}</p>}

          {isUploading && (
            <div className="mt-4 w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-sky-500 animate-pulse-fast w-1/2"></div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
