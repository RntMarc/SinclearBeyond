"use client";

import { AlertTriangle, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/layout/ThemeProvider";
import LanguageTimezoneFields from "@/components/profile/LanguageTimezoneFields";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";
import { isContrastAcceptable, mixColors } from "@/lib/utils";

export default function AppearanceForm({ initialPreferences }) {
  const router = useRouter();
  const t = useTranslations("Settings.appearance");
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

  useEffect(() => {
    if (!localTimezone) {
      setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [localTimezone]);

  const suggestedColors = {
    light: ["#86680e", "#3568cc", "#0a7e0a", "#a42be0"],
    dark: ["#8c7328", "#216bfe", "#0b890b", "#b22ff4"],
  };

  const currentSuggested =
    localTheme === "light" ? suggestedColors.light : suggestedColors.dark;

  // Derive dynamic background color for contrast calculation (following globals.css logic)
  const bgColor =
    localTheme === "light"
      ? mixColors(localColor, "#ffffff", 5) // color-mix(in oklch, var(--primary-custom), white 95%)
      : mixColors(localColor, "#000000", 10); // color-mix(in oklch, var(--primary-custom), black 90%)

  // Background contrast remains at 2.1, but text contrast (on white) must be 4.5
  const isBgContrastOk = isContrastAcceptable(localColor, bgColor, 2.1);
  const isTextContrastOk = isContrastAcceptable(localColor, "#ffffff", 4.5);
  const isContrastOk = isBgContrastOk && isTextContrastOk;

  const handleSave = async () => {
    if (!isContrastOk) return { ok: false, error: t("contrastError") };

    const result = await fetchAction(
      "/api/user/preferences",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: localTheme,
          primaryColor: localColor,
          language: localLanguage,
          timezone: localTimezone,
        }),
      },
      { fallbackError: tCommon("saveError") },
    );

    if (result.ok) {
      setTheme(localTheme);
      setPrimaryColor(localColor);
      router.refresh();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold mb-2">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t("description")}</p>

        <div className="space-y-8 bg-sidebar border border-sidebar-border rounded-2xl p-8">
          {/* Language selection */}
          <LanguageTimezoneFields
            language={localLanguage}
            setLanguage={setLocalLanguage}
            timezone={localTimezone}
            setTimezone={setLocalTimezone}
          />

          <hr className="border-border" />

          {/* Theme Mode */}
          <div>
            <label
              htmlFor="theme-mode"
              className="block text-sm font-medium mb-4"
            >
              {t("themeLabel")}
            </label>
            <div id="theme-mode" className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setLocalTheme("light")}
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
                onClick={() => setLocalTheme("dark")}
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
            <SubmitButton
              type="button"
              onClick={handleSave}
              disabled={!isContrastOk}
              label={t("save")}
              successToast={tCommon("saved")}
              errorToast={tCommon("saveError")}
              className="px-6 py-2"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
