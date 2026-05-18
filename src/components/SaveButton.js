"use client";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

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
  const isPending = pending || loading;
  const isSuccess = state?.ok === true;
  const isError = state?.ok === false;

  const displayLabel = label || children || t("save");

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type={type}
        onClick={onClick}
        disabled={isPending}
        variant={isError ? "destructive" : "primary"}
        className="w-full"
      >
        {isPending ? (
          t("saving")
        ) : isSuccess ? (
          <>
            <Check size={15} /> {t("saved")}
          </>
        ) : isError ? (
          <>
            <X size={15} /> {t("error")}
          </>
        ) : (
          displayLabel
        )}
      </Button>
      {isError && state.error && (
        <p className="text-destructive text-xs text-center">{state.error}</p>
      )}
    </div>
  );
}
