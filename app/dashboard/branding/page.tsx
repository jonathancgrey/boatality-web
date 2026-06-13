"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  ImageUploadSlot,
  type UploadState,
} from "@/components/onboarding/ImageUploadSlot";
import { slugify } from "@/utils/slugify";
import {
  Check,
  Globe,
  Instagram,
  Video,
  Mic,
  FileText,
  Youtube,
  AtSign,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Creator = {
  display_name: string;
  bio: string;
  slug: string;
  website_url: string;
  youtube_url: string;
  instagram_url: string;
  tiktok_url: string;
  avatar_url: string | null;
  banner_url: string | null;
};

type ChannelType = "video" | "podcast" | "article";

type Channel = {
  id: string;
  name: string;
  type: ChannelType;
  enabled: boolean;
  avatar_url: string | null;
  banner_url: string | null;
};

const ALL_CHANNEL_TYPES: {
  type: ChannelType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  defaultName: string;
}[] = [
  { type: "video",   label: "Videos",   desc: "Long & short-form video",         icon: <Video size={18} />,    defaultName: "Videos"   },
  { type: "podcast", label: "Podcast",  desc: "Audio episodes & interviews",      icon: <Mic size={18} />,      defaultName: "Podcast"  },
  { type: "article", label: "Articles", desc: "Written posts & long-form content", icon: <FileText size={18} />, defaultName: "Articles" },
];

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
  video:   <Video    size={14} className="text-white/50" />,
  podcast: <Mic      size={14} className="text-white/50" />,
  article: <FileText size={14} className="text-white/50" />,
};

const BUCKET = "creator-media";

