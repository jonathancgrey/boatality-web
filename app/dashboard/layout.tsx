import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { Compass, Upload, LibraryBig, LogOut } from "lucide-react";
import { headers } from "next/headers";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/upload", label: "Upload" },
  { href: "/dashboard/content", label: "Content library" },
];

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

  const pathname = headers().get("x-pathname") || "";

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

        <nav className="flex-1 px-4 py-6 space-y-2 text-sm">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-300 ease-out group ${
              pathname === "/dashboard"
                ? "bg-white/15 text-white shadow-[0_0_20px_-4px_rgba(0,0,0,0.7)]"
                : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-[1.03] hover:shadow-[0_4px_18px_-4px_rgba(0,0,0,0.6)]"
            }`}
          >
            <Compass size={18} className="opacity-70 group-hover:opacity-100 transition-transform group-hover:scale-110" />
            Overview
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
            Upload
          </Link>

          <Link
            href="/dashboard/content"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-300 ease-out group ${
              pathname === "/dashboard/content"
                ? "bg-white/15 text-white shadow-[0_0_20px_-4px_rgba(0,0,0,0.7)]"
                : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-[1.03] hover:shadow-[0_4px_18px_-4px_rgba(0,0,0,0.6)]"
            }`}
          >
            <LibraryBig size={18} className="opacity-70 group-hover:opacity-100 transition-transform group-hover:scale-110" />
            Content Library
          </Link>
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
