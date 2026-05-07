import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ContactList from "@/components/contacts/ContactList";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { getContacts } from "@/lib/profile/contacts";
import { getProfileData } from "@/lib/profile/profile";

export default async function KontaktePage() {
  const t = await getTranslations("Contacts");
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const contacts = await getContacts();
  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <header className="px-6 py-8 md:px-10 md:py-12 bg-card border-b border-border shrink-0">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
              {t("subtitle")}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {t("title")}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <ContactList initialContacts={contacts} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
