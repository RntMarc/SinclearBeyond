import { eq } from "drizzle-orm";
import { CalendarCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { InlineError } from "@/components/ui/InlineError";
import { getSession } from "@/lib/auth/session";
import { db, safeQuery } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { getPolls } from "@/lib/polls/utils";
import PollsClient from "./PollsClient";

export default async function PollsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  let polls = [];
  let pollError = false;
  try {
    polls = await getPolls(session.sub, false);
  } catch (e) {
    console.error("[PollsPage] Error fetching polls:", e);
    pollError = true;
  }

  const { data: userData } = await safeQuery(
    db
      .select({
        displayName: users.displayName,
        image: users.image,
        onboardingCompleted: users.onboardingCompleted,
      })
      .from(users)
      .where(eq(users.id, session.sub))
      .limit(1),
  );
  const user = userData?.[0];

  const t = await getTranslations("Polls");

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={CalendarCheck}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-6">
            {pollError && <InlineError />}
            <PollsClient initialPolls={polls || []} />
          </div>
        </main>
      </div>
    </AppShell>
  );
}
