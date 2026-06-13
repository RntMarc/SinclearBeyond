import { FileText, Wrench } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";

export async function generateMetadata() {
  const t = await getTranslations("Navigation");
  return {
    title: `${t("office")} | Sinclear Beyond`,
  };
}

export default async function OfficePage() {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const userResult = await phpFetch(`/users/${session.sub}`);
  const user = userResult.ok ? (userResult.data?.data || userResult.data) : null;

  const t = await getTranslations("Office");
  const navT = await getTranslations("Navigation");

  return (
    <AppShell
      user={user}
      session={session}
    >
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          subtitle={t("subtitle")}
          title={navT("office")}
          icon={FileText}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Content */}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
