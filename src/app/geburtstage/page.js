import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import BirthdayList from "@/components/birthdays/BirthdayList";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { getBirthdays } from "@/lib/profile/birthdays";
import { getProfileData } from "@/lib/profile/profile";

export default async function GeburtstagePage() {
  const t = await getTranslations("Birthdays");
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const birthdays = await getBirthdays();
  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="max-w-3xl mx-auto w-full px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
          {t("subtitle")}
        </p>
        <h1 className="text-4xl font-light text-foreground mb-8">
          {t("title")}
        </h1>
        <BirthdayList initialBirthdays={birthdays} />
      </div>
    </AppShell>
  );
}
