"use client";
import {
  Check,
  CheckCircle2,
  HelpCircle,
  Star,
  Target,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";

export default function PollDetail({ poll, userId, onVote, onFinalize }) {
  const t = useTranslations("Polls");
  const locale = useLocale();
  const [_finalizing, _setFinalizing] = useState(false);

  const isFinalized = !!poll.finalizedOptionId;
  const isCreator = poll.creatorId === userId;

  const formatDate = (date) => {
    return new Date(date).toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOptionStats = (optionId) => {
    const optionVotes = poll.votes.filter((v) => v.optionId === optionId);
    const yes = optionVotes.filter((v) => v.availability === "yes").length;
    const maybe = optionVotes.filter((v) => v.availability === "maybe").length;
    const no = optionVotes.filter((v) => v.availability === "no").length;

    // Check if all indispensable users have voted 'yes' or 'maybe'
    const indispensableUsers = poll.invites.filter((i) => i.isIndispensable);
    // Specifically check if any indispensable user voted 'no'
    const anyIndispensableVotedNo = indispensableUsers.some((i) =>
      optionVotes.some((v) => v.userId === i.userId && v.availability === "no"),
    );

    const score = yes * 2 + maybe * 1;
    const canHappen = !anyIndispensableVotedNo;

    return { yes, maybe, no, score, canHappen };
  };

  const optionStats = poll.options.map((o) => ({
    id: o.id,
    ...getOptionStats(o.id),
  }));
  const maxScore = Math.max(
    ...optionStats.filter((s) => s.canHappen).map((s) => s.score),
    0,
  );
  const bestOptions = optionStats
    .filter((s) => s.score === maxScore && s.canHappen && maxScore > 0)
    .map((s) => s.id);

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[200px]">
                  {t("invites")}
                </th>
                {poll.options.map((option) => (
                  <th
                    key={option.id}
                    className={`p-4 text-center min-w-[120px] ${bestOptions.includes(option.id) ? "bg-primary/5" : ""}`}
                  >
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {new Date(option.startAt).toLocaleDateString(locale, {
                          weekday: "short",
                        })}
                      </div>
                      <div className="text-sm font-black leading-tight">
                        {new Date(option.startAt).toLocaleDateString(locale, {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">
                        {new Date(option.startAt).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Creator row */}
              <tr>
                <td className="p-4 flex items-center gap-3">
                  <Avatar
                    user={{ id: poll.creatorId, displayName: poll.creatorName }}
                    size="xs"
                  />
                  <span className="text-sm font-medium">{poll.creatorName}</span>
                </td>
                {poll.options.map((option) => (
                  <td
                    key={option.id}
                    className={`p-4 text-center ${bestOptions.includes(option.id) ? "bg-primary/5" : ""}`}
                  >
                    {/* Creator is always assumed 'yes' */}
                    <div className="flex justify-center">
                      <Check size={18} className="text-emerald-500" />
                    </div>
                  </td>
                ))}
              </tr>
              {/* Invitees rows */}
              {poll.invites.map((invite) => (
                <tr key={invite.id}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        user={{
                          id: invite.userId,
                          displayName: invite.displayName,
                          image: invite.image,
                        }}
                        size="xs"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {invite.displayName}
                        </span>
                        {invite.isIndispensable === 1 && (
                          <div className="flex items-center gap-1 text-[10px] text-yellow-600 font-bold uppercase tracking-tight">
                            <Star size={10} fill="currentColor" />
                            {t("indispensable")}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {poll.options.map((option) => {
                    const vote = poll.votes.find(
                      (v) =>
                        v.userId === invite.userId && v.optionId === option.id,
                    );
                    return (
                      <td
                        key={option.id}
                        className={`p-4 text-center ${bestOptions.includes(option.id) ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex justify-center">
                          {vote?.availability === "yes" && (
                            <Check size={18} className="text-emerald-500" />
                          )}
                          {vote?.availability === "maybe" && (
                            <HelpCircle size={18} className="text-yellow-500" />
                          )}
                          {vote?.availability === "no" && (
                            <X size={18} className="text-destructive" />
                          )}
                          {!vote && (
                            <div className="w-4 h-px bg-muted-foreground/20" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Voting row (only if not finalized) */}
              {!isFinalized && (
                <tr className="bg-muted/10 border-t-2 border-border">
                  <td className="p-4 text-sm font-bold">{t("voting.yes")}?</td>
                  {poll.options.map((option) => {
                    const myVote = poll.votes.find(
                      (v) => v.userId === userId && v.optionId === option.id,
                    );
                    return (
                      <td
                        key={option.id}
                        className={`p-4 ${bestOptions.includes(option.id) ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1 bg-sidebar-accent/50 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => onVote(option.id, "yes")}
                            className={`p-1.5 rounded-md transition-all ${myVote?.availability === "yes" ? "bg-emerald-500 text-white shadow-sm" : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500"}`}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onVote(option.id, "maybe")}
                            className={`p-1.5 rounded-md transition-all ${myVote?.availability === "maybe" ? "bg-yellow-500 text-white shadow-sm" : "hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-500"}`}
                          >
                            <HelpCircle size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onVote(option.id, "no")}
                            className={`p-1.5 rounded-md transition-all ${myVote?.availability === "no" ? "bg-destructive text-white shadow-sm" : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
            {/* Summary / Best Option Footer */}
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("bestOption")}
                </td>
                {poll.options.map((option) => {
                  const isBest = bestOptions.includes(option.id);
                  const stats = optionStats.find((s) => s.id === option.id);
                  return (
                    <td
                      key={option.id}
                      className={`p-4 text-center ${isBest ? "bg-primary/10" : ""}`}
                    >
                      {isBest && (
                        <div className="flex flex-col items-center gap-1">
                          <Target
                            size={20}
                            className="text-primary animate-pulse"
                          />
                          <span className="text-[10px] font-black uppercase text-primary tracking-tight">
                            Top
                          </span>
                        </div>
                      )}
                      {!stats.canHappen && (
                        <div className="text-[10px] font-bold uppercase text-destructive tracking-tight leading-none">
                          {t("indispensable")}
                          <br />
                          fehlt
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              {isCreator && !isFinalized && (
                <tr className="border-t border-border">
                  <td className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("finalize")}
                  </td>
                  {poll.options.map((option) => (
                    <td
                      key={option.id}
                      className={`p-4 text-center ${bestOptions.includes(option.id) ? "bg-primary/5" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => onFinalize(option.id)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                      >
                        {t("finalize")}
                      </button>
                    </td>
                  ))}
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {isFinalized && (
        <div className="flex items-center gap-4 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-emerald-400">{t("finalized")}</h3>
            <p className="text-sm text-emerald-400/80">
              {t("finalizedOn", {
                date: formatDate(
                  poll.options.find((o) => o.id === poll.finalizedOptionId)
                    ?.startAt,
                ),
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
