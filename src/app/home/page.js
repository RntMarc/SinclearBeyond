import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export default async function HomePage() {
  const t = await getTranslations("Home");
  const session = await getSession();
  if (!session) redirect("/login");

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-20">
        <div className="w-full max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 font-medium">
            {t("subtitle")}
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-3">
            {t("welcome", { name: user?.displayName ?? session.email })}
          </h1>
          <p className="text-muted-foreground text-lg">{t("description")}</p>
        </div>
      </div>
    </AppShell>
  );
}
