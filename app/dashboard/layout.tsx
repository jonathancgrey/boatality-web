"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Layers,
  Video,
  Mic2,
  FileText,
  Upload,
  BarChart2,
  Palette,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  Rocket,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  soon?: boolean;
};

type NavGroup = {
  section: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard/content", icon: LayoutDashboard }],
  },
  {
    section: "Content",
    items: [
      { label: "All content", href: "/dashboard/content", icon: Layers },
      { label: "Videos", href: "/dashboard/content?type=video", icon: Video },
      { label: "Podcasts", href: "/dashboard/content?type=podcast", icon: Mic2 },
      { label: "Articles", href: "/dashboard/content?type=article", icon: FileText },
      { label: "Upload", href: "/dashboard/upload", icon: Upload },
    ],
  },
  {
    section: "Analytics",
    items: [{ label: "Overview", href: "#", icon: BarChart2, soon: true }],
  },
  {
    section: "Channel",
    items: [
      { label: "Branding", href: "#", icon: Palette, soon: true },
      { label: "Settings", href: "#", icon: Settings, soon: true },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState<string | null>(null);
  const [initials, setInitials] = useState("BG");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      const e = data.user.email ?? null;
      setEmail(e);
      if (e) setInitials(e.slice(0, 2).toUpperCase());
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[#010d18] border-r border-white/8 w-56 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C84121] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Boatality Studio</p>
            <p className="text-[10px] text-white/40 truncate">{email ?? "Loading…"}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-2 mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = !item.soon && pathname.startsWith(item.href.split("?")[0]) && item.href !== "#";
                return (
                  <li key={item.label}>
                    <Link
                      href={item.soon ? "#" : item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                        item.soon
                          ? "cursor-default text-white/25"
                          : active
                          ? "bg-white/10 text-white"
                          : "text-white/55 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.soon && (
                        <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/30">
                          Soon
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/8 space-y-0.5">
        <a
          href="https://boatality.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/40 hover:bg-white/5 hover:text-white transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View site
        </a>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/40 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#020b16] text-white overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex w-56">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">Boatality Studio</span>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {/* Pre-launch beta banner */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#C84121]/30 bg-[#C84121]/8 px-4 py-3.5">
            <Rocket className="h-4 w-4 text-[#f4845f] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/90">You're in pre-launch beta</p>
              <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
                The platform isn't open to viewers yet — we're building the creator side first.
                Publish your content now so there's something to discover when users arrive.
                We'll let you know when the doors open.
              </p>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
