"use client";
import { CheckCircle2, ChevronRight, Clock, Target } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

function PollCard({ poll }) {
  const t = useTranslations("Polls");
  const locale = useLocale();

  const isFinalized = !!poll.finalizedOptionId;

  const formatDate = (date) => {
    return new Date(date).toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabel = isFinalized ? t("status.finalized") : t("status.ongoing");
  const statusClass = isFinalized
    ? "bg-emerald-500/15 text-emerald-400"
    : "bg-primary/15 text-primary";

  return (
    <Link href={`/termin/${poll.id}`} className="block">
      <div className="flex items-center justify-between p-4 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border rounded-xl transition-all group">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isFinalized ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"}`}
          >
            {isFinalized ? <CheckCircle2 size={18} /> : <Target size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">{poll.title}</span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass}`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isFinalized ? (
                <>
                  {t("finalizedOn", {
                    date: formatDate(
                      poll.options.find((o) => o.id === poll.finalizedOptionId)
                        ?.startAt,
                    ),
                  })}
                </>
              ) : (
                t("createdBy", { name: poll.creatorName })
              )}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-2"
        />
      </div>
    </Link>
  );
}

export default function PollList({ polls }) {
  const t = useTranslations("Polls");

  if (!polls || polls.length === 0) {
    return (
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-8 text-center">
        <Clock className="mx-auto mb-3 text-muted-foreground" size={28} />
        <p className="text-muted-foreground">{t("noPolls")}</p>
      </div>
    );
  }

  const active = polls.filter((p) => !p.finalizedOptionId);
  const finalized = polls.filter((p) => p.finalizedOptionId);

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
            {t("status.ongoing")}
          </p>
          <div className="space-y-3">
            {active.map((p) => (
              <PollCard key={p.id} poll={p} />
            ))}
          </div>
        </div>
      )}

      {finalized.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
            {t("status.finalized")}
          </p>
          <div className="space-y-3">
            {finalized.map((p) => (
              <PollCard key={p.id} poll={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
