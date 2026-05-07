import { notFound, redirect } from "next/navigation";
import PlaceDetailPage from "@/components/discover/PlaceDetailPage";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";

export default async function Page({ params }) {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/entdecken");

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const { id } = await params;
  if (!id) notFound();

  return (
    <AppShell user={user} session={session}>
      <PlaceDetailPage
        id={id}
        userId={session?.sub}
        isAdmin={session?.isAdmin}
      />
    </AppShell>
  );
}
