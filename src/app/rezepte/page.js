import { redirect } from "next/navigation";
import AppShell from "@/components/layout/Appshell";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";
import { getProfileData } from "@/lib/profile/profile";
import RezepteClient from "./RezepteClient";

export default async function RezeptePage() {
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/rezepte");
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  const result = await phpFetch("/recipes/list");
  const recipesData = result.ok ? (result.data?.data || []) : [];

  return (
    <AppShell user={user} session={session}>
      {!result.ok && (
        <div className="p-6">
          <InlineError />
        </div>
      )}
      <RezepteClient initialRecipes={recipesData} userId={session.sub} />
    </AppShell>
  );
}
