import { MessageCircle } from "lucide-react";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";

export default async function ChatPage() {
  const session = await getSessionWithSubs();
  const profile = session ? await getProfileData(session) : null;

  return (
    <AppShell user={profile?.user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          subtitle="Kommunikation"
          title="Chat"
          icon={MessageCircle}
        />
        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="text-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto text-primary">
              <MessageCircle size={32} />
            </div>
            <p className="text-muted-foreground font-medium">
              Hier wird später noch etwas eingebaut.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
