"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import { fetchAction } from "@/lib/asyncAction";

export default function FeedbackForm() {
  const t = useTranslations("Feedback");
  const tc = useTranslations("Common");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return { ok: false };

    setStatus("saving");
    const result = await fetchAction(
      "/api/feedback",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "feedback", message }),
      },
      { fallbackError: tc("saveError") },
    );

    if (result.ok) {
      setStatus("saved");
      setMessage("");
      setTimeout(() => setStatus("idle"), 3000);
      return { ok: true };
    }
    setStatus("error");
    return { ok: false, error: result.error };
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
          <SubmitButton
            type="submit"
            onClick={handleSubmit}
            label={t("sendFeedback")}
            successToast={t("feedbackSuccess")}
            errorToast={tc("saveError")}
            successDuration={2500}
          />
        </div>
        {status === "saved" && (
          <p className="text-sm text-green-500 text-center mt-2">
            {t("feedbackSuccess")}
          </p>
        )}
      </form>
    </div>
  );
}
