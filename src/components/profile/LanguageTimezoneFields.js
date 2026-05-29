"use client";

import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";

const timezones = Intl.supportedValuesOf("timeZone");

export default function LanguageTimezoneFields({
  language,
  setLanguage,
  timezone,
  setTimezone,
}) {
  const t = useTranslations("Settings.appearance");
  const tLang = useTranslations("Settings.language");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="language" className="block text-sm font-medium mb-4">
          {tLang("label")}
        </label>
        <div className="relative">
          <select
            id="language"
            name="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none"
          >
            <option value="de">{tLang("german")}</option>
            <option value="de-als">{tLang("swabian")}</option>
            <option value="en">{tLang("english")}</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <Languages size={16} className="text-muted-foreground" />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-medium mb-4">
          {t("timezoneLabel")}
        </label>
        <select
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
