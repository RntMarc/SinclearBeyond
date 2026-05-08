import { eq } from "drizzle-orm";
import KalenderClient from "@/components/calendar/CalendarClient";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export default async function KalenderPage({ searchParams }) {
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
      <KalenderClient userId={session.sub} initialView={view} />
    </AppShell>
  );
}
