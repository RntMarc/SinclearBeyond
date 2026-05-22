import { eq } from "drizzle-orm";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import KalenderClient from "@/components/calendar/CalendarClient";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db, safeQuery } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export default async function KalenderPage({ searchParams }) {
  const t = await getTranslations("Calendar");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const { data: userData, error: userError } = await safeQuery(
    db
      .select({
        displayName: users.displayName,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, session.sub))
      .limit(1),
  );
  const user = userData?.[0];

  const view = (await searchParams)?.view || "month";

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          subtitle={t("subtitle")}
          title={t("title")}
          icon={Calendar}
        />

        <div className="flex-1 overflow-hidden flex flex-col">
          {userError && (
            <div className="p-4">
              <InlineError />
            </div>
          )}
          <KalenderClient
            userId={session.sub}
            initialView={view}
            timezone={session.timezone}
          />
        </div>
      </div>
    </AppShell>
  );
}
