"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function DeleteConfirmModal({ onConfirm, onCancel }) {
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Beitrag löschen?</h2>
          <p className="text-muted-foreground text-sm">
            Möchtest du diesen Beitrag wirklich unwiderruflich löschen? Diese
            Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>

        <div className="flex border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-4 text-sm font-medium hover:bg-accent transition-colors border-r border-border"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-4 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}
