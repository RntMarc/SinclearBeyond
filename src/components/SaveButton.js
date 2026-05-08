"use client";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/layout/ThemeProvider";

export default function SaveButton({
  pending,
  loading,
  state,
  label,
  children,
  onClick,
  type = "submit",
}) {
  const t = useTranslations("Common");
  const { activeEffects } = useTheme();
  const isPending = pending || loading;
  const isSuccess = state?.ok === true;
  const isError = state?.ok === false;

  const displayLabel = label || children || t("save");

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
          } ${activeEffects.showPride ? "effect-pride-button" : ""} ${activeEffects.showSnow ? "effect-snow-button" : ""}`}
      >
        {isPending
          ? t("saving")
          : isSuccess
            ? <>
                <Check size={15} /> {t("saved")}
              </>
            : isError
              ? <>
                  <X size={15} /> {t("error")}
                </>
              : displayLabel}
      </button>
      {isError && state.error && (
        <p className="text-destructive text-xs text-center">{state.error}</p>
      )}
    </div>
  );
}