const EMPTY_CREATOR: Creator = {
  display_name: "",
  bio: "",
  slug: "",
  website_url: "",
  youtube_url: "",
  instagram_url: "",
  tiktok_url: "",
  avatar_url: null,
  banner_url: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ext(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "jpg";
}

function makeSlots(
  creator: Creator,
  channels: Channel[]
): Record<SlotKey, SlotData> {
  const make = (url: string | null): SlotData => ({
    previewUrl: url,
    uploadState: url ? "done" : "idle",
    errorMessage: null,
  });

  const initial: Record<string, SlotData> = {
    "creator-avatar": make(creator.avatar_url),
    "creator-cover": make(creator.banner_url),
  };

  for (const ch of channels) {
    initial[`ch-${ch.id}-icon`] = make(ch.avatar_url);
    initial[`ch-${ch.id}-banner`] = make(ch.banner_url);
  }

  return initial as Record<SlotKey, SlotData>;
}

// ─── Tiktok icon (lucide doesn't have one) ────────────────────────────────────

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

// ─── Input field component ────────────────────────────────────────────────────

function Field({
  label,
  hint,
  optional,
  prefix,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  prefix?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
        {label}
        {optional && (
          <span className="ml-1.5 font-normal normal-case tracking-normal text-white/25">
            optional
          </span>
        )}
        {hint && (
          <span className="ml-1.5 font-normal normal-case tracking-normal text-white/25">
            {hint}
          </span>
        )}
      </label>
      {prefix ? (
        <div className="flex items-center rounded-xl bg-white/[0.06] border border-white/15 overflow-hidden focus-within:ring-2 focus-within:ring-brand-orange/40 focus-within:border-brand-orange/40 transition">
          <div className="pl-3.5 pr-2 text-white/35 flex-shrink-0">{prefix}</div>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl bg-white/[0.06] border border-white/15 px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/40 transition";

const prefixInputBase =
  "flex-1 bg-transparent border-0 py-3 pr-4 text-sm text-white placeholder-white/25 focus:outline-none";

// ─── Main component ───────────────────────────────────────────────────────────

export default function BrandingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [creator, setCreator] = useState<Creator>(EMPTY_CREATOR);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelNames, setChannelNames] = useState<Record<string, string>>({});
  const [slots, setSlots] = useState<Record<SlotKey, SlotData>>({} as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
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

      const [{ data: creatorData }, { data: channelData }] = await Promise.all([
        supabase
          .from("creators_v2")
          .select(
            "display_name, bio, slug, website_url, youtube_url, instagram_url, tiktok_url, avatar_url, banner_url"
          )
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("channels_v2")
          .select("id, name, type, enabled, avatar_url, banner_url")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      const c: Creator = {
        display_name: creatorData?.display_name ?? "",
        bio: creatorData?.bio ?? "",
        slug: creatorData?.slug ?? "",
        website_url: creatorData?.website_url ?? "",
        youtube_url: creatorData?.youtube_url ?? "",
        instagram_url: creatorData?.instagram_url ?? "",
        tiktok_url: creatorData?.tiktok_url ?? "",
        avatar_url: creatorData?.avatar_url ?? null,
        banner_url: creatorData?.banner_url ?? null,
      };

      const ch: Channel[] = (channelData ?? []).map((r: any) => ({
        id:         r.id,
        name:       r.name,
        type:       r.type,
        enabled:    r.enabled ?? true,
        avatar_url: r.avatar_url ?? null,
        banner_url: r.banner_url ?? null,
      }));
      setCreator(c);
      setChannels(ch);
      setChannelNames(Object.fromEntries(ch.map((x) => [x.id, x.name])));
      setSlots(makeSlots(c, ch));
      setLoading(false);
    }

    load();
  }, []);

  // ── Auto-generate slug from display_name ─────────────────────────────────
  function handleDisplayNameChange(val: string) {
    setCreator((prev) => ({
      ...prev,
      display_name: val,
      // Only auto-fill slug if user hasn't manually edited it
      slug: slugEdited ? prev.slug : slugify(val),
    }));
  }

  function handleSlugChange(val: string) {
    setSlugEdited(true);
    setCreator((prev) => ({ ...prev, slug: slugify(val) }));
  }

  // ── Upload image ──────────────────────────────────────────────────────────
  const uploadImage = useCallback(
    async (slotKey: SlotKey, file: File) => {
      if (!userId) return;

      const objectUrl = URL.createObjectURL(file);
      setSlots((prev) => ({
        ...prev,
        [slotKey]: { previewUrl: objectUrl, uploadState: "uploading", errorMessage: null },
      }));

      try {
        let storagePath: string;
        if (slotKey === "creator-avatar") {
          storagePath = `branding/${userId}/avatar.${ext(file)}`;
        } else if (slotKey === "creator-cover") {
          storagePath = `branding/${userId}/cover.${ext(file)}`;
        } else {
          const parts = slotKey.split("-");
          const channelId = parts.slice(1, -1).join("-");
          const assetType = parts[parts.length - 1];
          storagePath = `branding/${userId}/channels/${channelId}/${assetType}.${ext(file)}`;
        }

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, { upsert: true, contentType: file.type });

        if (uploadError) throw new Error(uploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

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
          const assetType = parts[parts.length - 1];
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
            previewUrl: objectUrl,
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

  // ── Toggle channel on/off ─────────────────────────────────────────────────
  const [toggling, setToggling] = useState<ChannelType | null>(null);

  async function toggleChannel(type: ChannelType) {
    if (!userId || toggling) return;
    setToggling(type);

    try {
      const existing = channels.find((ch) => ch.type === type);

      if (!existing) {
        // Channel doesn't exist yet — create it enabled
        const opt = ALL_CHANNEL_TYPES.find((o) => o.type === type)!;
        const { data, error } = await supabase
          .from("channels_v2")
          .insert({ creator_id: userId, name: opt.defaultName, type, enabled: true })
          .select("id, name, type, enabled, avatar_url, banner_url")
          .single();

        if (error) throw new Error(error.message);

        const newCh: Channel = {
          id:         data.id,
          name:       data.name,
          type:       data.type,
          enabled:    true,
          avatar_url: null,
          banner_url: null,
        };
        setChannels((prev) => [...prev, newCh]);
        setChannelNames((prev) => ({ ...prev, [data.id]: data.name }));
        setSlots((prev) => ({
          ...prev,
          [`ch-${data.id}-icon`]:   { previewUrl: null, uploadState: "idle", errorMessage: null },
          [`ch-${data.id}-banner`]: { previewUrl: null, uploadState: "idle", errorMessage: null },
        }));
      } else {
        // Toggle the enabled flag
        const newEnabled = !existing.enabled;
        const { error } = await supabase
          .from("channels_v2")
          .update({ enabled: newEnabled })
          .eq("id", existing.id)
          .eq("creator_id", userId);

        if (error) throw new Error(error.message);

        setChannels((prev) =>
          prev.map((ch) => ch.id === existing.id ? { ...ch, enabled: newEnabled } : ch)
        );
      }
    } catch (err: any) {
      setSaveError(err?.message ?? "Failed to update channel.");
    } finally {
      setToggling(null);
    }
  }

  // ── Save text fields ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Save creator profile
      const { error: creatorErr } = await supabase
        .from("creators_v2")
        .update({
          display_name: creator.display_name.trim(),
          bio: creator.bio.trim() || null,
          slug: creator.slug.trim() || null,
          website_url: creator.website_url.trim() || null,
          youtube_url: creator.youtube_url.trim() || null,
          instagram_url: creator.instagram_url.trim() || null,
          tiktok_url: creator.tiktok_url.trim() || null,
        })
        .eq("id", userId);

      if (creatorErr) throw new Error(creatorErr.message);

      // Save channel names (only where changed)
      const channelUpdates = channels.filter(
        (ch) => channelNames[ch.id] !== ch.name
      );

      for (const ch of channelUpdates) {
        const { error: chErr } = await supabase
          .from("channels_v2")
          .update({ name: channelNames[ch.id].trim() })
          .eq("id", ch.id)
          .eq("creator_id", userId);

        if (chErr) throw new Error(chErr.message);
      }

      // Refresh channel list to reflect saved names
      setChannels((prev) =>
        prev.map((ch) => ({ ...ch, name: channelNames[ch.id] }))
      );

      setSaveSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const isAnyUploading = Object.values(slots).some(
    (s) => s.uploadState === "uploading"
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-10">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Branding</h1>
          <p className="text-sm text-white/45 mt-1">
            Manage your public profile, channel names, and social links.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || isAnyUploading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex-shrink-0"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : saveSuccess ? (
            <>
              <Check size={14} />
              Saved
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {saveError}
        </div>
      )}

      {/* ── Section: Creator profile ───────────────────────────────────── */}
      <section className="space-y-5">
        <SectionDivider label="Creator profile" />

        {/* Cover image */}
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

        {/* Avatar */}
        {slots["creator-avatar"] && (
          <div className="flex items-end gap-5">
            <ImageUploadSlot
              label="Avatar"
              hint="400 × 400px"
              aspectRatio="square"
              previewUrl={slots["creator-avatar"].previewUrl}
              uploadState={slots["creator-avatar"].uploadState}
              errorMessage={slots["creator-avatar"].errorMessage}
              onFile={(file) => uploadImage("creator-avatar", file)}
              onClear={() => clearSlot("creator-avatar")}
            />
            <p className="text-xs text-white/30 pb-1 leading-relaxed">
              Shown next to your name across Boatality.
              <br />
              JPG, PNG, or WebP — max 5 MB.
            </p>
          </div>
        )}

        {/* Display name */}
        <Field label="Display name">
          <input
            className={inputBase}
            placeholder="Captain Grey"
            value={creator.display_name}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            maxLength={60}
          />
          <p className="text-xs text-white/20 text-right mt-1">
            {creator.display_name.length}/60
          </p>
        </Field>

        {/* Handle */}
        <Field
          label="Handle"
          hint="your public @username"
          optional
          prefix={<AtSign size={14} />}
        >
          <input
            className={prefixInputBase}
            placeholder="captaingrey"
            value={creator.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            maxLength={40}
          />
        </Field>

        {/* Bio */}
        <Field label="Bio" optional>
          <textarea
            className={`${inputBase} resize-none`}
            placeholder="A few words about you or your content…"
            rows={3}
            value={creator.bio}
            onChange={(e) =>
              setCreator((prev) => ({ ...prev, bio: e.target.value }))
            }
            maxLength={280}
          />
          <p className="text-xs text-white/20 text-right mt-1">
            {creator.bio.length}/280
          </p>
        </Field>
      </section>

      {/* ── Section: Social links ──────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Social links" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Website" optional prefix={<Globe size={14} />}>
            <input
              className={prefixInputBase}
              placeholder="https://yoursite.com"
              value={creator.website_url}
              onChange={(e) =>
                setCreator((prev) => ({
                  ...prev,
                  website_url: e.target.value,
                }))
              }
              type="url"
            />
          </Field>

          <Field label="YouTube" optional prefix={<Youtube size={14} />}>
            <input
              className={prefixInputBase}
              placeholder="https://youtube.com/@handle"
              value={creator.youtube_url}
              onChange={(e) =>
                setCreator((prev) => ({
                  ...prev,
                  youtube_url: e.target.value,
                }))
              }
              type="url"
            />
          </Field>

          <Field label="Instagram" optional prefix={<Instagram size={14} />}>
            <input
              className={prefixInputBase}
              placeholder="https://instagram.com/handle"
              value={creator.instagram_url}
              onChange={(e) =>
                setCreator((prev) => ({
                  ...prev,
                  instagram_url: e.target.value,
                }))
              }
              type="url"
            />
          </Field>

          <Field
            label="TikTok"
            optional
            prefix={<TikTokIcon size={14} />}
          >
            <input
              className={prefixInputBase}
              placeholder="https://tiktok.com/@handle"
              value={creator.tiktok_url}
              onChange={(e) =>
                setCreator((prev) => ({
                  ...prev,
                  tiktok_url: e.target.value,
                }))
              }
              type="url"
            />
          </Field>
        </div>
      </section>

      {/* ── Section: Channels ──────────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionDivider label="Your channels" />

        {/* Channel type toggle cards */}
        <div className="grid grid-cols-3 gap-3">
          {ALL_CHANNEL_TYPES.map((opt) => {
            const existing = channels.find((ch) => ch.type === opt.type);
            const isEnabled = existing?.enabled ?? false;
            const isLoading = toggling === opt.type;

            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => toggleChannel(opt.type)}
                disabled={!!toggling}
                className={[
                  "relative flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all duration-200 disabled:cursor-not-allowed",
                  isEnabled
                    ? "border-brand-orange/50 bg-brand-orange/10 ring-1 ring-brand-orange/20"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {/* Icon */}
                <div className={[
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                  isEnabled ? "bg-brand-orange text-white" : "bg-white/10 text-white/40",
                ].join(" ")}>
                  {isLoading
                    ? <Loader2 size={16} className="animate-spin" />
                    : opt.icon}
                </div>

                {/* Label */}
                <span className={[
                  "text-xs font-semibold transition-colors",
                  isEnabled ? "text-white" : "text-white/40",
                ].join(" ")}>
                  {opt.label}
                </span>

                {/* Status pill */}
                <span className={[
                  "text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                  isEnabled
                    ? "bg-brand-orange/20 text-brand-orange-soft"
                    : "bg-white/5 text-white/25",
                ].join(" ")}>
                  {isEnabled ? "On" : "Off"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Per-channel branding — only shown for enabled channels */}
        {channels.filter((ch) => ch.enabled).map((ch) => {
            const iconSlot = slots[`ch-${ch.id}-icon` as SlotKey];
            const bannerSlot = slots[`ch-${ch.id}-banner` as SlotKey];
            if (!iconSlot || !bannerSlot) return null;

            return (
              <div
                key={ch.id}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 space-y-5"
              >
                {/* Channel header */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    {CHANNEL_ICONS[ch.type]}
                  </div>
                  <span className="text-sm font-semibold text-white/80 capitalize">
                    {ch.type} channel
                  </span>
                </div>

                {/* Channel name */}
                <Field label="Channel name">
                  <input
                    className={inputBase}
                    value={channelNames[ch.id] ?? ch.name}
                    onChange={(e) =>
                      setChannelNames((prev) => ({
                        ...prev,
                        [ch.id]: e.target.value,
                      }))
                    }
                    maxLength={80}
                  />
                </Field>

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
                    Shown as the channel thumbnail
                    <br />
                    and in search results.
                  </p>
                </div>
              </div>
            );
          })}
      </section>

      {/* Bottom save button */}
      <div className="pt-2 pb-8">
        <button
          onClick={handleSave}
          disabled={saving || isAnyUploading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : saveSuccess ? (
            <>
              <Check size={14} />
              Changes saved
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/8" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
        {label}
      </span>
      <div className="h-px flex-1 bg-white/8" />
    </div>
  );
}
