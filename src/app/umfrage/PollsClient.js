"use client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import PollFormModal from "@/components/polls/PollFormModal";
import PollList from "@/components/polls/PollList";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";
import { markAllPollsAsRead } from "@/lib/polls/actions";

export default function PollsClient({ initialPolls }) {
  const t = useTranslations("Polls");
  const [polls, _setPolls] = useState(initialPolls);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    markAllPollsAsRead();
  }, []);

  const handleCreatePoll = async (form) => {
    if (form.type === "appointment") {
      const hasInvalidDate = form.questions[0].options.some(
        (opt) => !opt.dateValue,
      );
      if (hasInvalidDate) {
        return { ok: false, error: t("form.errorFillAll") };
      }
    }

    setSaving(true);
    const result = await fetchAction(
      "/api/polls",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
      { fallbackError: t("form.errorCreate") },
    );
    setSaving(false);

    if (result.ok) {
      setIsModalOpen(false);
      router.push(`/umfrage/${result.data.id}`);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <SubmitButton
          size="compact"
          icon={<Plus size={18} />}
          onClick={() => setIsModalOpen(true)}
          label={t("newPoll")}
          successDuration={0}
          className="shadow-lg shadow-primary/20"
        />
      </div>

      <PollList polls={polls} />

      <PollFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePoll}
        saving={saving}
      />
    </div>
  );
}
