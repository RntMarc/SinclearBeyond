"use client";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import PollForm from "./PollForm";

export default function PollFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  saving,
}) {
  const t = useTranslations("Polls");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label={t("close")}
      />
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-6 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              {initialData ? t("editPoll") : t("newPoll")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <PollForm
          initialData={initialData}
          saving={saving}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
