"use client";

import { Info, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import AddChangelogModal from "@/components/info/AddChangelogModal";
import ChangelogTimeline from "@/components/info/ChangelogTimeline";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { markAllChangelogAsRead } from "@/lib/changelog/actions";

export default function InfoClient({ entries, isAdmin }) {
  const t = useTranslations("Changelog");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Mark all as read when the page is visited
    markAllChangelogAsRead();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <PageHeader title={t("title")} subtitle={t("subtitle")} icon={Info}>
        {isAdmin && (
          <Button
            onClick={() => setIsModalOpen(true)}
            size="compact"
            className="shadow-lg shadow-primary/20"
          >
            <Plus size={16} />
            {t("addEntry")}
          </Button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <ChangelogTimeline entries={entries} />
        </div>
      </div>

      <AddChangelogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
