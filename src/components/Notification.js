"use client";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Notification({
  message,
  type = "success",
  duration = 3000,
  onClose,
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgClass = {
    success: "bg-emerald-500/15 border-emerald-500/50 text-emerald-500",
    error: "bg-destructive/15 border-destructive/50 text-destructive",
    info: "bg-primary/15 border-primary/50 text-primary",
  }[type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[type];

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 ${bgClass}`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        type="button"
        onClick={() => {
          setIsVisible(false);
          if (onClose) onClose();
        }}
        className="ml-2 hover:opacity-70 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
}
