import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db } from "@/lib/db/db";
import { userPreferences } from "@/lib/db/schema";
import { getCloseFriends } from "@/lib/profile/closeFriends";
import { getProfileData } from "@/lib/profile/profile";
import EinstellungenClient from "./EinstellungenClient";

export default async function EinstellungenPage({ searchParams }) {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.sub))
    .limit(1);

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
