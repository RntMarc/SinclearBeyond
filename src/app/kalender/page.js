import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import KalenderClient from "@/components/calendar/CalendarClient";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export default async function KalenderPage({ searchParams }) {
  const t = await getTranslations("Calendar");
  const session = await getSession();
  if (!session) redirect("/login");

  const [user] = await db
    .select({ displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  const view = (await searchParams)?.view || "month";

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <header className="px-6 py-8 md:px-10 md:py-12 bg-card border-b border-border shrink-0">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
              {t("subtitle")}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {t("title")}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <KalenderClient userId={session.sub} initialView={view} />
        </div>
      </div>
    </AppShell>
  );
}
