"use client";
import {
  Banknote,
  Calendar,
  Camera,
  Compass,
  Gift,
  Lock,
  Map as MapIcon,
  Menu,
  MessageSquarePlus,
  Settings,
  SquarePlay,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import LogoutButton from "@/components/auth/LogoutButton";
import SnowEffect from "@/components/layout/SnowEffect";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function AppShell({ children, user, session }) {
  const t = useTranslations("Navigation");
  const { activeEffects } = useTheme();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const navItems = [
    { href: "/feed", label: t("entertainment"), icon: SquarePlay },
    { href: "/entdecken", label: t("discover"), icon: Compass },
    { href: "/reisen", label: t("travel"), icon: MapIcon },
    { href: "/kalender", label: t("calendar"), icon: Calendar },
    { href: "/geburtstage", label: t("birthdays"), icon: Gift },
    { href: "/kontakte", label: t("contacts"), icon: Users },
    { href: "/fotos", label: t("photos"), icon: Camera },
    {
      href: "/abos",
      label: t("subscriptions"),
      icon: Banknote,
    },
    { href: "/feedback", label: t("feedback"), icon: MessageSquarePlus },
    { href: "/einstellungen", label: t("settings"), icon: Settings },
  ];

  const adminNavItem = { href: "/admin", label: t("admin"), icon: Lock };

  // On mobile, the sidebar is hidden by default and uses the mobile-specific overlay and top-bar.
  // We use isMobile to supplement Tailwind's md: breakpoints for landscape smartphones.
  const showMobileElements = isMobile;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {open && showMobileElements && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 w-full h-full cursor-default"
          onClick={() => setOpen(false)}
          aria-label={t("closeMenu")}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} ${showMobileElements ? "" : "md:translate-x-0 md:static md:flex"}`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border shrink-0">
          <Link
            href="/home"
            className="text-base font-semibold tracking-tight text-sidebar-foreground hover:opacity-80 transition-opacity"
            onClick={() => setOpen(false)}
          >
            Sinclear Beyond
          </Link>
          <button
            type="button"
            className={`${showMobileElements ? "flex" : "hidden md:hidden"} text-sidebar-foreground p-1 rounded hover:bg-sidebar-accent transition-colors`}
            onClick={() => setOpen(false)}
            aria-label={t("closeMenu")}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            ...navItems,
            ...(user?.isAdmin || session?.isAdmin ? [adminNavItem] : []),
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={user?.image}
              displayName={user?.displayName || session?.email}
              size="sm"
            />
            <span className="text-xs text-muted-foreground truncate">
              {user?.displayName ?? session?.email}
            </span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main area — flex-col so children can fill height */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile top bar */}
        <div
          className={`${
            showMobileElements ? "flex" : "hidden"
          } items-center gap-3 px-4 py-4 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm z-30`}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-foreground p-1"
            aria-label={t("openMenu")}
          >
            <Menu size={20} />
          </button>
          <Link
            href="/home"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Sinclear Beyond
          </Link>
        </div>

        {/* flex-1 + overflow-auto: scrollable for normal pages, fillable for fullscreen ones */}
        <main
          className={`flex-1 flex flex-col min-h-0 overflow-auto relative ${activeEffects.showPride ? "effect-pride-banner" : ""} ${activeEffects.showSnow ? "effect-snow-container" : ""}`}
        >
          {activeEffects.showSnow && <SnowEffect />}
          {children}
        </main>
      </div>
    </div>
  );
}
