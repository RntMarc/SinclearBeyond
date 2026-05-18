"use client";
import { Send, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import Button from "@/components/ui/Button";

export default function MessageModal({ contact, onClose }) {
  const t = useTranslations("Contacts");
  const commonT = useTranslations("Common");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${contact.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || commonT("genericError"));
      }

      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-sidebar border border-sidebar-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-20 bg-primary/10 flex items-center px-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-foreground transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <Avatar src={contact.image} displayName={contact.displayName} size="sm" />
            <div>
              <h2 className="text-lg font-semibold leading-tight">
                {t("messageTo")} {contact.displayName}
              </h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <Send size={24} />
              </div>
              <p className="text-foreground font-medium">{t("messageSent")}</p>
              <p className="text-xs text-muted-foreground">{commonT("saved")}</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("messageSubject")}
                </label>
                <input
                  required
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("messageSubjectPlaceholder")}
                  className="w-full bg-sidebar-accent border border-sidebar-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("messageBody")}
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("messageBodyPlaceholder")}
                  className="w-full bg-sidebar-accent border border-sidebar-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1"
                >
                  {commonT("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSending}
                  className="flex-1"
                >
                  {isSending ? commonT("loading") : t("sendButton")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      {/* Overlay click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
