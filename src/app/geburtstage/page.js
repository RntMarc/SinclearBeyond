import { Gift } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import BirthdayList from "@/components/birthdays/BirthdayList";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getBirthdays } from "@/lib/profile/birthdays";
import { getProfileData } from "@/lib/profile/profile";

export default async function GeburtstagePage() {
  const t = await getTranslations("Birthdays");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const birthdays = await getBirthdays();
  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader subtitle={t("subtitle")} title={t("title")} icon={Gift} />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <BirthdayList initialBirthdays={birthdays} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
