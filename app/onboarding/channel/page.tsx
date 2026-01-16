"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function OnboardingChannelSetup() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        console.error("auth.getUser failed:", userErr);
        alert("You must be logged in to continue.");
        return;
      }

      // If channels already exist for this creator, don’t duplicate.
      const { data: existing, error: existingErr } = await supabase
        .from("channels_v2")
        .select("id")
        .eq("creator_id", user.id);

      if (existingErr) {
        console.error("channels_v2 select failed:", existingErr);
        alert(`Failed to check existing channels: ${existingErr.message}`);
        return;
      }

      if (existing && existing.length > 0) {
        router.push("/onboarding/finish");
        return;
      }

      const payload = [
        { creator_id: user.id, name: "Videos", type: "video" },
        { creator_id: user.id, name: "Podcast", type: "podcast" },
        { creator_id: user.id, name: "Articles", type: "article" },
      ];

      const { error: insertErr } = await supabase.from("channels_v2").insert(payload);

      if (insertErr) {
        console.error("channels_v2 insert failed:", insertErr);
        alert(`Channel creation failed: ${insertErr.message}`);
        return;
      }

      router.push("/onboarding/finish");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Create Your Channels</h1>
      <p className="text-sm text-slate-600 mb-6">
        We'll create your default channels: Videos, Podcast, and Articles. You'll categorize each upload by topic.
      </p>

      <button
        onClick={handleNext}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded-md"
      >
        {loading ? "Creating…" : "Create Channels"}
      </button>
    </div>
  );
}
