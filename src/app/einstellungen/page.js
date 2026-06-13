import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getCloseFriends } from "@/lib/profile/closeFriends";
import { getProfileData } from "@/lib/profile/profile";
import EinstellungenClient from "./EinstellungenClient";

export default async function EinstellungenPage({ searchParams }) {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const prefsResult = await phpFetch(`/user-preferences`);
  const preferences = prefsResult.ok ? (prefsResult.data?.data?.[0] || null) : null;

  const { user, contact, social } = data;
  const { tab } = await searchParams;
  const closeFriends = await getCloseFriends();

  return (
    <AppShell user={user} session={session}>
      <EinstellungenClient
        user={user}
        contact={contact}
        social={social}
        preferences={
          preferences || {
            theme: "dark",
            primaryColor: "#7c3aed",
            language: "de",
          }
        }
        closeFriends={closeFriends}
        activeTab={tab || "profil"}
      />
    </AppShell>
  );
}
