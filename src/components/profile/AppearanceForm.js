"use client";

import { AlertTriangle, Check, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { isContrastAcceptable, mixColors } from "@/lib/utils";

const timezones = Intl.supportedValuesOf("timeZone");

export default function AppearanceForm({ initialPreferences }) {
  const router = useRouter();
  const t = useTranslations("Settings.appearance");
  const tLang = useTranslations("Settings.language");
  const tCommon = useTranslations("Common");
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();
  const [localTheme, setLocalTheme] = useState(theme);
  const [localColor, setLocalColor] = useState(primaryColor);
  const [localLanguage, setLocalLanguage] = useState(
    initialPreferences?.language || "de",
  );
  const [localTimezone, setLocalTimezone] = useState(
    initialPreferences?.timezone || "",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!localTimezone) {
      setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [localTimezone]);

  const [saved, setSaved] = useState(false);

  const suggestedColors = {
    light: ["#86680e", "#3568cc", "#0a7e0a", "#a42be0"], // Gold, Blue, Green, Violet
    dark: ["#8c7328", "#216bfe", "#0b890b", "#b22ff4"], // Gold, Blue, Green, Violet
    "neo-retro": ["#9fff00", "#9b4dff", "#ff00d4", "#00f0ff"], // Neon Lime, Purple, Magenta, Cyan
  };

  const currentSuggested = suggestedColors[localTheme] || suggestedColors.dark;

  // Derive dynamic background color for contrast calculation (following globals.css logic)
  let bgColor;
  if (localTheme === "light") {
    bgColor = mixColors(localColor, "#ffffff", 5);
  } else if (localTheme === "neo-retro") {
    bgColor = "#0d111a"; // Fixed background for neo-retro
  } else {
    bgColor = mixColors(localColor, "#000000", 10);
  }

  // Background contrast remains at 2.1, but text contrast (on white) must be 4.5
  const isBgContrastOk = isContrastAcceptable(localColor, bgColor, 2.1);
  const isTextContrastOk = isContrastAcceptable(localColor, "#ffffff", 4.5);
  const isContrastOk = isBgContrastOk && isTextContrastOk;

  const handleSave = async () => {
    if (!isContrastOk) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: localTheme,
          primaryColor: localColor,
          language: localLanguage,
          timezone: localTimezone,
        }),
      });
      if (res.ok) {
        setTheme(localTheme);
        setPrimaryColor(localColor);
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save preferences", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold mb-2">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t("description")}</p>

        <div className="space-y-8 bg-sidebar border border-sidebar-border rounded-lg-custom p-8">
          {/* Language selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium mb-4"
              >
                {tLang("label")}
              </label>
              <div className="relative">
                <select
                  id="language"
                  name="language"
                  value={localLanguage}
                  onChange={(e) => setLocalLanguage(e.target.value)}
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
              <label
                htmlFor="timezone"
                className="block text-sm font-medium mb-4"
              >
                {t("timezoneLabel")}
              </label>
              <select
                id="timezone"
                name="timezone"
                value={localTimezone}
                onChange={(e) => setLocalTimezone(e.target.value)}
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

          <hr className="border-border" />

          {/* Theme Mode */}
          <div>
            <label
              htmlFor="theme-mode"
              className="block text-sm font-medium mb-4"
            >
              {t("themeLabel")}
            </label>
            <div id="theme-mode" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => {
                  setLocalTheme("light");
                  if (!suggestedColors.light.includes(localColor))
                    setLocalColor(suggestedColors.light[0]);
                }}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  localTheme === "light"
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-background hover:bg-muted"
                }`}
              >
                <div className="w-full h-20 bg-white rounded-md border border-gray-200 flex flex-col p-2 gap-2">
                  <div className="h-2 w-1/2 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-blue-500 rounded" />
                </div>
                <span className="text-sm font-medium">{t("light")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalTheme("dark");
                  if (!suggestedColors.dark.includes(localColor))
                    setLocalColor(suggestedColors.dark[0]);
                }}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  localTheme === "dark"
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-background hover:bg-muted"
                }`}
              >
                <div className="w-full h-20 bg-gray-900 rounded-md border border-gray-800 flex flex-col p-2 gap-2">
                  <div className="h-2 w-1/2 bg-gray-700 rounded" />
                  <div className="h-4 w-full bg-blue-600 rounded" />
                </div>
                <span className="text-sm font-medium">{t("dark")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalTheme("neo-retro");
                  setLocalColor(suggestedColors["neo-retro"][0]);
                }}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  localTheme === "neo-retro"
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-background hover:bg-muted"
                }`}
              >
                <div className="w-full h-20 bg-[#0d111a] rounded-md border border-gray-800 flex flex-col p-2 gap-2 overflow-hidden relative">
                  <div className="h-2 w-1/2 bg-gray-700 rounded" />
                  <div className="h-4 w-full bg-[#9fff00] rounded" />
                  <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-[#9b4dff] rounded-full blur-xl opacity-50" />
                </div>
                <span className="text-sm font-medium">{t("neo-retro")}</span>
              </button>
            </div>
          </div>

          {/* Primary Color */}
          <div className="space-y-4">
            <label
              htmlFor="primary-color"
              className="block text-sm font-medium"
            >
              {t("primaryColorLabel")}
            </label>

            <div id="primary-color" className="flex flex-wrap gap-3">
              {currentSuggested.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setLocalColor(color)}
                  className="w-10 h-10 rounded-full border-2 border-background ring-2 ring-transparent hover:ring-muted-foreground transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: color,
                    boxShadow:
                      localColor === color
                        ? "0 0 0 2px var(--color-primary)"
                        : "none",
                  }}
                >
                  {localColor === color && (
                    <Check
                      size={16}
                      className={
                        isContrastAcceptable(color, "#ffffff")
                          ? "text-black"
                          : "text-white"
                      }
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">
                  {t("customColor")}
                </p>
                <div className="flex gap-2">
                  <input
                    id="primary-color-picker"
                    type="color"
                    value={localColor}
                    onChange={(e) => setLocalColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent"
                  />
                  <input
                    id="primary-color-hex"
                    type="text"
                    value={localColor}
                    onChange={(e) => setLocalColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-sm font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            {!isContrastOk && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-xs">
                <AlertTriangle size={14} />
                {t("contrastError")}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isContrastOk}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? "..." : saved ? <Check size={16} /> : t("save")}
              {saved && tCommon("saved")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
