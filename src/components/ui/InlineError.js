import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function InlineError({ message }) {
  const t = useTranslations("Common");

  return (
    <div className="flex items-center gap-2 p-4 rounded-[2rem] bg-destructive/10 text-destructive text-sm border border-destructive/20">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p>{message || t("dbError")}</p>
    </div>
  );
}
