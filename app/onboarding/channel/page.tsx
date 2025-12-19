"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function OnboardingChannelSetup() {
  const supabase = createClient();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleNext() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Create 3 channels for this creator
    const channels = [
      { type: "video", name: "Videos" },
      { type: "podcast", name: "Podcast" },
      { type: "article", name: "Articles" },
    ];

    for (const c of channels) {
      await supabase.from("channels_v2").insert({
        creator_id: user.id,
        name: c.name,
        type: c.type,
        category: selectedCategory,
      });
    }

    router.push("/onboarding/finish");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Choose Your Channel Category</h1>

      <label className="block mb-2 font-medium">Primary Category</label>
      <select
        className="w-full p-3 border rounded mb-6"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">-- Select Category --</option>
        {categories.map((cat: any) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <button
        onClick={handleNext}
        disabled={!selectedCategory || loading}
        className="w-full bg-blue-600 text-white p-3 rounded-md"
      >
        Continue
      </button>
    </div>
  );
}
