import { redirect } from "next/navigation";
import FeedDashboard from "@/components/feed/FeedDashboard";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { getProfileData } from "@/lib/profile/profile";

export default async function FeedPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getProfileData(session);
  if (!data) redirect("/login");

  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <FeedDashboard />
    </AppShell>
  );
}
