"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function OnboardingStep1() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("creators_v2").insert({
      id: user.id,
      display_name: displayName,
    });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    router.push("/onboarding/channel");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Your Creator Profile</h1>
      <label className="block font-medium mb-2">Display Name</label>
      <input
        className="w-full p-3 border rounded mb-4"
        placeholder="Captain Grey"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <button
        onClick={handleNext}
        disabled={!displayName || loading}
        className="w-full bg-blue-600 text-white p-3 rounded-md"
      >
        Continue
      </button>
    </div>
  );
}
