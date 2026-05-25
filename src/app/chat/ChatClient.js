"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";

export default function ChatClient({ matrixHandle }) {
  const t = useTranslations("Chat");

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader subtitle={t("subtitle")} title={t("title")} icon={MessageCircle} />
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {matrixHandle ? t("comingSoon") : t("linkRequired")}
          </div>
        </div>
      </div>
    </div>
  );
}
