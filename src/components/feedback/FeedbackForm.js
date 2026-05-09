"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import SaveButton from "@/components/SaveButton";

export default function FeedbackForm() {
  const t = useTranslations("Feedback");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("saving");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "feedback", message }),
      });

      if (res.ok) {
        setStatus("saved");
        setMessage("");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch (_err) {
      setStatus("error");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-2">{t("generalFeedback")}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t("generalFeedbackDesc")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("feedbackPlaceholder")}
          className="w-full min-h-[120px] p-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          required
        />
        <div className="flex justify-end">
          <SaveButton
            type="submit"
            status={status}
            idleText={t("sendFeedback")}
            savingText={useTranslations("Common")("saving")}
            savedText={t("feedbackSuccess")}
          />
        </div>
      </form>
    </div>
  );
}
