"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function LeaveConfirmModal({ onConfirm, onCancel }) {
  const t = useTranslations("Feed");
  const tCommon = useTranslations("Common");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onCancel, 200);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(onConfirm, 200);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={handleClose} />

      <div
        className={`relative w-full max-w-sm bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-200 ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {t("leaveConfirmTitle")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("leaveConfirmDesc")}
          </p>
        </div>

        <div className="flex border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-4 text-sm font-medium hover:bg-accent transition-colors border-r border-border"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-4 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            {t("leave")}
          </button>
        </div>
      </div>
    </div>
  );
}
