import { getSession } from "@/lib/auth/session";
import { getPolls } from "@/lib/polls/utils";
import PollsClient from "./PollsClient";
import AppShell from "@/components/layout/Appshell";
import { getTranslations } from "next-intl/server";

export default async function PollsPage() {
  const session = await getSession();
  const polls = await getPolls(session.sub);
  const t = await getTranslations("Polls");

  return (
    <AppShell session={session}>
      <div className="flex flex-col h-full overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-8 md:px-10 md:py-12 shrink-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                {t("subtitle")}
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {t("title")}
              </h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <PollsClient initialPolls={polls} />
          </div>
        </main>
      </div>
    </AppShell>
  );
}
