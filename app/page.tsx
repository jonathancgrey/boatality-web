import Link from "next/link";
import { PlayCircle, Radio, FileText, Anchor, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#012C44] bg-noise text-slate-50 flex flex-col">
      {/* Top nav */}
      <header className="relative z-20 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Logo mark – replace src with your real logo asset in /public */}
            <div className="h-9 w-9 rounded-xl bg-[#C84121] flex items-center justify-center shadow-lg shadow-black/40">
              <Anchor className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-[0.16em] uppercase text-white/70">
                Boatality
              </div>
              <p className="text-[11px] text-white/50">
                The streaming home for boaters
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-white/70">
            <Link href="#for-boaters" className="hover:text-white transition">
              For boaters
            </Link>
            <Link href="#for-creators" className="hover:text-white transition">
              For creators
            </Link>
            <Link href="#for-brands" className="hover:text-white transition">
              For brands
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-3 py-1.5 hover:border-white/40 hover:text-white transition"
            >
              Creator login
            </Link>
          </nav>
        </div>
      </header>

      {/* Background glow layers */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-[#127AB2]/35 blur-3xl opacity-70" />
        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-[#C84121]/35 blur-3xl opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
      </div>

      {/* Main hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-12 pb-16 md:pt-16 md:pb-24 flex flex-col lg:flex-row gap-10 lg:gap-14 items-center">
          {/* Left column: story */}
          <div className="w-full lg:w-[55%] space-y-7 slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#C84121] animate-pulse" />
              Built for the water — not the algorithm
            </span>

            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl lg:text-[46px] font-semibold leading-tight tracking-tight">
                The streaming home
                <br />
                <span className="text-[#F5F7FA]">
                  for people who live on the water.
                </span>
              </h1>
              <p className="text-sm md:text-base text-slate-200/80 max-w-xl leading-relaxed">
                Boatality brings together boating videos, podcasts, and articles —
                all in one place. Built for boat owners, liveaboards, weekend
                captains, and the creators who tell their stories.
              </p>
            </div>

            {/* Connection stats */}
            <div className="flex flex-wrap gap-6 text-xs text-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <PlayCircle className="h-4 w-4 text-[#F5F7FA]" />
                </div>
                <div>
                  <div className="font-semibold text-white">Watch</div>
                  <div className="text-[11px] text-slate-300/80">
                    Long-form journeys, how-tos & reviews
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Radio className="h-4 w-4 text-[#F5F7FA]" />
                </div>
                <div>
                  <div className="font-semibold text-white">Listen</div>
                  <div className="text-[11px] text-slate-300/80">
                    Podcasts from the boating community
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <FileText className="h-4 w-4 text-[#F5F7FA]" />
                </div>
                <div>
                  <div className="font-semibold text-white">Learn</div>
                  <div className="text-[11px] text-slate-300/80">
                    Deep dives, DIY, and cruising insights
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="#for-boaters"
                className="tap-scale inline-flex items-center gap-2 rounded-full bg-[#C84121] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/40 hover:bg-[#d75633] transition"
              >
                Launch Boatality
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/login"
                className="tap-scale inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/90 hover:bg-white/10 hover:border-white/50 transition"
              >
                I’m a creator
              </Link>
            </div>

            {/* Sub-note */}
            <p className="text-[11px] text-slate-300/80 pt-1 max-w-md">
              Boatality is built for boat owners with real skin in the game —
              from first-time buyers to full-time liveaboards. No generic lifestyle
              fluff. Just the content that actually keeps you on the water.
            </p>
          </div>

          {/* Right column: product glimpse */}
          <div className="w-full lg:w-[45%] relative">
            <div className="relative max-w-md mx-auto">
              {/* Glow */}
              <div className="absolute -inset-6 bg-gradient-to-br from-[#127AB2]/30 via-transparent to-[#C84121]/35 blur-2xl opacity-90" />

              <div className="relative rounded-3xl bg-white/5 border border-white/12 shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-xl">
                {/* Top meta */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3 text-[11px] text-white/70">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>New on Boatality this week</span>
                  </div>
                  <span className="text-white/40">Built for the water</span>
                </div>

                {/* Fake “feed” */}
                <div className="space-y-3 px-4 pb-4">
                  {/* Video item */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3 flex gap-3 hover:bg-white/8 transition hover-lift">
                    <div className="relative h-16 w-24 rounded-xl bg-gradient-to-br from-[#127AB2] to-[#012C44] overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(245,247,250,0.4),transparent_55%),radial-gradient(circle_at_110%_120%,rgba(200,65,33,0.4),transparent_55%)]" />
                      <button className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-[3px] text-[10px] text-white">
                        <PlayCircle className="h-3 w-3" />
                        Watch
                      </button>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-[11px] font-semibold text-white">
                        Crossing to the islands: what they don&apos;t tell you
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-300/90">
                        <span>⛵ Coastal Cruising</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-slate-400" />
                        <span>18 min watch</span>
                      </div>
                    </div>
                  </div>

                  {/* Podcast item */}
                  <div className="rounded-2xl bg-white/3 border border-white/8 p-3 flex gap-3 hover:bg-white/6 transition hover-lift">
                    <div className="h-10 w-10 rounded-xl bg-[#012C44] border border-white/15 flex items-center justify-center">
                      <Radio className="h-4 w-4 text-[#F5F7FA]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-white">
                        The Liveaboard Question
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-300/90">
                        <span>Boatality Voices</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-slate-400" />
                        <span>36 min listen</span>
                      </div>
                    </div>
                  </div>

                  {/* Article item */}
                  <div className="rounded-2xl bg-white/3 border border-white/8 p-3 flex gap-3 hover:bg-white/6 transition hover-lift">
                    <div className="h-10 w-10 rounded-xl bg-[#127AB2]/20 border border-[#127AB2]/40 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#F5F7FA]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-white">
                        7 upgrades that actually matter at sea
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-300/90">
                        <span>Owner Stories</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-slate-400" />
                        <span>Read in 9 minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Connection strip */}
                  <div className="mt-2 rounded-2xl bg-gradient-to-r from-[#C84121]/30 via-[#127AB2]/40 to-transparent border border-white/10 px-4 py-3 text-[11px] text-slate-50 flex flex-col gap-1.5">
                    <div className="font-semibold">
                      Where boaters, creators, and marine brands actually meet.
                    </div>
                    <div className="text-slate-100/80">
                      One home for the people who keep the boating world moving:
                      the owners, the pros, and the storytellers.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simple anchor sections (stubs for now) */}
        <section
          id="for-boaters"
          className="max-w-6xl mx-auto px-4 md:px-6 pb-12 md:pb-16 pt-4 text-xs text-slate-200/80"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 hover-lift">
              <div className="text-[11px] font-semibold text-white mb-1">
                For boaters
              </div>
              <p className="text-[11px] text-slate-200/80">
                Follow your favorite captains, crews, and channels — with content
                built around real ownership, not generic lifestyle clips.
              </p>
            </div>
            <div
              id="for-creators"
              className="rounded-2xl bg-white/5 border border-white/10 p-4 hover-lift"
            >
              <div className="text-[11px] font-semibold text-white mb-1">
                For creators
              </div>
              <p className="text-[11px] text-slate-200/80">
                Own your boating audience in one place. Upload videos, podcasts,
                and articles — Boatality gives you a true marine-native home.
              </p>
            </div>
            <div
              id="for-brands"
              className="rounded-2xl bg-white/5 border border-white/10 p-4 hover-lift"
            >
              <div className="text-[11px] font-semibold text-white mb-1">
                For marine brands
              </div>
              <p className="text-[11px] text-slate-200/80">
                Reach verified boat owners where they&apos;re already learning,
                upgrading, and dreaming about their next adventure.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer stub */}
      <footer className="border-t border-white/10 py-4">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-[11px] text-white/50">
            © {new Date().getFullYear()} Boatality. Built for the water.
          </p>
          <div className="flex gap-4 text-[11px] text-white/55">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
