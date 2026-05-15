"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ArrowRight, SkipForward, Video, Mic, FileText } from "lucide-react";
import {
  ImageUploadSlot,
  type UploadState,
} from "@/components/onboarding/ImageUploadSlot";

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = {
  id: string;
  name: string;
  type: "video" | "podcast" | "article";
};

type SlotKey =
  | "creator-avatar"
  | "creator-cover"
  | `ch-${string}-icon`
  | `ch-${string}-banner`;

type SlotData = {
  previewUrl: string | null;
  uploadState: UploadState;
  errorMessage: string | null;
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  video: <Video size={14} className="text-white/50" />,
  podcast: <Mic size={14} className="text-white/50" />,
  article: <FileText size={14} className="text-white/50" />,
};

const BUCKET = "creator-media";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ext(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "jpg";
}

function makeSlots(channels: Channel[]): Record<SlotKey, SlotData> {
  const blank: SlotData = {
    previewUrl: null,
    uploadState: "idle",
    errorMessage: null,
  };
  const initial: Record<string, SlotData> = {
    "creator-avatar": { ...blank },
    "creator-cover": { ...blank },
  };
  for (const ch of channels) {
    initial[`ch-${ch.id}-icon`] = { ...blank };
    initial[`ch-${ch.id}-banner`] = { ...blank };
  }
  return initial as Record<SlotKey, SlotData>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingBranding() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Record<SlotKey, SlotData>>({} as any);
  const [navigating, setNavigating] = useState(false);

  // ── Load user + channels ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: channelData } = await supabase
        .from("channels_v2")
        .select("id, name, type")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: true });

      const ch = (channelData as Channel[]) ?? [];
      setChannels(ch);
      setSlots(makeSlots(ch));
      setLoading(false);
    }

    load();
  }, []);

  // ── Upload helper ────────────────────────────────────────────────────────
  const uploadImage = useCallback(
    async (slotKey: SlotKey, file: File) => {
      if (!userId) return;

      // Instant preview
      const objectUrl = URL.createObjectURL(file);
      setSlots((prev) => ({
        ...prev,
        [slotKey]: { previewUrl: objectUrl, uploadState: "uploading", errorMessage: null },
      }));

      try {
        // Build storage path
        let storagePath: string;
        if (slotKey === "creator-avatar") {
          storagePath = `branding/${userId}/avatar.${ext(file)}`;
        } else if (slotKey === "creator-cover") {
          storagePath = `branding/${userId}/cover.${ext(file)}`;
        } else {
          // ch-{channelId}-icon or ch-{channelId}-banner
          const parts = slotKey.split("-"); // ["ch", channelId, "icon"|"banner"]
          const channelId = parts.slice(1, -1).join("-");
          const assetType = parts[parts.length - 1];
          storagePath = `branding/${userId}/channels/${channelId}/${assetType}.${ext(file)}`;
        }

        // Upload to Supabase Storage (upsert so re-uploads overwrite)
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, { upsert: true, contentType: file.type });

        if (uploadError) throw new Error(uploadError.message);

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

        // Persist URL to the right DB row
        if (slotKey === "creator-avatar") {
          await supabase
            .from("creators_v2")
            .update({ avatar_url: publicUrl })
            .eq("id", userId);
        } else if (slotKey === "creator-cover") {
          await supabase
            .from("creators_v2")
            .update({ banner_url: publicUrl })
            .eq("id", userId);
        } else {
          const parts = slotKey.split("-");
          const channelId = parts.slice(1, -1).join("-");
          const assetType = parts[parts.length - 1]; // "icon" | "banner"
          const dbField = assetType === "icon" ? "avatar_url" : "banner_url";
          await supabase
            .from("channels_v2")
            .update({ [dbField]: publicUrl })
            .eq("id", channelId)
            .eq("creator_id", userId);
        }

        setSlots((prev) => ({
          ...prev,
          [slotKey]: { previewUrl: publicUrl, uploadState: "done", errorMessage: null },
        }));
      } catch (err: any) {
        setSlots((prev) => ({
          ...prev,
          [slotKey]: {
            previewUrl: objectUrl, // keep preview
            uploadState: "error",
            errorMessage: err?.message ?? "Upload failed",
          },
        }));
      }
    },
    [userId, supabase]
  );

  const clearSlot = useCallback((slotKey: SlotKey) => {
    setSlots((prev) => ({
      ...prev,
      [slotKey]: { previewUrl: null, uploadState: "idle", errorMessage: null },
    }));
  }, []);

  const isAnyUploading = Object.values(slots).some(
    (s) => s.uploadState === "uploading"
  );

  function handleContinue() {
    setNavigating(true);
    router.push("/onboarding/finish");
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Add your branding
        </h1>
        <p className="text-white/50 text-sm">
          Upload avatars, icons, and banners. You can skip any of these and
          update them later.
        </p>
      </div>

      {/* ── Creator profile section ────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/35">
            Creator profile
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Cover image (full width) */}
        {slots["creator-cover"] && (
          <ImageUploadSlot
            label="Cover image"
            hint="recommended 1500 × 500px"
            aspectRatio="wide"
            previewUrl={slots["creator-cover"].previewUrl}
            uploadState={slots["creator-cover"].uploadState}
            errorMessage={slots["creator-cover"].errorMessage}
            onFile={(file) => uploadImage("creator-cover", file)}
            onClear={() => clearSlot("creator-cover")}
          />
        )}

        {/* Avatar (square, sits below cover) */}
        {slots["creator-avatar"] && (
          <div className="flex items-end gap-4">
            <ImageUploadSlot
              label="Avatar"
              hint="recommended 400 × 400px"
              aspectRatio="square"
              previewUrl={slots["creator-avatar"].previewUrl}
              uploadState={slots["creator-avatar"].uploadState}
              errorMessage={slots["creator-avatar"].errorMessage}
              onFile={(file) => uploadImage("creator-avatar", file)}
              onClear={() => clearSlot("creator-avatar")}
            />
            <p className="text-xs text-white/30 pb-1 leading-relaxed">
              Your avatar appears next to your name across Boatality. JPG, PNG,
              or WebP — max 5 MB.
            </p>
          </div>
        )}
      </div>

      {/* ── Per-channel sections ───────────────────────────────────────── */}
      {channels.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/35">
              Your channels
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {channels.filter((ch) => ch.type !== "video").map((ch) => {
            const iconSlot = slots[`ch-${ch.id}-icon` as SlotKey];
            const bannerSlot = slots[`ch-${ch.id}-banner` as SlotKey];
            if (!iconSlot || !bannerSlot) return null;

            return (
              <div
                key={ch.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4"
              >
                {/* Channel label */}
                <div className="flex items-center gap-2">
                  {CHANNEL_ICONS[ch.type]}
                  <span className="text-sm font-semibold text-white/70">
                    {ch.name}
                  </span>
                  <span className="text-xs text-white/25 capitalize">
                    · {ch.type}
                  </span>
                </div>

                {/* Banner */}
                <ImageUploadSlot
                  label="Channel banner"
                  hint="1500 × 500px"
                  aspectRatio="wide"
                  previewUrl={bannerSlot.previewUrl}
                  uploadState={bannerSlot.uploadState}
                  errorMessage={bannerSlot.errorMessage}
                  onFile={(file) =>
                    uploadImage(`ch-${ch.id}-banner` as SlotKey, file)
                  }
                  onClear={() => clearSlot(`ch-${ch.id}-banner` as SlotKey)}
                />

                {/* Icon */}
                <div className="flex items-end gap-4">
                  <ImageUploadSlot
                    label="Channel icon"
                    hint="400 × 400px"
                    aspectRatio="square"
                    previewUrl={iconSlot.previewUrl}
                    uploadState={iconSlot.uploadState}
                    errorMessage={iconSlot.errorMessage}
                    onFile={(file) =>
                      uploadImage(`ch-${ch.id}-icon` as SlotKey, file)
                    }
                    onClear={() => clearSlot(`ch-${ch.id}-icon` as SlotKey)}
                  />
                  <p className="text-xs text-white/30 pb-1 leading-relaxed">
                    Shown as the channel thumbnail and in search results.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleContinue}
          disabled={isAnyUploading}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <SkipForward size={14} />
          Skip for now
        </button>

        <button
          onClick={handleContinue}
          disabled={isAnyUploading || navigating}
          className="flex items-center justify-center gap-2 flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors tap-scale text-sm"
        >
          {isAnyUploading
            ? "Uploading…"
            : navigating
            ? "Continuing…"
            : "Continue"}
          {!isAnyUploading && !navigating && <ArrowRight size={15} />}
        </button>
      </div>
    </div>
  );
}
