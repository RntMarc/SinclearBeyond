import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import KalenderClient from "@/components/calendar/CalendarClient";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { InlineError } from "@/components/ui/InlineError";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { phpFetch } from "@/lib/api/phpClient";

export default async function KalenderPage({ searchParams }) {
  const t = await getTranslations("Calendar");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const userResult = await phpFetch(`/users/${session.sub}`);
  const user = userResult.ok ? (userResult.data?.data || userResult.data) : null;

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
          {!userResult.ok && (
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
