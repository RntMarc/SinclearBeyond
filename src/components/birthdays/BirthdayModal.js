"use client";
import { Calendar, Gift, Heart, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Avatar from "@/components/Avatar";

export default function BirthdayModal({ user, onClose }) {
  const t = useTranslations("Birthdays");
  const bday = new Date(user.birthday);
  const formattedDate = bday.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-sidebar border border-sidebar-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-24 bg-primary/10 flex items-end px-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-foreground transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <Avatar
              src={user.image}
              displayName={user.displayName}
              size="xl"
              className="rounded-2xl shadow-lg border-4 border-sidebar !w-16 !h-16"
            />
            <div className="mb-1">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {user.displayName}
                {user.isCloseFriend && (
                  <Heart size={16} className="fill-primary text-primary" />
                )}
              </h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {useTranslations("Contacts")("member")}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-sidebar-border pb-2">
              {t("infoTitle")}
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                    {t("dateLabel")}
                  </p>
                  <p className="text-foreground">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground">
                  <Gift size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">
                    {t("ageLabel")}
                  </p>
                  <p className="text-foreground">
                    {user.currentAge} {t("years")}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 text-center">
                <p className="text-sm text-primary font-medium">
                  {user.daysUntil === 0
                    ? t("todayMessage")
                    : t("countdownMessage", {
                        days: user.daysUntil,
                        age: user.ageAtNextBirthday,
                      })}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground rounded-xl font-medium transition-colors border border-sidebar-border"
          >
            {useTranslations("Contacts")("close")}
          </button>
        </div>
      </div>
      {/* Overlay click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
