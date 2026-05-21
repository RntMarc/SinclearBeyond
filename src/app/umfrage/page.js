import { CalendarCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSession } from "@/lib/auth/session";
import { getPolls } from "@/lib/polls/utils";
import PollsClient from "./PollsClient";

export default async function PollsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const polls = await getPolls(session.sub);
  const t = await getTranslations("Polls");

  return (
    <AppShell session={session}>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={CalendarCheck}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <PollsClient initialPolls={polls} />
          </div>
        </main>
      </div>
    </AppShell>
  );
}
