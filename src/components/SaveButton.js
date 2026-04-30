"use client";
import { Check, X } from "lucide-react";

export default function SaveButton({
  pending,
  loading,
  state,
  label = "Speichern",
  children,
  onClick,
  type = "submit",
}) {
  const isPending = pending || loading;
  const isSuccess = state?.ok === true;
  const isError = state?.ok === false;

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type={type}
        onClick={onClick}
        disabled={isPending}
        className={`w-full rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2
          ${
            isError
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
      >
        {isPending
          ? "Wird gespeichert…"
          : isSuccess
            ? <>
                <Check size={15} /> Gespeichert
              </>
            : isError
              ? <>
                  <X size={15} /> Fehler
                </>
              : children || label}
      </button>
      {isError && state.error && (
        <p className="text-destructive text-xs text-center">{state.error}</p>
      )}
    </div>
  );
}
