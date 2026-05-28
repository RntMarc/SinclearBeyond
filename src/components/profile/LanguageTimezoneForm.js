"use client";

import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

const timezones = Intl.supportedValuesOf("timeZone");

export default function LanguageTimezoneForm({
  language,
  setLanguage,
  timezone,
  setTimezone,
}) {
  const tLang = useTranslations("Settings.language");
  const tAppearance = useTranslations("Settings.appearance");

  useEffect(() => {
    if (!timezone) {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [timezone, setTimezone]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="space-y-4">
        <label
          htmlFor="language"
          className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground"
        >
          {tLang("label")}
        </label>
        <div className="relative group">
          <select
            id="language"
            name="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-[2rem] border border-white/5 bg-white/5 px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-foreground appearance-none transition-all group-hover:bg-white/10"
          >
            <option value="de">{tLang("german")}</option>
            <option value="de-als">{tLang("swabian")}</option>
            <option value="en">{tLang("english")}</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
            <Languages size={18} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label
          htmlFor="timezone"
          className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground"
        >
          {tAppearance("timezoneLabel")}
        </label>
        <select
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full rounded-[2rem] border border-white/5 bg-white/5 px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all hover:bg-white/10"
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
