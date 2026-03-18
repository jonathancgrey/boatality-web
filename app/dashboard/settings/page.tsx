"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  Mail,
  KeyRound,
  Bell,
  Globe,
  ShieldAlert,
  Download,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationPrefs = {
  platform_updates: boolean;
  new_follower: boolean;
  performance_summaries: boolean;
};

type SettingsData = {
  email: string;
  notification_prefs: NotificationPrefs;
  is_public: boolean;
  listed_in_directory: boolean;
};

const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  platform_updates: true,
  new_follower: true,
  performance_summaries: false,
};

// ─── Section Divider ──────────────────────────────────────────────────────────

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

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-white/[0.06] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/85">{label}</p>
        <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative flex-shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C84121]/50 disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? "bg-[#C84121]" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsData>({
    email: "",
    notification_prefs: DEFAULT_NOTIF_PREFS,
    is_public: true,
    listed_in_directory: true,
  });

  // Saving states
  const [savingToggles, setSavingToggles] = useState(false);
  const [toggleSaveSuccess, setToggleSaveSuccess] = useState(false);
  const [toggleSaveError, setToggleSaveError] = useState<string | null>(null);

  // Password reset
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("creators_v2")
        .select("notification_prefs, is_public, listed_in_directory")
        .eq("id", user.id)
        .maybeSingle();

      setSettings({
        email: user.email ?? "",
        notification_prefs: data?.notification_prefs ?? DEFAULT_NOTIF_PREFS,
        is_public: data?.is_public ?? true,
        listed_in_directory: data?.listed_in_directory ?? true,
      });

      setLoading(false);
    }
    load();
  }, []);

  // ── Auto-save toggles ───────────────────────────────────────────────────────
  async function saveToggles(next: Partial<SettingsData>) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    setSavingToggles(true);
    setToggleSaveError(null);
    setToggleSaveSuccess(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingToggles(false); return; }

    const { error } = await supabase
      .from("creators_v2")
      .update({
        notification_prefs: merged.notification_prefs,
        is_public: merged.is_public,
        listed_in_directory: merged.listed_in_directory,
      })
      .eq("id", user.id);

    setSavingToggles(false);
    if (error) {
      setToggleSaveError(error.message);
    } else {
      setToggleSaveSuccess(true);
      setTimeout(() => setToggleSaveSuccess(false), 2500);
    }
  }

  function updateNotifPref(key: keyof NotificationPrefs, val: boolean) {
    const next = { ...settings.notification_prefs, [key]: val };
    saveToggles({ notification_prefs: next });
  }

  // ── Password reset ───────────────────────────────────────────────────────────
  async function sendPasswordReset() {
    if (!settings.email || sendingReset) return;
    setSendingReset(true);
    setResetError(null);
    setResetSent(false);

    const { error } = await supabase.auth.resetPasswordForEmail(settings.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
    });

    setSendingReset(false);
    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
  }

  // ── Delete account ───────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    setDeleteError(null);

    const res = await fetch("/api/settings/delete-account", { method: "POST" });
    const json = await res.json();

    if (!json.ok) {
      setDeleting(false);
      setDeleteError(json.error ?? "Something went wrong");
      return;
    }

    // Sign out and redirect
    await supabase.auth.signOut();
    router.push("/login");
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-10">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-sm text-white/45 mt-1">
            Manage your account, notifications, and privacy preferences.
          </p>
        </div>

        {/* Auto-save indicator */}
        <div className="flex items-center gap-2 text-xs font-medium flex-shrink-0 mt-1">
          {savingToggles && (
            <span className="flex items-center gap-1.5 text-white/40">
              <Loader2 size={12} className="animate-spin" />
              Saving…
            </span>
          )}
          {toggleSaveSuccess && !savingToggles && (
            <span className="flex items-center gap-1.5 text-green-400">
              <Check size={12} />
              Saved
            </span>
          )}
          {toggleSaveError && !savingToggles && (
            <span className="flex items-center gap-1.5 text-red-400">
              <AlertCircle size={12} />
              {toggleSaveError}
            </span>
          )}
        </div>
      </div>

      {/* ── Section: Account ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Account" />

        {/* Email */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-white/40" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Email address</p>
                <p className="text-sm text-white/80 mt-0.5 truncate">{settings.email}</p>
              </div>
            </div>
            <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white/25 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-full">
              Read-only
            </span>
          </div>
        </div>

        {/* Password */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                <KeyRound className="h-4 w-4 text-white/40" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Password</p>
                <p className="text-sm text-white/80 mt-0.5">
                  {resetSent
                    ? "Reset email sent — check your inbox"
                    : "Change your account password"}
                </p>
                {resetError && (
                  <p className="text-xs text-red-400 mt-1">{resetError}</p>
                )}
              </div>
            </div>
            <button
              onClick={sendPasswordReset}
              disabled={sendingReset || resetSent}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.10] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {sendingReset ? (
                <Loader2 size={12} className="animate-spin" />
              ) : resetSent ? (
                <Check size={12} className="text-green-400" />
              ) : (
                <ChevronRight size={12} />
              )}
              {resetSent ? "Email sent" : "Send reset email"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Section: Notifications ────────────────────────────────────────── */}
      <section className="space-y-2">
        <SectionDivider label="Notifications" />

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5">
          <div className="flex items-center gap-3 pt-4 pb-3 border-b border-white/[0.06]">
            <Bell className="h-4 w-4 text-white/35 flex-shrink-0" />
            <p className="text-sm font-semibold text-white/60">Email notifications</p>
          </div>

          <ToggleRow
            label="Platform updates"
            description="News about new features, improvements, and Boatality announcements."
            checked={settings.notification_prefs.platform_updates}
            onChange={(v) => updateNotifPref("platform_updates", v)}
            disabled={savingToggles}
          />
          <ToggleRow
            label="New follower emails"
            description="Get notified when someone follows your channel."
            checked={settings.notification_prefs.new_follower}
            onChange={(v) => updateNotifPref("new_follower", v)}
            disabled={savingToggles}
          />
          <ToggleRow
            label="Performance summaries"
            description="Weekly digest of your content's views, listens, and reads."
            checked={settings.notification_prefs.performance_summaries}
            onChange={(v) => updateNotifPref("performance_summaries", v)}
            disabled={savingToggles}
          />
        </div>
      </section>

      {/* ── Section: Privacy & Visibility ────────────────────────────────── */}
      <section className="space-y-2">
        <SectionDivider label="Privacy & Visibility" />

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5">
          <div className="flex items-center gap-3 pt-4 pb-3 border-b border-white/[0.06]">
            <Globe className="h-4 w-4 text-white/35 flex-shrink-0" />
            <p className="text-sm font-semibold text-white/60">Public visibility</p>
          </div>

          <ToggleRow
            label="Public profile"
            description="Your profile page is visible to anyone on Boatality."
            checked={settings.is_public}
            onChange={(v) => saveToggles({ is_public: v })}
            disabled={savingToggles}
          />
          <ToggleRow
            label="Listed in creator directory"
            description="Appear in Boatality's creator discovery and search results."
            checked={settings.listed_in_directory}
            onChange={(v) => saveToggles({ listed_in_directory: v })}
            disabled={savingToggles}
          />
        </div>
      </section>

      {/* ── Section: Danger Zone ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Danger zone" />

        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] overflow-hidden">
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-red-500/10">
            <ShieldAlert className="h-4 w-4 text-red-400/60 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-300/60">Irreversible actions</p>
          </div>

          {/* Export data */}
          <div className="flex items-start justify-between gap-6 px-5 py-4 border-b border-red-500/[0.08]">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/70">Export your data</p>
              <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
                Download a copy of all your content, settings, and account data.
              </p>
            </div>
            <button
              disabled
              className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/30 cursor-not-allowed"
            >
              <Download size={12} />
              Coming soon
            </button>
          </div>

          {/* Delete account */}
          <div className="flex items-start justify-between gap-6 px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-red-300">Delete account</p>
              <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
                Permanently delete your account and all associated content. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      </section>

      {/* Bottom spacer */}
      <div className="pb-8" />

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteConfirmText(""); setDeleteError(null); } }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-sm rounded-2xl border border-red-500/25 bg-[#0d1f2d] shadow-2xl shadow-black/60 p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Delete your account?</h2>
                <p className="text-sm text-white/45 mt-1 leading-relaxed">
                  This will permanently delete your account, all your content, and your creator profile.
                  <strong className="text-white/70"> There is no way to undo this.</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-white/40">
                Type <span className="text-red-400 font-bold normal-case tracking-normal">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition disabled:opacity-40"
              />
            </div>

            {deleteError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 text-xs text-red-300">
                <AlertCircle size={13} className="flex-shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteConfirmText(""); setDeleteError(null); } }}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-40 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition"
              >
                {deleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
