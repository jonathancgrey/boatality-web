"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Anchor, ArrowRight, CheckCircle2 } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"viewer" | "creator">("viewer");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [deviceType, setDeviceType] = useState<"phone" | "tablet">("phone");
  const [creatorLinksText, setCreatorLinksText] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // Allow marketing site CTAs to preselect the form role.
    // Supported:
    // - ?role=viewer|creator
    // - ?source=creator|viewer (fallback)
    const roleParam = (searchParams.get("role") || "").toLowerCase();
    const sourceParam = (searchParams.get("source") || "").toLowerCase();

    let nextRole: "viewer" | "creator" | null = null;
    if (roleParam === "creator") nextRole = "creator";
    if (roleParam === "viewer") nextRole = "viewer";

    if (!nextRole) {
      if (sourceParam.includes("creator")) nextRole = "creator";
      if (sourceParam.includes("viewer") || sourceParam.includes("boater")) nextRole = "viewer";
    }

    if (nextRole && nextRole !== role) {
      setRole(nextRole);
    }

    // Optional viewer defaults via query params
    // - ?platform=ios|android
    // - ?device=phone|tablet (or deviceType)
    const platformParam = (searchParams.get("platform") || "").toLowerCase();
    if (platformParam === "ios" || platformParam === "android") {
      setPlatform(platformParam as "ios" | "android");
    }

    const deviceParam = (searchParams.get("deviceType") || searchParams.get("device") || "").toLowerCase();
    if (deviceParam === "phone" || deviceParam === "tablet") {
      setDeviceType(deviceParam as "phone" | "tablet");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const creatorLinks = useMemo(() => {
    // Allow creators to paste multiple links separated by commas/spaces/newlines.
    const raw = creatorLinksText
      .split(/[\n,\s]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

    return raw.map((url) => ({ type: "other", url }));
  }, [creatorLinksText]);

  async function handleWaitlistSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        name,
        email,
        role,
        source: searchParams.get("source") || "webapp-home",
      };

      if (role === "viewer") {
        payload.platform = platform;
        payload.deviceType = deviceType;
      } else {
        // Only send creatorLinks if present; API expects an array.
        if (creatorLinks.length) payload.creatorLinks = creatorLinks;
      }

      const resp = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data?.ok) {
        setSubmitError(data?.error || `Request failed (${resp.status})`);
        return;
      }

      window.location.href = "/waitlist/thanks";
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#012C44]">
      {/* Header aligned with marketing style */}
      <header className="sticky top-0 z-20 bg-[#F5F7FA]/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/brand/boatality-icon.png"
              alt="Boatality"
              className="h-10 w-10 rounded-xl"
            />
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-[0.12em] uppercase text-[#012C44]">
                Boatality
              </div>
              <div className="text-[11px] text-slate-600">
                Built for how boating works
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-white transition"
            >
              Creator login
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-start">
          {/* Left: marketing-aligned copy */}
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">
              <span className="inline-block h-2 w-2 rounded-full bg-[#C84121]" />
              Built for the water — not the algorithm
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Join the Boatality Beta
              </h1>
              <p className="text-slate-700 leading-relaxed max-w-2xl">
                We’re opening early access in waves. Sign up below and we’ll invite you
                when your lane is ready.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-extrabold">Built for how boating works</h2>
              <p className="text-sm text-slate-700 mt-1">
                Content is organized by activity, topic, and intent — not popularity.
              </p>

              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4">
                  <CheckCircle2 className="h-5 w-5 text-[#127AB2] mt-0.5" />
                  <div>
                    <div className="text-sm font-bold">Find your lane</div>
                    <div className="text-[12px] text-slate-700">
                      Fishing stays with fishing. DIY stays with DIY. No fighting for attention.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4">
                  <CheckCircle2 className="h-5 w-5 text-[#127AB2] mt-0.5" />
                  <div>
                    <div className="text-sm font-bold">Follow real channels</div>
                    <div className="text-[12px] text-slate-700">
                      Track creators inside the lanes you care about — videos, podcasts, and articles.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4">
                  <CheckCircle2 className="h-5 w-5 text-[#127AB2] mt-0.5" />
                  <div>
                    <div className="text-sm font-bold">Discovery without chaos</div>
                    <div className="text-[12px] text-slate-700">
                      Browse by intent, not trends. Less noise, more boating.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4">
                  <CheckCircle2 className="h-5 w-5 text-[#127AB2] mt-0.5" />
                  <div>
                    <div className="text-sm font-bold">Creator-first tools</div>
                    <div className="text-[12px] text-slate-700">
                      Upload once. Publish everywhere in Boatality — with real ownership.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-slate-600 max-w-2xl">
              By signing up, you agree we may email you about beta access. No spam.
            </p>
          </section>

          {/* Right: the form card */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 md:p-7">
              <div>
                <div className="text-sm font-extrabold">Request access</div>
                <div className="text-[12px] text-slate-600">
                  Tell us who you are so we can invite you to the right beta.
                </div>
              </div>

              <form onSubmit={handleWaitlistSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    name="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#127AB2]/30 focus:border-[#127AB2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#127AB2]/30 focus:border-[#127AB2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    I am joining as
                  </label>
                  <select
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "viewer" | "creator")}
                    className="w-full rounded-2xl bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#127AB2]/30 focus:border-[#127AB2]"
                  >
                    <option value="viewer">Viewer / Boater</option>
                    <option value="creator">Creator</option>
                  </select>
                </div>

                {role === "viewer" && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Platform
                      </label>
                      <select
                        name="platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value as "ios" | "android")}
                        className="w-full rounded-2xl bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#127AB2]/30 focus:border-[#127AB2]"
                      >
                        <option value="ios">iOS</option>
                        <option value="android">Android</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Device
                      </label>
                      <select
                        name="deviceType"
                        value={deviceType}
                        onChange={(e) => setDeviceType(e.target.value as "phone" | "tablet")}
                        className="w-full rounded-2xl bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#127AB2]/30 focus:border-[#127AB2]"
                      >
                        <option value="phone">Phone</option>
                        <option value="tablet">Tablet</option>
                      </select>
                    </div>
                  </div>
                )}

                {role === "creator" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Creator channel links
                    </label>
                    <input
                      name="creatorLinks"
                      value={creatorLinksText}
                      onChange={(e) => setCreatorLinksText(e.target.value)}
                      placeholder="YouTube, Instagram, website, etc. (paste one or many)"
                      className="w-full rounded-2xl bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127AB2]/30 focus:border-[#127AB2]"
                    />
                    <p className="text-[11px] text-slate-600 mt-1">
                      This helps us review creators faster.
                    </p>
                  </div>
                )}

                {submitError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C84121] px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#d75633] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting…" : "Request beta access"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-slate-200 text-[12px] text-slate-600">
                Already approved?{" "}
                <Link href="/login" className="font-bold text-[#127AB2] hover:underline">
                  Sign in to Creator Studio
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-[12px] text-slate-600">
            © {new Date().getFullYear()} Boatality. Built for the water.
          </p>
          <div className="flex gap-5 text-[12px] text-slate-600">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}