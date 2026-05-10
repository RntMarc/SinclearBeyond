import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ContactList from "@/components/contacts/ContactList";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getContacts } from "@/lib/profile/contacts";
import { getProfileData } from "@/lib/profile/profile";

export default async function KontaktePage() {
  const t = await getTranslations("Contacts");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const contacts = await getContacts();
  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader subtitle={t("subtitle")} title={t("title")} icon={Users} />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <ContactList initialContacts={contacts} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
