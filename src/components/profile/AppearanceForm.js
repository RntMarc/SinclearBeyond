"use client";

import { Check, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const timezones = Intl.supportedValuesOf("timeZone");

export default function AppearanceForm({ initialPreferences }) {
  const router = useRouter();
  const t = useTranslations("Settings.appearance");
  const tLang = useTranslations("Settings.language");
  const tCommon = useTranslations("Common");

  const [localLanguage, setLocalLanguage] = useState(
    initialPreferences?.language || "de",
  );
  const [localTimezone, setLocalTimezone] = useState(
    initialPreferences?.timezone || "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!localTimezone) {
      setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [localTimezone]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: "dark", // Enforced
          primaryColor: "#00FF9D", // Enforced
          language: localLanguage,
          timezone: localTimezone,
        }),
      });
      if (res.ok) {
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
    <div className="space-y-12">
      <section>
        <div className="mb-8">
          <span className="sticker sticker-lime mb-3">Settings</span>
          <h2 className="text-3xl font-display font-black uppercase tracking-tighter">
            {t("title")}
          </h2>
        </div>

        <Card className="p-8 md:p-12">
          <div className="space-y-10">
            {/* Language & Timezone */}
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
                    value={localLanguage}
                    onChange={(e) => setLocalLanguage(e.target.value)}
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
                  {t("timezoneLabel")}
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={localTimezone}
                  onChange={(e) => setLocalTimezone(e.target.value)}
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

            <div className="pt-8 border-t border-white/5">
              <div className="flex flex-col gap-6">
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                  <p className="text-xs text-primary font-black uppercase tracking-widest mb-1">
                    Marken-Identität
                  </p>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Sinclear Beyond nutzt ein fest definiertes, immersives
                    Designsystem. Manuelle Farbanpassungen und Theme-Wechsel
                    sind deaktiviert, um eine konsistente visuelle Qualität zu
                    gewährleisten.
                  </p>
                </div>

                <div className="flex justify-start">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="min-w-[160px]"
                  >
                    {saving ? "..." : saved ? <Check size={18} /> : t("save")}
                    {saved && tCommon("saved")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
