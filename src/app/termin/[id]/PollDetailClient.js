"use client";
import { Settings2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Notification from "@/components/Notification";
import PollDetail from "@/components/polls/PollDetail";
import PollFormModal from "@/components/polls/PollFormModal";

export default function PollDetailClient({ initialPoll, userId }) {
  const t = useTranslations("Polls");
  const [poll, setPoll] = useState(initialPoll);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const router = useRouter();

  const handleVote = async (optionId, availability) => {
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, availability }),
      });

      if (res.ok) {
        const updatedRes = await fetch(`/api/polls/${poll.id}`);
        if (updatedRes.ok) {
          setPoll(await updatedRes.json());
        }
      }
    } catch (_error) {
      setNotification({ message: "Fehler beim Abstimmen", type: "error" });
    }
  };

  const handleFinalize = async (optionId) => {
    if (!confirm(`${t("finalize")}?`)) return;

    try {
      const res = await fetch(`/api/polls/${poll.id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });

      if (res.ok) {
        setNotification({
          message: t("form.successFinalize"),
          type: "success",
        });
        const updatedRes = await fetch(`/api/polls/${poll.id}`);
        if (updatedRes.ok) {
          setPoll(await updatedRes.json());
        }
      }
    } catch (_error) {
      setNotification({ message: "Fehler beim Finalisieren", type: "error" });
    }
  };

  const handleUpdatePoll = async (form) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setNotification({ message: t("form.successUpdate"), type: "success" });
        setIsEditModalOpen(false);
        const updatedRes = await fetch(`/api/polls/${poll.id}`);
        if (updatedRes.ok) {
          setPoll(await updatedRes.json());
        }
      }
    } catch (_error) {
      setNotification({ message: "Fehler beim Aktualisieren", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("form.deleteConfirm"))) return;

    try {
      const res = await fetch(`/api/polls/${poll.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/termin");
      }
    } catch (_error) {
      setNotification({ message: "Fehler beim Löschen", type: "error" });
    }
  };

  return (
    <div className="space-y-8">
      {poll.isCreator && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 bg-sidebar-accent border border-sidebar-border px-4 py-2 rounded-xl font-bold text-xs hover:bg-sidebar-accent/80 transition-all"
          >
            <Settings2 size={16} />
            {t("editPoll")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2 rounded-xl font-bold text-xs hover:bg-destructive/20 transition-all"
          >
            <Trash2 size={16} />
            {t("deletePoll")}
          </button>
        </div>
      )}

      <PollDetail
        poll={poll}
        userId={userId}
        onVote={handleVote}
        onFinalize={handleFinalize}
      />

      <PollFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={{
          title: poll.title,
          options: poll.options,
          invites: poll.invites,
        }}
        onSubmit={handleUpdatePoll}
        saving={saving}
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
