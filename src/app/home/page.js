import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import SiteHeader from "@/components/SiteHeader";

export default async function HomePage() {
  const session = await getSession();

  const [user] = await db
    .select({ displayName: users.displayName, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen flex flex-col items-center justify-center px-6 pt-24">
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
      </main>
    </>
  );
}
