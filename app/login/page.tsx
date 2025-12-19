// app/login/page.tsx
"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendMagicLink() {
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="space-y-4 max-w-sm w-full">
        <h1 className="text-xl font-semibold">Creator Login</h1>

        <input
          className="w-full px-3 py-2 rounded bg-white/10"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        {error && <p className="text-red-400">{error}</p>}
        {sent && <p className="text-green-400">Magic link sent!</p>}

        <button
          onClick={sendMagicLink}
          className="w-full bg-blue-600 py-2 rounded"
        >
          Send Magic Link
        </button>
      </div>
    </div>
  );
}