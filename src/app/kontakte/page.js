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
      <div className="max-w-3xl mx-auto w-full px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
          {t("subtitle")}
        </p>
        <h1 className="text-4xl font-light text-foreground mb-8">
          {t("title")}
        </h1>
        <ContactList initialContacts={contacts} />
      </div>
    </AppShell>
  );
}
