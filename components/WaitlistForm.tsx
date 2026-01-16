"use client";

import { useState } from "react";

type Role = "creator" | "viewer" | "advertiser";

export default function WaitlistForm({ source = "landing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role, source }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setStatus("error");
        setMsg(json?.error || `Failed (${res.status})`);
        return;
      }

      setStatus("success");
      setMsg(json?.already ? "You’re already on the list ✅" : "You’re on the list ✅");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMsg(err?.message || "Failed to fetch");
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-lg space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@domain.com"
            required
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <option value="viewer">Viewer</option>
          <option value="creator">Creator</option>
          <option value="advertiser">Advertiser</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-500 disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : "Join the beta waitlist"}
      </button>

      {msg ? (
        <p className={status === "error" ? "text-sm text-red-300" : "text-sm text-white/70"}>
          {msg}
        </p>
      ) : null}
    </form>
  );
}
