import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { Compass, Upload, LibraryBig, LogOut, Video, Mic, FileText, BarChart3, Palette, Settings, ExternalLink } from "lucide-react";
import { headers } from "next/headers";

export default async function DashboardLayout({
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

  const { data: creator } = await supabase
    .from("creators_v2")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!creator) {
    redirect("/onboarding");
  }

  const rawPath = headers().get("x-pathname") || "";
  const rawUrl = headers().get("x-url") || headers().get("referer") || "";

  // Some setups pass the full path including query in x-pathname; others don't.
  const pathname = rawPath.split("?")[0] || "";

  let activeType: string | null = null;
  try {
    if (rawUrl) activeType = new URL(rawUrl).searchParams.get("type");
  } catch {
    activeType = null;
  }

  if (!activeType && rawPath.includes("?")) {
    try {
      activeType = new URL(`https://boatality.local${rawPath}`).searchParams.get("type");
    } catch {
      activeType = null;
    }
  }

  const contentType = (activeType || "all").toLowerCase();

  return (
    <div className="min-h-screen flex text-slate-50 bg-[#020b16] bg-noise">
      <aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-[#02263A]/70 to-[#011722]/70 backdrop-blur-2xl border-r border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        <div className="h-24 flex items-center px-6 border-b border-white/10 bg-white/10 backdrop-blur-xl shadow-inner shadow-black/30">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#C84121] to-[#8A2B17] shadow-xl shadow-black/50 ring-1 ring-white/20" />
          <div className="ml-3">
            <div className="text-base font-semibold tracking-wide text-white">Boatality Studio</div>
            <div className="text-[11px] text-white/60">Creator dashboard</div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 text-sm">
          {/* Helper: section label */}
          <div className="space-y-6">
            {/* OVERVIEW */}
            <div>
              <div className="px-3 mb-2 text-[11px] tracking-[0.22em] text-white/45">OVERVIEW</div>
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-300 ease-out group ${
                    pathname === "/dashboard"
                      ? "bg-white/15 text-white shadow-[0_0_20px_-4px_rgba(0,0,0,0.7)]"
                      : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-[1.03] hover:shadow-[0_4px_18px_-4px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <Compass size={18} className="opacity-70 group-hover:opacity-100 transition-transform group-hover:scale-110" />
                  <div className="flex-1">Dashboard</div>
                </Link>
              </div>
            </div>

            {/* CONTENT */}
            <div>
              <div className="px-3 mb-2 text-[11px] tracking-[0.22em] text-white/45">CONTENT</div>
              <div className="space-y-2">
                <Link
                  href="/dashboard/content"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-300 ease-out group ${
                    pathname.startsWith("/dashboard/content") && (contentType === "all" || contentType === "")
                      ? "bg-white/15 text-white shadow-[0_0_20px_-4px_rgba(0,0,0,0.7)]"
                      : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-[1.03] hover:shadow-[0_4px_18px_-4px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <LibraryBig size={18} className="opacity-70 group-hover:opacity-100 transition-transform group-hover:scale-110" />
                  <div className="flex-1">All content</div>
                </Link>

                <Link
                  href="/dashboard/content?type=video"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-300 ease-out group ${
                    pathname.startsWith("/dashboard/content") && contentType === "video"
                      ? "bg-white/15 text-white shadow-[0_0_20px_-4px_rgba(0,0,0,0.7)]"
                      : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-[1.03] hover:shadow-[0_4px_18px_-4px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <Video size={18} className="opacity-60 group-hover:opacity-100 transition-transform group-hover:scale-110" />
                  <div className="flex-1">Videos</div>
                </Link>

                <Link
                  href="/dashboard/content?type=podcast"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-300 ease-out group ${
                    pathname.startsWith("/dashboard/content") && contentType === "podcast"
                      ? "bg-white/15 text-white shadow-[0_0_20px_-4px_rgba(0,0,0,0.7)]"
                      : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-[1.03] hover:shadow-[0_4px_18px_-4px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <Mic size={18} className="opacity-60 group-hover:opacity-100 transition-transform group-hover:scale-110" />
                  <div className="flex-1">Podcasts</div>
                </Link>

                <Link
                  href="/dashboard/content?type=article"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-300 ease-out group ${
                    pathname.startsWith("/dashboard/content") && contentType === "article"
                      ? "bg-white/15 text-white shadow-[0_0_20px_-4px_rgba(0,0,0,0.7)]"
                      : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-[1.03] hover:shadow-[0_4px_18px_-4px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <FileText size={18} className="opacity-60 group-hover:opacity-100 transition-transform group-hover:scale-110" />
                  <div className="flex-1">Articles</div>
                </Link>

                <Link
                  href="/dashboard/upload"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-300 ease-out group ${
                    pathname === "/dashboard/upload"
                      ? "bg-white/15 text-white shadow-[0_0_20px_-4px_rgba(0,0,0,0.7)]"
                      : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-[1.03] hover:shadow-[0_4px_18px_-4px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <Upload size={18} className="opacity-70 group-hover:opacity-100 transition-transform group-hover:scale-110" />
                  <div className="flex-1">Upload</div>
                </Link>
              </div>
            </div>

            {/* ANALYTICS */}
            <div>
              <div className="px-3 mb-2 text-[11px] tracking-[0.22em] text-white/45">ANALYTICS</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 bg-white/5 border border-white/10">
                  <BarChart3 size={18} className="opacity-70" />
                  <div className="flex-1">Overview</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">Soon</span>
                </div>
              </div>
            </div>

            {/* CHANNEL */}
            <div>
              <div className="px-3 mb-2 text-[11px] tracking-[0.22em] text-white/45">CHANNEL</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 bg-white/5 border border-white/10">
                  <Palette size={18} className="opacity-70" />
                  <div className="flex-1">Branding</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">Soon</span>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 bg-white/5 border border-white/10">
                  <Settings size={18} className="opacity-70" />
                  <div className="flex-1">Settings</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">Soon</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="px-4 py-6 border-t border-white/10 text-[12px] text-white/60 flex items-center gap-3 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer group hover:shadow-inner hover:shadow-black/20">
          <LogOut size={16} className="text-white/50 group-hover:text-white transition" />
          <span>Sign out</span>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-white/10 bg-[#020b16]/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-sky-400" />
            <div>
              <div className="text-sm font-semibold">Boatality Studio</div>
              <div className="text-[11px] text-slate-400">Dashboard</div>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-[11px] px-2 py-1 rounded border border-slate-700 text-slate-300"
          >
            Overview
          </Link>
        </header>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between h-16 px-6 border-b border-white/10 bg-[#020b16]/70 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-inner shadow-black/30 flex items-center justify-center">
              <span className="text-[12px] font-semibold text-white/80">BG</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">Boatality Studio</div>
              <div className="text-[11px] text-white/55 truncate">{user.email || "Creator"}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-[12px] text-white/85 transition"
            >
              <Upload size={16} className="opacity-90" />
              Upload
            </Link>

            <Link
              href="/dashboard/content"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[12px] text-white/75 transition"
            >
              <LibraryBig size={16} className="opacity-80" />
              Content
            </Link>

            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[12px] text-white/75 transition"
            >
              <ExternalLink size={16} className="opacity-80" />
              View site
            </Link>

            <div className="ml-2 flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] text-white/45 bg-white/5 border border-white/10">
              <BarChart3 size={16} className="opacity-70" />
              <span>Analytics soon</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto animate-fade-scale backdrop-blur-[2px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
