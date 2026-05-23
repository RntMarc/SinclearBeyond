"use client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Notification from "@/components/Notification";
import PollFormModal from "@/components/polls/PollFormModal";
import PollList from "@/components/polls/PollList";

export default function PollsClient({ initialPolls }) {
  const t = useTranslations("Polls");
  const [polls, _setPolls] = useState(initialPolls);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const router = useRouter();

  const handleCreatePoll = async (form) => {
    setSaving(true);
    try {
      // Basic validation for dates if appointment
      if (form.type === "appointment") {
        const hasInvalidDate = form.questions[0].options.some(
          (opt) => !opt.dateValue,
        );
        if (hasInvalidDate) {
          setNotification({
            message: "Bitte alle Daten ausfüllen",
            type: "error",
          });
          setSaving(false);
          return;
        }
      }

      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const { id } = await res.json();
        setNotification({ message: t("form.successCreate"), type: "success" });
        setIsModalOpen(false);
        router.push(`/umfrage/${id}`);
      } else {
        setNotification({ message: "Fehler beim Erstellen", type: "error" });
      }
    } catch (_error) {
      setNotification({ message: "Netzwerkfehler", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          {t("newPoll")}
        </button>
      </div>

      <PollList polls={polls} />

      <PollFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePoll}
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
