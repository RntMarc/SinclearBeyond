"use client";

import { Bell, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

export default function NotificationBell({ side = "right" }) {
  const t = useTranslations("Notifications");
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const clearAll = async () => {
    try {
      const res = await fetch("/api/notifications?all=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to clear all notifications", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label={t("title")}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute ${side === "left" ? "left-0" : "right-0"} mt-2 w-80 max-h-[32rem] overflow-hidden rounded-2xl border bg-card shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          <div className="p-4 border-b flex items-center justify-between bg-muted/30">
            <h3 className="font-bold">{t("title")}</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("clearAll")}
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[24rem]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">{t("empty")}</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-muted/30 transition-colors group relative"
                  >
                    <Link
                      prefetch={false}
                      href={notification.link}
                      onClick={() => {
                        setIsOpen(false);
                        markAsRead(notification.id);
                      }}
                      className="block"
                    >
                      <p className="text-sm font-medium leading-tight mb-1">
                        {notification.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className="absolute top-4 right-4 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                      aria-label={t("markAsRead")}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t bg-muted/10">
              <Link
                prefetch={false}
                href="/home"
                onClick={() => setIsOpen(false)}
                className="block w-full py-2 text-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("viewAll")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
