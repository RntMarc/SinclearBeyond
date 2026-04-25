import { getContacts } from "@/app/kontakte/actions";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import ContactList from "@/components/contacts/ContactList";

export default async function KontaktePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const contacts = await getContacts();

  // Wir brauchen den user für die AppShell (displayName etc)
  // session enthält email und sub (id)
  const user = {
    displayName: session.email.split('@')[0], // Fallback falls kein Name da
    email: session.email
  };

  return (
    <AppShell user={user} session={session}>
      <div className="max-w-4xl mx-auto w-full px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
          Netzwerk
        </p>
        <h1 className="text-4xl font-light text-foreground mb-8">
          Kontakte
        </h1>
        <ContactList initialContacts={contacts} />
      </div>
    </AppShell>
  );
}
