import { redirect } from "next/navigation";
import ContactList from "@/components/contacts/ContactList";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { getContacts } from "@/lib/profile/contacts";
import { getProfileData } from "@/lib/profile/profile";

export default async function KontaktePage() {
  const session = await getSession();
  const data = await getProfileData();
  if (!session) redirect("/login");

  const contacts = await getContacts();
  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="max-w-4xl mx-auto w-full px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
          Netzwerk
        </p>
        <h1 className="text-4xl font-light text-foreground mb-8">Kontakte</h1>
        <ContactList initialContacts={contacts} />
      </div>
    </AppShell>
  );
}
