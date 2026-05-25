import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";
import ChatClient from "./ChatClient";

export default async function ChatPage() {
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");
  const profile = await getProfileData(session);
  if (!profile) redirect("/login");

  return (
    <AppShell user={profile.user} session={session}>
      <ChatClient matrixHandle={profile.contact?.matrixHandle} />
    </AppShell>
  );
}
