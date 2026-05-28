"use client";

import { useTranslations } from "next-intl";
import VisibilityToggle from "@/components/profile/VisibilityToggle";

export default function BirthdayForm({
  birthday,
  setBirthday,
  visibility,
  setVisibility,
}) {
  const t = useTranslations("Settings.profile");

  return (
    <div className="space-y-4">
      <label
        htmlFor="birthday"
        className="block text-sm font-medium mb-1 text-foreground"
      >
        {t("birthdayLabel")}
      </label>
      <div className="flex gap-2 items-center">
        <input
          id="birthday"
          name="birthday"
          type="date"
          value={birthday || ""}
          onChange={(e) => setBirthday(e.target.value)}
          className="flex-1 rounded-[2rem] border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
        />
        {visibility !== undefined && setVisibility && (
          <VisibilityToggle value={visibility} onChange={setVisibility} />
        )}
        <input
          type="hidden"
          name="birthdayVisibility"
          value={visibility ?? 1}
        />
      </div>
    </div>
  );
}
