"use client";
import {
  Calendar,
  Camera,
  Gift,
  Lock,
  Map as MapIcon,
  Menu,
  SquarePlay,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/auth/LogoutButton";
import { useIsMobile } from "@/hooks/useIsMobile";

const navItems = [
  { href: "/feed", label: "Unterhaltung", icon: SquarePlay },
  { href: "/reisen", label: "Reisen", icon: MapIcon },
  { href: "/kalender", label: "Kalender", icon: Calendar },
  { href: "/geburtstage", label: "Geburtstage", icon: Gift },
  { href: "/kontakte", label: "Kontakte", icon: Users },
  { href: "/fotos", label: "Fotografien", icon: Camera },
  { href: "/profil", label: "Profil", icon: User },
];

const adminNavItem = { href: "/admin", label: "Admin", icon: Lock };

export default function AppShell({ children, user, session }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();

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
          aria-label="Menü schließen"
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
            aria-label="Menü schließen"
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
          <span className="text-xs text-muted-foreground truncate min-w-0">
            {user?.displayName ?? session?.email}
          </span>
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
            aria-label="Menü öffnen"
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
        <main className="flex-1 flex flex-col min-h-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
