import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getProfileData } from "@/lib/profile/profile";
import ClientGastronomyList from "./ClientGastronomyList";

export default async function GastronomyListPage() {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login?callbackUrl=/entdecken/gastronomie");

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const result = await phpFetch("/discover/list?category=gastronomy");
  const places = result.ok ? (result.data?.data || []) : [];

  return (
    <AppShell user={user} session={session}>
      <ClientGastronomyList initialPlaces={places} />
    </AppShell>
  );
}
