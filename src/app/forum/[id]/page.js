import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";
import ForumDetailClient from "./ForumDetailClient";

export default async function ForumDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <ForumDetailClient forumId={id} userId={user.id} />
    </AppShell>
  );
}
