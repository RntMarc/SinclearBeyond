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

  const matrixHandle = profile.contact?.matrixUser
    ? `@${profile.contact.matrixUser}:${profile.contact.matrixHomeserver}`
    : null;

  return (
    <AppShell user={profile.user} session={session}>
      <ChatClient matrixHandle={matrixHandle} />
    </AppShell>
  );
}
