"use client";
import { ChevronRight, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import BirthdayModal from "./BirthdayModal";

export default function BirthdayList({ initialBirthdays }) {
  const t = useTranslations("Birthdays");
  const tc = useTranslations("Common");
  const [selectedUser, setSelectedUser] = useState(null);

  if (!initialBirthdays || initialBirthdays.length === 0) {
    return (
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-8 text-center">
        <p className="text-muted-foreground">{tc("noEntries")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {initialBirthdays.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => setSelectedUser(user)}
            className="flex items-center justify-between p-4 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border rounded-xl transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <Avatar src={user.image} displayName={user.displayName} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {user.displayName}
                  </span>
                  {user.isCloseFriend && (
                    <Heart size={14} className="fill-primary text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.birthdayDay}.{" "}
                  {new Date(0, user.birthdayMonth).toLocaleString("de-DE", {
                    month: "long",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-foreground">
                  {user.daysUntil === 0
                    ? t("today")
                    : t("inDays", { days: user.daysUntil })}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">
                  {user.ageAtNextBirthday} {t("years")}
                </p>
              </div>
              <ChevronRight
                size={18}
                className="text-muted-foreground group-hover:translate-x-1 transition-transform"
              />
            </div>
          </button>
        ))}
      </div>

      {selectedUser && (
        <BirthdayModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
