"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingFinish() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/dashboard"), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">You're All Set!</h1>
      <p className="text-gray-600 mb-4">Redirecting you to your dashboard...</p>
    </div>
  );
}
