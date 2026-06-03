"use client";
import {
  Archive,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  Target,
  X,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

function PollCard({ poll }) {
  const t = useTranslations("Polls");
  const locale = useLocale();

  const isFinalized = !!poll.finalizedOptionId;

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const pollDates = poll.options
      .filter((o) => o.dateValue)
      .map((o) => new Date(o.dateValue));
    const years = [...new Set(pollDates.map((pd) => pd.getFullYear()))];

    const showYear = d.getFullYear() !== now.getFullYear() || years.length > 1;

    return d.toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: showYear ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabel = isFinalized ? t("status.finalized") : t("status.ongoing");
  const statusClass = isFinalized
    ? "bg-emerald-500/15 text-emerald-400"
    : "bg-primary/15 text-primary";

  const Icon =
    poll.type === "survey" ? CheckSquare : isFinalized ? CheckCircle2 : Target;

  return (
    <Link href={`/umfrage/${poll.id}`} className="block">
      <div className="flex items-center justify-between p-4 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border rounded-xl transition-all group">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isFinalized ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"}`}
          >
            <Icon size={18} />
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
              {isFinalized && poll.type === "appointment"
                ? t("finalizedOn", {
                    date: formatDate(
                      poll.options.find((o) => o.id === poll.finalizedOptionId)
                        ?.dateValue,
                    ),
                  })
                : t("createdBy", { name: poll.creatorName })}
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

export default function PollList({
  polls,
  isArchiveOpen,
  onCloseArchive,
  archivedPolls,
  loadingArchive,
}) {
  const t = useTranslations("Polls");
  const tc = useTranslations("Common");

  if (!polls || polls.length === 0) {
    return (
      <div className="bg-sidebar rounded-xl border border-sidebar-border p-8 text-center relative">
        <Clock className="mx-auto mb-3 text-muted-foreground" size={28} />
        <p className="text-muted-foreground">{t("noPolls")}</p>

        {isArchiveOpen && (
          <ArchiveModal
            onClose={onCloseArchive}
            polls={archivedPolls}
            loading={loadingArchive}
            t={t}
            tc={tc}
          />
        )}
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

      {isArchiveOpen && (
        <ArchiveModal
          onClose={onCloseArchive}
          polls={archivedPolls}
          loading={loadingArchive}
          t={t}
          tc={tc}
        />
      )}
    </div>
  );
}

function ArchiveModal({ onClose, polls, loading, t, tc }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-sidebar border border-sidebar-border rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Archive size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black">{t("archive")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("archiveSubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-sidebar-accent rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">{tc("loading")}</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Clock
                className="mx-auto text-muted-foreground opacity-20"
                size={48}
              />
              <p className="text-muted-foreground font-medium">{t("noPolls")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {polls.map((p) => (
                <PollCard key={p.id} poll={p} />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-sidebar-border flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-sidebar-accent hover:bg-sidebar-accent/80 rounded-xl text-sm font-bold transition-all"
          >
            {tc("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
