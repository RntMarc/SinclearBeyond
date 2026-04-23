import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AppShell from "@/components/layout/Appshell";

export default async function HomePage() {
  const session = await getSession();

  const [user] = await db
    .select({ displayName: users.displayName, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-20">
        <div className="w-full max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
            Dashboard
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-3">
            Hallo, {user?.displayName ?? session.email}.
          </h1>
          <p className="text-muted-foreground text-lg">
            Willkommen bei Sinclear Beyond.
          </p>
        </div>
      </div>
    </AppShell>
  );
}