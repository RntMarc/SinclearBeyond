"use client";

import { clsx } from "clsx";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";

const categoryColors = {
  feature: "bg-blue-500",
  bugfix: "bg-red-500",
  improvement: "bg-green-500",
  maintenance: "bg-slate-500",
  security: "bg-amber-500",
};

const categoryBorders = {
  feature: "border-blue-500/20",
  bugfix: "border-red-500/20",
  improvement: "border-green-500/20",
  maintenance: "border-slate-500/20",
  security: "border-amber-500/20",
};

const categoryShadows = {
  feature: "shadow-blue-500/10",
  bugfix: "shadow-red-500/10",
  improvement: "shadow-green-500/10",
  maintenance: "shadow-slate-500/10",
  security: "shadow-amber-500/10",
};

export default function ChangelogTimeline({ entries }) {
  const t = useTranslations("Changelog");
  const locale = useLocale();
  const dateLocale = locale === "de" || locale === "de-als" ? de : enUS;

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>{t("noEntries") || "Keine Einträge vorhanden."}</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 md:before:left-0 md:before:ml-5">
      {/* The line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

      {entries.map((entry, _index) => (
        <div key={entry.id} className="relative flex items-start group">
          {/* Dot */}
          <div
            className={clsx(
              "absolute left-5 w-4 h-4 rounded-full border-2 border-background -translate-x-1/2 mt-1.5 z-10 transition-transform group-hover:scale-125",
              categoryColors[entry.category] || "bg-primary",
            )}
          />

          {/* Card */}
          <div className="ml-12 flex-1">
            <div
              className={clsx(
                "bg-card border rounded-xl p-5 shadow-sm transition-all",
                categoryBorders[entry.category],
                categoryShadows[entry.category],
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded text-white",
                      categoryColors[entry.category] || "bg-primary",
                    )}
                  >
                    {t(`categories.${entry.category}`)}
                  </span>
                  <h3 className="font-bold text-card-foreground">
                    {entry.title}
                  </h3>
                </div>
                <time className="text-xs text-muted-foreground font-mono">
                  {format(new Date(entry.createdAt), "P p", {
                    locale: dateLocale,
                  })}
                </time>
              </div>

              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {entry.content}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
