"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

type Channel = {
  id: string;
  creator_id: string;
  type: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  created_at?: string | null;
};

export default function ChannelsPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [debug, setDebug] = useState<any>(null);

  async function load() {
    setLoading(true);
    setStatus("");
    setDebug(null);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    console.log("[channels] getUser:", { userErr, user: userData?.user });

    if (userErr || !userData?.user) {
      setUserId(null);
      setChannels([]);
      setLoading(false);
      setStatus("You must be logged in.");
      setDebug({ step: "auth.getUser", userErr });
      return;
    }

    setUserId(userData.user.id);

    const { data: ch, error: chErr } = await supabase
      .from("channels_v2")
      .select("id,creator_id,type,name,description,avatar_url,banner_url,created_at")
      .eq("creator_id", userData.user.id)
      .order("created_at", { ascending: true });

    console.log("[channels] select:", { chErr, count: ch?.length, rows: ch });

    if (chErr) {
      setChannels([]);
      setStatus(`Failed to load channels: ${chErr.message}`);
      setDebug({ step: "channels_v2 select", chErr });
      setLoading(false);
      return;
    }

    setChannels((ch as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createDefaultChannels() {
    if (!userId) return;

    setStatus("Creating default channels…");

    const payload = [
      { creator_id: userId, name: "Videos", type: "video" },
      { creator_id: userId, name: "Podcast", type: "podcast" },
      { creator_id: userId, name: "Articles", type: "article" },
    ];

    const { error } = await supabase.from("channels_v2").insert(payload);
    console.log("[channels] insert defaults:", { error });

    if (error) {
      setStatus(`Channel creation failed: ${error.message}`);
      setDebug({ step: "channels_v2 insert", error });
      return;
    }

    setStatus("Channels created.");
    await load();
  }

  async function saveChannel(channel: Channel) {
    setSavingId(channel.id);
    setStatus("");

    const { error } = await supabase
      .from("channels_v2")
      .update({
        name: channel.name,
        description: channel.description ?? null,
      })
      .eq("id", channel.id)
      .eq("creator_id", channel.creator_id);

    console.log("[channels] update:", { id: channel.id, error });

    if (error) {
      setStatus(`Save failed: ${error.message}`);
      setDebug({ step: "channels_v2 update", error });
      setSavingId(null);
      return;
    }

    setStatus("Saved.");
    setSavingId(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 md:px-0 py-10 bg-[#020b16] bg-noise">
        <div className="max-w-3xl mx-auto rounded-3xl bg-white/5 border border-white/10 p-8 text-slate-200">
          Loading channel management…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-0 py-10 bg-[#020b16] bg-noise animate-fade-slide-up">
      <div className="max-w-3xl mx-auto rounded-3xl bg-white/5 border border-white/10 shadow-2xl shadow-black/40 backdrop-blur-2xl p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Channel Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Channels are format containers (Video / Podcast / Article).
          </p>
        </div>

        {status && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
            {status}
          </div>
        )}

        {debug && (
          <pre className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-slate-200 overflow-auto">
{JSON.stringify(debug, null, 2)}
          </pre>
        )}

        <div className="text-xs text-slate-400">
          <span className="font-mono">auth uid:</span> {userId ?? "none"} •{" "}
          <span className="font-mono">channels loaded:</span> {channels.length}
        </div>

        {channels.length === 0 ? (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-yellow-100">
            <p className="text-sm font-semibold">No channels returned to the client query.</p>
            <p className="mt-2 text-sm text-yellow-100/90">
              If this is unexpected, check the debug box above and browser console logs.
            </p>

            <button
              type="button"
              onClick={createDefaultChannels}
              className="mt-4 rounded-full bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-100 hover:bg-yellow-500/30"
            >
              Create default channels
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {channels.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {c.type} channel
                    </p>
                    <p className="text-sm text-slate-300 mt-1">
                      Channel ID: <span className="font-mono text-slate-200">{c.id}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => saveChannel(c)}
                    disabled={savingId === c.id}
                    className="rounded-full bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold px-4 py-2 shadow-xl shadow-black/40 disabled:opacity-60"
                  >
                    {savingId === c.id ? "Saving…" : "Save"}
                  </button>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">
                      Channel Name
                    </label>
                    <input
                      className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                      value={c.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setChannels((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, name: v } : x))
                        );
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                      value={c.description ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setChannels((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, description: v } : x))
                        );
                      }}
                    />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
                    <p className="font-semibold text-slate-200">Branding fields</p>
                    <p className="mt-1">
                      avatar_url: <span className="font-mono">{c.avatar_url ?? "null"}</span>
                    </p>
                    <p className="mt-1">
                      banner_url: <span className="font-mono">{c.banner_url ?? "null"}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
