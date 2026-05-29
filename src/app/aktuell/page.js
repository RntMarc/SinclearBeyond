import { Newspaper } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import AktuellContent from "@/components/news/AktuellContent";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";

export default async function AktuellPage() {
  const t = await getTranslations("News");
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/aktuell");
  }

  const profile = await getProfileData(session);
  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell user={profile.user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          subtitle={t("subtitle")}
          title={t("title")}
          icon={Newspaper}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <Suspense
              fallback={
                <div className="animate-pulse space-y-8">
                  <div className="h-10 w-48 bg-muted rounded-lg" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-64 bg-muted rounded-2xl" />
                    ))}
                  </div>
                </div>
              }
            >
              <AktuellContent _userId={session.sub} />
            </Suspense>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
