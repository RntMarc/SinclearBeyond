"use client";
import {
  Check,
  CheckCircle2,
  HelpCircle,
  Send,
  Star,
  Target,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import SaveButton from "@/components/SaveButton";

export default function PollDetail({ poll, userId, onVote, onFinalize }) {
  const t = useTranslations("Polls");
  const locale = useLocale();
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize answers from poll votes
  useEffect(() => {
    const initialAnswers = {};
    poll.votes
      .filter((v) => v.userId === userId)
      .forEach((v) => {
        if (poll.type === "appointment") {
          if (!initialAnswers[v.questionId]) initialAnswers[v.questionId] = {};
          initialAnswers[v.questionId][v.optionId] = v.availability;
        } else {
          const question = poll.questions.find((q) => q.id === v.questionId);
          if (question?.type === "multiple_choice") {
            if (!initialAnswers[v.questionId])
              initialAnswers[v.questionId] = [];
            initialAnswers[v.questionId].push(v.optionId);
          } else if (["single_choice"].includes(question?.type)) {
            initialAnswers[v.questionId] = v.optionId;
          } else if (["checkbox", "toggle"].includes(question?.type)) {
            initialAnswers[v.questionId] =
              v.value !== null && v.value !== undefined
                ? v.value === "true" || v.value === "yes"
                : v.optionId !== null && v.optionId !== undefined;
          } else {
            initialAnswers[v.questionId] = v.value;
          }
        }
      });
    setAnswers(initialAnswers);
  }, [poll, userId]);

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

  if (poll.type === "appointment") {
    // Appointment logic (grid)
    const dateQuestion = poll.questions.find((q) => q.type === "date");
    if (!dateQuestion) return <div>Invalid poll structure</div>;

    const options = poll.options.filter(
      (o) => o.questionId === dateQuestion.id,
    );

    const getOptionStats = (optionId) => {
      const optionVotes = poll.votes.filter((v) => v.optionId === optionId);
      const yes = optionVotes.filter((v) => v.availability === "yes").length;
      const maybe = optionVotes.filter(
        (v) => v.availability === "maybe",
      ).length;
      const no = optionVotes.filter((v) => v.availability === "no").length;

      const indispensableUsers = poll.invites.filter((i) => i.isIndispensable);
      const anyIndispensableVotedNo = indispensableUsers.some((i) =>
        optionVotes.some(
          (v) => v.userId === i.userId && v.availability === "no",
        ),
      );

      const score = yes * 2 + maybe * 1;
      const canHappen = !anyIndispensableVotedNo;

      return { yes, maybe, no, score, canHappen };
    };

    const optionStats = options.map((o) => ({
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

    const handleVoteClick = async (optionId, availability) => {
      const qId = dateQuestion.id;
      const newQuestionAnswers = {
        ...(answers[qId] || {}),
        [optionId]: availability,
      };

      // Update local state immediately for snappy UI
      setAnswers((prev) => ({
        ...prev,
        [qId]: newQuestionAnswers,
      }));

      // Send all votes for this question
      const votesToSend = Object.entries(newQuestionAnswers).map(
        ([optId, avail]) => ({
          questionId: qId,
          optionId: optId,
          availability: avail,
        }),
      );

      await onVote(votesToSend);
    };

    return (
      <div className="space-y-8">
        {poll.description && (
          <div className="bg-sidebar-accent/30 border border-sidebar-border rounded-lg-custom p-6">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {poll.description}
            </p>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg-custom overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[200px]">
                    {t("invites")}
                  </th>
                  {options.map((option) => (
                    <th
                      key={option.id}
                      className={`p-4 text-center min-w-[120px] ${bestOptions.includes(option.id) ? "bg-primary/5" : ""}`}
                    >
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          {new Date(option.dateValue).toLocaleDateString(
                            locale,
                            {
                              weekday: "short",
                            },
                          )}
                        </div>
                        <div className="text-sm font-black leading-tight">
                          {new Date(option.dateValue).toLocaleDateString(
                            locale,
                            {
                              day: "2-digit",
                              month: "2-digit",
                            },
                          )}
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">
                          {new Date(option.dateValue).toLocaleTimeString(
                            locale,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Creator row */}
                <tr>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={poll.creatorImage}
                        displayName={poll.creatorName}
                        size="xs"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {poll.creatorName}
                        </span>
                        {poll.invites.find((i) => i.userId === poll.creatorId)
                          ?.isIndispensable === 1 && (
                          <div className="flex items-center gap-1 text-[10px] text-yellow-600 font-bold uppercase tracking-tight">
                            <Star size={10} fill="currentColor" />
                            {t("indispensable")}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {options.map((option) => {
                    const vote = poll.votes.find(
                      (v) =>
                        v.userId === poll.creatorId && v.optionId === option.id,
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
                {/* Invitees rows */}
                {poll.invites
                  .filter((i) => i.userId !== poll.creatorId)
                  .map((invite) => (
                    <tr key={invite.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={invite.image}
                            displayName={invite.displayName}
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
                      {options.map((option) => {
                        const vote = poll.votes.find(
                          (v) =>
                            v.userId === invite.userId &&
                            v.optionId === option.id,
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
                                <HelpCircle
                                  size={18}
                                  className="text-yellow-500"
                                />
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
                    <td className="p-4 text-sm font-bold">
                      {t("voting.confirm")}
                    </td>
                    {options.map((option) => {
                      const myAvailability =
                        answers[dateQuestion.id]?.[option.id];
                      return (
                        <td
                          key={option.id}
                          className={`p-4 ${bestOptions.includes(option.id) ? "bg-primary/5" : ""}`}
                        >
                          <div className="flex items-center justify-center gap-1 bg-sidebar-accent/50 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleVoteClick(option.id, "yes")}
                              className={`p-1.5 rounded-md transition-all ${myAvailability === "yes" ? "bg-emerald-500 text-white shadow-sm" : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500"}`}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleVoteClick(option.id, "maybe")
                              }
                              className={`p-1.5 rounded-md transition-all ${myAvailability === "maybe" ? "bg-yellow-500 text-white shadow-sm" : "hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-500"}`}
                            >
                              <HelpCircle size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVoteClick(option.id, "no")}
                              className={`p-1.5 rounded-md transition-all ${myAvailability === "no" ? "bg-destructive text-white shadow-sm" : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"}`}
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
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("bestOption")}
                  </td>
                  {options.map((option) => {
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
                            {t("missing")}
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
                    {options.map((option) => (
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
          <div className="flex items-center gap-4 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg-custom">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-emerald-400">{t("finalized")}</h3>
              <p className="text-sm text-emerald-400/80">
                {t("finalizedOn", {
                  date: formatDate(
                    options.find((o) => o.id === poll.finalizedOptionId)
                      ?.dateValue,
                  ),
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Survey logic
  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const surveyAnswers = Object.entries(answers).flatMap(([qId, val]) => {
      if (Array.isArray(val)) {
        return val.map((v) => ({ questionId: qId, optionId: v }));
      }
      const question = poll.questions.find((q) => q.id === qId);
      if (question.type === "single_choice") {
        return [{ questionId: qId, optionId: val }];
      }
      if (["checkbox", "toggle"].includes(question.type)) {
        return [
          {
            questionId: qId,
            value: val ? "yes" : "no",
          },
        ];
      }
      return [{ questionId: qId, value: val }];
    });
    await onVote(surveyAnswers);
    setSaving(false);
  };

  const updateAnswer = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-sidebar-accent/30 border border-sidebar-border rounded-3xl p-8 space-y-2">
        <h2 className="text-2xl font-black">{poll.title}</h2>
        {poll.description && (
          <p className="text-muted-foreground whitespace-pre-wrap">
            {poll.description}
          </p>
        )}
        <div className="flex items-center gap-2 pt-2">
          <Avatar
            src={poll.creatorImage}
            displayName={poll.creatorName}
            size="xs"
          />
          <span className="text-xs text-muted-foreground">
            {t("createdBy", { name: poll.creatorName })}
          </span>
        </div>
      </div>

      <form onSubmit={handleSurveySubmit} className="space-y-6">
        {poll.questions.map((q) => {
          const qOptions = poll.options.filter((o) => o.questionId === q.id);
          const currentAnswer =
            answers[q.id] ??
            poll.votes.find((v) => v.questionId === q.id && v.userId === userId)
              ?.value ??
            (q.type === "multiple_choice"
              ? poll.votes
                  .filter((v) => v.questionId === q.id && v.userId === userId)
                  .map((v) => v.optionId)
              : poll.votes.find(
                  (v) => v.questionId === q.id && v.userId === userId,
                )?.optionId) ??
            "";

          return (
            <div
              key={q.id}
              className="bg-card border border-border rounded-lg-custom p-6 space-y-4"
            >
              <label className="block text-sm font-bold">{q.title}</label>

              {q.type === "text" && (
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                />
              )}

              {q.type === "textarea" && (
                <textarea
                  value={currentAnswer}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  rows={4}
                  className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none"
                />
              )}

              {q.type === "single_choice" && (
                <div className="space-y-2">
                  {qOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 p-3 bg-sidebar-accent/30 border border-sidebar-border rounded-xl cursor-pointer hover:bg-sidebar-accent transition-all"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={currentAnswer === opt.id}
                        onChange={() => updateAnswer(q.id, opt.id)}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "multiple_choice" && (
                <div className="space-y-2">
                  {qOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 p-3 bg-sidebar-accent/30 border border-sidebar-border rounded-xl cursor-pointer hover:bg-sidebar-accent transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(currentAnswer) &&
                          currentAnswer.includes(opt.id)
                        }
                        onChange={(e) => {
                          const prev = Array.isArray(currentAnswer)
                            ? currentAnswer
                            : [];
                          if (e.target.checked) {
                            updateAnswer(q.id, [...prev, opt.id]);
                          } else {
                            updateAnswer(
                              q.id,
                              prev.filter((id) => id !== opt.id),
                            );
                          }
                        }}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "checkbox" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!currentAnswer}
                    onChange={(e) => updateAnswer(q.id, e.target.checked)}
                    className="h-5 w-5 rounded border-sidebar-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    {t("yes")}
                  </span>
                </label>
              )}

              {q.type === "toggle" && (
                <div className="inline-flex rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-1">
                  <button
                    type="button"
                    onClick={() => updateAnswer(q.id, true)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      currentAnswer
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("yes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAnswer(q.id, false)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      currentAnswer === false
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("no")}
                  </button>
                </div>
              )}

              {["email", "number", "address"].includes(q.type) && (
                <input
                  type={q.type === "number" ? "number" : "text"}
                  value={currentAnswer}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                />
              )}
            </div>
          );
        })}

        <div className="flex justify-end">
          <SaveButton
            loading={saving}
            type="submit"
            className="px-8 py-3 rounded-lg-custom shadow-xl shadow-primary/20"
          >
            <Send size={18} className="mr-2" />
            {t("form.save")}
          </SaveButton>
        </div>
      </form>

      {isCreator && poll.type === "survey" && poll.votes.length > 0 && (
        <div className="pt-10 space-y-6">
          <h3 className="text-xl font-black">
            {t("results")} ({new Set(poll.votes.map((v) => v.userId)).size})
          </h3>
          <div className="bg-card border border-border rounded-lg-custom overflow-hidden divide-y divide-border">
            {poll.questions.map((q) => {
              const qVotes = poll.votes.filter((v) => v.questionId === q.id);
              return (
                <div key={q.id} className="p-6 space-y-3">
                  <p className="text-sm font-bold text-primary uppercase tracking-wider">
                    {q.title}
                  </p>
                  <div className="space-y-2">
                    {qVotes.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm"
                      >
                        <Avatar
                          src={
                            poll.invites.find((i) => i.userId === v.userId)
                              ?.image ||
                            (v.userId === poll.creatorId
                              ? poll.creatorImage
                              : null)
                          }
                          displayName={
                            poll.invites.find((i) => i.userId === v.userId)
                              ?.displayName || poll.creatorName
                          }
                          size="xs"
                        />
                        <span className="bg-muted/30 px-3 py-1.5 rounded-lg flex-1">
                          {v.value ||
                            poll.options.find((o) => o.id === v.optionId)
                              ?.label ||
                            (v.optionId ? t("yes") : t("no"))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
