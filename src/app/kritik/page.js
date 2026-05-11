import { Clapperboard, Gamepad2, Music } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AppShell from "@/components/layout/Appshell";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionWithSubs } from "@/lib/auth/sessionExtended";
import { getProfileData } from "@/lib/profile/profile";

export default async function ReviewsPage() {
  const t = await getTranslations("Reviews");
  const session = await getSessionWithSubs();

  if (!session) {
    redirect("/login?callbackUrl=/kritik");
  }

  const data = await getProfileData(session);
  if (!data) redirect("/login");
  const { user } = data;

  return (
    <AppShell user={user} session={session}>
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          subtitle={t("subtitle")}
          title={t("title")}
          icon={Gamepad2}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-12">
            <section>
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                {t("categoriesLabel")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/kritik/spiele"
                  className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Gamepad2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">{t("games")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("gamesDesc")}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/kritik/filme"
                  className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Clapperboard size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">{t("movies")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("moviesDesc")}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/kritik/musik"
                  className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all shadow-sm flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Music size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">{t("music")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("musicDesc")}
                    </p>
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
