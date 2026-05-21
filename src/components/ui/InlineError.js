import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function InlineError({ message, className = "" }) {
  const t = useTranslations("Common");

  return (
    <div
      className={`flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl ${className}`}
    >
      <AlertCircle size={16} className="shrink-0" />
      <span>{message || t("dbError")}</span>
    </div>
  );
}
