import { eq } from "drizzle-orm";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import KalenderClient from "@/components/calendar/CalendarClient";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export default async function KalenderPage({ searchParams }) {
  const t = await getTranslations("Calendar");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

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
