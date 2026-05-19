import { eq } from "drizzle-orm";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import HomeContent from "@/components/home/HomeContent";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { HomeSkeleton } from "@/components/layout/Skeletons";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

export default async function HomePage() {
  const t = await getTranslations("Home");
  const session = await getSessionWithSubs();
  if (!session) redirect("/login");

  const userId = session.sub;

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return (
    <AppShell
      user={{ ...user, hasSubscriptions: session.hasSubscriptions }}
      session={session}
    >
      <div className="flex flex-col min-h-full bg-background">
        <PageHeader
          subtitle={t("subtitle")}
          title={t("welcome", { name: user?.displayName ?? session.email })}
          description={t("description")}
          icon={Home}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <Suspense fallback={<HomeSkeleton />}>
              <HomeContent userId={userId} isAdmin={session.isAdmin} />
            </Suspense>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
