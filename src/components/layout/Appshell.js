"use client";
import * as LucideIcons from "lucide-react";
import { Info, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import LogoutButton from "@/components/auth/LogoutButton";
import NotificationBell from "@/components/layout/NotificationBell";
import SnowEffect from "@/components/layout/SnowEffect";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import navigationConfig from "@/lib/navigation.json";

function NotificationAutoReader() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const notificationId = searchParams.get("readNotification");
    if (notificationId) {
      const markAsRead = async () => {
        try {
          const res = await fetch(`/api/notifications?id=${notificationId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("readNotification");
            const newQuery = params.toString() ? `?${params.toString()}` : "";
            router.replace(`${pathname}${newQuery}`, { scroll: false });
          }
        } catch (error) {
          console.error("Failed to mark notification as read from URL", error);
        }
      };
      markAsRead();
    }
  }, [searchParams, pathname, router]);

  return null;
}

export default function AppShell({ children, user, session }) {
  const t = useTranslations("Navigation");
  const { activeEffects } = useTheme();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [unreadChangelog, setUnreadChangelog] = useState(0);
  const [unreadForums, setUnreadForums] = useState(0);
  const [unreadTravel, setUnreadTravel] = useState(0);
  const [unreadCalendar, setUnreadCalendar] = useState(0);
  const [unreadPolls, setUnreadPolls] = useState(0);
  const [unreadBirthdays, setUnreadBirthdays] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);

  const [localUser, setLocalUser] = useState(user);

  const unreadCounts = {
    unreadChangelog,
    unreadForums,
    unreadTravel,
    unreadCalendar,
    unreadPolls,
    unreadBirthdays,
    unreadChat,
  };

  useEffect(() => {
    async function checkUnread() {
      try {
        const { getUnreadChangelogCount } = await import(
          "@/lib/changelog/actions"
        );
        const { getUnreadForumsCount } = await import("@/lib/forums/actions");
        const { getUnreadTravelCount } = await import("@/lib/travel/actions");
        const { getUnreadCalendarCount } = await import(
          "@/lib/calendar/actions"
        );
        const { getUnreadPollsCount } = await import("@/lib/polls/actions");
        const { getUnreadBirthdaysCount } = await import(
          "@/lib/profile/birthdayActions"
        );
        const { getUnreadChatCount } = await import("@/lib/chat/actions");
        const [
          changelogCount,
          forumsCount,
          travelCount,
          calendarCount,
          pollsCount,
          birthdaysCount,
          chatCount,
        ] = await Promise.all([
          getUnreadChangelogCount(),
          getUnreadForumsCount(),
          getUnreadTravelCount(),
          getUnreadCalendarCount(),
          getUnreadPollsCount(),
          getUnreadBirthdaysCount(),
          getUnreadChatCount(),
        ]);
        setUnreadChangelog(changelogCount);
        setUnreadForums(forumsCount);
        setUnreadTravel(travelCount);
        setUnreadCalendar(calendarCount);
        setUnreadPolls(pollsCount);
        setUnreadBirthdays(birthdaysCount);
        setUnreadChat(chatCount);
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    }
    if (user || session) {
      checkUnread();
    }
  }, [user, session]);

  useEffect(() => {
    async function fetchUser() {
      if (!user && session?.sub) {
        try {
          const { getProfileData } = await import("@/lib/profile/profile");
          const profile = await getProfileData(session);
          if (profile) {
            setLocalUser(profile.user);
          }
        } catch (error) {
          console.error("Failed to fetch user data in AppShell", error);
        }
      }
    }
    fetchUser();
  }, [user, session]);

  // On mobile, the sidebar is hidden by default and uses the mobile-specific overlay and top-bar.
  // We use isMobile to supplement Tailwind's md: breakpoints for landscape smartphones.
  const showMobileElements = isMobile;

  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense fallback={null}>
        <NotificationAutoReader />
      </Suspense>
      {/* Mobile overlay */}
      {open && showMobileElements && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 w-full h-full cursor-default"
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
          <div className="flex items-center gap-1">
            {!showMobileElements && <NotificationBell side="left" />}
            <button
              type="button"
              className={`${showMobileElements ? "flex" : "hidden md:hidden"} text-sidebar-foreground p-1 rounded hover:bg-sidebar-accent transition-colors`}
              onClick={() => setOpen(false)}
              aria-label={t("closeMenu")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navigationConfig.categories.map((category) => {
            const visibleItems = category.items.filter((item) => {
              if (item.isAdmin) {
                return user?.isAdmin || session?.isAdmin;
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={category.id} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">
                  {t(`categories.${category.id}`)}
                </h4>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = LucideIcons[item.icon] || Info;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/home" && pathname.startsWith(item.href));
                    const hasBadge =
                      item.badgeKey &&
                      unreadCounts[item.badgeKey] > 0 &&
                      !pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                      >
                        <Icon size={16} />
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {hasBadge && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={localUser?.image}
              displayName={localUser?.displayName || session?.email}
              size="sm"
            />
            <span className="text-xs text-muted-foreground truncate">
              {localUser?.displayName ?? session?.email}
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
          <div className="ml-auto">
            <NotificationBell />
          </div>
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
