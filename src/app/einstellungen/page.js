import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { getCloseFriends } from "@/lib/profile/closeFriends";
import { getProfileData } from "@/lib/profile/profile";
import EinstellungenClient from "./EinstellungenClient";

export default async function EinstellungenPage({ searchParams }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const { user, contact, social } = data;
  const { tab } = await searchParams;
  const closeFriends = await getCloseFriends();

  return (
    <AppShell user={user} session={session}>
      <EinstellungenClient
        user={user}
        contact={contact}
        social={social}
        closeFriends={closeFriends}
        activeTab={tab || "profil"}
      />
    </AppShell>
  );
}
