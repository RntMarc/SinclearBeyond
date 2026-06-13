import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getProfileData } from "@/lib/profile/profile";
import ClientLeisureList from "./ClientLeisureList";

export default async function LeisureListPage() {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login?callbackUrl=/entdecken/freizeit");

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const result = await phpFetch("/discover/list?category=leisure");
  const places = result.ok ? (result.data?.data || []) : [];

  return (
    <AppShell user={user} session={session}>
      <ClientLeisureList initialPlaces={places} />
    </AppShell>
  );
}
