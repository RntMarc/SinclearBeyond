import { MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ChatClient from "@/components/chat/ChatClient";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { listChatRooms } from "@/lib/chat/backend";
import { getContacts } from "@/lib/profile/contacts";
import { getProfileData } from "@/lib/profile/profile";

export default async function ChatPage() {
  const t = await getTranslations("Chat");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const profile = await getProfileData(session);
  if (!profile) redirect("/login");

  let contacts = [];
  let contactsError = false;
  try {
    contacts = (await getContacts()) || [];
  } catch (error) {
    console.error("[ChatPage] Error fetching contacts:", error);
    contactsError = true;
  }

  const roomResult = await listChatRooms();
  const initialRooms = roomResult.ok ? roomResult.data?.data || [] : [];
  const initialRoomsError = roomResult.ok ? null : roomResult.error;

  return (
    <AppShell user={profile.user} session={session}>
      <div className="flex h-full flex-col bg-background">
        <PageHeader
          subtitle={t("subtitle")}
          title={t("title")}
          description={t("description")}
          icon={MessageCircle}
        />
        <ChatClient
          contacts={contacts}
          contactsError={contactsError}
          initialRooms={initialRooms}
          initialRoomsError={initialRoomsError}
          currentUser={profile.user}
        />
      </div>
    </AppShell>
  );
}
