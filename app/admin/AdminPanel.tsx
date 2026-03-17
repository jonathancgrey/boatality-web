"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, ExternalLink } from "lucide-react";

export type Signup = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  platform: string | null;
  source: string | null;
  creator_links: { type: string; url: string }[] | null;
  status: "pending" | "invited" | "rejected";
  created_at: string;
  invited_at: string | null;
  rejected_at: string | null;
};

type Filter = "all" | "pending" | "invited" | "rejected";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  invited:  { label: "Invited",  className: "bg-green-500/15  text-green-300  border-green-500/30"  },
  rejected: { label: "Rejected", className: "bg-red-500/15    text-red-300    border-red-500/30"    },
};

export default function AdminPanel({ initial }: { initial: Signup[] }) {
  const [signups, setSignups] = useState<Signup[]>(initial);
  const [filter, setFilter]   = useState<Filter>("pending");
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function callApi(path: string, body: object, optimistic: Partial<Signup>, id: string) {
    setActionId(id);
    const res  = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setActionId(null);
    if (json.ok) {
      setSignups((prev) => prev.map((s) => s.id === id ? { ...s, ...optimistic } : s));
      return true;
    }
    showToast(json.error ?? "Something went wrong", false);
    return false;
  }

  async function invite(s: Signup) {
    setActionId(s.id);
    const res  = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: s.email, signupId: s.id }),
    });
    const json = await res.json();
    setActionId(null);
    if (json.ok) {
      setSignups((prev) => prev.map((x) => x.id === s.id ? { ...x, status: "invited", invited_at: new Date().toISOString() } : x));
      showToast(json.note ?? `Invite sent to ${s.email}`, true);
    } else {
      showToast(json.error ?? "Something went wrong", false);
    }
  }

  async function reject(s: Signup) {
    const ok = await callApi(
      "/api/admin/reject",
      { signupId: s.id },
      { status: "rejected", rejected_at: new Date().toISOString() },
      s.id,
    );
    if (ok) showToast(`${s.email} rejected`, true);
  }

  const filtered = signups.filter((s) => filter === "all" || s.status === filter);
  const counts = {
    all:      signups.length,
    pending:  signups.filter((s) => s.status === "pending").length,
    invited:  signups.filter((s) => s.status === "invited").length,
    rejected: signups.filter((s) => s.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-[#020b16] text-white px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 mb-1">Boatality Studio</p>
            <h1 className="text-2xl font-bold tracking-tight">Beta Approvals</h1>
            <p className="text-sm text-white/50 mt-1">
              {counts.pending} pending · {counts.invited} invited · {counts.rejected} rejected
            </p>
          </div>
          <a
            href="/admin"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </a>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
          {(["pending", "invited", "rejected", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filter === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              {f} <span className="ml-1 opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-white/30">
              No {filter === "all" ? "" : filter} signups yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03]">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white/35">Name / Email</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white/35">Role</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white/35">Links</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white/35">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-white/35">Signed up</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-white/35">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.pending;
                  const busy  = actionId === s.id;
                  return (
                    <tr key={s.id} className="border-t border-white/[0.06] hover:bg-white/[0.03] transition">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white text-sm">{s.name ?? "—"}</p>
                        <p className="text-xs text-white/45 mt-0.5">{s.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="capitalize text-white/70 text-xs">{s.role ?? "—"}</span>
                        {s.platform && (
                          <span className="ml-1.5 text-[10px] text-white/30 capitalize">({s.platform})</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {s.creator_links?.length ? (
                          <div className="flex flex-col gap-0.5">
                            {s.creator_links.slice(0, 2).map((l, i) => (
                              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300">
                                <ExternalLink className="h-2.5 w-2.5" />
                                {l.type}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-white/25 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${badge.className}`}>
                          {s.status === "pending"  && <Clock className="h-3 w-3" />}
                          {s.status === "invited"  && <CheckCircle className="h-3 w-3" />}
                          {s.status === "rejected" && <XCircle className="h-3 w-3" />}
                          {badge.label}
                        </span>
                        {s.invited_at && (
                          <p className="text-[10px] text-white/30 mt-1">
                            {new Date(s.invited_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-white/40">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.status !== "invited" && (
                            <button onClick={() => invite(s)} disabled={busy}
                              className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1.5 text-[11px] font-semibold text-green-300 hover:bg-green-500/25 disabled:opacity-40 transition">
                              {busy
                                ? <div className="h-3 w-3 rounded-full border-2 border-green-300/30 border-t-green-300 animate-spin" />
                                : <CheckCircle className="h-3 w-3" />}
                              {s.status === "rejected" ? "Re-invite" : "Approve"}
                            </button>
                          )}
                          {s.status !== "rejected" && (
                            <button onClick={() => reject(s)} disabled={busy}
                              className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/25 px-3 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition">
                              {busy
                                ? <div className="h-3 w-3 rounded-full border-2 border-red-300/30 border-t-red-300 animate-spin" />
                                : <XCircle className="h-3 w-3" />}
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl shadow-black/60 ${
          toast.ok
            ? "bg-green-900/80 border-green-500/40 text-green-100"
            : "bg-red-900/80 border-red-500/40 text-red-100"
        }`}>
          {toast.ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
