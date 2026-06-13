import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background bg-noise flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <StepIndicator />
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/60 p-8 slide-up">
          {children}
        </div>
      </div>
    </div>
  );
}
