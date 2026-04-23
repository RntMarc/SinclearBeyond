import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AppShell from "@/components/layout/Appshell";
import KalenderClient from "@/components/kalender/KalenderClient";

export default async function KalenderPage() {
  const session = await getSession();

  const [user] = await db
    .select({ displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  return (
    <AppShell user={user} session={session}>
      <KalenderClient />
    </AppShell>
  );
}
