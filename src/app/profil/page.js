import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import PasskeyManager from "@/components/profile/PasskeyManager";
import ProfilForm from "@/components/profile/ProfilForm";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";

export default async function ProfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const { user, contact, social } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="max-w-lg mx-auto w-full px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
          Profil
        </p>
        <h1 className="text-4xl font-light text-foreground mb-8">
          {user.displayName}
        </h1>
        <ProfilForm user={user} contact={contact} social={social} />
        <PasskeyManager />
      </div>
    </AppShell>
  );
}
