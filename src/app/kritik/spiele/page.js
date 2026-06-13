import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getProfileData } from "@/lib/profile/profile";
import GamesClient from "./GamesClient";

export default async function GamesPage() {
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/kritik/spiele");
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const result = await phpFetch("/media/list?type=game");
  const games = result.ok ? (result.data?.data || []) : [];

  return (
    <AppShell user={user} session={session}>
      {!result.ok && (
        <div className="p-6">
          <InlineError />
        </div>
      )}
      <GamesClient initialGames={games} />
    </AppShell>
  );
}
