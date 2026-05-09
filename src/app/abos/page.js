import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import AbosClient from "@/components/subscriptions/AbosClient";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { getSubscriptions } from "@/lib/subscriptions";

export default async function AbosPage() {
  const t = await getTranslations("Subscriptions");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const userId = session.sub;

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      isAdmin: users.isAdmin,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const subscriptions = await getSubscriptions();

  return (
    <AppShell
      user={{ ...user, hasSubscriptions: subscriptions.length > 0 }}
      session={session}
    >
      <div className="flex flex-col min-h-full bg-background">
        <PageHeader subtitle={t("subtitle")} title={t("title")} />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <AbosClient initialSubscriptions={subscriptions} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
