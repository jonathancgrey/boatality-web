"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { uploadContent } from "../actions";
import { createClient } from "@/lib/supabaseClient";
import { uploadMediaToB2 } from "@/utils/upload/uploadMediaToB2";
import {
  Video,
  Mic2,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  X,
  RotateCw,
} from "lucide-react";

type BulkType = "video" | "podcast";

type QueueStatus = "queued" | "uploading" | "done" | "error";

type QueueItem = {
  id: string;
  file: File;
  title: string;
  status: QueueStatus;
  pct: number;
  error?: string;
};

const TYPES: { value: BulkType; label: string; icon: React.ElementType; accept: string; acceptLabel: string }[] = [
  { value: "video", label: "Videos", icon: Video, accept: ".mp4,video/mp4", acceptLabel: "MP4" },
  { value: "podcast", label: "Podcasts", icon: Mic2, accept: ".mp3,audio/mpeg", acceptLabel: "MP3" },
];

// Turn "My_Great Video-final.mp4" into "My Great Video final"
function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length ? cleaned.replace(/\b\w/g, (c) => c.toUpperCase()) : base;
}

export default function BulkUploadPage() {
  const supabase = createClient();

  const [channels, setChannels] = useState<any[]>([]);
  const [contentType, setContentType] = useState<BulkType>("video");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("channels_v2")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: true });
      setChannels(data ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchedChannel = useMemo(
    () => channels.find((c) => c.type === contentType),
    [channels, contentType]
  );
  const activeType = TYPES.find((t) => t.value === contentType)!;

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const additions: QueueItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      title: titleFromFilename(file.name),
      status: "queued",
      pct: 0,
    }));
    setQueue((q) => [...q, ...additions]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    setQueue((q) => q.filter((it) => it.id !== id));
  }

  async function uploadOne(item: QueueItem, channelId: string) {
    updateItem(item.id, { status: "uploading", pct: 0, error: undefined });
    try {
      const { key } = await uploadMediaToB2({
        file: item.file,
        channelId,
        contentType,
        onProgress: (pct) => updateItem(item.id, { pct }),
      });

      const base = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "https://media.boatality.com").replace(/\/+$/, "");
      const mediaUrl = `${base}/${key}`;

      const fd = new FormData();
      fd.set("contentType", contentType);
      fd.set("channelId", channelId);
      fd.set("title", item.title.trim() || item.file.name);
      fd.set("mediaUrl", mediaUrl);

      const result: any = await uploadContent(fd);
      if (result?.error) throw new Error(result.error);

      updateItem(item.id, { status: "done", pct: 100 });
    } catch (err: any) {
      updateItem(item.id, { status: "error", error: err?.message ?? "Upload failed" });
    }
  }

  async function runQueue() {
    if (!matchedChannel) return;
    setRunning(true);
    // Sequential: read the freshest queue each pass so retries/removes are respected
    // and one failure never blocks the rest.
    let remaining = queue.filter((it) => it.status === "queued" || it.status === "error");
    for (const item of remaining) {
      // Skip if it was removed mid-run
      const live = queueRef.current.find((q) => q.id === item.id);
      if (!live) continue;
      await uploadOne(live, matchedChannel.id);
    }
    setRunning(false);
  }

  // Keep a ref in sync so runQueue sees removals without re-closing over stale state
  const queueRef = useRef<QueueItem[]>([]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const counts = useMemo(() => {
    return {
      total: queue.length,
      done: queue.filter((q) => q.status === "done").length,
      error: queue.filter((q) => q.status === "error").length,
      pending: queue.filter((q) => q.status === "queued" || q.status === "uploading").length,
    };
  }, [queue]);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Bulk upload</h1>
        <p className="text-sm text-white/45 mt-1">
          Bring your back catalog over in one pass. Select many files, we upload them as drafts —
          then you set thumbnails and publish when you're ready.
        </p>
      </div>

      {/* Type selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-3">Content type</p>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setContentType(value)}
              className={[
                "flex items-center gap-2.5 rounded-xl border px-4 py-3 transition-all",
                contentType === value
                  ? "border-brand-orange/50 bg-brand-orange/10 ring-1 ring-brand-orange/20"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20",
              ].join(" ")}
            >
              <Icon size={16} className={contentType === value ? "text-brand-orange-soft" : "text-white/40"} />
              <span className={`text-sm font-semibold ${contentType === value ? "text-white" : "text-white/45"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3">
          {matchedChannel ? (
            <p className="text-xs text-white/35">
              Will post to <span className="text-white/60 font-medium">{matchedChannel.name}</span>
            </p>
          ) : (
            <p className="text-xs text-amber-400/70">
              You don't have a {contentType} channel yet —{" "}
              <a href="/dashboard/branding" className="underline underline-offset-2 hover:text-amber-400">
                enable it in Branding
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06] px-6 py-8 text-center cursor-pointer transition-all"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); addFiles(e.dataTransfer.files); }}
      >
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-white/30">
          <Upload size={20} />
        </div>
        <p className="text-sm font-semibold text-white/60">Drop your {activeType.acceptLabel} files here</p>
        <p className="text-xs text-white/30 mt-1">or tap to browse — select as many as you like</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={activeType.accept}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {counts.total} file{counts.total === 1 ? "" : "s"}
              {counts.done > 0 && <span className="text-green-400/70"> · {counts.done} done</span>}
              {counts.error > 0 && <span className="text-red-400/70"> · {counts.error} failed</span>}
            </p>
            {!running && queue.some((q) => q.status === "done") && (
              <button
                onClick={() => setQueue((q) => q.filter((it) => it.status !== "done"))}
                className="text-xs text-white/35 hover:text-white/60"
              >
                Clear completed
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {queue.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={item.status} />
                  <div className="min-w-0 flex-1">
                    {item.status === "queued" ? (
                      <input
                        value={item.title}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        className="w-full bg-transparent text-sm text-white/90 focus:outline-none border-b border-transparent focus:border-white/20 transition"
                      />
                    ) : (
                      <p className="truncate text-sm text-white/80">{item.title}</p>
                    )}
                    <p className="truncate text-[11px] text-white/30">
                      {item.file.name} · {(item.file.size / 1024 / 1024).toFixed(1)} MB
                      {item.status === "error" && item.error && (
                        <span className="text-red-400/70"> · {item.error}</span>
                      )}
                    </p>
                    {item.status === "uploading" && (
                      <div className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-brand-orange rounded-full transition-all duration-300"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === "uploading" && (
                      <span className="text-xs tabular-nums text-white/40">{item.pct}%</span>
                    )}
                    {item.status === "error" && !running && matchedChannel && (
                      <button
                        onClick={() => uploadOne(item, matchedChannel.id)}
                        className="text-white/40 hover:text-white"
                        aria-label="Retry"
                      >
                        <RotateCw size={14} />
                      </button>
                    )}
                    {(item.status === "queued" || item.status === "error") && !running && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-white/30 hover:text-white/70"
                        aria-label="Remove"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={runQueue}
            disabled={running || !matchedChannel || counts.pending === 0 && counts.error === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 transition-colors"
          >
            {running ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Uploading {counts.done + 1} of {counts.total}…
              </>
            ) : (
              <>
                <Upload size={15} />
                {counts.error > 0 ? `Upload ${counts.pending} + retry ${counts.error}` : `Upload ${counts.pending} file${counts.pending === 1 ? "" : "s"}`}
              </>
            )}
          </button>

          {!running && counts.pending === 0 && counts.error === 0 && counts.done > 0 && (
            <div className="flex items-center gap-2.5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              <Check size={14} className="flex-shrink-0" />
              All {counts.done} uploaded as drafts. Head to{" "}
              <a href="/dashboard/content" className="underline underline-offset-2">your library</a> to add thumbnails and publish.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: QueueStatus }) {
  if (status === "done")
    return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/15 text-green-400"><Check size={13} /></span>;
  if (status === "error")
    return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15 text-red-400"><AlertCircle size={13} /></span>;
  if (status === "uploading")
    return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange-soft"><Loader2 size={13} className="animate-spin" /></span>;
  return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8 text-white/30"><Upload size={12} /></span>;
}
