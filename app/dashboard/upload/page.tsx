"use client";

import { useEffect, useState, useRef } from "react";
import { uploadContent } from "./actions";
import { createClient } from "@/lib/supabaseClient";
import { uploadMediaToB2 } from "@/utils/upload/uploadMediaToB2";
import {
  Video,
  Mic2,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "video",   label: "Video",   icon: Video,    desc: "Long-form, shorts, walkthroughs" },
  { value: "podcast", label: "Podcast", icon: Mic2,     desc: "Audio episodes & interviews" },
  { value: "article", label: "Article", icon: FileText, desc: "Written posts & logbook entries" },
] as const;

type ContentTypeValue = "video" | "podcast" | "article";

const inputBase =
  "w-full rounded-xl bg-white/[0.06] border border-white/15 px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#C84121]/40 focus:border-[#C84121]/40 transition";

const selectBase =
  "w-full rounded-xl bg-white/[0.06] border border-white/15 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C84121]/40 focus:border-[#C84121]/40 transition appearance-none";

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
        {label}
        {optional && <span className="ml-1.5 font-normal normal-case tracking-normal text-white/25">optional</span>}
      </label>
      {children}
    </div>
  );
}

export default function UploadPage() {
  const supabase = createClient();

  const [channels, setChannels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [contentType, setContentType] = useState<ContentTypeValue>("video");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: chData }, { data: catData }] = await Promise.all([
        supabase.from("channels_v2").select("*").eq("creator_id", user.id).order("created_at", { ascending: true }),
        supabase.from("categories").select("*"),
      ]);

      setChannels(chData ?? []);
      setCategories(catData ?? []);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsUploading(true);
    setSuccess(false);
    setErrorMsg(null);
    setUploadPct(0);

    try {
      if (!selectedChannel) {
        setErrorMsg("Please select a channel before uploading.");
        return;
      }

      const file = formData.get("file") as File | null;
      if (!file) {
        setErrorMsg("Please select a file.");
        return;
      }

      const { key, bucket } = await uploadMediaToB2({
        file,
        channelId: selectedChannel,
        contentType,
        onProgress: (pct) => setUploadPct(pct),
      });

      const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "https://media.boatality.com";
      const safeBase = base.includes("<") || base.includes("YOUR_") ? "https://media.boatality.com" : base;
      const mediaUrl = `${safeBase.replace(/\/+$/, "")}/${key}`;

      formData.set("mediaUrl", mediaUrl);
      formData.set("mediaKey", key);
      formData.set("mediaBucket", bucket);

      const result: any = await uploadContent(formData);

      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        setSuccess(true);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Upload content</h1>
        <p className="text-sm text-white/45 mt-1">
          Add a new video, podcast, or article to your library.
        </p>
      </div>

      {/* Content type selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-3">Content type</p>
        <div className="grid grid-cols-3 gap-3">
          {CONTENT_TYPES.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setContentType(value)}
              className={[
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all",
                contentType === value
                  ? "border-[#C84121]/50 bg-[#C84121]/10 ring-1 ring-[#C84121]/20"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <div className={[
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                contentType === value ? "bg-[#C84121] text-white" : "bg-white/10 text-white/40",
              ].join(" ")}>
                <Icon size={18} />
              </div>
              <span className={`text-xs font-semibold ${contentType === value ? "text-white" : "text-white/40"}`}>
                {label}
              </span>
              <span className="text-[10px] text-white/25 leading-tight hidden sm:block">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form action={handleSubmit} className="space-y-5">
        <input type="hidden" name="contentType" value={contentType} />

        {/* Channel */}
        <Field label="Channel">
          <div className="relative">
            <select
              name="channelId"
              required
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className={selectBase}
            >
              <option value="">Select a channel…</option>
              {channels.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </Field>

        {/* Title */}
        <Field label="Title">
          <input
            name="title"
            required
            placeholder={`Your ${contentType} title…`}
            className={inputBase}
          />
        </Field>

        {/* Description */}
        <Field label="Description" optional>
          <textarea
            name="description"
            rows={3}
            placeholder="A short description of what this is about…"
            className={`${inputBase} resize-none`}
          />
        </Field>

        {/* Category */}
        <Field label="Category" optional>
          <div className="relative">
            <select
              name="primaryCategory"
              value={primaryCategory}
              onChange={(e) => setPrimaryCategory(e.target.value)}
              className={selectBase}
            >
              <option value="">Select a category…</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </Field>

        {/* File upload */}
        <Field label="Content file">
          <div
            className={[
              "rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-all",
              fileName
                ? "border-[#C84121]/40 bg-[#C84121]/[0.06]"
                : "border-white/15 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
            ].join(" ")}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
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
            <div className={[
              "mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl",
              fileName ? "bg-[#C84121]/20 text-[#f4845f]" : "bg-white/8 text-white/30",
            ].join(" ")}>
              <Upload size={20} />
            </div>
            {fileName ? (
              <>
                <p className="text-sm font-semibold text-white/80 truncate px-4">{fileName}</p>
                <p className="text-xs text-white/35 mt-1">Tap to change file</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white/60">Drop your file here</p>
                <p className="text-xs text-white/30 mt-1">or tap to browse</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            required
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </Field>

        {/* Thumbnail */}
        <Field label="Thumbnail" optional>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className={inputBase}
          />
        </Field>

        {/* Upload progress bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Uploading…</span>
              <span>{uploadPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#C84121] rounded-full transition-all duration-300"
                style={{ width: `${uploadPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={14} className="flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2.5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            <Check size={14} className="flex-shrink-0" />
            Upload successful! Your content is in your library.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C84121] hover:bg-[#d94d2a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload size={15} />
              Upload content
            </>
          )}
        </button>
      </form>
    </div>
  );
}
