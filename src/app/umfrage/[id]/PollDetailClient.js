"use client";
import { Settings2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import PollDetail from "@/components/polls/PollDetail";
import PollFormModal from "@/components/polls/PollFormModal";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";
import { markPollAsRead } from "@/lib/polls/actions";

export default function PollDetailClient({ initialPoll, userId }) {
  const t = useTranslations("Polls");
  const [poll, setPoll] = useState(initialPoll);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    markPollAsRead(poll.id);
  }, [poll.id]);

  const handleCounterProposal = async (dateValue) => {
    const result = await fetchAction(
      `/api/polls/${poll.id}/counter-proposal`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateValue }),
      },
      { fallbackError: t("form.errorCounterProposal") },
    );

    if (result.ok) {
      const updatedRes = await fetch(`/api/polls/${poll.id}`);
      if (updatedRes.ok) {
        setPoll(await updatedRes.json());
      }
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  const handleVote = async (answers) => {
    const result = await fetchAction(
      `/api/polls/${poll.id}/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      },
      { fallbackError: t("form.errorVote") },
    );

    if (result.ok) {
      const updatedRes = await fetch(`/api/polls/${poll.id}`);
      if (updatedRes.ok) {
        setPoll(await updatedRes.json());
      }
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  const handleFinalize = async (optionId) => {
    const message = optionId ? t("finalize") : t("closePoll");
    if (!confirm(`${message}?`)) return { ok: false };

    const result = await fetchAction(
      `/api/polls/${poll.id}/finalize`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, closeOnly: !optionId }),
      },
      { fallbackError: t("form.errorFinalize") },
    );

    if (result.ok) {
      const updatedRes = await fetch(`/api/polls/${poll.id}`);
      if (updatedRes.ok) {
        setPoll(await updatedRes.json());
      }
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  const handleUpdatePoll = async (form) => {
    setSaving(true);
    const result = await fetchAction(
      `/api/polls/${poll.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
      { fallbackError: t("form.errorUpdate") },
    );
    setSaving(false);

    if (result.ok) {
      setIsEditModalOpen(false);
      const updatedRes = await fetch(`/api/polls/${poll.id}`);
      if (updatedRes.ok) {
        setPoll(await updatedRes.json());
      }
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  const handleDelete = async () => {
    if (!confirm(t("form.deleteConfirm"))) return { ok: false };

    const result = await fetchAction(
      `/api/polls/${poll.id}`,
      { method: "DELETE" },
      { fallbackError: t("form.errorDelete") },
    );

    if (result.ok) {
      router.push("/umfrage");
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  return (
    <div className="space-y-8">
      {poll.isCreator && (
        <div className="flex justify-end gap-3">
          <SubmitButton
            size="compact"
            variant="secondary"
            icon={<Settings2 size={16} />}
            onClick={() => setIsEditModalOpen(true)}
            label={t("editPoll")}
            successDuration={0}
          />
          <SubmitButton
            size="compact"
            variant="destructive"
            icon={<Trash2 size={16} />}
            onClick={handleDelete}
            label={t("deletePoll")}
            errorToast={t("form.errorDelete")}
            successDuration={0}
          />
        </div>
      )}

      <PollDetail
        poll={poll}
        userId={userId}
        onVote={handleVote}
        onFinalize={handleFinalize}
        onCounterProposal={handleCounterProposal}
      />

      <PollFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={{
          type: poll.type,
          title: poll.title,
          description: poll.description,
          allowCounterProposals: !!poll.allowCounterProposals,
          questions: poll.questions.map((q) => ({
            ...q,
            options: poll.options.filter((o) => o.questionId === q.id),
          })),
          invites: poll.invites,
        }}
        onSubmit={handleUpdatePoll}
        saving={saving}
      />
    </div>
  );
}
