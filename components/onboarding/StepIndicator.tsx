"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Welcome", path: "/onboarding" },
  { label: "Profile", path: "/onboarding/profile" },
  { label: "Channels", path: "/onboarding/channel" },
  { label: "Branding", path: "/onboarding/branding" },
  { label: "Done", path: "/onboarding/finish" },
];

export function StepIndicator() {
  const pathname = usePathname();
  const currentIdx = STEPS.findIndex((s) => s.path === pathname);

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;

        return (
          <div key={step.path} className="flex items-center">
            {/* Step bubble */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  done
                    ? "bg-blue-500 text-white"
                    : active
                    ? "bg-white text-brand-navy ring-4 ring-white/20"
                    : "bg-white/10 text-white/30",
                ].join(" ")}
              >
                {done ? <Check size={13} strokeWidth={2.5} /> : i + 1}
              </div>
              <span
                className={[
                  "text-[10px] font-medium hidden sm:block transition-colors duration-300 tracking-wide",
                  active
                    ? "text-white"
                    : done
                    ? "text-blue-400"
                    : "text-white/25",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={[
                  "w-8 h-px mb-3.5 transition-colors duration-300",
                  done ? "bg-blue-500" : "bg-white/10",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
