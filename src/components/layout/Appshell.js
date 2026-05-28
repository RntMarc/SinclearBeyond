"use client";

import {
  Banknote,
  Calendar,
  CalendarCheck,
  Camera,
  Compass,
  FileText,
  Gift,
  Home,
  Info,
  Lock,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageCircle,
  MessageSquarePlus,
  MoreHorizontal,
  Newspaper,
  Settings,
  SquarePlay,
  Star,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useMemo } from "react";
import Avatar from "@/components/Avatar";
import LogoutButton from "@/components/auth/LogoutButton";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

export default function AppShell({ children, user, session }) {
  const t = useTranslations("Navigation");
  const { activeEffects } = useTheme();
  const [showMoreMobile, setShowMoreMobile] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [counts, setCounts] = useState({
    changelog: 0,
    forums: 0,
    travel: 0,
    calendar: 0,
    polls: 0,
    birthdays: 0,
  });

  useEffect(() => {
    async function checkUnread() {
      try {
        const { getUnreadChangelogCount } = await import("@/lib/changelog/actions");
        const { getUnreadForumsCount } = await import("@/lib/forums/actions");
        const { getUnreadTravelCount } = await import("@/lib/travel/actions");
        const { getUnreadCalendarCount } = await import("@/lib/calendar/actions");
        const { getUnreadPollsCount } = await import("@/lib/polls/actions");
        const { getUnreadBirthdaysCount } = await import("@/lib/profile/birthdayActions");

        const [c, f, tr, cal, p, b] = await Promise.all([
          getUnreadChangelogCount(),
          getUnreadForumsCount(),
          getUnreadTravelCount(),
          getUnreadCalendarCount(),
          getUnreadPollsCount(),
          getUnreadBirthdaysCount(),
        ]);

        setCounts({
          changelog: c,
          forums: f,
          travel: tr,
          calendar: cal,
          polls: p,
          birthdays: b,
        });
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    }
    if (user || session) {
      checkUnread();
    }
  }, [user, session]);

  const navGroups = useMemo(() => {
    const isAdmin = user?.isAdmin || session?.isAdmin;

    return {
      main: [
        { href: "/home", label: t("home") || "Home", icon: Home },
        {
          href: "/forum",
          label: t("entertainment"),
          icon: SquarePlay,
          badge: counts.forums > 0 && !pathname.startsWith("/forum")
        },
        {
          href: "/reisen",
          label: t("travel"),
          icon: MapIcon,
          badge: counts.travel > 0 && !pathname.startsWith("/reisen")
        },
        { href: "/entdecken", label: t("discover"), icon: Compass },
      ],
      organization: [
        {
          href: "/kalender",
          label: t("calendar"),
          icon: Calendar,
          badge: counts.calendar > 0 && !pathname.startsWith("/kalender")
        },
        {
          href: "/umfrage",
          label: t("polls"),
          icon: CalendarCheck,
          badge: counts.polls > 0 && !pathname.startsWith("/umfrage")
        },
        {
          href: "/geburtstage",
          label: t("birthdays"),
          icon: Gift,
          badge: counts.birthdays > 0 && pathname !== "/geburtstage"
        },
        { href: "/kontakte", label: t("contacts"), icon: Users },
      ],
      content: [
        { href: "/aktuell", label: t("news"), icon: Newspaper },
        { href: "/fotos", label: t("photos"), icon: Camera },
        { href: "/kritik", label: t("reviews"), icon: Star },
        { href: "/abos", label: t("subscriptions"), icon: Banknote },
      ],
      system: [
        { href: "/chat", label: t("chat"), icon: MessageCircle },
        { href: "/feedback", label: t("feedback"), icon: MessageSquarePlus },
        {
          href: "/info",
          label: t("info"),
          icon: Info,
          badge: counts.changelog > 0 && pathname !== "/info"
        },
        { href: "/einstellungen", label: t("settings"), icon: Settings },
      ],
      admin: isAdmin ? [
        { href: "/office", label: t("office"), icon: FileText },
        { href: "/admin", label: t("admin"), icon: Lock },
      ] : []
    };
  }, [counts, pathname, t, user, session]);

  const allItems = [...navGroups.main, ...navGroups.organization, ...navGroups.content, ...navGroups.system, ...navGroups.admin];

  const mobileBottomNav = [
    navGroups.main[0], // Home
    navGroups.main[1], // Forum
    navGroups.main[2], // Reisen
    navGroups.main[3], // Entdecken
    { label: "Mehr", icon: MoreHorizontal, isMore: true }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-72 flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl z-40 relative">
          <div className="p-8 shrink-0">
            <Link href="/home" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary rounded-[2rem] flex items-center justify-center shadow-[0_0_20px_rgba(135,255,157,0.4)] group-hover:scale-110 transition-transform">
                <span className="font-black text-primary-foreground text-xl">S</span>
              </div>
              <span className="font-display font-black text-xl tracking-tighter uppercase">Sinclear</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-8 scrollbar-hide">
            <div>
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Main</p>
              <div className="space-y-1">
                {navGroups.main.map(item => <SidebarItem key={item.href} {...item} active={pathname.startsWith(item.href)} />)}
              </div>
            </div>

            <div>
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Organization</p>
              <div className="space-y-1">
                {navGroups.organization.map(item => <SidebarItem key={item.href} {...item} active={pathname.startsWith(item.href)} />)}
              </div>
            </div>

            <div>
              <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Content</p>
              <div className="space-y-1">
                {navGroups.content.map(item => <SidebarItem key={item.href} {...item} active={pathname.startsWith(item.href)} />)}
              </div>
            </div>

            {navGroups.admin.length > 0 && (
              <div>
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Admin</p>
                <div className="space-y-1">
                  {navGroups.admin.map(item => <SidebarItem key={item.href} {...item} active={pathname.startsWith(item.href)} />)}
                </div>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3 p-2 rounded-[2rem] bg-white/5 border border-white/5">
              <Avatar src={user?.image} displayName={user?.displayName || session?.email} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{user?.displayName ?? session?.email}</p>
                <Link href="/einstellungen" className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase font-black">Settings</Link>
              </div>
              <LogoutButton />
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 pointer-events-none" />

        <div className="flex-1 overflow-y-auto scroll-smooth relative z-10 pb-24 md:pb-0">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <>
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl w-[90%] max-w-md">
              {mobileBottomNav.map((item, idx) => {
                if (item.isMore) {
                  return (
                    <button
                      key="more"
                      onClick={() => setShowMoreMobile(true)}
                      className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-full text-muted-foreground hover:text-foreground transition-all"
                    >
                      <item.icon size={20} />
                    </button>
                  );
                }
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-full transition-all relative",
                      active ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(135,255,157,0.4)] scale-110" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon size={20} />
                    {item.badge && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-black shadow-[0_0_10px_rgba(255,0,150,0.5)]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile "More" Drawer */}
            {showMoreMobile && (
              <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in duration-300 flex flex-col p-8">
                <div className="flex justify-between items-center mb-12">
                  <h2 className="text-3xl font-display font-black uppercase tracking-tighter">Explore</h2>
                  <button onClick={() => setShowMoreMobile(false)} className="p-3 bg-white/10 rounded-full"><X /></button>
                </div>

                <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-12">
                  {allItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMoreMobile(false)}
                      className={cn(
                        "flex flex-col gap-3 p-6 rounded-[2rem] border border-white/5 transition-all active:scale-95",
                        pathname.startsWith(item.href) ? "bg-primary text-primary-foreground" : "bg-white/5 text-foreground"
                      )}
                    >
                      <item.icon size={24} />
                      <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                    </Link>
                  ))}
                  <div className="flex flex-col gap-3 p-6 rounded-[2rem] border border-destructive/20 bg-destructive/10 text-destructive text-left">
                    <LogoutButton />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ href, label, icon: Icon, active, badge }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-[2rem] transition-all group relative",
        active
          ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(135,255,157,0.25)] font-bold scale-[1.02]"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      <Icon size={18} className={cn(active ? "" : "group-hover:scale-110 transition-transform")} />
      <span className="text-sm tracking-tight">{label}</span>
      {badge && (
        <span className="absolute right-4 w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_rgba(255,0,150,0.5)]" />
      )}
    </Link>
  );
}
