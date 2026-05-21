import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { getPoll } from "@/lib/polls/utils";
import PollDetailClient from "./PollDetailClient";

export default async function PollDetailPage({ params }) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const poll = await getPoll(id, session.sub);
  const t = await getTranslations("Polls");

  if (!poll) {
    notFound();
  }

  return (
    <AppShell session={session}>
      <div className="flex flex-col h-full overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-6 shrink-0">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <Link
              href="/umfrage"
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {t("subtitle")}
              </p>
              <h1 className="text-xl font-black">{poll.title}</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <PollDetailClient initialPoll={poll} userId={session.sub} />
          </div>
        </main>
      </div>
    </AppShell>
  );
}
